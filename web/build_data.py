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
intl/<code of the name's first letter>.json (loaded by the name page), from data-raw/intl/:
  tot         {country: {sex: [first year, [babies with a listed name per year]]}}
  sp          {"country|sex|spelling": [first year, [babies per year]]}
  m           {"name|sex|sector": {country: [spellings, the default first]}}; sector "" = any sector
intl/sp/<first two letters>.json (loaded when searching a spelling): every spelling in the four
countries, split by the first two letters of its plain form (no accents, lower case; other
characters written as _<code point>):
  tot         as above
  sp          as above, for every spelling starting with those letters
  il          {plain form: ["name|sex|sector", ...]}: the Israeli names matched to it (matches.csv)
"""
import csv
import gzip
import json
import unicodedata
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

# Other countries (data-raw/intl, made by prepare.py and match.mjs), split by the name's first letter
tot = {}
for r in read("intl/totals.csv"):
    tot.setdefault(r["country"], {}).setdefault(r["sex"], {})[int(r["year"])] = int(r["total"])
tot = {c: {sx: [min(v), [v[y] for y in range(min(v), max(v) + 1)]] for sx, v in d.items()} for c, d in tot.items()}
sp = {f'{r["country"]}|{r["sex"]}|{r["spelling"]}': [int(r["first"]), [int(x) for x in r["counts"].split()]]
      for r in read("intl/counts.csv")}
shards = {}
for r in read("intl/matches.csv"):
    m = shards.setdefault(ord(r["name"][0]), {}).setdefault(f'{r["name"]}|{r["sex"]}|{r["sector"]}', {})
    m.setdefault(r["country"], []).append(r["spelling"])
(WEB / "intl").mkdir(exist_ok=True)
for code, m in shards.items():
    need = {f'{c}|{k.split("|")[1]}|{s}' for k, v in m.items() for c, ss in v.items() for s in ss}
    write(WEB / "intl" / f"{code}.json", {"tot": tot, "sp": {k: sp[k] for k in sorted(need)}, "m": m})
print(f"intl/*.json: {len(shards)} files, {sum(len(m) for m in shards.values())} names")


def plain(s):  # same as plainLatin in lib.js
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c)[0] != "M").lower()


def sp_shard(k):  # same as spShard in lib.js
    return "".join(c if "a" <= c <= "z" else f"_{ord(c)}" for c in k[:2])


il = {}
for r in read("intl/matches.csv"):
    il.setdefault(plain(r["spelling"]), set()).add(f'{r["name"]}|{r["sex"]}|{r["sector"]}')
spsh = {}
for k in sp:
    spsh.setdefault(sp_shard(plain(k.split("|", 2)[2])), []).append(k)
(WEB / "intl" / "sp").mkdir(exist_ok=True)
for f, ks in spsh.items():
    keys = {plain(k.split("|", 2)[2]) for k in ks}
    write(WEB / "intl" / "sp" / f"{f}.json", {"tot": tot, "sp": {k: sp[k] for k in sorted(ks)},
                                               "il": {k: sorted(il[k]) for k in sorted(keys & il.keys())}})
print(f"intl/sp/*.json: {len(spsh)} files, {len(sp)} spellings")
