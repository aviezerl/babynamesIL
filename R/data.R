#' @importFrom tibble tibble
NULL

#' Israeli Baby Names (1949-2024)
#'
#' Names given to babies born in Israel from 1949-2024, sourced from the
#' Israeli Central Bureau of Statistics (CBS/LAMAS).
#'
#' @details
#' ## Data Sources
#' The primary data source is CBS release 391/2025, which contains comprehensive
#' baby name statistics from 1949 to 2024. The data is filtered to include only
#' names given to at least 5 babies in a given year.
#'
#' Data was downloaded from:
#' \href{https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx}{CBS Release 391/2025}
#'
#' ## Sectors
#' The data covers four demographic sectors:
#' \itemize{
#'   \item \code{Jewish} - Jewish population
#'   \item \code{Muslim} - Muslim population
#'   \item \code{Christian-Arab} - Christian Arab population
#'   \item \code{Druze} - Druze population
#' }
#'
#' ## Related Datasets
#' \itemize{
#'   \item \code{\link{babynamesIL_1948}}: Legacy 1948 data (from earlier CBS release)
#'   \item \code{\link{babynamesIL_other}}: Archived "Other" sector data (1985-2021)
#'   \item \code{\link{babynamesIL_totals}}: Aggregated totals by name/sector/sex
#' }
#'
#' ## Breaking Changes (v0.1.0)
#' \itemize{
#'   \item "Christian" sector renamed to "Christian-Arab"
#'   \item "Other" sector removed from main data (see \code{\link{babynamesIL_other}})
#'   \item 1948 data moved to separate object (see \code{\link{babynamesIL_1948}})
#' }
#'
#' @format A tibble with six columns:
#' \describe{
#'   \item{sector}{Demographic sector (character): "Jewish", "Muslim", "Christian-Arab", or "Druze"}
#'   \item{year}{Birth year (numeric): 1949-2024}
#'   \item{sex}{Sex (character): "M" for male, "F" for female}
#'   \item{name}{Baby name in Hebrew (character)}
#'   \item{n}{Count of babies given this name in that year (integer)}
#'   \item{prop}{Proportion of babies with this name within the year/sector/sex group (numeric, 0-1)}
#' }
#'
#' @examples
#' \donttest{
#' # Most popular names in 2024
#' library(dplyr)
#' babynamesIL |>
#'   filter(year == 2024, sector == "Jewish") |>
#'   group_by(sex) |>
#'   slice_max(n, n = 5)
#'
#' # Names over time
#' babynamesIL |>
#'   filter(name == "נועם", sector == "Jewish") |>
#'   select(year, sex, n, prop)
#' }
#'
#' @seealso \code{\link{babynamesIL_totals}}, \code{\link{babynamesIL_1948}}, \code{\link{babynamesIL_other}}
"babynamesIL"

#' Israeli Baby Names - Aggregated Totals
#'
#' Total count of babies per name across all years (1949-2024), by sector and sex.
#'
#' @format A tibble with four columns:
#' \describe{
#'   \item{sector}{Demographic sector (character): "Jewish", "Muslim", "Christian-Arab", or "Druze"}
#'   \item{sex}{Sex (character): "M" for male, "F" for female}
#'   \item{name}{Baby name in Hebrew (character)}
#'   \item{total}{Total count across all years (integer)}
#' }
#'
#' @examples
#' \donttest{
#' # Most popular names of all time in the Jewish sector
#' library(dplyr)
#' babynamesIL_totals |>
#'   filter(sector == "Jewish") |>
#'   group_by(sex) |>
#'   slice_max(total, n = 10)
#' }
#'
#' @seealso \code{\link{babynamesIL}}
"babynamesIL_totals"

#' Israeli Baby Names - 1948 Legacy Data
#'
#' Baby name data from 1948, preserved from an earlier CBS release.
#' This data is kept separate as the primary dataset (babynamesIL) now
#' uses CBS release 391/2025 which starts from 1949.
#'
#' @details
#' This dataset was extracted from the original babynamesIL package
#' (versions prior to 0.1.0) which used a different CBS source file.
#' The 1948 data represents the first full year of Israeli statehood.
#'
#' Note that the "Other" sector was not reported in 1948 data.
#'
#' @format A tibble with six columns:
#' \describe{
#'   \item{sector}{Demographic sector (character): "Jewish", "Muslim", "Christian", or "Druze"}
#'   \item{year}{Birth year (numeric): 1948}
#'   \item{sex}{Sex (character): "M" for male, "F" for female}
#'   \item{name}{Baby name in Hebrew (character)}
#'   \item{n}{Count of babies given this name (integer)}
#'   \item{prop}{Proportion within the year/sector/sex group (numeric, 0-1)}
#' }
#'
#' @note
#' This dataset uses "Christian" (not "Christian-Arab") as the sector name,
#' matching the terminology from the original data source.
#'
#' @seealso \code{\link{babynamesIL}}
"babynamesIL_1948"

#' Israeli Baby Names - "Other" Sector Archive
#'
#' Archived baby name data for the "Other" demographic sector (1985-2021).
#' This sector is no longer published by CBS in recent releases.
#'
#' @details
#' The "Other" sector included populations not classified as Jewish, Muslim,
#' Christian, or Druze. CBS discontinued publishing this sector in their
#' baby names statistics after 2021.
#'
#' This dataset preserves the historical "Other" sector data for research
#' purposes. It was extracted from babynamesIL versions prior to 0.1.0.
#'
#' @format A tibble with six columns:
#' \describe{
#'   \item{sector}{Demographic sector (character): "Other"}
#'   \item{year}{Birth year (numeric): 1985-2021}
#'   \item{sex}{Sex (character): "M" for male, "F" for female}
#'   \item{name}{Baby name in Hebrew (character)}
#'   \item{n}{Count of babies given this name (integer)}
#'   \item{prop}{Proportion within the year/sector/sex group (numeric, 0-1)}
#' }
#'
#' @note
#' This dataset is provided for historical reference. The "Other" sector
#' is no longer updated and should be used with appropriate caveats in
#' any analysis.
#'
#' @seealso \code{\link{babynamesIL}}
"babynamesIL_other"
