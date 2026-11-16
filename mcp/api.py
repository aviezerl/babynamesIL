"""
babynamesIL REST API

Simple API that returns plain-text markdown responses,
designed to be easily readable by LLMs with web browsing.
"""

from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, Query, Response
from fastapi.responses import FileResponse, PlainTextResponse

DATA_DIR = Path(__file__).parent.parent / "data-raw"

app = FastAPI(title="babynamesIL API", docs_url="/api/docs", openapi_url="/api/openapi.json")


def _load_data():
    if not hasattr(_load_data, "_cache"):
        main = pd.read_csv(DATA_DIR / "babynamesIL.csv")
        totals = pd.read_csv(DATA_DIR / "babynamesIL_totals.csv")
        try:
            legacy = pd.read_csv(DATA_DIR / "babynamesIL_1948.csv")
            legacy["sector"] = legacy["sector"].replace({"Christian": "Christian-Arab"})
            main = pd.concat([legacy, main], ignore_index=True)
        except FileNotFoundError:
            pass
        _load_data._cache = (main, totals)
    return _load_data._cache


VALID_SECTORS = ["Jewish", "Muslim", "Christian-Arab", "Druze"]


def _check(sector=None, sex=None):
    """Return an error message for an invalid sector/sex, else None."""
    if sector is not None and sector not in VALID_SECTORS:
        return f"Invalid sector '{sector}'. Valid: {', '.join(VALID_SECTORS)}"
    if sex is not None and sex not in ("M", "F"):
        return f"Invalid sex '{sex}'. Valid: M, F"
    return None


def _norm(name: str) -> str:
    # CBS writes Arabic sounds with an ASCII apostrophe (ג'ואד); accept the Hebrew geresh too
    return name.strip().replace("\u05f3", "'")


@app.get("/api/search", response_class=PlainTextResponse)
def search_name(
    name: str = Query(..., description="Name in Hebrew (e.g. נועם)"),
    sector: Optional[str] = Query(None, description="Jewish, Muslim, Christian-Arab, or Druze"),
    sex: Optional[str] = Query(None, description="M or F"),
):
    """Search for a baby name and get summary statistics."""
    if err := _check(sector, sex):
        return err
    name = _norm(name)
    main, totals = _load_data()
    mask = main["name"] == name
    if sector:
        mask &= main["sector"] == sector
    if sex:
        mask &= main["sex"] == sex

    result = main[mask].sort_values(["sector", "sex", "year"])
    tmask = totals["name"] == name
    if sector:
        tmask &= totals["sector"] == sector
    if sex:
        tmask &= totals["sex"] == sex
    name_totals = totals[tmask].set_index(["sector", "sex"])["total"]

    if result.empty:
        if name_totals.empty:
            return f"No data found for '{name}'."
        lines = [
            f"# Results for '{name}'\n",
            "Never given to 5 or more babies in a single year, so there is no yearly data.",
            "All-time totals (1949-2024):\n",
        ]
        for (sec, sx), total in name_totals.items():
            lines.append(f"- {sec} - {'Male' if sx == 'M' else 'Female'}: {int(total):,}")
        return "\n".join(lines)

    lines = [f"# Results for '{name}'\n"]
    for (sec, sx), group in result.groupby(["sector", "sex"]):
        sex_label = "Male" if sx == "M" else "Female"
        # all-time total includes years with < 5 babies (not in the yearly data)
        total = int(name_totals.get((sec, sx), 0)) + int(group.loc[group["year"] == 1948, "n"].sum())
        peak = group.loc[group["n"].idxmax()]
        lines.append(
            f"## {sec} - {sex_label}\n"
            f"- Total: {total:,}\n"
            f"- Years with data: {int(group['year'].min())}-{int(group['year'].max())} ({len(group)} years)\n"
            f"- Peak: {int(peak['n']):,} in {int(peak['year'])} ({peak['prop']:.2%})\n"
        )

    if len(result) <= 40:
        lines.append("## Yearly detail\n")
        lines.append("| Sector | Year | Sex | Count | % |")
        lines.append("|--------|------|-----|-------|---|")
        for _, row in result.iterrows():
            lines.append(f"| {row['sector']} | {int(row['year'])} | {row['sex']} | {int(row['n']):,} | {row['prop']:.3%} |")

    return "\n".join(lines)


@app.get("/api/top", response_class=PlainTextResponse)
def top_names(
    year: int = Query(2024, description="Year (1948-2024)"),
    sector: str = Query("Jewish", description="Jewish, Muslim, Christian-Arab, or Druze"),
    sex: str = Query("M", description="M or F"),
    n: int = Query(10, description="Number of names (max 50)"),
):
    """Get the most popular names for a given year."""
    if err := _check(sector, sex):
        return err
    n = max(1, min(n, 50))
    main, _ = _load_data()
    mask = (main["year"] == year) & (main["sector"] == sector) & (main["sex"] == sex)
    result = main[mask].nlargest(n, "n")

    if result.empty:
        return f"No data for year={year}, sector={sector}, sex={sex}."

    sex_label = "boys" if sex == "M" else "girls"
    lines = [f"# Top {n} {sex_label}' names in {year} ({sector})\n"]
    lines.append("| Rank | Name | Count | % |")
    lines.append("|------|------|-------|---|")
    for i, (_, row) in enumerate(result.iterrows(), 1):
        lines.append(f"| {i} | {row['name']} | {int(row['n']):,} | {row['prop']:.2%} |")

    return "\n".join(lines)


@app.get("/api/trend", response_class=PlainTextResponse)
def name_trend(
    name: str = Query(..., description="Name in Hebrew"),
    sector: str = Query("Jewish", description="Sector"),
    sex: Optional[str] = Query(None, description="M or F"),
):
    """Get year-by-year popularity trend for a name."""
    if err := _check(sector, sex):
        return err
    name = _norm(name)
    main, _ = _load_data()
    mask = (main["name"] == name) & (main["sector"] == sector)
    if sex:
        mask &= main["sex"] == sex
    result = main[mask].sort_values(["sex", "year"])

    if result.empty:
        return f"No data for '{name}' in {sector}."

    lines = [f"# Trend for '{name}' ({sector})\n"]
    for sx, group in result.groupby("sex"):
        sex_label = "Male" if sx == "M" else "Female"
        lines.append(f"## {sex_label}\n")
        lines.append("| Year | Count | % |")
        lines.append("|------|-------|---|")
        for _, row in group.iterrows():
            lines.append(f"| {int(row['year'])} | {int(row['n']):,} | {row['prop']:.3%} |")

    return "\n".join(lines)


@app.get("/api/compare", response_class=PlainTextResponse)
def compare_names(
    names: str = Query(..., description="Comma-separated names in Hebrew (e.g. דוד,יוסף)"),
    sector: str = Query("Jewish", description="Sector"),
    sex: Optional[str] = Query(None, description="M or F"),
    year: Optional[int] = Query(None, description="Specific year, or omit for all-time"),
):
    """Compare multiple names side by side."""
    if err := _check(sector, sex):
        return err
    name_list = [_norm(n) for n in names.split(",") if n.strip()]
    main, totals = _load_data()

    if year:
        mask = (main["name"].isin(name_list)) & (main["sector"] == sector) & (main["year"] == year)
        if sex:
            mask &= main["sex"] == sex
        result = main[mask].sort_values("n", ascending=False)
        lines = [f"# Comparison — {sector}, {year}\n"]
        lines.append("| Name | Sex | Count | % |")
        lines.append("|------|-----|-------|---|")
        for _, row in result.iterrows():
            lines.append(f"| {row['name']} | {row['sex']} | {int(row['n']):,} | {row['prop']:.3%} |")
    else:
        mask = (totals["name"].isin(name_list)) & (totals["sector"] == sector)
        if sex:
            mask &= totals["sex"] == sex
        result = totals[mask].sort_values("total", ascending=False)
        lines = [f"# Comparison — {sector}, all-time\n"]
        lines.append("| Name | Sex | Total |")
        lines.append("|------|-----|-------|")
        for _, row in result.iterrows():
            lines.append(f"| {row['name']} | {row['sex']} | {int(row['total']):,} |")

    found = set(result["name"].unique())
    missing = [n for n in name_list if n not in found]
    if missing:
        lines.append(f"\n*Not found: {', '.join(missing)}*")

    return "\n".join(lines)


@app.get("/api/search-pattern", response_class=PlainTextResponse)
def search_pattern(
    pattern: str = Query(..., description="Substring to search for"),
    sector: str = Query("Jewish", description="Sector"),
    sex: Optional[str] = Query(None, description="M or F"),
):
    """Find names containing a substring."""
    if err := _check(sector, sex):
        return err
    pattern = _norm(pattern)
    _, totals = _load_data()
    mask = totals["name"].str.contains(pattern, regex=False, na=False) & (totals["sector"] == sector)
    if sex:
        mask &= totals["sex"] == sex
    result = totals[mask].sort_values("total", ascending=False).head(30)

    if result.empty:
        return f"No names matching '{pattern}' in {sector}."

    lines = [f"# Names containing '{pattern}' ({sector})\n"]
    lines.append("| Name | Sex | All-time total |")
    lines.append("|------|-----|----------------|")
    for _, row in result.iterrows():
        lines.append(f"| {row['name']} | {row['sex']} | {int(row['total']):,} |")

    return "\n".join(lines)


@app.get("/data/babynamesIL.csv")
def download_main():
    """Download the full dataset as CSV."""
    return FileResponse(
        DATA_DIR / "babynamesIL.csv",
        media_type="text/csv",
        filename="babynamesIL.csv",
    )


@app.get("/data/babynamesIL_totals.csv")
def download_totals():
    """Download the totals dataset as CSV."""
    return FileResponse(
        DATA_DIR / "babynamesIL_totals.csv",
        media_type="text/csv",
        filename="babynamesIL_totals.csv",
    )


LLMS_TXT = """\
# babynamesIL

Israeli baby names data from the Central Bureau of Statistics (CBS/LAMAS), 1948-2024.
Contains name counts by year, sex (M/F), and sector (Jewish, Muslim, Christian-Arab, Druze).
Only names given to at least 5 babies in a given year are included.

## API

Interactive API docs (OpenAPI/Swagger): https://babynames.lifshitz.xyz/api/docs

Query this data using simple URLs that return plain text:

- Search a name: https://babynames.lifshitz.xyz/api/search?name=נועם
- Top names: https://babynames.lifshitz.xyz/api/top?year=2024&sector=Jewish&sex=M&n=10
- Name trend: https://babynames.lifshitz.xyz/api/trend?name=נועם&sector=Jewish
- Compare names: https://babynames.lifshitz.xyz/api/compare?names=דוד,יוסף&sector=Jewish
- Search by pattern: https://babynames.lifshitz.xyz/api/search-pattern?pattern=אור&sector=Jewish

Parameters:
- name: Name in Hebrew
- sector: Jewish, Muslim, Christian-Arab, or Druze (default: Jewish)
- sex: M or F (optional)
- year: 1948-2024
- n: number of results (for top names, max 50)

## Download

- Full dataset: https://babynames.lifshitz.xyz/data/babynamesIL.csv
- Totals by name: https://babynames.lifshitz.xyz/data/babynamesIL_totals.csv

## Columns

babynamesIL.csv: sector, year, sex, name, n (count), prop (proportion)
babynamesIL_totals.csv: sector, sex, name, total

## MCP

For AI tools that support MCP (Claude Desktop, Claude Code, Cursor):
SSE endpoint: https://babynames.lifshitz.xyz/sse

## Source

Israeli Central Bureau of Statistics, Release 391/2025.
Website: https://babynames.lifshitz.xyz
GitHub: https://github.com/aviezerl/babynamesIL
"""


@app.get("/llms.txt", response_class=PlainTextResponse)
def llms_txt():
    """LLM-friendly site description."""
    return LLMS_TXT
