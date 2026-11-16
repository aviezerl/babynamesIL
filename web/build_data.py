"""Build web/data.json and web/rare.json from data-raw/ (run at Docker build time).

data.json (needed for the first render):
  y0, y1      first and last year in the data
  sectors     sector labels
  names       every name listed in at least one year (given to 5+ babies)
  s           one row per listed (sector, sex, name):
              [sector, sex, name, start, total, [n per year from y0+start]]
              n = 0 means fewer than 5 babies that year; total is the all-time
              total from babynamesIL_totals.csv (includes years with < 5)
  births      optional, from data-raw/births_by_year.csv (year, sector, sex, births):
              {sector: {sex: [births per year]}}, only for complete sector/sex series
rare.json (loaded after the first render):
  names       names that appear only here (indices continue after data.json names)
  t           [sector, sex, name, total] for names never given to 5+ babies in one year
sex: 0 = M, 1 = F. Only counts are shipped; the browser computes percentages.
"""
import csv
import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw"
WEB = ROOT / "web"
SECTORS = ["Jewish", "Muslim", "Christian-Arab", "Druze"]
SEX = {"M": 0, "F": 1}


def read(name):
    with open(RAW / name, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write(path, obj):
    raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode()
    path.write_bytes(raw)
    # precompressed copy for Caddy's file_server (smaller than on-the-fly gzip)
    path.with_name(path.name + ".gz").write_bytes(gzip.compress(raw, 9, mtime=0))
    return f"{path.name} {len(raw) / 1e3:.0f} KB raw"


rows = read("babynamesIL.csv")
totals = {(r["sector"], r["sex"], r["name"]): int(r["total"]) for r in read("babynamesIL_totals.csv")}
y0 = min(int(r["year"]) for r in rows)
y1 = max(int(r["year"]) for r in rows)

series = {}
for r in rows:
    series.setdefault((r["sector"], r["sex"], r["name"]), {})[int(r["year"])] = int(r["n"])

names = sorted({k[2] for k in series})
idx = {n: i for i, n in enumerate(names)}
s = []
for key in sorted(series, key=lambda k: (SECTORS.index(k[0]), SEX[k[1]], idx[k[2]])):
    by_year = series[key]
    a, b = min(by_year), max(by_year)
    total = totals.get(key, sum(by_year.values()))
    s.append([SECTORS.index(key[0]), SEX[key[1]], idx[key[2]], a - y0, total,
              [by_year.get(y, 0) for y in range(a, b + 1)]])

rare_keys = sorted(k for k in totals if k not in series)
rare_names = sorted({k[2] for k in rare_keys} - set(idx))
idx.update({n: len(names) + i for i, n in enumerate(rare_names)})
t = sorted([SECTORS.index(k[0]), SEX[k[1]], idx[k[2]], totals[k]] for k in rare_keys)

births = None
if (RAW / "births_by_year.csv").exists():
    got = {}
    for r in read("births_by_year.csv"):
        if r.get("births") not in (None, "") and r["sector"] in SECTORS and r["sex"] in SEX:
            got.setdefault((r["sector"], r["sex"]), {})[int(r["year"])] = int(float(r["births"]))
    births = {}
    for (sec, sx), by_year in got.items():
        if all(y in by_year for y in range(y0, y1 + 1)):  # only complete series
            births.setdefault(sec, {})[sx] = [by_year[y] for y in range(y0, y1 + 1)]
    births = births or None

print(write(WEB / "data.json", {"y0": y0, "y1": y1, "sectors": SECTORS, "names": names, "s": s, "births": births}),
      f"({len(s)} series, years {y0}-{y1}, births={'yes' if births else 'no'})")
print(write(WEB / "rare.json", {"names": rare_names, "t": t}), f"({len(t)} totals-only rows)")
