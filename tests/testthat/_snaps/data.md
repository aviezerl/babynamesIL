# data integrity

    Code
      babynamesIL[c(1:20, (nrow(babynamesIL) - 19):nrow(babynamesIL)), ]
    Output
      # A tibble: 40 x 6
         sector  year sex   name      n   prop
         <chr>  <dbl> <chr> <chr> <int>  <dbl>
       1 Jewish  1948 F     שרה     326 0.0500
       2 Jewish  1948 F     רחל     323 0.0496
       3 Jewish  1948 F     אסתר    263 0.0404
       4 Jewish  1948 F     חנה     247 0.0379
       5 Jewish  1948 F     מרים    190 0.0292
       6 Jewish  1948 F     רות     165 0.0253
       7 Jewish  1948 F     רבקה    164 0.0252
       8 Jewish  1948 F     דליה    152 0.0233
       9 Jewish  1948 F     שושנה   149 0.0229
      10 Jewish  1948 F     לאה     145 0.0222
      # ... with 30 more rows
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
      # ... with 30 more rows
      # i Use `print(n = ...)` to see more rows

