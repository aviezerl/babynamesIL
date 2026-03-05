# Israeli Baby Names (1949-2024)

Names given to babies born in Israel from 1949-2024, sourced from the
Israeli Central Bureau of Statistics (CBS/LAMAS).

## Usage

``` r
babynamesIL
```

## Format

A tibble with six columns:

- sector:

  Demographic sector (character): "Jewish", "Muslim", "Christian-Arab",
  or "Druze"

- year:

  Birth year (numeric): 1949-2024

- sex:

  Sex (character): "M" for male, "F" for female

- name:

  Baby name in Hebrew (character)

- n:

  Count of babies given this name in that year (integer)

- prop:

  Proportion of babies with this name within the year/sector/sex group
  (numeric, 0-1)

## Details

### Data Sources

The primary data source is CBS release 391/2025, which contains
comprehensive baby name statistics from 1949 to 2024. The data is
filtered to include only names given to at least 5 babies in a given
year.

Data was downloaded from: [CBS Release
391/2025](https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx)

### Sectors

The data covers four demographic sectors:

- `Jewish` - Jewish population

- `Muslim` - Muslim population

- `Christian-Arab` - Christian Arab population

- `Druze` - Druze population

### Related Datasets

- [`babynamesIL_1948`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_1948.md):
  Legacy 1948 data (from earlier CBS release)

- [`babynamesIL_other`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_other.md):
  Archived "Other" sector data (1985-2021)

- [`babynamesIL_totals`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_totals.md):
  Aggregated totals by name/sector/sex

### Breaking Changes (v0.1.0)

- "Christian" sector renamed to "Christian-Arab"

- "Other" sector removed from main data (see
  [`babynamesIL_other`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_other.md))

- 1948 data moved to separate object (see
  [`babynamesIL_1948`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_1948.md))

## See also

[`babynamesIL_totals`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_totals.md),
[`babynamesIL_1948`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_1948.md),
[`babynamesIL_other`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL_other.md)

## Examples

``` r
# \donttest{
# Most popular names in 2024
library(dplyr)
#> 
#> Attaching package: ‘dplyr’
#> The following objects are masked from ‘package:stats’:
#> 
#>     filter, lag
#> The following objects are masked from ‘package:base’:
#> 
#>     intersect, setdiff, setequal, union
babynamesIL |>
  filter(year == 2024, sector == "Jewish") |>
  group_by(sex) |>
  slice_max(n, n = 5)
#> # A tibble: 10 × 6
#> # Groups:   sex [2]
#>    sector  year sex   name       n   prop
#>    <chr>  <dbl> <chr> <chr>  <int>  <dbl>
#>  1 Jewish  2024 F     אביגיל  1437 0.0232
#>  2 Jewish  2024 F     איילה   1182 0.0191
#>  3 Jewish  2024 F     שרה     1151 0.0186
#>  4 Jewish  2024 F     תמר     1090 0.0176
#>  5 Jewish  2024 F     מאיה    1089 0.0176
#>  6 Jewish  2024 M     דוד     1842 0.0279
#>  7 Jewish  2024 M     לביא    1518 0.0230
#>  8 Jewish  2024 M     אריאל   1479 0.0224
#>  9 Jewish  2024 M     רפאל    1352 0.0205
#> 10 Jewish  2024 M     אורי    1320 0.0200

# Names over time
babynamesIL |>
  filter(name == "\u05E0\u05D5\u05E2\u05DD", sector == "Jewish") |>
  select(year, sex, n, prop)
#> # A tibble: 126 × 4
#>     year sex       n     prop
#>    <dbl> <chr> <int>    <dbl>
#>  1  1949 M        26 0.000708
#>  2  1950 M        25 0.000643
#>  3  1951 M        21 0.000533
#>  4  1952 M        30 0.000761
#>  5  1953 M        34 0.000898
#>  6  1954 M        38 0.00103 
#>  7  1955 M        34 0.000915
#>  8  1956 M        28 0.000765
#>  9  1957 M        34 0.000935
#> 10  1958 M        60 0.00167 
#> # ℹ 116 more rows
# }
```
