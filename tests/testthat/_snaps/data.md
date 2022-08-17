# data integrity

    Code
      babynamesIL[c(1:20, (nrow(babynamesIL) - 19):nrow(babynamesIL)), ]
    Output
      # A tibble: 40 x 6
         sector  year sex   name       n   prop
         <chr>  <dbl> <chr> <chr>  <int>  <dbl>
       1 Jewish  1948 F     שרה      326 0.0500
       2 Jewish  1948 F     רחל      323 0.0496
       3 Jewish  1948 F     אסתר     263 0.0404
       4 Jewish  1948 F     חנה      247 0.0379
       5 Jewish  1948 F     מרים     190 0.0292
       6 Jewish  1948 F     רות      165 0.0253
       7 Jewish  1948 F     רבקה     164 0.0252
       8 Jewish  1948 F     דליה     152 0.0233
       9 Jewish  1948 F     שושנה    149 0.0229
      10 Jewish  1948 F     לאה      145 0.0222
      11 Jewish  1948 F     יהודית   121 0.0186
      12 Jewish  1948 F     חיה      119 0.0183
      13 Jewish  1948 F     אילנה    115 0.0176
      14 Jewish  1948 F     יעל      111 0.0170
      15 Jewish  1948 F     צפורה    107 0.0164
      16 Jewish  1948 F     מלכה     102 0.0157
      17 Jewish  1948 F     דבורה    101 0.0155
      18 Jewish  1948 F     תמר       93 0.0143
      19 Jewish  1948 F     שולמית    90 0.0138
      20 Jewish  1948 F     יפה       86 0.0132
      # ... with 20 more rows
      # i Use `print(n = ...)` to see more rows

---

    Code
      babynamesIL_totals[c(1:20, (nrow(babynamesIL_totals) - 19):nrow(
        babynamesIL_totals)), ]
    Output
      # A tibble: 40 x 4
         sector sex   name  total
         <chr>  <chr> <chr> <int>
       1 Jewish F     נועה  47398
       2 Jewish F     רחל   46301
       3 Jewish F     יעל   45329
       4 Jewish F     שרה   45059
       5 Jewish F     מיכל  44945
       6 Jewish F     אסתר  44657
       7 Jewish F     תמר   39930
       8 Jewish F     שירה  36454
       9 Jewish F     חנה   35905
      10 Jewish F     מרים  34343
      11 Jewish F     מאיה  34213
      12 Jewish F     רבקה  33168
      13 Jewish F     עדי   30220
      14 Jewish F     חיה   24687
      15 Jewish F     הילה  24653
      16 Jewish F     רות   23764
      17 Jewish F     טליה  22622
      18 Jewish F     איילה 21579
      19 Jewish F     אפרת  20699
      20 Jewish F     רוני  20689
      # ... with 20 more rows
      # i Use `print(n = ...)` to see more rows

