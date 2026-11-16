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

console.log('all checks passed');
