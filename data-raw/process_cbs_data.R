# Process CBS baby names data release
# Source: https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx
# This script replaces lamas.R and update-20XX.R with a unified approach

library(tidyverse)
library(readxl)
library(usethis)

# Configuration
# Override these via command-line args: Rscript process_cbs_data.R <cbs_file> <start_year>
args <- commandArgs(trailingOnly = TRUE)
CBS_FILE <- if (length(args) >= 1) args[1] else "data-raw/11_25_391t1.xlsx"
START_YEAR <- if (length(args) >= 2) as.integer(args[2]) else NULL  # NULL = auto-detect from data
SKIP_ROWS <- 3  # Header rows to skip
NUM_LOCALE <- readr::locale(grouping_mark = ",")

# Helper to remove thousands separators and convert to numeric
clean_numeric <- function(x) {
    readr::parse_number(as.character(x), locale = NUM_LOCALE)
}

# Sheet name mapping (Hebrew -> English sector/sex)
sheet_mapping <- list(
    "בנות יהודיות" = c(sector = "Jewish", sex = "F"),
    "בנים יהודים" = c(sector = "Jewish", sex = "M"),
    "בנות מוסלמיות" = c(sector = "Muslim", sex = "F"),
    "בנים מוסלמים" = c(sector = "Muslim", sex = "M"),
    "בנות נוצריות-ערביות" = c(sector = "Christian-Arab", sex = "F"),
    "בנים נוצרים-ערבים" = c(sector = "Christian-Arab", sex = "M"),
    "בנות דרוזיות" = c(sector = "Druze", sex = "F"),
    "בנים דרוזים" = c(sector = "Druze", sex = "M")
)

#' Parse a single sheet from the CBS Excel file
#'
#' @param sheet_name Hebrew sheet name
#' @param sector_sex Named vector with sector and sex
#' @return list with:
#'   - yearly: tibble with columns: sector, year, sex, name, n, prop
#'   - totals: tibble with columns: sector, sex, name, total (CBS total including years with <5 babies)
parse_cbs_sheet <- function(sheet_name, sector_sex) {
    cat("Processing sheet:", sheet_name, "->", sector_sex["sector"], sector_sex["sex"], "\n")

    # Read the sheet
    raw_data <- read_xlsx(CBS_FILE, sheet = sheet_name, skip = SKIP_ROWS, col_names = FALSE)

    # First column is name, second is total, rest are years
    # Get column names (years) from the data structure
    # Column 1: name (prati1)
    # Column 2: total (סך הכל)
    # Columns 3+: years (1949, 1950, ..., 2024)

    n_cols <- ncol(raw_data)
    # Auto-detect start year from header row, or use configured value
    start_year <- START_YEAR
    if (is.null(start_year)) {
        header <- read_xlsx(CBS_FILE, sheet = sheet_name, n_max = SKIP_ROWS, col_names = FALSE)
        header_vals <- suppressWarnings(as.numeric(unlist(header[nrow(header), ])))
        detected_years <- header_vals[!is.na(header_vals) & header_vals > 1900 & header_vals < 2100]
        start_year <- if (length(detected_years) > 0) min(detected_years) else 1949L
    }
    years <- start_year:(start_year + n_cols - 3)  # subtract 2 for name+total columns

    colnames(raw_data) <- c("name", "total", as.character(years))

    # Clean raw data
    clean_data <- raw_data %>%
        filter(!is.na(name), !grepl("^prati", name, ignore.case = TRUE)) %>%
        mutate(total = clean_numeric(ifelse(total %in% c("..", "."), NA, total)))

    # Extract CBS totals (includes all registrations, even years with <5 babies)
    totals <- clean_data %>%
        filter(!is.na(total)) %>%
        mutate(
            sector = sector_sex["sector"],
            sex = sector_sex["sex"]
        ) %>%
        select(sector, sex, name, total) %>%
        mutate(total = as.integer(total))

    # Convert yearly data to long format
    yearly <- clean_data %>%
        pivot_longer(
            cols = -c(name, total),
            names_to = "year",
            values_to = "n"
        ) %>%
        mutate(
            year = as.numeric(year),
            n = case_when(
                n == ".." ~ NA_character_,
                n == "." ~ NA_character_,
                TRUE ~ as.character(n)
            ),
            n = clean_numeric(n)
        ) %>%
        filter(!is.na(n) & n > 0) %>%
        mutate(
            sector = sector_sex["sector"],
            sex = sector_sex["sex"]
        ) %>%
        group_by(year) %>%
        mutate(prop = zapsmall(n / sum(n, na.rm = TRUE))) %>%
        ungroup() %>%
        select(sector, year, sex, name, n, prop)

    return(list(yearly = yearly, totals = totals))
}

# Process all sheets
cat("Processing CBS data from:", CBS_FILE, "\n\n")

parsed <- map2(
    names(sheet_mapping),
    sheet_mapping,
    parse_cbs_sheet
)

babynamesIL <- map_dfr(parsed, "yearly") %>%
    mutate(
        sector = factor(sector, levels = c("Jewish", "Muslim", "Christian-Arab", "Druze")),
        n = as.integer(n)
    ) %>%
    arrange(sector, year, sex, desc(n)) %>%
    mutate(sector = as.character(sector))

# Totals from CBS (includes all registrations, even years with <5 babies)
babynamesIL_totals <- map_dfr(parsed, "totals") %>%
    mutate(
        sector = factor(sector, levels = c("Jewish", "Muslim", "Christian-Arab", "Druze"))
    ) %>%
    arrange(sector, sex, desc(total)) %>%
    mutate(sector = as.character(sector))

# Summary statistics
cat("\n=== Dataset Summary ===\n")
cat("babynamesIL:\n")
cat("  Rows:", nrow(babynamesIL), "\n")
cat("  Sectors:", paste(unique(babynamesIL$sector), collapse = ", "), "\n")
cat("  Year range:", min(babynamesIL$year), "-", max(babynamesIL$year), "\n")
cat("  Unique names:", n_distinct(babynamesIL$name), "\n")

cat("\nbabynamesIL_totals:\n")
cat("  Rows:", nrow(babynamesIL_totals), "\n")

# ============================================================================
# Data Validation Assertions
# ============================================================================
cat("\n=== Data Validation ===\n")

# 1. Proportions must sum to ~1 per group
prop_check <- babynamesIL %>%
    group_by(sector, year, sex) %>%
    summarise(prop_sum = sum(prop), .groups = "drop")

stopifnot(
    "Proportions do not sum to ~1 for all groups" =
        all(abs(prop_check$prop_sum - 1.0) < 0.01)
)
cat("  [OK] Proportions sum to ~1 for all sector/year/sex groups\n")

# 2. No duplicate name/year/sector/sex combinations
dup_check <- babynamesIL %>%
    group_by(sector, year, sex, name) %>%
    filter(n() > 1)
stopifnot("Duplicate name/year/sector/sex found" = nrow(dup_check) == 0)
cat("  [OK] No duplicate name/year/sector/sex combinations\n")

# 3. All counts >= 5 (CBS threshold)
stopifnot("Found counts < 5" = all(babynamesIL$n >= 5))
cat("  [OK] All counts >= 5\n")

# 4. Year range is contiguous (no gaps)
expected_sectors <- c("Jewish", "Muslim", "Christian-Arab", "Druze")
stopifnot(
    "Unexpected sectors" =
        setequal(unique(babynamesIL$sector), expected_sectors)
)
cat("  [OK] Sectors match expected:", paste(expected_sectors, collapse = ", "), "\n")

# 5. Years are contiguous per sector
year_gaps <- babynamesIL %>%
    distinct(sector, year) %>%
    group_by(sector) %>%
    arrange(year) %>%
    mutate(gap = year - lag(year)) %>%
    filter(!is.na(gap), gap > 1)
if (nrow(year_gaps) > 0) {
    warning("Year gaps detected:\n", paste(capture.output(print(year_gaps)), collapse = "\n"))
} else {
    cat("  [OK] No year gaps detected\n")
}

# 6. CBS totals must be >= sum of filtered yearly data
#    (CBS totals include registrations from years with <5 babies)
totals_check <- babynamesIL %>%
    group_by(sector, sex, name) %>%
    summarise(yearly_sum = sum(n), .groups = "drop") %>%
    inner_join(babynamesIL_totals, by = c("sector", "sex", "name"))
stopifnot(
    "CBS total is less than sum of yearly data" =
        all(totals_check$total >= totals_check$yearly_sum)
)
cat("  [OK] CBS totals >= sum of filtered yearly data\n")

# Report how many names have totals higher than yearly sums
names_with_extra <- sum(totals_check$total > totals_check$yearly_sum)
cat("  [INFO]", names_with_extra, "names have CBS totals higher than sum of yearly data",
    "(includes sub-threshold years)\n")

cat("\nAll validations passed!\n")

cat("\nProportion summary:\n")
print(summary(prop_check$prop_sum))

# Save datasets
cat("\nSaving datasets...\n")

readr::write_csv(babynamesIL, "data-raw/babynamesIL.csv")
usethis::use_data(babynamesIL, compress = "xz", overwrite = TRUE)

readr::write_csv(babynamesIL_totals, "data-raw/babynamesIL_totals.csv")
usethis::use_data(babynamesIL_totals, compress = "xz", overwrite = TRUE)

cat("\nData processing complete!\n")
