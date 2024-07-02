import streamlit as st
import pandas as pd
import altair as alt

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

def get_line_chart(data, name, stat):
    hover = alt.selection_point(
        fields=["year"],
        nearest=True,
        on="mouseover",
        empty=False
    )
    
    # Define a custom color scale
    color_scale = alt.Scale(
        domain=["M", "F"],
        range=["blue", "red"]
    )
    
    lines = (
        alt.Chart(data, title=f"The name {name} over time")
        .mark_line()
        .encode(
            alt.X(
                "year", axis=alt.Axis(format="i"), scale=alt.Scale(domain=(1948, 2022))
            ),
            alt.Y("n:Q", axis=alt.Axis(title="# of babies"))
            if stat == "n"
            else alt.Y("prop:Q", axis=alt.Axis(format=".2%", title="% of babies")),
            color=alt.Color("sex:N", scale=color_scale),
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
                alt.Tooltip("year", title="Year"),
                alt.Tooltip("sex", title="Sex"),
                alt.Tooltip("n", title="Number of babies"),
                alt.Tooltip("prop:Q", title="% of babies", format=".2%"),
            ],
        )
        .add_params(hover)
    )
    return (lines + points + tooltips).interactive()

def main():
    st.set_page_config(
        layout="centered", page_icon="🍼", page_title="Israeli baby names"
    )
    st.title("Israeli baby names")

    babynames, babynames_totals = load_data()
    names_by_sector = process_data(babynames)

    col1, col2 = st.columns((3, 2))
    sectors = ["Jewish", "Muslim", "Christian", "Druze", "Other"]
    with col1:
        sector = st.selectbox("Sector:", sectors, index=0)
    with col2:
        stat = st.radio("Statistic:", ["Total number", "Percent in year"], index=1)

    current_names = names_by_sector[sector]
    
    # Find the index of "נועם" in the current names list
    default_index = current_names.index("נועם") if "נועם" in current_names else 0

    name = st.selectbox("Name:", current_names, index=default_index)

    stat = "n" if stat == "Total number" else "prop"
    lineplot_data = prepare_plot_data(babynames, sector, name)
    total_male, total_female = get_total_counts(babynames_totals, sector, name)

    st.altair_chart(get_line_chart(lineplot_data, name, stat), use_container_width=True)

    st.write(
        f"There were {total_male} male and {total_female} female babies named {name} from 1948 to 2022."
    )
    st.write(
        f"Years that include less than 5 babies are shown as 0. Data was downloaded from the [Israeli Central Bureau of Statistics](https://www.cbs.gov.il/he/publications/LochutTlushim/2020/%D7%A9%D7%9E%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D.xlsx). 2022 data was downloaded from [here](https://www.cbs.gov.il/he/mediarelease/Pages/2023/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2022.aspx)"
    )

    st.write(
        f"Additional analysis can be found [here](https://aviezerl.github.io/babynamesIL/articles/babynamesIL.html). [2022 analysis](https://aviezerl.github.io/babynamesIL/articles/2022.html)."
    )
    
if __name__ == "__main__":
    main()