# babynamesIL 0.2.1

## Breaking Changes

* **Sector renamed**: "Christian" sector is now "Christian-Arab" to match CBS terminology.
  Update your code: `filter(sector == "Christian")` becomes `filter(sector == "Christian-Arab")`.

* **"Other" sector removed**: The "Other" sector is no longer included in `babynamesIL`.
  Historical "Other" sector data (1985-2021) is available in the new `babynamesIL_other` dataset.

* **1948 data moved**: The 1948 data is now in a separate `babynamesIL_1948` dataset.
  The main `babynamesIL` dataset now covers 1949-2024.

## New Features

* Updated data through 2024 from CBS Release 391/2025.

* New dataset `babynamesIL_1948`: Legacy 1948 baby name data preserved from earlier CBS release.

* New dataset `babynamesIL_other`: Archived "Other" sector data (1985-2021) for historical research.

* Improved documentation with comprehensive details about data sources and breaking changes.

## Data Changes

* Year range: 1949-2024 (vs 1948-2023 in previous version)
* Sectors: Jewish, Muslim, Christian-Arab, Druze (removed "Other")
* Total rows: ~159K (vs ~131K in previous version)
* Primary source: CBS Release 391/2025

## Internal

* Refactored data processing into `data-raw/process_cbs_data.R` for maintainability.
* Added archive creation script `data-raw/create_archives.R`.

---

# babynamesIL 0.0.3

* Added 2023 data.

# babynamesIL 0.0.2

* Added 2022 data.

# babynamesIL 0.0.1

* Initial release.
