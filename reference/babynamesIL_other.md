# Israeli Baby Names - "Other" Sector Archive

Archived baby name data for the "Other" demographic sector (1985-2021).
This sector is no longer published by CBS in recent releases.

## Usage

``` r
babynamesIL_other
```

## Format

A tibble with six columns:

- sector:

  Demographic sector (character): "Other"

- year:

  Birth year (numeric): 1985-2021

- sex:

  Sex (character): "M" for male, "F" for female

- name:

  Baby name in Hebrew (character)

- n:

  Count of babies given this name (integer)

- prop:

  Proportion within the year/sector/sex group (numeric, 0-1)

## Details

The "Other" sector included populations not classified as Jewish,
Muslim, Christian, or Druze. CBS discontinued publishing this sector in
their baby names statistics after 2021.

This dataset preserves the historical "Other" sector data for research
purposes. It was extracted from babynamesIL versions prior to 0.1.0.

## Note

This dataset is provided for historical reference. The "Other" sector is
no longer updated and should be used with appropriate caveats in any
analysis.

## See also

[`babynamesIL`](https://aviezerl.github.io/babynamesIL/reference/babynamesIL.md)
