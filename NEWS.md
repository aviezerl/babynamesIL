# babynamesIL 0.2.3

## Bug Fix: Incorrect totals in `babynamesIL_totals`

**This release fixes a significant data bug introduced in v0.2.0.**

In v0.2.0, the `babynamesIL_totals` dataset was inadvertently changed to compute
totals by summing the filtered yearly data (which only includes years where a name
was given to ≥5 babies). This resulted in substantially underreported totals,
especially for less common names.

The CBS source data includes an accurate "total" column that counts *all*
registrations across all years, including years below the 5-baby threshold.
This release restores the use of the CBS total column.

**Impact**: Names that were uncommon (rarely reaching ≥5/year) were most affected.
For example, "אביעזר" was reported as 5 (only 1 year crossed the threshold)
when the true CBS total is 129. Even common names like "דוד" were slightly
underreported (95,744 vs correct 97,218).

**Affected versions**: v0.2.0 and v0.2.1.

**What changed**:

* `babynamesIL_totals` now uses the CBS total column directly (28,626 rows, up
  from 7,847) — this includes names that never reached ≥5 in any single year
  but still have a CBS total.
* The yearly `babynamesIL` dataset is unchanged — it still only contains
  years where a name was given to ≥5 babies, as per CBS publication rules.

---

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
