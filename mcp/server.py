"""
babynamesIL MCP Server

Exposes Israeli baby name data (1948-2024) via the Model Context Protocol.
Users can search names, get trends, find top names, and compare names
across sectors and years.

Usage:
    pip install fastmcp pandas
    fastmcp run server.py
    # or: python server.py

Configuration (Claude Desktop / claude_desktop_config.json):
    {
      "mcpServers": {
        "babynamesIL": {
          "command": "fastmcp",
          "args": ["run", "/path/to/babynamesIL/mcp/server.py"]
        }
      }
    }
"""

import os
from pathlib import Path
from typing import Optional

import pandas as pd
from fastmcp import FastMCP

DATA_DIR = Path(__file__).parent.parent / "data-raw"

mcp = FastMCP(
    "babynamesIL",
    instructions=(
        "Israeli baby names data from the Central Bureau of Statistics (1948-2024). "
        "Contains name counts by year, sex, and sector (Jewish, Muslim, Christian-Arab, Druze). "
        "Names are in Hebrew. Only names given to at least 5 babies in a year are included."
    ),
)


def _load_data() -> tuple[pd.DataFrame, pd.DataFrame, Optional[pd.DataFrame]]:
    """Load and cache data from CSV files."""
    if not hasattr(_load_data, "_cache"):
        main = pd.read_csv(DATA_DIR / "babynamesIL.csv")
        totals = pd.read_csv(DATA_DIR / "babynamesIL_totals.csv")
        try:
            legacy_1948 = pd.read_csv(DATA_DIR / "babynamesIL_1948.csv")
        except FileNotFoundError:
            legacy_1948 = None
        _load_data._cache = (main, totals, legacy_1948)
    return _load_data._cache


def _get_all_data() -> pd.DataFrame:
    """Get main dataset, optionally including 1948 legacy data."""
    main, _, legacy = _load_data()
    if legacy is not None:
        return pd.concat([legacy, main], ignore_index=True)
    return main


VALID_SECTORS = ["Jewish", "Muslim", "Christian-Arab", "Druze"]
VALID_SEXES = ["M", "F"]


@mcp.tool()
def search_name(
    name: str,
    sector: Optional[str] = None,
    sex: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
) -> str:
    """Search for a baby name and get its usage over time.

    Args:
        name: The name to search for (in Hebrew, e.g. "נועם")
        sector: Filter by sector: Jewish, Muslim, Christian-Arab, or Druze
        sex: Filter by sex: M or F
        year_from: Start year (default: 1948)
        year_to: End year (default: 2024)
    """
    df = _get_all_data()
    mask = df["name"] == name

    if sector:
        if sector not in VALID_SECTORS:
            return f"Invalid sector '{sector}'. Valid: {', '.join(VALID_SECTORS)}"
        mask &= df["sector"] == sector
    if sex:
        if sex not in VALID_SEXES:
            return f"Invalid sex '{sex}'. Valid: M, F"
        mask &= df["sex"] == sex
    if year_from:
        mask &= df["year"] >= year_from
    if year_to:
        mask &= df["year"] <= year_to

    result = df[mask].sort_values(["sector", "sex", "year"])

    if result.empty:
        return f"No data found for name '{name}' with the given filters."

    # Summarize
    lines = [f"## Results for '{name}'\n"]

    for (sec, sx), group in result.groupby(["sector", "sex"]):
        sex_label = "Male" if sx == "M" else "Female"
        total = int(group["n"].sum())
        peak_row = group.loc[group["n"].idxmax()]
        lines.append(
            f"### {sec} - {sex_label}\n"
            f"- Total babies (in data): {total:,}\n"
            f"- Years with data: {int(group['year'].min())}-{int(group['year'].max())} "
            f"({len(group)} years)\n"
            f"- Peak: {int(peak_row['n']):,} babies in {int(peak_row['year'])} "
            f"({peak_row['prop']:.2%} of all {sex_label.lower()} babies that year)\n"
        )

    # If few enough rows, include yearly detail
    if len(result) <= 40:
        lines.append("### Yearly detail\n")
        lines.append("| Sector | Year | Sex | Count | Proportion |")
        lines.append("|--------|------|-----|-------|------------|")
        for _, row in result.iterrows():
            lines.append(
                f"| {row['sector']} | {int(row['year'])} | {row['sex']} "
                f"| {int(row['n']):,} | {row['prop']:.4%} |"
            )

    return "\n".join(lines)


@mcp.tool()
def name_trend(
    name: str,
    sector: str = "Jewish",
    sex: Optional[str] = None,
) -> str:
    """Get the popularity trend of a name over all available years.

    Returns yearly counts suitable for understanding how a name's
    popularity changed over time.

    Args:
        name: The name to look up (in Hebrew)
        sector: Sector: Jewish, Muslim, Christian-Arab, or Druze (default: Jewish)
        sex: Filter by sex: M or F (default: both)
    """
    df = _get_all_data()
    mask = (df["name"] == name) & (df["sector"] == sector)
    if sex:
        mask &= df["sex"] == sex

    result = df[mask].sort_values(["sex", "year"])
    if result.empty:
        return f"No data found for '{name}' in sector '{sector}'."

    lines = [f"## Trend for '{name}' ({sector})\n"]

    for sx, group in result.groupby("sex"):
        sex_label = "Male" if sx == "M" else "Female"
        lines.append(f"### {sex_label}\n")
        lines.append("| Year | Count | % of babies |")
        lines.append("|------|-------|-------------|")
        for _, row in group.iterrows():
            lines.append(
                f"| {int(row['year'])} | {int(row['n']):,} | {row['prop']:.3%} |"
            )

    return "\n".join(lines)


@mcp.tool()
def top_names(
    year: int = 2024,
    sector: str = "Jewish",
    sex: str = "M",
    n: int = 10,
) -> str:
    """Get the most popular baby names for a given year.

    Args:
        year: The year to look up (default: 2024)
        sector: Sector: Jewish, Muslim, Christian-Arab, or Druze (default: Jewish)
        sex: M for male, F for female (default: M)
        n: Number of top names to return (default: 10, max: 50)
    """
    n = min(n, 50)
    df = _get_all_data()
    mask = (df["year"] == year) & (df["sector"] == sector) & (df["sex"] == sex)
    result = df[mask].nlargest(n, "n")

    if result.empty:
        return f"No data for year={year}, sector={sector}, sex={sex}."

    sex_label = "boys" if sex == "M" else "girls"
    lines = [f"## Top {n} {sex_label}' names in {year} ({sector})\n"]
    lines.append("| Rank | Name | Count | % of babies |")
    lines.append("|------|------|-------|-------------|")
    for i, (_, row) in enumerate(result.iterrows(), 1):
        lines.append(
            f"| {i} | {row['name']} | {int(row['n']):,} | {row['prop']:.2%} |"
        )

    return "\n".join(lines)


@mcp.tool()
def compare_names(
    names: list[str],
    sector: str = "Jewish",
    sex: Optional[str] = None,
    year: Optional[int] = None,
) -> str:
    """Compare the popularity of multiple names.

    If year is given, compares counts for that year.
    Otherwise, compares all-time totals.

    Args:
        names: List of names to compare (in Hebrew, e.g. ["נועם", "אורי"])
        sector: Sector (default: Jewish)
        sex: Filter by sex: M or F (default: both)
        year: Specific year to compare (default: all-time totals)
    """
    if year:
        df = _get_all_data()
        mask = (df["name"].isin(names)) & (df["sector"] == sector) & (df["year"] == year)
        if sex:
            mask &= df["sex"] == sex
        result = df[mask].sort_values("n", ascending=False)

        if result.empty:
            return f"No data found for the given names in {year}."

        lines = [f"## Name comparison — {sector}, {year}\n"]
        lines.append("| Name | Sex | Count | % of babies |")
        lines.append("|------|-----|-------|-------------|")
        for _, row in result.iterrows():
            lines.append(
                f"| {row['name']} | {row['sex']} | {int(row['n']):,} | {row['prop']:.3%} |"
            )
    else:
        _, totals, _ = _load_data()
        mask = (totals["name"].isin(names)) & (totals["sector"] == sector)
        if sex:
            mask &= totals["sex"] == sex
        result = totals[mask].sort_values("total", ascending=False)

        if result.empty:
            return f"No data found for the given names."

        lines = [f"## Name comparison — {sector}, all-time totals\n"]
        lines.append("| Name | Sex | Total |")
        lines.append("|------|-----|-------|")
        for _, row in result.iterrows():
            lines.append(f"| {row['name']} | {row['sex']} | {int(row['total']):,} |")

    # Note missing names
    found = set(result["name"].unique())
    missing = [n for n in names if n not in found]
    if missing:
        lines.append(f"\n*Names not found: {', '.join(missing)}*")

    return "\n".join(lines)


@mcp.tool()
def search_by_pattern(
    pattern: str,
    sector: str = "Jewish",
    sex: Optional[str] = None,
    year: Optional[int] = None,
) -> str:
    """Search for names matching a pattern (substring match).

    Useful when you don't know the exact Hebrew spelling.

    Args:
        pattern: Substring to search for in name (e.g. "נו" to find names containing it)
        sector: Sector (default: Jewish)
        sex: Filter by sex: M or F
        year: Filter by specific year (default: show all-time totals)
    """
    _, totals, _ = _load_data()
    mask = totals["name"].str.contains(pattern, na=False) & (totals["sector"] == sector)
    if sex:
        mask &= totals["sex"] == sex

    result = totals[mask].sort_values("total", ascending=False).head(30)

    if result.empty:
        return f"No names matching '{pattern}' found in {sector}."

    lines = [f"## Names containing '{pattern}' ({sector})\n"]
    lines.append("| Name | Sex | All-time total |")
    lines.append("|------|-----|----------------|")
    for _, row in result.iterrows():
        lines.append(f"| {row['name']} | {row['sex']} | {int(row['total']):,} |")

    if len(result) == 30:
        lines.append("\n*Showing top 30 results by all-time total.*")

    return "\n".join(lines)


@mcp.tool()
def list_sectors() -> str:
    """List all available sectors and basic dataset info."""
    main, totals, legacy = _load_data()

    lines = ["## babynamesIL Dataset Info\n"]
    lines.append(
        "Israeli baby names from the Central Bureau of Statistics.\n"
        "Only names given to ≥5 babies in a given year are included.\n"
    )
    lines.append(f"- **Years covered**: 1948-2024")
    lines.append(f"- **Total records**: {len(main):,} (main) + {len(legacy) if legacy is not None else 0:,} (1948 legacy)")
    lines.append(f"- **Unique names**: {main['name'].nunique():,}")
    lines.append(f"- **Sectors**: {', '.join(VALID_SECTORS)}\n")

    lines.append("### Records per sector\n")
    lines.append("| Sector | Records | Unique names |")
    lines.append("|--------|---------|--------------|")
    for sector in VALID_SECTORS:
        sec_data = main[main["sector"] == sector]
        lines.append(
            f"| {sector} | {len(sec_data):,} | {sec_data['name'].nunique():,} |"
        )

    return "\n".join(lines)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--transport", default="stdio", choices=["stdio", "sse", "streamable-http"])
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    mcp.run(transport=args.transport, host=args.host, port=args.port)
