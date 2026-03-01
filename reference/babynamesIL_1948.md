# Israeli Baby Names - 1948 Legacy Data

Baby name data from 1948, preserved from an earlier CBS release. This
data is kept separate as the primary dataset (babynamesIL) now uses CBS
release 391/2025 which starts from 1949.

## Usage

``` r
babynamesIL_1948
```

## Format

A tibble with six columns:

- sector:

  Demographic sector (character): "Jewish", "Muslim", "Christian", or
  "Druze"

- year:

  Birth year (numeric): 1948

- sex:

  Sex (character): "M" for male, "F" for female

- name:

  Baby name in Hebrew (character)

- n:

  Count of babies given this name (integer)

- prop:

  Proportion within the year/sector/sex group (numeric, 0-1)

## Details

This dataset was extracted from the original babynamesIL package
(versions prior to 0.1.0) which used a different CBS source file. The
1948 data represents the first full year of Israeli statehood.

Note that the "Other" sector was not reported in 1948 data.

## Note

This dataset uses "Christian" (not "Christian-Arab") as the sector name,
matching the terminology from the original data source.

## See also

[`babynamesIL`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL.md)
