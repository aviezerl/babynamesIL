# Israeli Baby Names - Aggregated Totals

Total count of babies per name across all years (1949-2024), by sector
and sex. These totals come directly from the CBS source data and include
all registrations, even from years where the name was given to fewer
than 5 babies. This means the totals may be higher than the sum of
yearly counts in
[`babynamesIL`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL.md),
which only includes years with at least 5 babies.

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

  Total count across all years, including years below the 5-baby
  threshold (integer)

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
#>  1 Jewish F     שרה   60712
#>  2 Jewish F     אסתר  59404
#>  3 Jewish F     רחל   59083
#>  4 Jewish F     יעל   53269
#>  5 Jewish F     נועה  52967
#>  6 Jewish F     מיכל  50148
#>  7 Jewish F     תמר   46807
#>  8 Jewish F     חנה   46597
#>  9 Jewish F     מרים  46001
#> 10 Jewish F     מאיה  44003
#> 11 Jewish M     דוד   97218
#> 12 Jewish M     יוסף  81906
#> 13 Jewish M     משה   78676
#> 14 Jewish M     אברהם 70846
#> 15 Jewish M     יעקב  65203
#> 16 Jewish M     דניאל 61351
#> 17 Jewish M     יצחק  59198
#> 18 Jewish M     מיכאל 52531
#> 19 Jewish M     אורי  47687
#> 20 Jewish M     חיים  45212
# }
```
