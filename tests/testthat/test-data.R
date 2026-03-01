# Snapshot tests for data integrity
test_that("data integrity - snapshots", {
    old <- options(tibble.print_min = 20)
    on.exit(options(old))
    expect_snapshot(babynamesIL[c(1:20, (nrow(babynamesIL) - 19):nrow(babynamesIL)), ])
    expect_snapshot(babynamesIL_totals[c(1:20, (nrow(babynamesIL_totals) - 19):nrow(babynamesIL_totals)), ])
})

# Structural tests for main dataset
test_that("babynamesIL has correct structure", {
    expect_equal(ncol(babynamesIL), 6)
    expect_true(all(c("sector", "year", "sex", "name", "n", "prop") %in% names(babynamesIL)))

    # Check types
    expect_type(babynamesIL$sector, "character")
    expect_type(babynamesIL$year, "double")
    expect_type(babynamesIL$sex, "character")
    expect_type(babynamesIL$name, "character")
    expect_type(babynamesIL$n, "integer")
    expect_type(babynamesIL$prop, "double")
})

test_that("babynamesIL has correct sectors and sex values", {
    expect_setequal(unique(babynamesIL$sector), c("Jewish", "Muslim", "Christian-Arab", "Druze"))
    expect_setequal(unique(babynamesIL$sex), c("F", "M"))
})

test_that("babynamesIL has correct year range", {
    expect_equal(min(babynamesIL$year), 1949)
    expect_equal(max(babynamesIL$year), 2024)
})

test_that("babynamesIL proportions are valid", {
    expect_true(all(babynamesIL$prop >= 0 & babynamesIL$prop <= 1))

    # Check proportions sum to ~1 for each year/sector/sex group
    prop_sums <- babynamesIL %>%
        dplyr::group_by(sector, year, sex) %>%
        dplyr::summarise(prop_sum = sum(prop), .groups = "drop")
    expect_true(all(abs(prop_sums$prop_sum - 1) < 0.01))
})

test_that("high-volume names do not have long recent gaps", {
    gap_check <- babynamesIL %>%
        dplyr::group_by(sector, sex, name) %>%
        dplyr::summarise(
            years = list(sort(unique(year))),
            max_n = max(n),
            .groups = "drop"
        ) %>%
        dplyr::mutate(
            gap_info = purrr::map(
                years,
                ~ {
                    yrs <- .x
                    if (length(yrs) < 2) {
                        return(tibble::tibble(prev_year = numeric(), next_year = numeric(), gap = numeric()))
                    }
                    tibble::tibble(
                        prev_year = yrs[-length(yrs)],
                        next_year = yrs[-1],
                        gap = diff(yrs) - 1
                    )
                }
            )
        ) %>%
        dplyr::select(-years) %>%
        tidyr::unnest(gap_info) %>%
        dplyr::filter(max_n >= 1000, prev_year >= 2005, gap >= 3)

    offenders <- unique(gap_check$name)
    expect_equal(
        nrow(gap_check),
        0,
        info = if (length(offenders) == 0) "" else paste("Names with gaps:", paste(offenders, collapse = ", "))
    )
})

# Structural tests for totals dataset
test_that("babynamesIL_totals has correct structure", {
    expect_equal(ncol(babynamesIL_totals), 4)
    expect_true(all(c("sector", "sex", "name", "total") %in% names(babynamesIL_totals)))

    expect_setequal(unique(babynamesIL_totals$sector), c("Jewish", "Muslim", "Christian-Arab", "Druze"))
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

# Tests for archive datasets
test_that("babynamesIL_1948 exists and has correct structure", {
    expect_true(exists("babynamesIL_1948"))
    expect_equal(ncol(babynamesIL_1948), 6)
    expect_true(all(c("sector", "year", "sex", "name", "n", "prop") %in% names(babynamesIL_1948)))

    # All rows should be from 1948
    expect_equal(unique(babynamesIL_1948$year), 1948)

    # 1948 data uses old "Christian" naming
    expect_true("Christian" %in% unique(babynamesIL_1948$sector))
})

test_that("babynamesIL_other exists and has correct structure", {
    expect_true(exists("babynamesIL_other"))
    expect_equal(ncol(babynamesIL_other), 6)
    expect_true(all(c("sector", "year", "sex", "name", "n", "prop") %in% names(babynamesIL_other)))

    # All rows should be from "Other" sector
    expect_equal(unique(babynamesIL_other$sector), "Other")

    # Year range should be 1985-2021
    expect_equal(min(babynamesIL_other$year), 1985)
    expect_equal(max(babynamesIL_other$year), 2021)
})
