import streamlit as st
import pandas as pd
import altair as alt


def set_custom_css():
    st.markdown(
        """
    <style>
    .hebrew-mode [data-testid="stSelectbox"] {
        direction: rtl;
    }
    .rtl {
        direction: rtl;
        text-align: right;
    }
    .rtl-force {
        direction: rtl !important;
        text-align: right !important;
    }
    .rtl-title {
        direction: rtl;
        text-align: right;
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 0.5em;
    }
    </style>
    """,
        unsafe_allow_html=True,
    )


translations = {
    "English": {
        "title": "Israeli baby names",
        "sector": "Sector:",
        "statistic": "Statistic:",
        "name": "Name:",
        "name_prefix": "The name",
        "name_suffix": "over time",
        "total_number": "Total number",
        "percent_in_year": "Percent in year",
        "male_babies": "male babies",
        "female_babies": "female babies",
        "year": "Year",
        "sex": "Sex",
        "years_note": "Years that include less than 5 babies are shown as 0. Data was downloaded from the",
        "additional_analysis": "Additional analysis can be found",
        "here": "here",
        "analysis_2024": "2024 analysis",
        "year_axis": "Year",
        "babies_axis": "# of babies",
        "percent_axis": "% of babies",
        "male": "Male",
        "female": "Female",
        "include_1948": "Include 1948 (legacy data)",
        "highlights_2024": "2024 Highlights",
        "trend_filter": "Filter by trend:",
        "popularity_filter": "Filter by popularity:",
        "rising": "Rising",
        "falling": "Falling",
        "stable": "Stable",
        "new_names": "New to Top 100",
        "top_10": "Top 10",
        "top_50": "Top 50",
        "rare": "Rare (< 100 total)",
    },
    "Hebrew": {
        "title": "שמות תינוקות בישראל",
        "sector": ":מגזר",
        "statistic": ":סטטיסטיקה",
        "name": ":שם",
        "name_prefix": "השם",
        "name_suffix": "במהלך השנים",
        "total_number": "מספר כולל",
        "percent_in_year": "אחוז בשנה",
        "male_babies": "תינוקות זכרים",
        "female_babies": "תינוקות נקבות",
        "year": "שנה",
        "sex": "מין",
        "years_note": "שנים הכוללות פחות מ-5 תינוקות מוצגות כ-0. הנתונים הורדו מ",
        "additional_analysis": "ניתוח נוסף ניתן למצוא",
        "here": "כאן",
        "analysis_2024": "ניתוח 2024",
        "year_axis": "שנה",
        "babies_axis": "מספר תינוקות",
        "percent_axis": "אחוז תינוקות",
        "male": "זכר",
        "female": "נקבה",
        "include_1948": "כלול 1948 (נתונים היסטוריים)",
        "highlights_2024": "נקודות עניין 2024",
        "trend_filter": ":סינון לפי מגמה",
        "popularity_filter": ":סינון לפי פופולריות",
        "rising": "עולים",
        "falling": "יורדים",
        "stable": "יציבים",
        "new_names": "חדשים ב-100 המובילים",
        "top_10": "10 המובילים",
        "top_50": "50 המובילים",
        "rare": "נדירים (< 100 סה״כ)",
    },
}


@st.cache_data
def load_data():
    babynames = pd.read_csv("data-raw/babynamesIL.csv")
    babynames_totals = pd.read_csv("data-raw/babynamesIL_totals.csv")
    # Load 1948 legacy data if exists
    try:
        babynames_1948 = pd.read_csv("data-raw/babynamesIL_1948.csv")
    except FileNotFoundError:
        babynames_1948 = None
    return babynames, babynames_totals, babynames_1948


@st.cache_data
def process_data(babynames):
    names_by_sector = (
        babynames[["sector", "name"]]
        .drop_duplicates()
        .groupby(["sector"])["name"]
        .apply(list)
        .to_dict()
    )
    return names_by_sector


@st.cache_data
def compute_2024_highlights(babynames, babynames_totals):
    """Pre-compute 2024 highlights for interactive filtering."""
    highlights = {}

    # Get 2023 and 2024 data for comparison
    recent = babynames[babynames["year"].isin([2023, 2024])].copy()

    # Calculate year-over-year changes
    pivot = recent.pivot_table(
        index=["sector", "sex", "name"],
        columns="year",
        values=["n", "prop"],
        fill_value=0,
    ).reset_index()

    pivot.columns = [
        "_".join(map(str, col)).strip("_") if isinstance(col, tuple) else col
        for col in pivot.columns
    ]

    if "n_2023" in pivot.columns and "n_2024" in pivot.columns:
        pivot["prop_change"] = pivot.get("prop_2024", 0) - pivot.get("prop_2023", 0)
        pivot["n_2024"] = pivot.get("n_2024", 0)
        pivot["n_2023"] = pivot.get("n_2023", 0)

        # Rising names (positive proportion change)
        highlights["rising"] = (
            pivot[pivot["prop_change"] > 0.001]
            .nlargest(50, "prop_change")
            .copy()
        )

        # Falling names (negative proportion change)
        highlights["falling"] = (
            pivot[pivot["prop_change"] < -0.001]
            .nsmallest(50, "prop_change")
            .copy()
        )

        # Stable names (small change but in top 100)
        highlights["stable"] = (
            pivot[(abs(pivot["prop_change"]) < 0.001) & (pivot["n_2024"] > 50)]
            .nlargest(50, "n_2024")
            .copy()
        )

        # New to top 100 (in 2024 but not in 2023 top 100)
        highlights["new"] = (
            pivot[(pivot["n_2023"] < 10) & (pivot["n_2024"] >= 50)]
            .nlargest(50, "n_2024")
            .copy()
        )

    # Popularity-based filters using totals
    data_2024 = babynames[babynames["year"] == 2024].copy()

    for sector in data_2024["sector"].unique():
        for sex in ["M", "F"]:
            key = f"{sector}_{sex}"
            sector_sex_data = data_2024[
                (data_2024["sector"] == sector) & (data_2024["sex"] == sex)
            ].copy()

            if not sector_sex_data.empty:
                highlights[f"top10_{key}"] = sector_sex_data.nlargest(10, "n")
                highlights[f"top50_{key}"] = sector_sex_data.nlargest(50, "n")

    # Rare names from totals
    if babynames_totals is not None:
        highlights["rare"] = babynames_totals[babynames_totals["total"] < 100].copy()

    return highlights


def create_full_year_sex_df(start_year, end_year):
    return pd.DataFrame(
        [[y, s] for y in range(start_year, end_year + 1) for s in ["M", "F"]],
        columns=["year", "sex"],
    )


def prepare_plot_data(babynames, sector, name, include_1948=False, babynames_1948=None):
    # Filter main data
    lineplot_data = babynames[(babynames.sector == sector) & (babynames.name == name)][
        ["year", "sex", "n", "prop"]
    ].copy()

    # Add 1948 data if requested and available
    if include_1948 and babynames_1948 is not None:
        # Map sector name for 1948 data (Christian-Arab -> Christian for legacy data)
        sector_1948 = "Christian" if sector == "Christian-Arab" else sector
        data_1948 = babynames_1948[
            (babynames_1948.sector == sector_1948) & (babynames_1948.name == name)
        ][["year", "sex", "n", "prop"]]
        if not data_1948.empty:
            lineplot_data = pd.concat([data_1948, lineplot_data], ignore_index=True)

    if lineplot_data.empty:
        return pd.DataFrame(columns=["year", "sex", "n", "prop"])

    year_range = (int(lineplot_data.year.min()), int(lineplot_data.year.max()))
    all_combinations = create_full_year_sex_df(*year_range)
    return (
        lineplot_data.merge(all_combinations, on=["year", "sex"], how="outer")
        .fillna(0)
        .sort_values(["sex", "year"])
    )


def get_total_counts(babynames_totals, sector, name, babynames_1948=None, include_1948=False):
    total_data = babynames_totals[
        (babynames_totals.sector == sector) & (babynames_totals.name == name)
    ]
    total_male = total_data[total_data.sex == "M"]["total"].sum()
    total_female = total_data[total_data.sex == "F"]["total"].sum()

    # Add 1948 counts if requested
    if include_1948 and babynames_1948 is not None:
        sector_1948 = "Christian" if sector == "Christian-Arab" else sector
        data_1948 = babynames_1948[
            (babynames_1948.sector == sector_1948) & (babynames_1948.name == name)
        ]
        total_male += data_1948[data_1948.sex == "M"]["n"].sum()
        total_female += data_1948[data_1948.sex == "F"]["n"].sum()

    return int(total_male), int(total_female)


def get_line_chart(data, name, stat, t, include_1948=False):
    hover = alt.selection_point(
        fields=["year"],
        nearest=True,
        on="mouseover",
    )

    color_scale = alt.Scale(domain=["M", "F"], range=["red", "blue"])

    # Dynamic year range based on 1948 toggle
    min_year = 1948 if include_1948 else 1949
    max_year = 2024

    lines = (
        alt.Chart(data, title=f"{t['name_prefix']} {name} {t['name_suffix']}")
        .mark_line()
        .encode(
            alt.X(
                "year",
                axis=alt.Axis(title=t["year_axis"], format="i"),
                scale=alt.Scale(domain=(min_year, max_year)),
            ),
            (
                alt.Y("n:Q", axis=alt.Axis(title=t["babies_axis"]))
                if stat == "n"
                else alt.Y(
                    "prop:Q", axis=alt.Axis(format=".2%", title=t["percent_axis"])
                )
            ),
            color=alt.Color(
                "sex:N",
                scale=color_scale,
                legend=alt.Legend(
                    title=t["sex"],
                    labelExpr="datum.label == 'M' ? '"
                    + t["male"]
                    + "' : '"
                    + t["female"]
                    + "'",
                    orient="bottom",
                    direction="horizontal",
                    titleOrient="left",
                ),
            ),
        )
    )

    points = lines.transform_filter(hover).mark_circle(size=65)

    tooltips = (
        alt.Chart(data)
        .mark_rule()
        .encode(
            x="year",
            y=stat,
            opacity=alt.condition(hover, alt.value(0.3), alt.value(0)),
            tooltip=[
                alt.Tooltip("year", title=t["year"]),
                alt.Tooltip("sex", title=t["sex"]),
                alt.Tooltip("n", title=t["total_number"]),
                alt.Tooltip("prop:Q", title=t["percent_in_year"], format=".2%"),
            ],
        )
        .add_params(hover)
    )

    chart = (
        (lines + points + tooltips)
        .interactive()
        .configure_legend(padding=10, cornerRadius=10, orient="bottom")
        .properties(height=600)
    )

    return chart


def render_highlights_section(t, highlights, current_sector, lang):
    """Render the 2024 Highlights section with tabs."""
    st.subheader(t["highlights_2024"])

    tab1, tab2 = st.tabs([t["trend_filter"], t["popularity_filter"]])

    with tab1:
        trend_option = st.selectbox(
            t["trend_filter"],
            [t["rising"], t["falling"], t["stable"], t["new_names"]],
            key="trend_select",
        )

        trend_map = {
            t["rising"]: "rising",
            t["falling"]: "falling",
            t["stable"]: "stable",
            t["new_names"]: "new",
        }

        trend_key = trend_map.get(trend_option, "rising")
        if trend_key in highlights and not highlights[trend_key].empty:
            df = highlights[trend_key]
            # Filter by current sector if possible
            if "sector" in df.columns:
                df = df[df["sector"] == current_sector]

            if not df.empty:
                display_cols = ["name", "sex"]
                if "n_2024" in df.columns:
                    display_cols.append("n_2024")
                if "prop_change" in df.columns:
                    df = df.copy()
                    df["prop_change_pct"] = (df["prop_change"] * 100).round(3)
                    display_cols.append("prop_change_pct")

                st.dataframe(
                    df[display_cols].head(20),
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("No data for this sector/filter combination.")
        else:
            st.info("No data available for this filter.")

    with tab2:
        col1, col2 = st.columns(2)
        with col1:
            pop_option = st.selectbox(
                t["popularity_filter"],
                [t["top_10"], t["top_50"], t["rare"]],
                key="pop_select",
            )
        with col2:
            sex_filter = st.selectbox(
                t["sex"],
                [t["male"], t["female"]],
                key="sex_filter",
            )

        sex_code = "M" if sex_filter == t["male"] else "F"
        pop_map = {
            t["top_10"]: "top10",
            t["top_50"]: "top50",
            t["rare"]: "rare",
        }

        pop_key = pop_map.get(pop_option, "top10")

        if pop_key == "rare":
            if "rare" in highlights and not highlights["rare"].empty:
                df = highlights["rare"]
                df = df[(df["sector"] == current_sector) & (df["sex"] == sex_code)]
                if not df.empty:
                    st.dataframe(
                        df[["name", "total"]].head(30),
                        use_container_width=True,
                        hide_index=True,
                    )
                else:
                    st.info("No rare names for this sector/sex.")
        else:
            key = f"{pop_key}_{current_sector}_{sex_code}"
            if key in highlights and not highlights[key].empty:
                df = highlights[key]
                st.dataframe(
                    df[["name", "n", "prop"]].head(30),
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("No data for this filter combination.")


def main():
    st.set_page_config(
        layout="centered", page_icon="🍼", page_title="Israeli baby names"
    )

    set_custom_css()

    # Language selection
    lang = st.sidebar.selectbox("Language / שפה", ["English", "Hebrew"])
    t = translations[lang]

    # 1948 toggle in sidebar
    include_1948 = st.sidebar.checkbox(t["include_1948"], value=False)

    # Apply hebrew-mode class to body when Hebrew is selected
    if lang == "Hebrew":
        st.markdown('<div class="hebrew-mode">', unsafe_allow_html=True)

    if lang == "Hebrew":
        st.markdown(f'<h1 class="rtl-title">{t["title"]}</h1>', unsafe_allow_html=True)
    else:
        st.title(t["title"])

    babynames, babynames_totals, babynames_1948 = load_data()
    names_by_sector = process_data(babynames)
    highlights = compute_2024_highlights(babynames, babynames_totals)

    col1, col2 = st.columns((3, 2))
    # Updated sectors (removed "Other", renamed "Christian" to "Christian-Arab")
    sectors_en = ["Jewish", "Muslim", "Christian-Arab", "Druze"]
    sectors_he = ["יהודי", "מוסלמי", "נוצרי-ערבי", "דרוזי"]
    sectors = sectors_en if lang == "English" else sectors_he

    with col1:
        sector = st.selectbox(t["sector"], sectors, index=0)
    with col2:
        stat = st.radio(
            t["statistic"], [t["total_number"], t["percent_in_year"]], index=1
        )

    # Map Hebrew sector names to English for indexing
    sector_index = (
        sectors_he.index(sector) if lang == "Hebrew" else sectors_en.index(sector)
    )
    current_sector = sectors_en[sector_index]

    current_names = names_by_sector.get(current_sector, [])

    default_index = current_names.index("נועם") if "נועם" in current_names else 0

    name = st.selectbox(t["name"], current_names, index=default_index)

    stat = "n" if stat == t["total_number"] else "prop"
    lineplot_data = prepare_plot_data(
        babynames, current_sector, name, include_1948, babynames_1948
    )
    total_male, total_female = get_total_counts(
        babynames_totals, current_sector, name, babynames_1948, include_1948
    )

    st.altair_chart(
        get_line_chart(lineplot_data, name, stat, t, include_1948),
        use_container_width=True,
    )

    # Year range text
    start_year = 1948 if include_1948 else 1949
    year_range_text = f"{start_year} to 2024"

    if lang == "Hebrew":
        st.markdown(
            f'<div class="rtl">היו <span style="color: red;">{total_male}</span> תינוקות זכרים ו-<span style="color: blue;">{total_female}</span> תינוקות נקבות בשם <span style="color: green;">{name}</span> משנת {start_year} עד 2024.</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            f'<div class="rtl">{t["years_note"]} <a href="https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx">הלשכה המרכזית לסטטיסטיקה</a>. {t["additional_analysis"]} <a href="https://aviezerl.github.io/babynamesIL/articles/babynamesIL.html">{t["here"]}</a>. <a href="https://aviezerl.github.io/babynamesIL/articles/2024.html">{t["analysis_2024"]}</a></div>',
            unsafe_allow_html=True,
        )
        st.markdown("</div>", unsafe_allow_html=True)
    else:
        st.markdown(
            f'There were <span style="color: red;">{total_male}</span> male and <span style="color: blue;">{total_female}</span> female babies named <span style="color: green;">{name}</span> from {year_range_text}.<br><br>'
            f'{t["years_note"]} <a href="https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx">Israeli Central Bureau of Statistics</a>. '
            f'{t["additional_analysis"]} <a href="https://aviezerl.github.io/babynamesIL/articles/babynamesIL.html">{t["here"]}</a>. <a href="https://aviezerl.github.io/babynamesIL/articles/2024.html">{t["analysis_2024"]}</a>.',
            unsafe_allow_html=True,
        )

    # Temporarily disable 2024 Highlights section (data under review)
    # st.markdown("---")
    # render_highlights_section(t, highlights, current_sector, lang)


if __name__ == "__main__":
    main()
