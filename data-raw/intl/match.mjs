// Match each listed Israeli name to its spellings in the other countries (run after prepare.py).
// Usage: node data-raw/intl/match.mjs DIR   (DIR/long.tsv.gz from prepare.py; needs web/data.json)
// Reads data-raw/intl/fixes.csv (hand-fixed spellings for the most common names).
// Writes data-raw/intl/{matches,counts,totals}.csv, which build_data.py turns into web/intl.json.
//
// A foreign spelling is a candidate for a Hebrew name of the same sex when
//  1. its consonants fit one of the Hebrew name's readings (latinSkeleton in hebSkeletons, from
//     the site's Latin search), and
//  2. it starts the same way: a vowel for א/ע, y/j/i/e for י, a consonant otherwise
//     (so Ella doesn't match לאה).
// Candidates are ranked by how well their vowels line up with the Hebrew letters (an edit
// distance where unwritten vowels are cheap), then by popularity in that country.
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { hebSkeletons, latinSkeleton, romanize, lev } from '../../web/lib.js';

const DIR = process.argv[2];
const OUT = new URL('.', import.meta.url).pathname;
const K = 3; // automatic spellings kept per name, country and sex
const MIN_ALT = 0.1; // an automatic alternative needs at least this share of the top spelling's babies
const MAX_MISMATCH = 0.8; // ponytail: fixed cut-off, tuned by eye on the top names

const plain = s => s.normalize('NFD').replace(/\p{M}/gu, '');
// Ranking: the foreign name as consonant classes (ח/כ/ה/k one class) and vowels a/e/i/o (u = o),
// final h and silent final e dropped. The Hebrew name as every reading of its letters:
// A = א/ע/final ה (any vowel, or silent), q = ה inside the name (h, or silent at a small cost),
// ו = o or w (a consonant v inside the name, less likely; always o right after an initial א/ע),
// י = i or Y. ש is S (sh); ס and a foreign s are s; S~s costs 0.4.
const CONS = { b: 'V', v: 'V', w: 'V', g: 'G', j: 'Y', y: 'Y', d: 'D', h: 'K', z: 'Z', t: 'T', k: 'K', c: 'K', q: 'K',
  l: 'L', m: 'M', n: 'N', s: 's', p: 'F', f: 'F', r: 'R', a: 'a', e: 'e', i: 'i', o: 'o', u: 'o' };
function form(latin) {
  let s = plain(latin).toLowerCase().replace(/[^a-z]/g, '').replace(/([aeiouy])h$/, '$1').replace(/([^aeiouy])e$/, '$1');
  for (const [a, b] of [['tch', 'K'], ['sch', 'S'], ['ch', 'K'], ['kh', 'K'], ['sh', 'S'], ['ph', 'F'], ['tz', 'Z'],
    ['ts', 'Z'], ['th', 'T'], ['ck', 'K'], ['x', 'Ks'], ['iy', 'i']]) s = s.replaceAll(a, b);
  return [...s].map(ch => CONS[ch] ?? ch).join('').replace(/(.)\1+/g, '$1');
}
const HEB = { 'ב': 'V', 'ג': 'G', 'ד': 'D', 'ז': 'Z', 'ח': 'K', 'ט': 'T', 'כ': 'K', 'ל': 'L', 'מ': 'M', 'נ': 'N',
  'ס': 's', 'פ': 'F', 'צ': 'Z', 'ק': 'K', 'ר': 'R', 'ש': 'S', 'ת': 'T' };
const GER = { "ג'": 'Y', "ז'": 'Z', "צ'": 'K', "ח'": 'K', "ת'": 'T', "ד'": 'D', "ע'": 'G', "ט'": 'Z' };
const FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
function hebForms(heb) {
  const h = heb.replace(/[ךםןףץ]/g, c => FIN[c]), parts = [];
  for (let i = 0; i < h.length; i++) {
    const c = h[i], two = h.slice(i, i + 2);
    if (GER[two]) { parts.push([GER[two]]); i++; continue; }
    if (two === 'וו' || two === 'יי') { parts.push([c === 'ו' ? 'V' : 'Y']); i++; continue; }
    if (c === 'א' || c === 'ע') parts.push(['A']);
    else if (c === 'ה') parts.push(i === 0 ? ['K'] : i === h.length - 1 ? ['A'] : ['q']);
    else if (c === 'ו') parts.push(i === 0 ? ['V'] : i === 1 && 'אע'.includes(h[0]) ? ['o'] : ['o', 'w']);
    else if (c === 'י') parts.push(i === 0 ? ['Y'] : ['i', 'Y']);
    else if (HEB[c]) parts.push([HEB[c]]);
  }
  let out = [''];
  for (const opts of parts) out = out.flatMap(p => opts.map(o => p + o));
  return out;
}
// Edit distance from a Hebrew reading to a foreign form. Returns [total, mismatch]: total counts a
// vowel the Hebrew doesn't write as 0.4; mismatch leaves those out (everything else: A matches any
// vowel; i~e, i~Y, S~s cost 0.4; w~V 0.2; dropping A is free, q 0.4; the rest 1).
const VOW = new Set(['a', 'e', 'i', 'o']);
function sub(x, y) {
  if (x === y || (x === 'A' && VOW.has(y)) || (x === 'q' && y === 'K')) return 0;
  if (x === 'w' && y === 'V') return 0.2;
  if ((x === 'i' && (y === 'e' || y === 'Y')) || (x === 'Y' && y === 'i') || (x === 'S' && y === 's') || (x === 's' && y === 'S')) return 0.4;
  return 1;
}
const del = x => (x === 'A' ? 0 : x === 'q' ? 0.4 : 1);
function dist(a, b, vowelIns) {
  const ins = c => (VOW.has(c) ? vowelIns : 1);
  let prev = [0];
  for (let j = 1; j <= b.length; j++) prev.push(prev[j - 1] + ins(b[j - 1]));
  for (let i = 1; i <= a.length; i++) {
    const cur = [prev[0] + del(a[i - 1])];
    for (let j = 1; j <= b.length; j++)
      cur.push(Math.min(prev[j] + del(a[i - 1]), cur[j - 1] + ins(b[j - 1]), prev[j - 1] + sub(a[i - 1], b[j - 1])));
    prev = cur;
  }
  return prev[b.length];
}
function startsOk(heb, latin) {
  const h = heb[0], c = plain(latin)[0].toLowerCase();
  if (h === 'א' || h === 'ע') return 'aeiou'.includes(c);
  if (h === 'י') return 'yjie'.includes(c);
  return !'aeiou'.includes(c);
}

// foreign data: totals per country/sex/year, and per spelling
const tot = new Map(), sp = new Map(), rows = [];
for (const line of gunzipSync(readFileSync(`${DIR}/long.tsv.gz`)).toString().split('\n')) {
  if (!line) continue;
  const [c, sex, name, y, n] = line.split('\t');
  rows.push([c, sex, name, +y, +n]);
  const k = `${c}\t${sex}\t${y}`;
  tot.set(k, (tot.get(k) || 0) + +n);
  const ks = `${c}\t${sex}\t${name}`;
  sp.set(ks, (sp.get(ks) || 0) + +n);
}
// index spellings by skeleton (with and without a final h, which latinSkeleton drops)
const index = new Map();
for (const [ks, total] of sp) {
  const [c, sex, name] = ks.split('\t');
  const p = plain(name);
  for (const sk of new Set([latinSkeleton(p), latinSkeleton(p + 'a')])) {
    const key = `${c}\t${sex}\t${sk}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ name, total, form: form(name) });
  }
}

const db = JSON.parse(readFileSync(new URL('../../web/data.json', import.meta.url)));
const pairs = new Set(db.s.map(([, sex, i]) => `${db.names[i]}\t${'MF'[sex]}`));
const COUNTRIES = ['US', 'EW', 'FR', 'CA'];
const matches = ['name,sex,sector,country,spelling,total,how'], used = new Set();
const add = (heb, sex, sector, c, name, total, how) => {
  matches.push([heb, sex, sector, c, name, total, how].join(','));
  used.add(`${c}\t${sex}\t${name}`);
};

// hand-fixed names (fixes.csv): spellings, most common first in each country, then the traditional
// equivalents in the listed order. A listed spelling matches the country's most common spelling
// with the same letters ignoring accents and case (Lea -> Léa in France).
const byPlain = new Map();
for (const [ks, total] of sp) {
  const [c, sex, name] = ks.split('\t'), k = `${c}\t${sex}\t${plain(name).toLowerCase()}`;
  if (!byPlain.has(k) || byPlain.get(k).total < total) byPlain.set(k, { name, total });
}
const fixed = new Set();
for (const line of readFileSync(OUT + 'fixes.csv', 'utf8').trim().split('\n').slice(1)) {
  const [heb, sex, sector, spellings, equivalents] = line.split(',');
  if (!sector) fixed.add(`${heb}\t${sex}`);
  for (const c of COUNTRIES) {
    const find = list => list.split('|').filter(Boolean).map(s => byPlain.get(`${c}\t${sex}\t${plain(s).toLowerCase()}`)).filter(Boolean);
    const S = [...new Map(find(spellings).map(m => [m.name, m])).values()].sort((a, b) => b.total - a.total);
    const E = find(equivalents || '').filter(m => !S.some(s => s.name === m.name));
    for (const m of S.slice(0, 4)) add(heb, sex, sector, c, m.name, m.total, 'fix'); // the 4 most common
    for (const m of E) add(heb, sex, sector, c, m.name, m.total, 'equiv');
  }
}

// everything else: automatic
for (const pair of pairs) {
  if (fixed.has(pair)) continue;
  const [heb, sex] = pair.split('\t');
  const hfs = hebForms(heb), rom = romanize(heb), skels = hebSkeletons(heb);
  for (const c of COUNTRIES) {
    const seen = new Map();
    for (const sk of skels) for (const cand of index.get(`${c}\t${sex}\t${sk}`) || []) {
      if (seen.has(cand.name) || !startsOk(heb, cand.name)) continue;
      if (Math.min(...hfs.map(f => dist(f, cand.form, 0))) > MAX_MISMATCH) continue;
      const d = Math.min(...hfs.map(f => dist(f, cand.form, 0.4)));
      // popularity in that country, then closeness to the usual Israeli romanization as a tie-break
      seen.set(cand.name, { ...cand, score: d - 0.5 * Math.log10(cand.total) + 0.15 * lev(rom, plain(cand.name).toLowerCase()) });
    }
    const best = [...seen.values()].sort((a, b) => a.score - b.score);
    for (const m of best.slice(0, K)) if (m === best[0] || m.total >= MIN_ALT * best[0].total) add(heb, sex, '', c, m.name, m.total, 'auto');
  }
}
// counts: one row per spelling (all of them, for searching any name), babies per year from the
// first year listed to the last (0 = not listed)
const byYear = new Map();
for (const [c, sex, name, y, n] of rows) {
  const k = `${c}\t${sex}\t${name}`;
  if (!byYear.has(k)) byYear.set(k, new Map());
  byYear.get(k).set(y, n);
}
const counts = ['country,sex,spelling,first,counts'];
for (const [k, m] of byYear) {
  const ys = [...m.keys()], a = Math.min(...ys), b = Math.max(...ys);
  counts.push([...k.split('\t'), a, Array.from({ length: b - a + 1 }, (_, i) => m.get(a + i) || 0).join(' ')].join(','));
}
const totals = ['country,sex,year,total', ...[...tot].map(([k, n]) => `${k.replaceAll('\t', ',')},${n}`).sort()];
writeFileSync(OUT + 'matches.csv', matches.join('\n') + '\n');
writeFileSync(OUT + 'counts.csv', counts.join('\n') + '\n');
writeFileSync(OUT + 'totals.csv', totals.join('\n') + '\n');
console.log(`${pairs.size} Israeli name/sex pairs (${fixed.size} hand-fixed), ${matches.length - 1} matches, ${used.size} matched spellings, ${counts.length - 1} spellings in all`);
