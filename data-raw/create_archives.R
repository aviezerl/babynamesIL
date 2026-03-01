# Create archive datasets from current babynamesIL before the 2024 update
# This script extracts:
#   - babynamesIL_1948: 1948 data (will be excluded from new CBS file)
#   - babynamesIL_other: "Other" sector data (discontinued by CBS)

library(tidyverse)
library(usethis)
library(babynamesIL)

# Extract 1948 data
babynamesIL_1948 <- babynamesIL %>%
    filter(year == 1948) %>%
    arrange(sector, sex, desc(n))

cat("babynamesIL_1948 summary:\n")
cat("  Rows:", nrow(babynamesIL_1948), "\n")
cat("  Sectors:", paste(unique(babynamesIL_1948$sector), collapse = ", "), "\n")
cat("  Year range:", range(babynamesIL_1948$year), "\n")

# Extract "Other" sector data
babynamesIL_other <- babynamesIL %>%
    filter(sector == "Other") %>%
    arrange(year, sex, desc(n))

cat("\nbabynamesIL_other summary:\n")
cat("  Rows:", nrow(babynamesIL_other), "\n")
cat("  Year range:", range(babynamesIL_other$year), "\n")
cat("  Unique names:", n_distinct(babynamesIL_other$name), "\n")

# Also extract totals for "Other" sector
babynamesIL_other_totals <- babynamesIL_totals %>%
    filter(sector == "Other") %>%
    arrange(sex, desc(total))

cat("\nbabynamesIL_other_totals summary:\n")
cat("  Rows:", nrow(babynamesIL_other_totals), "\n")

# Save archive datasets
usethis::use_data(babynamesIL_1948, compress = "xz", overwrite = TRUE)
usethis::use_data(babynamesIL_other, compress = "xz", overwrite = TRUE)

# Also save as CSV for reference
readr::write_csv(babynamesIL_1948, "data-raw/babynamesIL_1948.csv")
readr::write_csv(babynamesIL_other, "data-raw/babynamesIL_other.csv")

cat("\nArchive datasets created successfully!\n")
