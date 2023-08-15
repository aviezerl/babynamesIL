import streamlit as st
import pandas as pd
import altair as alt


# data load
babynames = pd.read_csv("data-raw/babynamesIL.csv")
babynames_totals = pd.read_csv("data-raw/babynamesIL_totals.csv")

names_by_sector_gender = (
    babynames[["sector", "sex", "name"]]
    .drop_duplicates()
    .groupby(["sector", "sex"])["name"]
    .apply(list)
    .to_dict()
)


# app layout and selectors

st.set_page_config(layout="centered", page_icon="🍼", page_title="Israeli baby names")

st.title("Israeli baby names")

col1, col2, col3 = st.columns((3, 0.9, 2))

sectors = ["Jewish", "Muslim", "Christian", "Druze", "Other"]
with col1:
    sector = st.selectbox("Sector:", sectors, index=0)

with col2:
    sex = st.radio(
        "Sex:",
        ["Male", "Female"],
        index=0,
    )

with col3:
    stat = st.radio(
        "Statistic:",
        ["Total number", "Percent in year"],
        index=1,
    )

if stat == "Total number":
    stat = "n"
else:
    stat = "prop"

current_names = names_by_sector_gender[(sector, "M" if sex == "Male" else "F")]
name = st.selectbox("Name:", current_names, index=0)

# plotting data

lineplot_data = babynames[(babynames.sector == sector) & (babynames.name == name)][
    ["year", "sex", "n", "prop"]
]
all_combinations = pd.DataFrame(
    [[y, s] for y in range(1949, 2021) for s in ["M", "F"]], columns=["year", "sex"]
)
lineplot_data = lineplot_data.merge(
    all_combinations, on=["year", "sex"], how="outer"
).fillna(0)
lineplot_data = lineplot_data.sort_values(["sex", "year"])

total_data = babynames_totals[
    (babynames_totals.sector == sector) & (babynames_totals.name == name)
]

total_male = total_data[total_data.sex == "M"]["total"]
if len(total_male) == 0:
    total_male = 0
else:
    total_male = total_male.values[0]

total_female = total_data[total_data.sex == "F"]["total"]
if len(total_female) == 0:
    total_female = 0
else:
    total_female = total_female.values[0]

# plotting


def get_line_chart(data):

    hover = alt.selection_single(
        fields=["year"],
        nearest=True,
        on="mouseover",
        empty="none",
    )
    lines = (
        alt.Chart(data, title=f"The name {name} over time")
        .mark_line()
        .encode(
            alt.X(
                "year", axis=alt.Axis(format="i"), scale=alt.Scale(domain=(1948, 2021))
            ),
            alt.Y("n:Q", axis=alt.Axis(title="# of babies"))
            if stat == "n"
            else alt.Y("prop:Q", axis=alt.Axis(format=".2%", title="% of babies")),
            color="sex",
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
        .add_selection(hover)
    )
    return (lines + points + tooltips).interactive()


st.altair_chart(get_line_chart(lineplot_data), use_container_width=True)

st.write(
    f"There where {total_male} male babies and {total_female} female babies named {name} from 1948 to 2021."
)

st.write(
    f"Years that include less than 5 babies are shown as 0. Data was downloaded from the [Israeli Central Bureau of Statistics](https://www.cbs.gov.il/he/publications/LochutTlushim/2020/%D7%A9%D7%9E%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D.xlsx)."
)

st.write(
    f"Additional analysis can be found [here](https://aviezerl.github.io/babynamesIL/articles/babynamesIL.html)"
)
