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
        "analysis_2023": "2023 analysis",
        "year_axis": "Year",
        "babies_axis": "# of babies",
        "percent_axis": "% of babies",
        "male": "Male",
        "female": "Female",
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
        "analysis_2023": "ניתוח 2023",
        "year_axis": "שנה",
        "babies_axis": "מספר תינוקות",
        "percent_axis": "אחוז תינוקות",
        "male": "זכר",
        "female": "נקבה",
    },
}


@st.cache_data
def load_data():
    babynames = pd.read_csv("data-raw/babynamesIL.csv")
    babynames_totals = pd.read_csv("data-raw/babynamesIL_totals.csv")
    return babynames, babynames_totals


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


def create_full_year_sex_df(start_year, end_year):
    return pd.DataFrame(
        [[y, s] for y in range(start_year, end_year + 1) for s in ["M", "F"]],
        columns=["year", "sex"],
    )


def prepare_plot_data(babynames, sector, name):
    lineplot_data = babynames[(babynames.sector == sector) & (babynames.name == name)][
        ["year", "sex", "n", "prop"]
    ]
    year_range = (lineplot_data.year.min(), lineplot_data.year.max())
    all_combinations = create_full_year_sex_df(*year_range)
    return (
        lineplot_data.merge(all_combinations, on=["year", "sex"], how="outer")
        .fillna(0)
        .sort_values(["sex", "year"])
    )


def get_total_counts(babynames_totals, sector, name):
    total_data = babynames_totals[
        (babynames_totals.sector == sector) & (babynames_totals.name == name)
    ]
    total_male = total_data[total_data.sex == "M"]["total"].sum()
    total_female = total_data[total_data.sex == "F"]["total"].sum()
    return total_male, total_female


def get_line_chart(data, name, stat, t):
    hover = alt.selection_point(
        fields=["year"],
        nearest=True,
        on="mouseover",
    )

    color_scale = alt.Scale(domain=["M", "F"], range=["red", "blue"])

    lines = (
        alt.Chart(data, title=f"{t['name_prefix']} {name} {t['name_suffix']}")
        .mark_line()
        .encode(
            alt.X(
                "year",
                axis=alt.Axis(title=t["year_axis"], format="i"),
                scale=alt.Scale(domain=(1948, 2023)),
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
                    orient="bottom",  # Place legend at the bottom
                    direction="horizontal",  # Arrange legend items horizontally
                    titleOrient="left",  # Place legend title to the left
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

    # Combine the chart elements and configure the legend position
    chart = (
        (lines + points + tooltips)
        .interactive()
        .configure_legend(padding=10, cornerRadius=10, orient="bottom")
        .properties(height=600)
    )

    return chart


def main():
    st.set_page_config(
        layout="centered", page_icon="🍼", page_title="Israeli baby names"
    )

    set_custom_css()

    # Language selection
    lang = st.sidebar.selectbox("Language / שפה", ["English", "Hebrew"])
    t = translations[lang]

    # Apply hebrew-mode class to body when Hebrew is selected
    if lang == "Hebrew":
        st.markdown('<div class="hebrew-mode">', unsafe_allow_html=True)

    if lang == "Hebrew":
        st.markdown(f'<h1 class="rtl-title">{t["title"]}</h1>', unsafe_allow_html=True)
    else:
        st.title(t["title"])

    babynames, babynames_totals = load_data()
    names_by_sector = process_data(babynames)

    col1, col2 = st.columns((3, 2))
    sectors_en = ["Jewish", "Muslim", "Christian", "Druze", "Other"]
    sectors_he = ["יהודי", "מוסלמי", "נוצרי", "דרוזי", "אחר"]
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

    current_names = names_by_sector[current_sector]

    default_index = current_names.index("נועם") if "נועם" in current_names else 0

    name = st.selectbox(t["name"], current_names, index=default_index)

    stat = "n" if stat == t["total_number"] else "prop"
    lineplot_data = prepare_plot_data(babynames, current_sector, name)
    total_male, total_female = get_total_counts(babynames_totals, current_sector, name)

    st.altair_chart(
        get_line_chart(lineplot_data, name, stat, t), use_container_width=True
    )

    if lang == "Hebrew":
        st.markdown(
            f'<div class="rtl">היו <span style="color: red;">{total_male}</span> תינוקות זכרים ו-<span style="color: blue;">{total_female}</span> תינוקות נקבות בשם <span style="color: green;">{name}</span> משנת 1948 עד 2023.</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            f'<div class="rtl">{t["years_note"]} <a href="https://www.cbs.gov.il/he/publications/LochutTlushim/2020/%D7%A9%D7%9E%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D.xlsx">הלשכה המרכזית לסטטיסטיקה</a>. <a href="https://www.cbs.gov.il/he/mediarelease/Pages/2023/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2022.aspx">[2022]</a>, <a href="https://www.cbs.gov.il/he/mediarelease/Pages/2024/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2023.aspx">[2023]</a>. {t["additional_analysis"]} <a href="https://aviezerl.github.io/babynamesIL/articles/babynamesIL.html">{t["here"]}</a>. <a href="https://aviezerl.github.io/babynamesIL/articles/2023.html">{t["analysis_2023"]}</a></div>',
            unsafe_allow_html=True,
        )
        st.markdown("</div>", unsafe_allow_html=True)
    else:
        st.markdown(
            f'There were <span style="color: red;">{total_male}</span> male and <span style="color: blue;">{total_female}</span> female babies named <span style="color: green;">{name}</span> from 1948 to 2023.<br><br>'
            f'{t["years_note"]} <a href="https://www.cbs.gov.il/he/publications/LochutTlushim/2020/%D7%A9%D7%9E%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D.xlsx">Israeli Central Bureau of Statistics</a>, '
            f'<a href="https://www.cbs.gov.il/he/mediarelease/Pages/2023/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2022.aspx">[2022]</a>, <a href="https://www.cbs.gov.il/he/mediarelease/Pages/2024/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2023.aspx">[2023]</a>. '
            f'{t["additional_analysis"]} <a href="https://aviezerl.github.io/babynamesIL/articles/babynamesIL.html">{t["here"]}</a>. <a href="https://aviezerl.github.io/babynamesIL/articles/2023.html">{t["analysis_2023"]}</a>.',
            unsafe_allow_html=True,
        )


if __name__ == "__main__":
    main()
