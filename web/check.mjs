// node web/check.mjs  (after python3 web/build_data.py)
// Checks lib.js against values verified independently (CSV, live API, the R vignette audit).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import * as L from './lib.js';

const here = new URL('.', import.meta.url);
const db = L.decode(JSON.parse(readFileSync(new URL('data.json', here))));
L.addRare(db, JSON.parse(readFileSync(new URL('rare.json', here))));
const yi = db.nY - 1, y = year => year - db.y0;

// decoding
assert.equal(db.y1, 2024);
assert.equal(L.lookup(db, 'Jewish', 'נועם').M.n[y(2024)], 990);
assert.equal(L.lookup(db, 'Jewish', 'נועם').F.n[y(2024)], 199);
assert.equal(L.lookup(db, 'Jewish', 'אביעזר').M.total, 129); // all-time total, not the sum of listed years (5)
assert.equal(L.lookup(db, 'Jewish', 'שרח').rareF, 120);      // never 5+ in one year
const s = L.group(db, 'Druze', 'F').reduce((a, o) => a + L.share(db, o)[y(1990)], 0);
assert.ok(Math.abs(s - 1) < 1e-9, 'listed shares sum to 1');

// analyses (expected values from the R audit of the vignettes)
assert.equal(L.top(db, 'Jewish', 'M', yi, 1)[0].name, 'דוד');
assert.ok(L.numberOnes(db, 'Jewish', 'M').some(r => r.name === 'דוד' && r.from === 1952 && r.to === 1990));
assert.deepEqual(L.numberOnes(db, 'Muslim', 'M'), [{ name: 'מוחמד', from: 1949, to: 2024 }]);
assert.ok(Math.abs(L.diversity(db, 'Jewish', 'F')[yi] - 228) < 1);
assert.ok(Math.abs(L.diversity(db, 'Jewish', 'M')[yi] - 190) < 1);
assert.equal(db.sectors.reduce((a, sec) => a + L.disappeared(db, sec).length, 0), 232);
assert.ok(L.disappeared(db, 'Jewish').some(r => r.name === 'סיון' && r.peak === 1305 && r.peakYear === 1982 && r.low === 7 && r.lowYear === 2024));
const sh = L.shifts(db, 'Jewish', yi);
assert.equal(sh.length, 12);
assert.ok(sh.find(r => r.name === 'דורון').after > sh.find(r => r.name === 'דורון').before);
assert.ok(sh.find(r => r.name === 'ניצן').after < sh.find(r => r.name === 'ניצן').before);
const sim = L.similar(db, 'Jewish', 'M', 'נועם');
assert.equal(sim.length, 6);
assert.ok(!sim.some(o => o.name === 'נועם') && sim.every((o, i) => i === 0 || sim[i - 1].r >= o.r));
assert.equal(L.similar(db, 'Jewish', 'M', 'אביעזר'), null); // peak below 30: not compared

// comparison: default sex is both when the smaller sex has >= 10% of the name's total
assert.equal(L.defaultSex(db, 'Jewish', 'נועם'), 'B');  // 42,506 M / 12,863 F (23% girls)
assert.equal(L.defaultSex(db, 'Jewish', 'אורן'), 'M');  // 14,834 M / 1,163 F (7% girls): girls listed, but under 10%
assert.equal(L.defaultSex(db, 'Jewish', 'נועה'), 'F');  // girls only
assert.equal(L.defaultSex(db, 'Jewish', 'מוחמד'), null); // not in this sector
assert.equal(L.validSex(db, 'Jewish', 'אורן', 'B'), 'B');
assert.equal(L.validSex(db, 'Jewish', 'נועה', 'B'), null);
assert.equal(L.validSex(db, 'Jewish', 'נועה', 'M'), null);
const cmp = L.parseCmp(db, 'דוד:M,יוסף,נועה:B,<img>:F,דוד:F,נועם:M,אריאל:X,מוחמד:M,טל:B,חן', 'Jewish', 'נועם');
// explicit sex kept; missing sex -> default; unusable sex -> default; junk, duplicates, the main name,
// names not in the sector and bad sex codes dropped; at most 4 entries besides the main name
assert.deepEqual(cmp, [{ name: 'דוד', sex: 'M' }, { name: 'יוסף', sex: 'M' }, { name: 'נועה', sex: 'F' }, { name: 'טל', sex: 'B' }]);
assert.equal(L.cmpParam(cmp), 'דוד:M,יוסף:M,נועה:F,טל:B');
assert.deepEqual(L.parseCmp(db, L.cmpParam(cmp), 'Jewish', 'נועם'), cmp); // round trip
assert.deepEqual(L.parseCmp(db, ' אורן:B , ', 'Jewish', 'נועם'), [{ name: 'אורן', sex: 'B' }]);
assert.deepEqual(L.parseCmp(db, '', 'Jewish', 'נועם'), []);

// one-year jumps (x3, to 100+) and their reasons: every jump has a row in data-raw/jump_reasons.csv
// (confidence "none" when no reason was found) and every row is a jump, so new data shows what to research
const jumps = db.sectors.flatMap(sec => L.jumps(db, sec).map(r => ({ ...r, sector: sec })));
assert.equal(jumps.length, 58);
assert.ok(jumps.some(r => r.sector === 'Jewish' && r.name === 'סיון' && r.year === 1981 && r.from === 109 && r.to === 973));
assert.equal(jumps.filter(r => r.name === 'גולן').length, 2); // 1967 and 1973, not back to back
const jk = new Set(jumps.map(r => `${r.sector}|${r.sex}|${r.name}|${r.year}`));
for (const k of jk) assert.ok(db.why.has(k), `no row in jump_reasons.csv for ${k}`);
for (const [k, w] of db.why) {
  assert.ok(jk.has(k), `jump_reasons.csv row ${k} is not a jump`);
  assert.ok(['documented', 'probable', 'none'].includes(w.conf), k);
  if (w.conf !== 'none') assert.ok(w.en && w.he && /^https?:\/\//.test(w.src), `${k}: reason in both languages and a source`);
  assert.ok(!/\u2014/.test(w.en + w.he), `${k}: no long dash`);
}

// search
assert.ok(['נועם', 'נועה'].includes(L.suggest(db, 'נוע', 'Jewish')[0].name));
assert.equal(L.suggest(db, 'noam', 'Jewish')[0].name, 'נועם');
assert.equal(L.suggest(db, ' ג׳ואד ', 'Druze')[0].name, "ג'ואד"); // Hebrew geresh accepted

// transliteration: same test list as the prototype (top1 48/56, top3 54/56)
const tests = [
  ['noam', 'Jewish', 'נועם'], ['david', 'Jewish', 'דוד'], ['yosef', 'Jewish', 'יוסף'], ['joseph', 'Jewish', 'יוסף'],
  ['ariel', 'Jewish', 'אריאל'], ['avigail', 'Jewish', 'אביגיל'], ['abigail', 'Jewish', 'אביגיל'], ['maya', 'Jewish', 'מאיה'],
  ['yonatan', 'Jewish', 'יונתן'], ['jonathan', 'Jewish', 'יונתן'], ['yehonatan', 'Jewish', 'יהונתן'], ['lavi', 'Jewish', 'לביא'],
  ['tamar', 'Jewish', 'תמר'], ['shira', 'Jewish', 'שירה'], ['michael', 'Jewish', 'מיכאל'], ['adam', 'Jewish', 'אדם'],
  ['eitan', 'Jewish', 'איתן'], ['ethan', 'Jewish', 'איתן'], ['ori', 'Jewish', 'אורי'], ['yael', 'Jewish', 'יעל'],
  ['hila', 'Jewish', 'הילה'], ['noa', 'Jewish', 'נועה'], ['daniel', 'Jewish', 'דניאל'], ['sarah', 'Jewish', 'שרה'],
  ['rachel', 'Jewish', 'רחל'], ['esther', 'Jewish', 'אסתר'], ['liam', 'Jewish', 'ליאם'], ['ella', 'Jewish', 'אלה'],
  ['avraham', 'Jewish', 'אברהם'], ['abraham', 'Jewish', 'אברהם'], ['refael', 'Jewish', 'רפאל'], ['raphael', 'Jewish', 'רפאל'],
  ['itamar', 'Jewish', 'איתמר'], ['omer', 'Jewish', 'עומר'], ['roni', 'Jewish', 'רוני'], ['talia', 'Jewish', 'טליה'],
  ['chaim', 'Jewish', 'חיים'], ['haim', 'Jewish', 'חיים'], ['yitzhak', 'Jewish', 'יצחק'], ['isaac', 'Jewish', 'יצחק'],
  ['moshe', 'Jewish', 'משה'], ['ayala', 'Jewish', 'איילה'], ['mohammed', 'Muslim', 'מוחמד'], ['muhammad', 'Muslim', 'מוחמד'],
  ['ahmad', 'Muslim', 'אחמד'], ['ahmed', 'Muslim', 'אחמד'], ['omar', 'Muslim', 'עומר'], ['ali', 'Muslim', 'עלי'],
  ['maryam', 'Muslim', 'מרים'], ['lian', 'Muslim', 'ליאן'], ['jude', 'Muslim', "ג'ודי"], ['george', 'Christian-Arab', "ג'ורג'"],
  ['elias', 'Christian-Arab', 'אליאס'], ['charbel', 'Christian-Arab', 'שרבל'], ['khaled', 'Muslim', "ח'אלד"], ['jawad', 'Druze', "ג'ואד"],
];
let top1 = 0, top3 = 0;
for (const [q, sec, want] of tests) {
  const got = L.translitSearch(db, q, sec).map(e => e.name);
  top1 += got[0] === want; top3 += got.slice(0, 3).includes(want);
}
console.log(`transliteration: top1 ${top1}/${tests.length}, top3 ${top3}/${tests.length}`);
assert.ok(top1 >= 48 && top3 >= 54);

// other countries (intl/*.json): defaults from fixes.csv, a sector-specific one, every spelling has
// counts, and David's 2024 US numbers as read straight from SSA's yob2024.txt (7369 of 1722888 boys)
const intl = name => JSON.parse(readFileSync(new URL(`intl/${name.charCodeAt(0)}.json`, here)));
const dalet = intl('דוד');
assert.equal(dalet.m['דוד|M|'].US[0], 'David');
assert.equal(intl('יוסף').m['יוסף|M|Muslim'].US[0], 'Yusuf');
assert.equal(intl('עומר').m['עומר|M|'].US[0], 'Omer');
const [f, n] = dalet.sp['US|M|David'], [tf, tn] = dalet.tot.US.M;
assert.equal(n[2024 - f], 7369);
assert.equal(tn[2024 - tf], 1722888);
for (const d of [dalet, intl('מוחמד'), intl('אליהו')])
  for (const [k, by] of Object.entries(d.m)) for (const [c, sps] of Object.entries(by))
    for (const sp of sps) assert.ok(d.sp[`${c}|${k.split('|')[1]}|${sp}`], `${k} ${c} ${sp} has counts`);

// searching any spelling (intl/sp/*.json): file names and plain forms agree with build_data.py
assert.equal(L.plainLatin('Raphaël'), 'raphael');
assert.equal(L.spShard('raphael'), 'ra');
assert.equal(L.spShard("d'arcy"), 'd_39');
const ra = JSON.parse(readFileSync(new URL('intl/sp/ra.json', here)));
assert.ok(ra.sp['FR|M|Raphaël'] && ra.sp['US|M|Raphael']);
const da = JSON.parse(readFileSync(new URL('intl/sp/da.json', here)));
assert.deepEqual(da.sp['US|M|David'], dalet.sp['US|M|David']);
assert.ok(da.il.david.includes('דוד|M|'));

console.log('all checks passed');
