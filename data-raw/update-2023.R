library(tidyverse)
library(readxl)
library(usethis)
library(babynamesIL)

dir.create("data-raw/2023", showWarnings = FALSE, recursive = TRUE)

raw_data <- list(
    c("Jewish_female", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t1.xlsx"),
    c("Jewish_male", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t2.xlsx"),
    c("Muslim_female", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t3.xlsx"),
    c("Muslim_male", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t4.xlsx"),
    c("Christian_female", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t5.xlsx"),
    c("Christian_male", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t6.xlsx"),
    c("Druze_female", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t7.xlsx"),
    c("Druze_male", "https://www.cbs.gov.il/he/mediarelease/doclib/2024/199/11_24_199t8.xlsx")
)

# download files and parse data
data_new <- purrr::map_dfr(
    raw_data,
    ~ {
        file <- paste0("data-raw/2023/", .x[1], ".xlsx")
        if (!file.exists(file)) {
            download.file(.x[2], file)
        }
        md <- stringr::str_split(.x[1], "_")[[1]]
        sector <- md[1]
        sex <- md[2]
        sd <- readxl::read_xlsx(file, skip = 3, col_names = c("name", "n", "prop")) %>%
            mutate(prop = prop / 100, year = 2023, sector = sector, sex = ifelse(sex == "male", "M", "F")) %>%
            select(sector, year, sex, name, n, prop)

        return(sd)
    }
)

# add totals_2023 to the existing totals (babynamesIL_totals)
babynamesIL_totals <- babynamesIL_totals %>%
    left_join(data_new) %>%
    mutate(n = ifelse(is.na(n), 0, n)) %>%
    mutate(total = total + n) %>%
    select(-n) %>%
    distinct(sector, sex, name, total) %>%
    arrange(sector, sex, desc(total)) %>%
    mutate(sector = as.character(sector), total = as.integer(total)) %>%
    select(sector, sex, name, total)


# add the 2023 data to the existing data
babynamesIL <- bind_rows(
    babynamesIL,
    data_new %>%
        select(sector, year, sex, name, n, prop) %>%
        mutate(sector = as.character(sector), n = as.integer(n))
) %>%
    arrange(sector, year, sex, desc(n))

readr::write_csv(
    babynamesIL,
    "data-raw/babynamesIL.csv"
)
usethis::use_data(babynamesIL, compress = "xz", overwrite = TRUE)


readr::write_csv(
    babynamesIL_totals,
    "data-raw/babynamesIL_totals.csv"
)
usethis::use_data(babynamesIL_totals, compress = "xz", overwrite = TRUE)
