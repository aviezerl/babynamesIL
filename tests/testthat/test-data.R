test_that("data integrity", {
    old <- options(tibble.print_min = 20)
    on.exit(options(old))
    expect_snapshot(babynamesIL[c(1:20, (nrow(babynamesIL) - 19):nrow(babynamesIL)), ])
    expect_snapshot(babynamesIL_totals[c(1:20, (nrow(babynamesIL_totals) - 19):nrow(babynamesIL_totals)), ])
})

test_that("data has all sectors and genders", {
    expect_setequal(unique(babynamesIL$sector), c("Jewish", "Muslim", "Christian", "Druze", "Other"))
    expect_setequal(unique(babynamesIL$sex), c("F", "M"))

    expect_setequal(unique(babynamesIL_totals$sector), c("Jewish", "Muslim", "Christian", "Druze", "Other"))
    expect_setequal(unique(babynamesIL_totals$sex), c("F", "M"))
})

test_that("totals and yearly data match", {
    expect_equal(
        babynamesIL %>%
            dplyr::distinct(sector, sex, name) %>%
            dplyr::inner_join(babynamesIL_totals, by = c("sector", "sex", "name")) %>%
            nrow(),
        nrow(babynamesIL_totals)
    )
})
