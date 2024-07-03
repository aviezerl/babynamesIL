#' @importFrom tibble tibble
NULL

#' Israeli baby names per year.
#'
#' Full baby name data provided by the Israel's Central Bureau of
#' Statistics (LAMAS). Only names with at least 5 uses (in a given year)
#' are included. Data is separated by sectors and sex, where sectors are
#' "Jewish", "Muslim", "Christian", "Druze" and "Other".
#'
#' Data was downloaded from: \href{https://www.cbs.gov.il/he/publications/LochutTlushim/2020/%D7%A9%D7%9E%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D.xlsx}{here}
#'
#' 2022 data was downloaded from: \href{https://www.cbs.gov.il/he/mediarelease/Pages/2023/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2022.aspx}{here}
#'
#' 2023 data was downloaded from: \href{https://www.cbs.gov.il/he/mediarelease/Pages/2024/%D7%94%D7%A9%D7%9E%D7%95%D7%AA-%D7%94%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D-%D7%A9%D7%A0%D7%99%D7%AA%D7%A0%D7%95-%D7%9C%D7%99%D7%9C%D7%99%D7%93%D7%99-2023.aspx}{here}
#'
#'
#' @format A data frame with six variables: \code{sector}, \code{year}, \code{sex}, \code{name}, \code{n} and \code{prop} (\code{n} divided by total number
#' of babies \emph{in the database}).
"babynamesIL"

#' Israeli baby names total numbers.
#'
#' Total number of babies per name, sector and gender at the years 1948-2023.
#'
#'
#' @format A data frame with 4 variables: \code{sector}, \code{sex}, \code{name}, \code{n}.
"babynamesIL_totals"
