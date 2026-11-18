// Data decoding and analyses (no DOM). Used by app.js and tested by check.mjs.
// Data layout: see build_data.py.

export const SEXES = ['M', 'F'];
const key = (sector, sex, name) => `${sector}|${sex}|${name}`;

export function decode(d) {
  const nY = d.y1 - d.y0 + 1;
  const db = {
    y0: d.y0, y1: d.y1, nY, sectors: d.sectors, names: d.names.slice(),
    births: d.births || null, mainNames: d.names.length,
    series: new Map(), groups: new Map(), rare: new Map(), index: [], _cache: new Map(),
  };
  for (const [sec, sx, ni, start, total, counts] of d.s) {
    const n = new Int32Array(nY);
    n.set(counts, start);
    const o = { sector: d.sectors[sec], sex: SEXES[sx], name: d.names[ni], n, total, peak: Math.max(...counts) };
    db.series.set(key(o.sector, o.sex, o.name), o);
    const g = o.sector + '|' + o.sex;
    if (!db.groups.has(g)) db.groups.set(g, []);
    db.groups.get(g).push(o);
  }
  db.listed = new Map();
  for (const [g, arr] of db.groups) {
    const s = new Float64Array(nY);
    for (const o of arr) for (let i = 0; i < nY; i++) s[i] += o.n[i];
    db.listed.set(g, s);
  }
  // search index: one entry per (sector, name), both sexes merged
  const recentFrom = Math.max(0, nY - 5);
  const byName = new Map();
  for (const o of db.series.values()) {
    const k = o.sector + '|' + o.name;
    let e = byName.get(k);
    if (!e) byName.set(k, e = { name: o.name, sector: o.sector, recent: 0, total: 0, listedSum: 0, listed: true });
    for (let i = 0; i < nY; i++) { e.listedSum += o.n[i]; if (i >= recentFrom) e.recent += o.n[i]; }
    e.total += o.total;
  }
  db.index = [...byName.values()];
  // reasons for the one-year jumps (data-raw/jump_reasons.csv), keyed "sector|sex|name|year"
  db.why = new Map((d.why || []).map(([sec, sx, name, year, conf, en, he, src]) =>
    [`${sec}|${sx}|${name}|${year}`, { conf, en, he, src }]));
  return db;
}

// Sudden rises. years = 1: babies at least tripled from one year to the next, to 100 or more.
// years = 3: at least x5 within 3 years, to 100 or more, for names with no one-year jump (in this sector
// and sex). from = babies `years` years before (0 = under 5, counted as a jump from at most 4).
// fall: sudden drops instead, from 100 or more: to half or less in one year, or to a third or less within
// 3 years (to = 0: under 5, counted as at most 4). times: how many times the babies grew or shrank.
// after (drops only): the year of a jump or 3-year rise of the name that ended at most 5 years before the drop
// began, i.e. the drop is that rise fading.
// Back-to-back qualifying years are one rise (or drop), shown at its biggest change. By year, then size.
export function jumps(db, sector, { years = 1, fall = false, min = fall ? (years === 1 ? 2 : 3) : (years === 1 ? 3 : 5), minN = 100 } = {}) {
  const skip = years === 1 ? null : new Set(jumps(db, sector, { fall }).map(r => r.sex + '|' + r.name));
  const out = [];
  for (const sex of SEXES) for (const o of group(db, sector, sex)) {
    if (skip?.has(sex + '|' + o.name)) continue;
    let cur = null;
    for (let i = years; i < db.nY; i++) {
      const a = o.n[i - years], b = o.n[i], [hi, lo] = fall ? [a, b] : [b, a];
      if (!(hi >= minN && hi >= min * lo)) { cur = null; continue; }
      const r = { name: o.name, sex, year: db.y0 + i, from: a, to: b, years, times: hi / (lo || 4) };
      if (!cur) out.push(cur = r);
      else if (r.times > cur.times) Object.assign(cur, r);
    }
  }
  if (fall) {
    const ups = [...jumps(db, sector), ...jumps(db, sector, { years: 3 })];
    for (const d of out) {
      const start = d.year - d.years;
      d.after = ups.filter(u => u.sex === d.sex && u.name === d.name && u.year <= start && start - u.year <= 5)
        .reduce((y, u) => Math.max(y, u.year), 0) || null;
    }
  }
  return out.sort((x, y) => x.year - y.year || Math.max(y.from, y.to) - Math.max(x.from, x.to));
}

// Names never given to 5+ babies in one year (rare.json), loaded after the first render.
export function addRare(db, r) {
  db.names = db.names.slice(0, db.mainNames).concat(r.names);
  const listedIn = new Set(db.index.map(e => e.sector + '|' + e.name));
  const extra = new Map();
  for (const [sec, sx, ni, total] of r.t) {
    const sector = db.sectors[sec], name = db.names[ni];
    db.rare.set(key(sector, SEXES[sx], name), total);
    const k = sector + '|' + name;
    if (listedIn.has(k)) continue;
    if (!extra.has(k)) extra.set(k, { name, sector, recent: 0, total: 0, listedSum: 0, listed: false });
    extra.get(k).total += total;
  }
  db.index.push(...extra.values());
  db.rareLoaded = true;
}

export const group = (db, sector, sex) => db.groups.get(sector + '|' + sex) || [];
export const yearIdx = (db, year) => year - db.y0;
export const hasBirths = (db, sector) => !!(db.births && db.births[sector] && db.births[sector].M && db.births[sector].F);

export function denom(db, sector, sex) {
  return hasBirths(db, sector) ? db.births[sector][sex] : db.listed.get(sector + '|' + sex);
}

export function share(db, o) {
  const d = denom(db, o.sector, o.sex);
  return Array.from(o.n, (v, i) => (d[i] ? v / d[i] : 0));
}

export function lookup(db, sector, name) {
  const out = { name, sector, M: null, F: null, rareM: null, rareF: null };
  for (const sex of SEXES) {
    out[sex] = db.series.get(key(sector, sex, name)) || null;
    out['rare' + sex] = db.rare.get(key(sector, sex, name)) ?? null;
  }
  return out;
}

export const normalize = q => q.trim().replace(/׳/g, "'").replace(/\s+/g, ' ');
// Other countries' spellings: the plain form (no accents, lower case) groups Raphaël with Raphael,
// and its first two letters name the file it is in (intl/sp/, see build_data.py).
export const plainLatin = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export const spShard = k => [...k].slice(0, 2).map(c => (c >= 'a' && c <= 'z' ? c : '_' + c.codePointAt(0))).join('');

// ---- comparison (several names on one chart) -----------------------------------------
// sex per compared name: 'M', 'F' or 'B' (both lines).

const has = (db, sector, sex, name) => db.series.has(key(sector, sex, name));

// sex is usable for this name if it has yearly data (both sexes for 'B'), else null.
export function validSex(db, sector, name, sex) {
  if (sex === 'B') return has(db, sector, 'M', name) && has(db, sector, 'F', name) ? 'B' : null;
  return (sex === 'M' || sex === 'F') && has(db, sector, sex, name) ? sex : null;
}

// Both sexes if the smaller one has >= minShare of the name's all-time total in the
// sector (keeps flat-at-zero lines off the chart), else the larger one.
export function defaultSex(db, sector, name, minShare = 0.1) {
  const tot = sex => db.series.get(key(sector, sex, name))?.total ?? 0;
  const m = tot('M'), f = tot('F');
  if (!m && !f) return null;
  if (m && f && Math.min(m, f) / (m + f) >= minShare) return 'B';
  return m >= f ? 'M' : 'F';
}

// "name:sex,name:sex" -> [{name, sex}] validated against the data: names without yearly
// data in the sector are dropped, a missing or unusable sex falls back to defaultSex,
// duplicates and `exclude` (the main name) are dropped, at most `max` entries.
export function parseCmp(db, raw, sector, exclude, max = 4) {
  const out = [], seen = new Set([exclude]);
  for (const part of String(raw || '').split(',')) {
    const m = /^(.*?)(?::([MFB]))?$/.exec(part.trim());
    const name = normalize(m[1]).slice(0, 40);
    if (!name || seen.has(name)) continue;
    const sex = validSex(db, sector, name, m[2]) || defaultSex(db, sector, name);
    if (!sex) continue;
    seen.add(name);
    out.push({ name, sex });
    if (out.length >= max) break;
  }
  return out;
}

export const cmpParam = list => list.map(e => `${e.name}:${e.sex}`).join(',');

// competition ranking: 1 + number of names with more babies that year
export function rank(db, sector, sex, yi, n) {
  if (!n) return null;
  let r = 1;
  for (const o of group(db, sector, sex)) if (o.n[yi] > n) r++;
  return r;
}

const byCount = yi => (a, b) => b.n[yi] - a.n[yi] || (a.name < b.name ? -1 : 1);

export function top(db, sector, sex, yi, k = 10) {
  const g = group(db, sector, sex);
  const now = g.filter(o => o.n[yi] > 0).sort(byCount(yi)).slice(0, k);
  return now.map(o => ({
    name: o.name, n: o.n[yi], rank: rank(db, sector, sex, yi, o.n[yi]),
    prevRank: yi > 0 ? rank(db, sector, sex, yi - 1, o.n[yi - 1]) : undefined,
  }));
}

// Largest changes in number of babies vs the previous year (0 = fewer than 5).
export function changes(db, sector, yi, { minN = 20, k = 8 } = {}) {
  const rows = [];
  for (const sex of SEXES) for (const o of group(db, sector, sex)) {
    const prev = o.n[yi - 1], now = o.n[yi];
    if (Math.max(prev, now) < minN) continue;
    rows.push({ name: o.name, sex, prev, now, d: now - prev });
  }
  return {
    rise: rows.filter(r => r.d > 0).sort((a, b) => b.d - a.d).slice(0, k),
    fall: rows.filter(r => r.d < 0).sort((a, b) => a.d - b.d).slice(0, k),
  };
}

// Names given to at least minEach boys and minEach girls in the year.
export function unisex(db, sector, yi, { minEach = 50, k = 10 } = {}) {
  const out = [];
  for (const m of group(db, sector, 'M')) {
    const f = db.series.get(key(sector, 'F', m.name));
    if (!f || m.n[yi] < minEach || f.n[yi] < minEach) continue;
    out.push({ name: m.name, m: m.n[yi], f: f.n[yi], male: m.n[yi] / (m.n[yi] + f.n[yi]) });
  }
  return out.sort((a, b) => b.m + b.f - (a.m + a.f)).slice(0, k);
}

// Male share changed by >= minChange vs the previous year; the name was given to both
// sexes in both years, with >= minBoth babies in each year (same rule as the R articles).
export function shifts(db, sector, yi, { minChange = 0.1, minBoth = 50 } = {}) {
  const out = [];
  for (const m of group(db, sector, 'M')) {
    const f = db.series.get(key(sector, 'F', m.name));
    if (!f) continue;
    const [m0, m1, f0, f1] = [m.n[yi - 1], m.n[yi], f.n[yi - 1], f.n[yi]];
    if (!m0 || !m1 || !f0 || !f1 || m0 + f0 < minBoth || m1 + f1 < minBoth) continue;
    const before = m0 / (m0 + f0), after = m1 / (m1 + f1);
    if (Math.abs(after - before) >= minChange) out.push({ name: m.name, before, after, m: m1, f: f1 });
  }
  return out.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before));
}

// Peak >= minPeak, and the lowest listed count after the peak year is >= 95% below it
// (same rule as the corrected R article). Sorted by peak size.
export function disappeared(db, sector, { minPeak = 100, minDecline = 0.95, k = Infinity } = {}) {
  const out = [];
  for (const sex of SEXES) for (const o of group(db, sector, sex)) {
    if (o.peak < minPeak) continue;
    const py = o.n.indexOf(o.peak);
    let low = Infinity, ly = -1;
    for (let i = py + 1; i < db.nY; i++) if (o.n[i] > 0 && o.n[i] < low) { low = o.n[i]; ly = i; }
    if (ly < 0 || 1 - low / o.peak < minDecline) continue;
    out.push({ name: o.name, sex, peak: o.peak, peakYear: db.y0 + py, low, lowYear: db.y0 + ly, last: o.n[db.nY - 1] });
  }
  return out.sort((a, b) => b.peak - a.peak).slice(0, k);
}

// The #1 name each year, as runs of consecutive years.
export function numberOnes(db, sector, sex) {
  const g = group(db, sector, sex), runs = [];
  for (let yi = 0; yi < db.nY; yi++) {
    let best = null;
    for (const o of g) if (o.n[yi] > 0 && (!best || o.n[yi] > best.n[yi] || (o.n[yi] === best.n[yi] && o.name < best.name))) best = o;
    if (!best) continue;
    const last = runs[runs.length - 1];
    if (last && last.name === best.name && last.to === db.y0 + yi - 1) last.to++;
    else runs.push({ name: best.name, from: db.y0 + yi, to: db.y0 + yi });
  }
  return runs;
}

// Effective number of names = exp(Shannon entropy) over the listed names of each year.
export function diversity(db, sector, sex) {
  const g = group(db, sector, sex), tot = db.listed.get(sector + '|' + sex);
  return Array.from(tot, (t, i) => {
    let h = 0;
    for (const o of g) if (o.n[i] > 0) { const p = o.n[i] / t; h -= p * Math.log(p); }
    return t ? Math.exp(h) : 0;
  });
}

// Names whose yearly share has a similar shape (Pearson r on the share scaled to its own
// max). Only names with a peak of >= minPeak babies are compared, to avoid noisy series.
export function similar(db, sector, sex, name, { k = 6, minPeak = 30 } = {}) {
  const ck = `sim|${sector}|${sex}`;
  if (!db._cache.has(ck)) {
    const rows = group(db, sector, sex).filter(o => o.peak >= minPeak);
    const vecs = rows.map(o => {
      const v = share(db, o), mx = Math.max(...v);
      const x = v.map(a => a / mx), mean = x.reduce((a, b) => a + b, 0) / x.length;
      const sd = Math.sqrt(x.reduce((a, b) => a + (b - mean) ** 2, 0) / x.length) || 1;
      return Float64Array.from(x, a => (a - mean) / sd);
    });
    db._cache.set(ck, { rows, vecs });
  }
  const { rows, vecs } = db._cache.get(ck);
  const i = rows.findIndex(o => o.name === name);
  if (i < 0) return null;
  const v = vecs[i], nY = v.length;
  return rows.map((o, j) => {
    let r = 0;
    for (let t = 0; t < nY; t++) r += v[t] * vecs[j][t];
    return { name: o.name, r: r / nY };
  }).filter((_, j) => j !== i).sort((a, b) => b.r - a.r).slice(0, k);
}

// ---- rise and fall (same rules as vignettes/articles/dynamics.Rmd) ------------------------
// Every name-and-sex series with minTop+ babies in its top year. Curve x: the name's share of its sector-and-sex
// babies, 5-year moving average (the ends repeat the first/last year), divided by its own maximum.
// Types, in this order:
//   comeback / camel (two waves): a dip (away from the first and last 5 years) below 1/2 of the lower of the highs on its two
//     sides, that high at least 1/4 of the peak; comeback if the first year is already at half the first high
//   stable: never below 1/3 of its peak
//   rising / declining: peak in the last / first EDGE years
//   bell: the rest
// rise: years from the first year at half the peak (from) to the peak; fall: from the peak to the last year at
// half (to). Each is null unless the peak is at least EDGE years inside the data and that side crosses half
// inside it. p: index of the peak year. dip: years of the high before, the low, and the high after (comeback and
// camel only).
export const TYPES = ['bell', 'rising', 'declining', 'stable', 'comeback', 'camel'];
const EDGE = 3;

function curve(v) {
  const n = v.length, s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let a = 0;
    for (let k = -2; k <= 2; k++) a += v[Math.min(n - 1, Math.max(0, i + k))];
    s[i] = a / 5;
  }
  const mx = Math.max(...s);
  return s.map(a => a / mx);
}

// the deepest dip: [depth, low index, first high index], or null
function deepestDip(x) {
  const n = x.length, pre = new Float64Array(n), post = new Float64Array(n);
  for (let i = 0; i < n; i++) pre[i] = Math.max(x[i], i ? pre[i - 1] : 0);
  for (let i = n - 1; i >= 0; i--) post[i] = Math.max(x[i], i < n - 1 ? post[i + 1] : 0);
  let best = null;
  for (let m = 5; m < n - 5; m++) {
    const lo = Math.min(pre[m - 1], post[m + 1]);
    if (lo < 1 / 4) continue;
    const r = x[m] / lo;
    if (!best || r < best[0]) best = [r, m];
  }
  if (!best) return null;
  let h1 = 0;
  for (let i = 1; i < best[1]; i++) if (x[i] > x[h1]) h1 = i;
  return [best[0], best[1], h1];
}

export function dynamics(db, sector, { minTop = 50 } = {}) {
  const ck = `dyn|${sector}|${minTop}`;
  if (db._cache.has(ck)) return db._cache.get(ck);
  const out = [], n = db.nY;
  for (const sex of SEXES) for (const o of group(db, sector, sex)) {
    if (o.peak < minTop) continue;
    const x = curve(share(db, o));
    let p = 0;
    for (let i = 1; i < n; i++) if (x[i] > x[p]) p = i;
    let l = p, r = p;
    while (l > 0 && x[l - 1] >= 0.5) l--;
    while (r < n - 1 && x[r + 1] >= 0.5) r++;
    const inner = p >= EDGE && p < n - EDGE, d = deepestDip(x);
    let type, dip = null;
    if (d && d[0] < 1 / 2) {
      type = x[0] >= x[d[2]] / 2 ? 'comeback' : 'camel';
      let h2 = d[1] + 1;
      for (let i = h2 + 1; i < n; i++) if (x[i] > x[h2]) h2 = i;
      dip = { hi1: db.y0 + d[2], lo: db.y0 + d[1], hi2: db.y0 + h2 };
    } else if (Math.min(...x) >= 1 / 3) type = 'stable';
    else if (p >= n - EDGE) type = 'rising';
    else if (p < EDGE) type = 'declining';
    else type = 'bell';
    out.push({ name: o.name, sex, top: o.peak, x, p, peak: db.y0 + p, from: db.y0 + l, to: db.y0 + r, type, dip,
      rise: inner && l > 0 ? p - l : null, fall: inner && r < n - 1 ? r - p : null });
  }
  db._cache.set(ck, out);
  return out;
}

// numpy's default (linear) quantile of a sorted array
const quant = (s, q) => { const i = (s.length - 1) * q, a = Math.floor(i); return s[a] + (s[Math.min(a + 1, s.length - 1)] - s[a]) * (i - a); };

// Median and middle half of the rise, fall and span (rise + fall + 1, both sides measured) of the rows.
export function spanStats(rows) {
  const st = v => { const s = v.sort((a, b) => a - b); return s.length ? { n: s.length, med: quant(s, 0.5), q25: quant(s, 0.25), q75: quant(s, 0.75) } : { n: 0 }; };
  return {
    rise: st(rows.filter(r => r.rise != null).map(r => r.rise)),
    fall: st(rows.filter(r => r.fall != null).map(r => r.fall)),
    span: st(rows.filter(r => r.rise != null && r.fall != null).map(r => r.rise + r.fall + 1)),
  };
}

// The rows' curves lined up on their peak year, offsets -K..K: quantiles 10, 25, 50, 75, 90 at each offset
// (null where fewer than minN names have data there).
export function typical(rows, { K = 40, minN = 30 } = {}) {
  const k = Array.from({ length: 2 * K + 1 }, (_, i) => i - K), q = { 10: [], 25: [], 50: [], 75: [], 90: [] };
  for (const off of k) {
    const v = [];
    for (const r of rows) { const j = r.p + off; if (j >= 0 && j < r.x.length) v.push(r.x[j]); }
    v.sort((a, b) => a - b);
    for (const p of [10, 25, 50, 75, 90]) q[p].push(v.length >= minN ? quant(v, p / 100) : null);
  }
  return { k, q };
}

// ---- search ----------------------------------------------------------------------

const HEBREW = /[֐-׿]/, LATIN = /[a-z]/i;

export function suggest(db, q, sector, k = 8) {
  q = normalize(q);
  if (!q) return [];
  let hits;
  if (HEBREW.test(q)) {
    hits = [];
    for (const e of db.index) {
      const s = e.name.startsWith(q) ? 0 : e.name.includes(q) ? 1 : -1;
      if (s >= 0) hits.push({ ...e, score: s });
    }
    hits.sort((a, b) => a.score - b.score || (a.sector === sector ? 0 : 1) - (b.sector === sector ? 0 : 1)
      || b.recent - a.recent || b.total - a.total || (a.name < b.name ? -1 : 1));
  } else if (LATIN.test(q)) {
    hits = translitSearch(db, q, sector, k);
    if (hits.length < k) for (const s of db.sectors) if (s !== sector) hits.push(...translitSearch(db, q, s, k - hits.length));
  } else return [];
  return hits.slice(0, k);
}

// Latin letters -> Hebrew names (ported from the prototype in the review). Each Hebrew
// name expands to its possible consonant skeletons; the query is reduced to a skeleton
// with the same letter classes; candidates are within edit distance 1, ranked by
// distance on a vowelled form minus a popularity bonus.
const FINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const finals = h => h.replace(/[ךםןףץ]/g, c => FINAL[c]);
const dedupe = s => s.replace(/(.)\1+/g, '$1');
const GERESH = { "ג'": 'j', "ז'": 'zh', "צ'": 'ch', "ח'": 'kh', "ת'": 'th', "ד'": 'dh', "ע'": 'gh', "ט'": 'z' };
const LET = { 'א': 'a', 'ב': 'v', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'o', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'i',
  'כ': 'ch', 'ל': 'l', 'מ': 'm', 'נ': 'n', 'ס': 's', 'ע': 'a', 'פ': 'f', 'צ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh',
  'ת': 't', '-': '', ' ': '' };
const GER_CLS = { "ג'": ['Y'], "ז'": ['Y', 'Z'], "צ'": ['X', 'S'], "ח'": ['X', 'H'], "ת'": ['T', 'S'],
  "ד'": ['D', 'Z'], "ע'": ['G', 'R'], "ט'": ['Z', 'T'] };
const CLS = { 'א': [''], 'ב': ['V'], 'ג': ['G'], 'ד': ['D'], 'ה': ['H', ''], 'ו': ['V', ''], 'ז': ['Z'],
  'ח': ['X', 'H'], 'ט': ['T'], 'י': ['Y', ''], 'כ': ['K', 'X'], 'ל': ['L'], 'מ': ['M'], 'נ': ['N'], 'ס': ['S'],
  'ע': [''], 'פ': ['F'], 'צ': ['Z'], 'ק': ['K'], 'ר': ['R'], 'ש': ['S'], 'ת': ['T'], '-': [''], ' ': [''], "'": [''] };
const LAT = { b: 'V', v: 'V', w: 'V', g: 'G', j: 'Y', y: 'Y', d: 'D', h: 'H', z: 'Z', t: 'T', k: 'K', c: 'K', q: 'K',
  l: 'L', m: 'M', n: 'N', s: 'S', p: 'F', f: 'F', r: 'R' };

export function romanize(h) {
  h = finals(h);
  const out = [];
  for (let i = 0; i < h.length; i++) {
    const two = h.slice(i, i + 2), c = h[i];
    if (GERESH[two]) { out.push(GERESH[two]); i++; continue; }
    if (c === "'") continue;
    let r = LET[c] ?? '';
    if (c === 'ו') { r = i === 0 || two === 'וו' ? 'v' : 'o'; if (two === 'וו') i++; }
    else if (c === 'י') { r = i === 0 || two === 'יי' ? 'y' : 'i'; if (two === 'יי') i++; }
    else if (i === 0 && (c === 'ב' || c === 'כ' || c === 'פ')) r = { 'ב': 'b', 'כ': 'k', 'פ': 'p' }[c];
    else if (c === 'ה' && i === h.length - 1) r = 'a';
    out.push(r);
  }
  return out.join('');
}

export function vowelled(s) {
  s = s.toLowerCase().replace(/[^a-z]/g, '');
  for (const [a, b] of [['ph', 'f'], ['kh', 'ch'], ['w', 'v'], ['ee', 'i'], ['oo', 'u'], ['u', 'o'], ['e', 'a'], ['y', 'i'], ['j', 'y']])
    s = s.replaceAll(a, b);
  return dedupe(s);
}

export function lev(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] !== b[j - 1])));
    prev = cur;
  }
  return prev[b.length];
}

export function hebSkeletons(h) {
  h = finals(h);
  const parts = [];
  for (let i = 0; i < h.length; i++) {
    const two = h.slice(i, i + 2);
    if (GER_CLS[two]) { parts.push(GER_CLS[two]); i++; continue; }
    const c = h[i], opts = CLS[c] ?? [''];
    if ((c === 'ו' || c === 'י') && (two === 'וו' || two === 'יי')) i++;
    parts.push(opts);
  }
  let out = [''];
  for (const opts of parts) out = out.flatMap(p => opts.map(o => p + o));
  return [...new Set(out.map(dedupe))];
}

export function latinSkeleton(q) {
  let s = q.toLowerCase().replace(/[^a-z]/g, '').replace(/h$/, '');
  for (const [a, b] of [['tch', 'X'], ['sch', 'S'], ['ch', 'X'], ['kh', 'X'], ['sh', 'S'], ['ph', 'F'], ['tz', 'Z'],
    ['ts', 'Z'], ['th', 'T'], ['ck', 'K'], ['x', 'KS']]) s = s.replaceAll(a, b);
  s = [...s].map(ch => LAT[ch] ?? (ch >= 'A' && ch <= 'Z' ? ch : '')).join('');
  return dedupe(s);
}

export function translitSearch(db, q, sector, k = 5) {
  const ck = 'tr|' + sector;
  if (!db._cache.has(ck)) db._cache.set(ck, db.index.filter(e => e.sector === sector && e.listed).map(e => ({
    e, skels: hebSkeletons(e.name), vow: vowelled(romanize(e.name)), bonus: Math.log10(e.listedSum),
  })));
  const sq = latinSkeleton(q), vq = vowelled(q), hits = [];
  for (const c of db._cache.get(ck)) {
    let d = Infinity;
    for (const s of c.skels) { d = Math.min(d, lev(s, sq)); if (!d) break; }
    if (d <= 1) hits.push({ ...c.e, d, score: lev(c.vow, vq) - c.bonus });
  }
  return hits.sort((a, b) => a.d - b.d || a.score - b.score || (a.name < b.name ? -1 : 1)).slice(0, k);
}
