# Israeli Baby Names - Aggregated Totals

Total count of babies per name across all years (1949-2024), by sector
and sex.

## Usage

``` r
babynamesIL_totals
```

## Format

A tibble with four columns:

- sector:

  Demographic sector (character): "Jewish", "Muslim", "Christian-Arab",
  or "Druze"

- sex:

  Sex (character): "M" for male, "F" for female

- name:

  Baby name in Hebrew (character)

- total:

  Total count across all years (integer)

## See also

[`babynamesIL`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL.md)

## Examples

``` r
# \donttest{
# Most popular names of all time in the Jewish sector
library(dplyr)
babynamesIL_totals |>
  filter(sector == "Jewish") |>
  group_by(sex) |>
  slice_max(total, n = 10)
#> # A tibble: 20 × 4
#> # Groups:   sex [2]
#>    sector sex   name  total
#>    <chr>  <chr> <chr> <int>
#>  1 Jewish F     שרה   59490
#>  2 Jewish F     אסתר  58123
#>  3 Jewish F     רחל   57859
#>  4 Jewish F     יעל   53078
#>  5 Jewish F     נועה  52956
#>  6 Jewish F     מיכל  50007
#>  7 Jewish F     תמר   46560
#>  8 Jewish F     חנה   45689
#>  9 Jewish F     מרים  45044
#> 10 Jewish F     מאיה  43903
#> 11 Jewish M     דוד   95744
#> 12 Jewish M     יוסף  80307
#> 13 Jewish M     משה   77214
#> 14 Jewish M     אברהם 69514
#> 15 Jewish M     יעקב  63704
#> 16 Jewish M     דניאל 61007
#> 17 Jewish M     יצחק  58041
#> 18 Jewish M     מיכאל 51517
#> 19 Jewish M     אורי  47503
#> 20 Jewish M     חיים  44302
# }
```
