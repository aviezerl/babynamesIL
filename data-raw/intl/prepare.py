"""Reshape the four countries' baby-name files into one long table.
Run monthly by .github/workflows/intl-update.yml, or by hand as below.

Usage: python3 data-raw/intl/prepare.py DIR
DIR holds the downloaded source files (kept on mraid16, too big for the repo):
  names.zip                 US, Social Security Administration. ssa.gov may refuse scripts; then
                            download https://www.ssa.gov/oact/babynames/names.zip in a browser.
  ons.xlsx                  England and Wales, ONS ("Baby names in England and Wales"), newest edition
  insee_nat.zip             France, INSEE ("Fichier des prénoms", national file)
  statcan_17100147.zip      Canada, Statistics Canada table 17-10-0147-01
Missing files are downloaded. INSEE puts each edition under a new URL:
update URLS["insee_nat.zip"] when a new one is out (usually June).
Writes DIR/long.tsv.gz: country, sex (M/F), name, year, n. Years before 1949 are dropped.
Each country's listing threshold is its own (US 5+, E&W 3+, Canada 5+, France counts rounded).
"""
import csv
import gzip
import io
import re
import sys
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

import openpyxl

DIR = Path(sys.argv[1])
Y0 = 1949
opener = urllib.request.build_opener()  # ons.gov.uk refuses Python's default client name
opener.addheaders = [("User-Agent", "babynamesIL-data-update")]
urllib.request.install_opener(opener)
ONS = "/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/datasets/babynamesinenglandandwalesfrom1996"
if not (DIR / "ons.xlsx").exists():  # each edition is a new file, babynames1996toYYYY.xlsx; take the newest listed
    y = max(re.findall(r"babynames1996to(\d{4})\.xlsx", urllib.request.urlopen("https://www.ons.gov.uk" + ONS).read().decode()))
    print("downloading ons.xlsx", y)
    urllib.request.urlretrieve(f"https://www.ons.gov.uk/file?uri={ONS}/1996to{y}/babynames1996to{y}.xlsx", DIR / "ons.xlsx")
URLS = {
    "insee_nat.zip": "https://www.insee.fr/fr/statistiques/fichier/8595130/prenoms-2025-nat_csv.zip",
    "statcan_17100147.zip": "https://www150.statcan.gc.ca/n1/tbl/csv/17100147-eng.zip",
}
for f, url in URLS.items():
    if not (DIR / f).exists():
        print("downloading", f)
        urllib.request.urlretrieve(url, DIR / f)
if not (DIR / "names.zip").exists():
    try:
        urllib.request.urlretrieve("https://www.ssa.gov/oact/babynames/names.zip", DIR / "names.zip")
        print("downloaded names.zip from ssa.gov")
    except urllib.error.HTTPError as e:
        sys.exit(f"ssa.gov refused names.zip ({e.code}): download https://www.ssa.gov/oact/babynames/names.zip in a browser")


def title(name):
    """AABAN -> Aaban, RAPHAËL -> Raphaël, JEAN-PIERRE -> Jean-Pierre"""
    return "-".join(p[:1] + p[1:].lower() for p in name.split("-"))


rows = []


def add(country, sex, name, year, n):
    if year >= Y0 and n > 0:
        rows.append((country, sex, unicodedata.normalize("NFC", name), year, n))


with zipfile.ZipFile(DIR / "names.zip") as z:
    for f in z.namelist():
        if f.startswith("yob") and f.endswith(".txt"):
            for name, sex, n in csv.reader(io.TextIOWrapper(z.open(f), "utf-8")):
                add("US", sex, name, int(f[3:7]), int(n))

wb = openpyxl.load_workbook(DIR / "ons.xlsx", read_only=True)
for sheet, sex in (("Table_1", "F"), ("Table_2", "M")):
    head = None
    for r in wb[sheet].iter_rows(values_only=True):
        if head is None:
            if r[0] == "Name":
                head = r
            continue
        if not r[0]:
            continue
        for h, v in zip(head, r):
            if h and h.endswith(" Count") and isinstance(v, (int, float)):  # "[x]" = 2 or fewer, redacted
                add("EW", sex, str(r[0]).strip(), int(h[:4]), int(v))

with zipfile.ZipFile(DIR / "insee_nat.zip") as z:
    f = next(f for f in z.namelist() if f.endswith(".csv"))
    for r in csv.DictReader(io.TextIOWrapper(z.open(f), "utf-8"), delimiter=";"):
        if r["prenom"] != "RARES" and r["periode"].isdigit():  # RARES lumps the rare names together
            add("FR", "M" if r["sexe"] == "1" else "F", title(r["prenom"]), int(r["periode"]), int(r["valeur"]))

with zipfile.ZipFile(DIR / "statcan_17100147.zip") as z:
    for r in csv.DictReader(io.TextIOWrapper(z.open("17100147.csv"), "utf-8-sig")):
        if r["Indicator"] == "Frequency" and r["VALUE"]:
            add("CA", "M" if r["Sex at birth"] == "Male" else "F", title(r["First name at birth"]),
                int(r["REF_DATE"]), int(float(r["VALUE"])))

with gzip.open(DIR / "long.tsv.gz", "wt", encoding="utf-8") as out:
    for r in rows:
        out.write("\t".join(map(str, r)) + "\n")
for c in ("US", "EW", "FR", "CA"):
    ys = [r[3] for r in rows if r[0] == c]
    print(c, f"{min(ys)}-{max(ys)}", sum(1 for r in rows if r[0] == c), "rows")
