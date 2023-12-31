# data integrity

    Code
      babynamesIL[c(1:20, (nrow(babynamesIL) - 19):nrow(babynamesIL)), ]
    Output
      # A tibble: 40 x 6
           sector year sex  name  n       prop
      1 Christian 1948   F  לילה 19 0.12925170
      2 Christian 1948   F סמירה 14 0.09523810
      3 Christian 1948   F  מארי 13 0.08843537
      4 Christian 1948   F  נואל 11 0.07482993
      5 Christian 1948   F   אמל  9 0.06122449
      6 Christian 1948   F  מרים  7 0.04761905
      # ... with 34 more rows

---

    Code
      babynamesIL_totals[c(1:20, (nrow(babynamesIL_totals) - 19):nrow(
        babynamesIL_totals)), ]
    Output
      # A tibble: 40 x 4
           sector sex name total
      1 Christian   F מריה  1063
      2 Christian   F  אמל   849
      3 Christian   F מרים   751
      4 Christian   F מארי   580
      5 Christian   F  רים   555
      6 Christian   F מאיה   530
      # ... with 34 more rows

