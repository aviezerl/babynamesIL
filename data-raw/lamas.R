library(tidyverse)
library(readxl)
library(usethis)

if (!file.exists("data-raw/names.xlsx")) {
    download.file("https://www.cbs.gov.il/he/publications/LochutTlushim/2020/%D7%A9%D7%9E%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D.xlsx", "data-raw/names.xlsx")
}

sectors_male <- c("Jewish" = "יהודים", "Muslim" = "מוסלמים", "Christian" = "נוצרים", "Druze" = "דרוזים", "Other" = "אחרים")
sectors_female <- c("Jewish" = "יהודיות", "Muslim" = "מוסלמיות", "Christian" = "נוצריות", "Druze" = "דרוזיות", "Other" = "אחרות")

parse_sheet <- function(sheet, sector, sex) {
    raw_xl <- readxl::read_xlsx("data-raw/names.xlsx", sheet = sheet, skip = 12)
    colnames(raw_xl)[1:2] <- c("name", "total")
    raw_xl %>%
        gather("year", "n", -(name:total)) %>%
        mutate(n = ifelse(n == "." | n == "..", NA, n)) %>%
        mutate(n = as.numeric(n)) %>%
        filter(!is.na(n)) %>%
        group_by(year) %>%
        mutate(prop = zapsmall(n / sum(n))) %>%
        ungroup() %>%
        mutate(sex = !!sex, sector = !!sector)
}

babynamesIL <- bind_rows(
    imap_dfr(sectors_male, ~ parse_sheet(.x, .y, "M")),
    imap_dfr(sectors_female, ~ parse_sheet(.x, .y, "F"))
) %>%
    mutate(year = as.numeric(year), sector = factor(sector, levels = names(sectors_male))) %>%
    arrange(sector, year, sex, desc(n))

babynamesIL_totals <- babynamesIL %>%
    distinct(sector, sex, name, total) %>%
    arrange(sector, sex, desc(total)) %>%
    mutate(sector = as.character(sector), total = as.integer(total)) %>%
    select(sector, sex, name, total)

babynamesIL <- babynamesIL %>%
    select(sector, year, sex, name, n, prop) %>%
    mutate(sector = as.character(sector), n = as.integer(n))

set.seed(60427)
readr::write_csv(
    babynamesIL %>%
        filter(n > 100) %>%
        sample_n(1000),
    "data-raw/babynamesIL_sample.csv"
)
usethis::use_data(babynamesIL, compress = "xz", overwrite = TRUE)

readr::write_csv(
    babynamesIL_totals %>%
        filter(total > 100) %>%
        sample_n(1000),
    "data-raw/babynamesIL_sample.csv"
)
usethis::use_data(babynamesIL_totals, compress = "xz", overwrite = TRUE)
