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
         sector         sex   name  total
         <chr>          <chr> <chr> <int>
       1 Christian-Arab F     מריה   1047
       2 Christian-Arab F     אמל     854
       3 Christian-Arab F     מרים    734
       4 Christian-Arab F     רים     557
       5 Christian-Arab F     מונא    516
       6 Christian-Arab F     רנא     486
       7 Christian-Arab F     עביר    480
       8 Christian-Arab F     מארי    457
       9 Christian-Arab F     לינא    445
      10 Christian-Arab F     מאיה    440
      11 Christian-Arab F     ליאן    434
      12 Christian-Arab F     שירין   434
      13 Christian-Arab F     רולא    432
      14 Christian-Arab F     חנאן    409
      15 Christian-Arab F     רנין    409
      16 Christian-Arab F     רימא    396
      17 Christian-Arab F     סנא     354
      18 Christian-Arab F     נטלי    353
      19 Christian-Arab F     מנאל    351
      20 Christian-Arab F     סוזאן   337
      # i 20 more rows

