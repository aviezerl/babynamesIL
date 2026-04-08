# data integrity - snapshots

    Code
      babynamesIL[c(1:20, (nrow(babynamesIL) - 19):nrow(babynamesIL)), ]
    Output
      # A tibble: 40 x 6
         sector  year sex   name       n    prop
         <chr>  <dbl> <chr> <chr>  <int>   <dbl>
       1 Jewish  1949 F     רחל     1362 0.0381 
       2 Jewish  1949 F     אסתר    1344 0.0376 
       3 Jewish  1949 F     שרה     1190 0.0333 
       4 Jewish  1949 F     מרים     964 0.0269 
       5 Jewish  1949 F     חנה      895 0.0250 
       6 Jewish  1949 F     שושנה    814 0.0227 
       7 Jewish  1949 F     רבקה     674 0.0188 
       8 Jewish  1949 F     יהודית   588 0.0164 
       9 Jewish  1949 F     לאה      585 0.0163 
      10 Jewish  1949 F     רות      500 0.0140 
      11 Jewish  1949 F     צפורה    394 0.0110 
      12 Jewish  1949 F     חיה      361 0.0101 
      13 Jewish  1949 F     מלכה     356 0.00995
      14 Jewish  1949 F     אנה      354 0.00989
      15 Jewish  1949 F     דינה     348 0.00973
      16 Jewish  1949 F     מזל      333 0.00931
      17 Jewish  1949 F     דליה     332 0.00928
      18 Jewish  1949 F     יפה      330 0.00922
      19 Jewish  1949 F     אילנה    326 0.00911
      20 Jewish  1949 F     פנינה    313 0.00875
      # i 20 more rows

---

    Code
      babynamesIL_totals[c(1:20, (nrow(babynamesIL_totals) - 19):nrow(
        babynamesIL_totals)), ]
    Output
      # A tibble: 40 x 4
         sector sex   name  total
         <chr>  <chr> <chr> <int>
       1 Jewish F     שרה   60712
       2 Jewish F     אסתר  59404
       3 Jewish F     רחל   59083
       4 Jewish F     יעל   53269
       5 Jewish F     נועה  52967
       6 Jewish F     מיכל  50148
       7 Jewish F     תמר   46807
       8 Jewish F     חנה   46597
       9 Jewish F     מרים  46001
      10 Jewish F     מאיה  44003
      11 Jewish F     רבקה  42314
      12 Jewish F     שירה  40836
      13 Jewish F     עדי   32381
      14 Jewish F     חיה   29901
      15 Jewish F     רות   28751
      16 Jewish F     לאה   27989
      17 Jewish F     טליה  26934
      18 Jewish F     הילה  26527
      19 Jewish F     אלה   26407
      20 Jewish F     איילה 26130
      # i 20 more rows

