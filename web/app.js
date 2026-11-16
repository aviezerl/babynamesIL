import * as L from './lib.js';
import { lineChart } from './chart.js';

const SITE = 'https://babynames.lifshitz.xyz';
const CBS_URL = 'https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx';
const PKGDOWN = 'https://aviezerl.github.io/babynamesIL/';
const GITHUB = 'https://github.com/aviezerl/babynamesIL';
const COLOR = { M: 'var(--m)', F: 'var(--f)' };
const PAGES = ['name', 'trends', 'data'];
const DEFAULT_NAME = 'נועם';

// ---- strings (one table for both languages) ----------------------------------------

const STR = {
  en: {
    brand: 'Israeli baby names', nav: { name: 'Name', trends: 'Trends', data: 'Data & API' },
    langBtn: 'עב', langLabel: 'עברית',
    sec: { Jewish: 'Jewish', Muslim: 'Muslim', 'Christian-Arab': 'Christian-Arab', Druze: 'Druze' },
    boys: 'boys', girls: 'girls', sexes: { M: 'boys', F: 'girls' },
    heroQ: 'Israeli baby names',
    heroSub: (a, b) => `Every name given to 5 or more babies in a year in Israel, ${a}-${b}, by sector and sex. Data from the Central Bureau of Statistics.`,
    searchPh: 'Type a name, in Hebrew or English letters', popularIn: y => `Popular in ${y}:`, sector: 'Sector',
    sub: (s, a, b) => `${s} sector · ${a}-${b}`, copyLink: 'Copy link', copied: 'Copied',
    bornIn: y => `Born in ${y}`, rankIn: y => `Rank in ${y}`, peakYear: 'Peak year', totalSince: y => `Total since ${y}`,
    chartN: 'Number of babies', chartPBirths: 'Share of all babies born that year',
    chartPListed: 'Share of babies whose name was given to 5+ babies that year',
    statN: 'Count', statP: 'Percent',
    chartFoot: 'Years with fewer than 5 babies show as 0. Source: Central Bureau of Statistics.',
    similarH: 'Names with a similar curve', similarD: 'Names that rose and fell in the same years (same sector and sex)',
    similarNone: 'Too few babies with this name to compare.',
    rareOnly: 'Never given to 5 or more babies in a single year, so there is no yearly data. All-time totals:',
    notFound: (n, s) => `No babies named ${n} in the ${s} sector.`, foundIn: 'Found in:', loadingRare: 'Searching rare names…',
    mostCommon: y => `Most common in ${y}`, risingSince: y => `Rising since ${y}`, seeAll: 'All trends →',
    year: 'Year', topH: s => `Top 10 · ${s}`, rankChange: y => `Rank change vs ${y}`, isNew: 'new',
    rose: 'Rose the most', fell: 'Fell the most', changeD: (a, b) => `Babies in ${a} and ${b}, names with at least 20 in one of them`,
    bothH: 'Names given to both boys and girls', bothD: y => `Split in ${y}, names with at least 50 boys and 50 girls`,
    shiftH: y => `Shifted toward boys or girls since ${y}`,
    shiftD: 'Share of boys changed by at least 10 points; at least 50 babies in each year',
    shiftNone: 'No name shifted that much.', male: 'boys',
    goneH: 'Names that almost disappeared', goneD: 'Peaked at 100+ babies, then fell by at least 95% (lowest listed year after the peak)',
    peak: 'peak', lowest: 'lowest', oneH: 'The #1 name over the years', yrs: n => (n === 1 ? '1 year' : `${n} years`),
    divH: 'How varied are names?',
    divD: 'Effective number of names: how many equally common names would give the same variety (exp of Shannon entropy over the listed names).',
    divNote: 'Christian-Arab and Druze are not shown: about half of their babies have names given to fewer than 5 babies a year, which the data does not list.',
    noPrev: 'No earlier year to compare with.', none: 'None.',
    aiH: 'Ask an AI tool about this data',
    aiD: 'Copy this into ChatGPT, Gemini, Claude or any AI tool with web access, then add your question.',
    prompt: (l, d, c) => `Read ${l}\nInteractive API docs: ${d}\nIf you can, also download ${c}\nAnswer ONLY based on the data. Do not make up information.\nMy question: `,
    copy: 'Copy', aiFallback: 'Doesn\'t work? Download the CSV and upload it to the chat:',
    dlH: 'Download', dlMain: 'every name, year, sector and sex with its count', dlTotals: 'all-time totals per name',
    apiH: 'API', apiD: 'Plain-text answers, handy for scripts and AI tools.', apiDocs: 'Full API docs',
    mcpH: 'MCP (Claude, Cursor)', mcpD: 'For AI tools that support the Model Context Protocol.',
    mcpDesktop: 'Claude Desktop (Settings → Developer → Edit Config):',
    notesH: 'About the data',
    notes: births => [
      'Source: Israel Central Bureau of Statistics (CBS), release 391/2025, as published by CBS.',
      'CBS lists a name in a year only if 5 or more babies of that sector and sex got it. Charts show those years as 0. All-time totals include them.',
      births ? 'Percentages are out of all babies born that year in the sector, by sex.'
        : 'Percentages are out of the babies whose names are listed (given to 5+ babies that year), not all babies born. For Christian-Arab and Druze about half of all babies are not listed, so percentages there are roughly twice the true share.',
      'Sectors follow the CBS classification. 1948 data is only in the R package (babynamesIL_1948).',
    ],
    rH: 'R package and analyses', rD: 'The same data as an R package on CRAN, with analysis articles.', articles: 'Analysis articles',
    footer: (a, b) => `Data: Israel Central Bureau of Statistics, ${a}-${b}. Names given to fewer than 5 babies in a year are not listed.`,
    loading: 'Loading…', loadError: 'Could not load the data. Please reload the page.',
  },
  he: {
    brand: 'שמות תינוקות בישראל', nav: { name: 'חיפוש שם', trends: 'מגמות', data: 'נתונים ו-API' },
    langBtn: 'EN', langLabel: 'English',
    sec: { Jewish: 'יהודי', Muslim: 'מוסלמי', 'Christian-Arab': 'נוצרי-ערבי', Druze: 'דרוזי' },
    boys: 'בנים', girls: 'בנות', sexes: { M: 'בנים', F: 'בנות' },
    heroQ: 'שמות תינוקות בישראל',
    heroSub: (a, b) => `כל שם שניתן ל-5 תינוקות לפחות בשנה בישראל, ${a}-${b}, לפי מגזר ומין. נתוני הלשכה המרכזית לסטטיסטיקה.`,
    searchPh: 'הקלידו שם, בעברית או באנגלית', popularIn: y => `פופולריים ב-${y}:`, sector: 'מגזר',
    sub: (s, a, b) => `מגזר ${s} · ${a}-${b}`, copyLink: 'העתקת קישור', copied: 'הועתק',
    bornIn: y => `נולדו ב-${y}`, rankIn: y => `דירוג ${y}`, peakYear: 'שנת שיא', totalSince: y => `סה״כ מאז ${y}`,
    chartN: 'מספר תינוקות', chartPBirths: 'אחוז מכלל התינוקות שנולדו באותה שנה',
    chartPListed: 'אחוז מהתינוקות ששמם ניתן ל-5 תינוקות לפחות באותה שנה',
    statN: 'מספר', statP: 'אחוז',
    chartFoot: 'שנים עם פחות מ-5 תינוקות מוצגות כ-0. מקור: הלשכה המרכזית לסטטיסטיקה.',
    similarH: 'שמות עם עקומה דומה', similarD: 'שמות שעלו וירדו באותן שנים (באותו מגזר ומין)',
    similarNone: 'אין מספיק תינוקות בשם הזה כדי להשוות.',
    rareOnly: 'השם לא ניתן אף פעם ל-5 תינוקות או יותר בשנה אחת, ולכן אין נתונים לפי שנה. סה״כ בכל השנים:',
    notFound: (n, s) => `לא נמצאו תינוקות בשם ${n} במגזר ה${s}.`, foundIn: 'נמצא במגזר:', loadingRare: 'מחפש בשמות נדירים…',
    mostCommon: y => `הכי נפוצים ב-${y}`, risingSince: y => `בעלייה מאז ${y}`, seeAll: 'לכל המגמות ←',
    year: 'שנה', topH: s => `10 השמות הנפוצים · ${s}`, rankChange: y => `שינוי בדירוג לעומת ${y}`, isNew: 'חדש',
    rose: 'עלו הכי הרבה', fell: 'ירדו הכי הרבה', changeD: (a, b) => `מספר תינוקות ב-${a} וב-${b}, שמות עם 20 לפחות באחת מהשנים`,
    bothH: 'שמות לבנים ולבנות', bothD: y => `החלוקה ב-${y}, שמות עם 50 בנים ו-50 בנות לפחות`,
    shiftH: y => `זזו לכיוון בנים או בנות מאז ${y}`,
    shiftD: 'חלק הבנים השתנה ב-10 נקודות אחוז לפחות; 50 תינוקות לפחות בכל שנה',
    shiftNone: 'אף שם לא זז כל כך.', male: 'בנים',
    goneH: 'שמות שכמעט נעלמו', goneD: 'הגיעו לשיא של 100 תינוקות לפחות, ואז ירדו ב-95% לפחות (השנה הנמוכה ביותר אחרי השיא)',
    peak: 'שיא', lowest: 'שפל', oneH: 'השם הנפוץ ביותר לאורך השנים', yrs: n => (n === 1 ? 'שנה' : `${n} שנים`),
    divH: 'כמה מגוונים השמות?',
    divD: 'מספר השמות האפקטיבי: כמה שמות נפוצים במידה שווה היו נותנים את אותו גיוון (אקספוננט של אנטרופיית שאנון על השמות המופיעים).',
    divNote: 'המגזרים הנוצרי-ערבי והדרוזי לא מוצגים: כמחצית מהתינוקות שם קיבלו שמות שניתנו לפחות מ-5 תינוקות בשנה, והם לא מופיעים בנתונים.',
    noPrev: 'אין שנה קודמת להשוואה.', none: 'אין.',
    aiH: 'שאלו כלי AI על הנתונים',
    aiD: 'העתיקו ל-ChatGPT, Gemini, Claude או כל כלי AI עם גישה לאינטרנט, והוסיפו את השאלה שלכם.',
    prompt: (l, d, c) => `קרא את ${l}\nתיעוד API אינטראקטיבי: ${d}\nאם אתה יכול, הורד גם את ${c}\nענה רק על סמך הנתונים. אל תמציא מידע שלא מופיע בהם.\nהשאלה שלי: `,
    copy: 'העתקה', aiFallback: 'לא עובד? הורידו את קובץ ה-CSV והעלו אותו לצ\'אט:',
    dlH: 'הורדה', dlMain: 'כל שם, שנה, מגזר ומין עם מספר התינוקות', dlTotals: 'סה״כ לכל שם בכל השנים',
    apiH: 'API', apiD: 'תשובות בטקסט פשוט, נוח לסקריפטים ולכלי AI.', apiDocs: 'תיעוד API מלא',
    mcpH: 'MCP (Claude, Cursor)', mcpD: 'לכלי AI שתומכים ב-Model Context Protocol.',
    mcpDesktop: 'Claude Desktop (Settings → Developer → Edit Config):',
    notesH: 'על הנתונים',
    notes: births => [
      'מקור: הלשכה המרכזית לסטטיסטיקה (הלמ״ס), הודעה 391/2025, כפי שפורסמה.',
      'הלמ״ס מפרסמת שם בשנה מסוימת רק אם 5 תינוקות לפחות מאותו מגזר ומין קיבלו אותו. בגרפים שנים כאלה מוצגות כ-0. הסה״כ בכל השנים כולל אותן.',
      births ? 'האחוזים הם מכלל התינוקות שנולדו באותה שנה במגזר, לפי מין.'
        : 'האחוזים הם מתוך התינוקות ששמם מופיע בנתונים (שם שניתן ל-5 תינוקות לפחות באותה שנה), לא מכלל הנולדים. במגזרים הנוצרי-ערבי והדרוזי כמחצית מהתינוקות לא מופיעים, ולכן האחוזים שם גבוהים בערך פי שניים מהחלק האמיתי.',
      'המגזרים לפי הגדרות הלמ״ס. נתוני 1948 נמצאים רק בחבילת ה-R (babynamesIL_1948).',
    ],
    rH: 'חבילת R וניתוחים', rD: 'אותם נתונים כחבילת R ב-CRAN, עם מאמרי ניתוח.', articles: 'מאמרי ניתוח',
    footer: (a, b) => `נתונים: הלשכה המרכזית לסטטיסטיקה, ${a}-${b}. שמות שניתנו לפחות מ-5 תינוקות בשנה אינם מופיעים.`,
    loading: 'טוען…', loadError: 'לא ניתן לטעון את הנתונים. נסו לרענן את הדף.',
  },
};

// ---- helpers -----------------------------------------------------------------------

let db = null;
const state = { page: 'name', lang: 'he', sector: 'Jewish', name: null, stat: null, year: null };
const t = (k, ...a) => { const v = STR[state.lang][k]; return typeof v === 'function' ? v(...a) : v; };
const secLabel = s => STR[state.lang].sec[s];
const int = new Intl.NumberFormat('en-US');
const fmtInt = n => int.format(Math.round(n));

// Build DOM nodes; text always goes in as text nodes (never parsed as HTML).
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c instanceof Node ? c : String(c));
  return e;
}
const dot = sex => h('span', { class: 'dot', style: `background:${COLOR[sex]}` });

function pctFmt(v, step) {
  const p = v * 100;
  if (step) { let d = 0; while (d < 4 && Math.abs(Math.round(step * 100 * 10 ** d) - step * 100 * 10 ** d) > 1e-6) d++; return p.toFixed(d) + '%'; }
  return p.toFixed(p > 0 && p < 0.1 ? 3 : 2) + '%';
}

// A link that changes state without reloading (still a real URL for new tabs / sharing).
function go(patch, ...kids) {
  return h('a', { href: urlFor({ ...state, ...patch }), onclick: ev => {
    if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
    ev.preventDefault(); set(patch, true); window.scrollTo(0, 0);
  } }, ...kids);
}

// ---- state <-> URL -----------------------------------------------------------------

function urlFor(s) {
  const p = new URLSearchParams();
  if (s.page !== 'name') p.set('page', s.page);
  if (s.page === 'name' && s.name) p.set('name', s.name);
  if (s.sector !== 'Jewish' || (s.page === 'name' && s.name)) p.set('sector', s.sector);
  if (s.page === 'name' && s.stat) p.set('stat', s.stat);
  if (s.page === 'trends' && s.year && db && s.year !== db.y1) p.set('year', s.year);
  p.set('lang', s.lang);
  return '?' + p.toString();
}

function readURL() {
  const p = new URLSearchParams(location.search);
  const lang = p.get('lang');
  state.lang = lang === 'en' || lang === 'he' ? lang : (navigator.language || '').toLowerCase().startsWith('he') ? 'he' : 'en';
  state.page = PAGES.includes(p.get('page')) ? p.get('page') : 'name';
  state.sector = ['Jewish', 'Muslim', 'Christian-Arab', 'Druze'].includes(p.get('sector')) ? p.get('sector') : 'Jewish';
  const name = p.get('name');
  state.name = name ? L.normalize(name).slice(0, 40) : null; // checked against the data in renderName
  state.stat = ['n', 'prop'].includes(p.get('stat')) ? p.get('stat') : null;
  const y = parseInt(p.get('year'), 10);
  state.year = Number.isFinite(y) ? y : null;
}

function set(patch, push = false) {
  Object.assign(state, patch);
  history[push ? 'pushState' : 'replaceState'](null, '', urlFor(state));
  render();
}

// ---- name helpers ------------------------------------------------------------------

const listedIn = (sector, name) => !!(db.series.get(`${sector}|M|${name}`) || db.series.get(`${sector}|F|${name}`));
const rareIn = (sector, name) => db.rare.has(`${sector}|M|${name}`) || db.rare.has(`${sector}|F|${name}`);
const existsIn = (sector, name) => listedIn(sector, name) || rareIn(sector, name);

function defaultName(sector) {
  if (listedIn(sector, DEFAULT_NAME)) return DEFAULT_NAME;
  const yi = db.nY - 1;
  return [...L.group(db, sector, 'M'), ...L.group(db, sector, 'F')].sort((a, b) => b.n[yi] - a.n[yi])[0].name;
}

const defaultStat = () => (L.hasBirths(db, state.sector) ? 'prop' : 'n');

// ---- page: name --------------------------------------------------------------------

function searchBox() {
  const input = h('input', {
    type: 'search', id: 'q', role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false',
    'aria-controls': 'sugg', autocomplete: 'off', spellcheck: 'false', dir: 'auto',
    placeholder: t('searchPh'), 'aria-label': t('searchPh'),
  });
  const list = h('ul', { id: 'sugg', role: 'listbox', class: 'sugg', hidden: true });
  let items = [], active = -1;
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
  const pick = e => { close(); set({ page: 'name', name: e.name, sector: e.sector }, true); };
  const paint = () => {
    list.replaceChildren(...items.map((e, i) => h('li', {
      id: 'opt' + i, role: 'option', 'aria-selected': String(i === active), class: i === active ? 'on' : null,
      onmousedown: ev => { ev.preventDefault(); pick(e); },
    }, h('span', { class: 'sname' }, e.name),
    e.sector !== state.sector ? h('span', { class: 'ssec' }, secLabel(e.sector)) : null,
    h('span', { class: 'scount' }, fmtInt(e.total)))));
    if (active >= 0) input.setAttribute('aria-activedescendant', 'opt' + active);
  };
  input.addEventListener('input', () => {
    items = L.suggest(db, input.value, state.sector);
    active = items.length ? 0 : -1;
    if (!items.length) return close();
    paint(); list.hidden = false; input.setAttribute('aria-expanded', 'true');
  });
  input.addEventListener('keydown', ev => {
    if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && items.length) {
      ev.preventDefault();
      active = (active + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      paint();
    } else if (ev.key === 'Enter' && items[active]) { ev.preventDefault(); pick(items[active]); }
    else if (ev.key === 'Escape') close();
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
  return h('div', { class: 'searchwrap' },
    h('label', { class: 'search' },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, '⌕'), input), list);
}

function sectorSeg(onPick) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': t('sector') },
    db.sectors.map(s => h('button', { type: 'button', 'aria-pressed': String(s === state.sector), class: s === state.sector ? 'on' : null, onclick: () => onPick(s) }, secLabel(s))));
}

function kpis(info) {
  const yi = db.nY - 1;
  const sexes = L.SEXES.filter(s => info[s] || info['rare' + s] != null);
  const tile = (label, val) => h('div', { class: 'kpi' }, h('div', { class: 'k' }, label),
    sexes.map(s => h('div', { class: 'v' }, dot(s), val(s), ' ', h('small', {}, t('sexes')[s]))));
  return h('div', { class: 'kpis' },
    tile(t('bornIn', db.y1), s => (info[s] ? (info[s].n[yi] ? fmtInt(info[s].n[yi]) : '<5') : '<5')),
    tile(t('rankIn', db.y1), s => { const o = info[s]; const r = o && L.rank(db, state.sector, s, yi, o.n[yi]); return r ? '#' + r : '-'; }),
    tile(t('peakYear'), s => (info[s] ? db.y0 + info[s].n.indexOf(info[s].peak) : '-')),
    tile(t('totalSince', db.y0), s => fmtInt(info[s] ? info[s].total : info['rare' + s])));
}

function nameChart(info, stat) {
  const xs = Array.from({ length: db.nY }, (_, i) => db.y0 + i);
  const series = L.SEXES.filter(s => info[s]).map(s => ({
    label: t('sexes')[s], color: COLOR[s], values: stat === 'n' ? Array.from(info[s].n) : L.share(db, info[s]),
  }));
  return lineChart({ x: xs, series, fmt: stat === 'n' ? v => fmtInt(v) : pctFmt, aria: `${info.name}, ${secLabel(state.sector)}, ${db.y0}-${db.y1}` });
}

function copyLinkBtn() {
  const b = h('button', { type: 'button', class: 'linkbtn', onclick: async () => {
    try { await navigator.clipboard.writeText(location.href); b.textContent = t('copied'); } catch { b.textContent = location.href; }
  } }, t('copyLink'));
  return b;
}

function renderName(main) {
  if (!state.name) state.name = defaultName(state.sector);
  const name = state.name, sector = state.sector, yi = db.nY - 1;
  const popular = [...L.top(db, sector, 'M', yi, 3), ...L.top(db, sector, 'F', yi, 3)].sort((a, b) => b.n - a.n);

  main.append(h('section', { class: 'hero' },
    h('h1', {}, t('heroQ')), h('p', {}, t('heroSub', db.y0, db.y1)),
    searchBox(),
    h('div', { class: 'chips' }, h('span', { class: 'label' }, t('popularIn', db.y1)),
      popular.map(p => h('button', { type: 'button', class: 'chip', onclick: () => set({ name: p.name }, true) }, p.name))),
    h('div', { class: 'label' }, t('sector')),
    sectorSeg(s => set({ sector: s, name: existsIn(s, name) ? name : defaultName(s), stat: null }, true))));

  const info = L.lookup(db, sector, name);
  const card = h('div', { class: 'card' }, h('div', { class: 'namehead' },
    h('h2', {}, name), h('span', { class: 'sub' }, t('sub', secLabel(sector), db.y0, db.y1)), copyLinkBtn()));
  main.append(card);

  if (info.M || info.F) {
    const stat = state.stat || defaultStat();
    card.append(kpis(info),
      h('div', { class: 'charthead' },
        h('h3', {}, stat === 'n' ? t('chartN') : L.hasBirths(db, sector) ? t('chartPBirths') : t('chartPListed')),
        h('div', { class: 'seg' }, [['n', t('statN')], ['prop', t('statP')]].map(([k, l]) =>
          h('button', { type: 'button', 'aria-pressed': String(stat === k), class: stat === k ? 'on' : null, onclick: () => set({ stat: k }) }, l)))),
      nameChart(info, stat), h('div', { class: 'foot' }, t('chartFoot')));

    const sim = L.SEXES.filter(s => info[s]).map(s => [s, L.similar(db, sector, s, name)]);
    main.append(h('div', { class: 'card' }, h('h3', {}, t('similarH')), h('p', { class: 'desc' }, t('similarD')),
      sim.map(([s, list]) => h('div', { class: 'chips' }, dot(s),
        list ? list.map(o => h('button', { type: 'button', class: 'chip', onclick: () => set({ name: o.name }, true) }, o.name))
          : h('span', { class: 'muted' }, t('similarNone'))))));
  } else if (info.rareM != null || info.rareF != null) {
    card.append(h('p', {}, t('rareOnly')), kpis(info));
  } else {
    card.querySelector('.linkbtn').remove();
    const elsewhere = db.sectors.filter(s => s !== sector && existsIn(s, name));
    card.append(h('p', {}, t('notFound', name, secLabel(sector))));
    if (elsewhere.length) card.append(h('div', { class: 'chips' }, h('span', { class: 'label' }, t('foundIn')),
      elsewhere.map(s => h('button', { type: 'button', class: 'chip', onclick: () => set({ sector: s, stat: null }, true) }, secLabel(s)))));
    else if (!db.rareLoaded) card.append(h('p', { class: 'muted' }, t('loadingRare')));
  }

  const ch = L.changes(db, sector, yi, { k: 3 });
  const topM = L.top(db, sector, 'M', yi, 1)[0], topF = L.top(db, sector, 'F', yi, 1)[0];
  main.append(h('div', { class: 'grid2' },
    go({ page: 'trends' }, h('div', { class: 'card teaser' }, h('div', { class: 'label' }, t('mostCommon', db.y1)),
      h('div', { class: 'big' }, [topM, topF].filter(Boolean).map(x => x.name).join(' · ')), h('div', { class: 'foot' }, t('seeAll')))),
    go({ page: 'trends' }, h('div', { class: 'card teaser' }, h('div', { class: 'label' }, t('risingSince', db.y1 - 1)),
      h('div', { class: 'big' }, ch.rise.map(r => r.name).join(' · ') || '-'), h('div', { class: 'foot' }, t('seeAll'))))));
}

// ---- page: trends ------------------------------------------------------------------

function nameLink(name, sector) {
  return go({ page: 'name', name, sector, stat: null }, name);
}

function renderTrends(main) {
  const sector = state.sector;
  const year = state.year >= db.y0 && state.year <= db.y1 ? state.year : db.y1;
  const yi = L.yearIdx(db, year), prev = year - 1;
  const years = Array.from({ length: db.nY }, (_, i) => db.y1 - i);

  main.append(h('div', { class: 'filters' },
    h('label', { class: 'yearsel' }, t('year'), ' ',
      h('select', { onchange: ev => set({ year: +ev.target.value }) },
        years.map(y => h('option', { value: y, selected: y === year }, y)))),
    sectorSeg(s => set({ sector: s }))));

  const topCard = sex => {
    const rows = L.top(db, sector, sex, yi, 10), max = rows.length ? rows[0].n : 1;
    return h('div', { class: 'card' }, h('h3', {}, dot(sex), t('topH', t('sexes')[sex])),
      h('p', { class: 'desc' }, yi > 0 ? t('rankChange', prev) : t('noPrev')),
      h('ol', { class: 'rank' }, rows.map(r => {
        const d = r.prevRank === undefined ? null : r.prevRank == null ? 'new' : r.prevRank - r.rank;
        return h('li', {}, h('span', { class: 'rk' }, r.rank),
          h('span', { class: 'nm' }, nameLink(r.name, sector), h('span', { class: 'b', style: `width:${(r.n / max * 100).toFixed(0)}%` })),
          h('span', { class: 'num' }, fmtInt(r.n)),
          h('span', { class: 'chg' }, d === null ? '' : d === 'new' ? h('span', { class: 'up' }, t('isNew'))
            : d > 0 ? h('span', { class: 'up' }, '▲' + d) : d < 0 ? h('span', { class: 'down' }, '▼' + -d) : h('span', { class: 'same' }, '=')));
      })));
  };
  main.append(h('div', { class: 'grid2' }, topCard('M'), topCard('F')));

  if (yi > 0) {
    const ch = L.changes(db, sector, yi);
    const list = (title, rows) => h('div', { class: 'card' }, h('h3', {}, title), h('p', { class: 'desc' }, t('changeD', prev, year)),
      rows.length ? h('ol', { class: 'rank change' }, rows.map(r => h('li', {}, h('span', { class: 'rk' }, dot(r.sex)),
        h('span', { class: 'nm' }, nameLink(r.name, sector)),
        h('span', { class: 'num' }, h('bdi', { dir: 'ltr' }, `${r.prev ? fmtInt(r.prev) : '<5'} → ${r.now ? fmtInt(r.now) : '<5'}`)),
        h('span', { class: 'chg ' + (r.d > 0 ? 'up' : 'down') }, h('bdi', { dir: 'ltr' }, (r.d > 0 ? '+' : '−') + fmtInt(Math.abs(r.d)))))))
        : h('p', { class: 'muted' }, t('none')));
    main.append(h('div', { class: 'grid2' }, list(t('rose'), ch.rise), list(t('fell'), ch.fall)));
  }

  const both = L.unisex(db, sector, yi);
  const split = (name, male, extra) => h('div', { class: 'split' }, h('span', {}, nameLink(name, sector)),
    h('div', { class: 'splitbar', role: 'img', 'aria-label': `${Math.round(male * 100)}% ${t('male')}` },
      h('i', { style: `width:${male * 100}%;background:var(--m)` }), h('i', { style: `width:${100 - male * 100}%;background:var(--f)` })),
    h('span', { class: 'pct' }, extra));
  const bothCard = h('div', { class: 'card' }, h('h3', {}, t('bothH')), h('p', { class: 'desc' }, t('bothD', year)),
    h('div', { class: 'legend' }, h('span', {}, dot('M'), t('boys')), h('span', {}, dot('F'), t('girls'))),
    both.length ? both.map(r => split(r.name, r.male, `${Math.round(r.male * 100)}% ${t('male')}`)) : h('p', { class: 'muted' }, t('none')));
  if (yi > 0) {
    const sh = L.shifts(db, sector, yi);
    bothCard.append(h('h4', {}, t('shiftH', prev)), h('p', { class: 'desc' }, t('shiftD')),
      h('div', {}, sh.length ? sh.map(r => split(r.name, r.after, h('bdi', { dir: 'ltr' }, `${Math.round(r.before * 100)}% → ${Math.round(r.after * 100)}%`)))
        : h('p', { class: 'muted' }, t('shiftNone'))));
  }
  main.append(bothCard);

  const gone = L.disappeared(db, sector, { k: 10 });
  main.append(h('div', { class: 'card' }, h('h3', {}, t('goneH')), h('p', { class: 'desc' }, t('goneD')),
    gone.length ? h('ol', { class: 'rank wide' }, gone.map(r => h('li', {}, h('span', { class: 'rk' }, dot(r.sex)),
      h('span', { class: 'nm' }, nameLink(r.name, sector)),
      h('span', { class: 'num' }, `${t('peak')} ${r.peakYear} · ${fmtInt(r.peak)}`),
      h('span', { class: 'num strong' }, `${t('lowest')} ${r.lowYear} · ${fmtInt(r.low)}`))))
      : h('p', { class: 'muted' }, t('none'))));

  main.append(h('div', { class: 'card' }, h('h3', {}, t('oneH')),
    h('div', { class: 'grid2 tight' }, L.SEXES.map(sex => h('div', {}, h('div', { class: 'label' }, dot(sex), t('sexes')[sex]),
      h('ol', { class: 'runs' }, L.numberOnes(db, sector, sex).map(r => h('li', {}, nameLink(r.name, sector),
        h('span', { class: 'num' }, h('bdi', { dir: 'ltr' }, r.from === r.to ? r.from : `${r.from}-${r.to}`), ' · ', t('yrs', r.to - r.from + 1))))))))));

  const xs = Array.from({ length: db.nY }, (_, i) => db.y0 + i);
  main.append(h('div', { class: 'card' }, h('h3', {}, t('divH')), h('p', { class: 'desc' }, t('divD')),
    h('div', { class: 'grid2 tight' }, ['Jewish', 'Muslim'].map(s => h('div', {}, h('div', { class: 'label' }, secLabel(s)),
      lineChart({ x: xs, series: L.SEXES.map(sex => ({ label: t('sexes')[sex], color: COLOR[sex], values: L.diversity(db, s, sex) })),
        fmt: v => fmtInt(v), aria: `${t('divH')} ${secLabel(s)}` })))),
    h('p', { class: 'foot' }, t('divNote'))));
}

// ---- page: data & API ----------------------------------------------------------------

function codeBlock(text) {
  const pre = h('pre', { dir: 'ltr' }, text);
  const b = h('button', { type: 'button', class: 'btn', onclick: async () => {
    try { await navigator.clipboard.writeText(text); b.textContent = t('copied'); } catch { /* clipboard blocked: text stays selectable */ }
  } }, t('copy'));
  return [pre, b];
}

function renderData(main) {
  const csv = `${SITE}/data/babynamesIL.csv`, totals = `${SITE}/data/babynamesIL_totals.csv`;
  const prompt = t('prompt', `${SITE}/llms.txt`, `${SITE}/api/docs`, csv);
  const ex = (path) => h('li', {}, h('a', { href: SITE + path, dir: 'ltr' }, path));
  const he = state.lang === 'he';
  main.append(
    h('div', { class: 'card' }, h('h3', {}, t('aiH')), h('p', { class: 'desc' }, t('aiD')), codeBlock(prompt),
      h('p', { class: 'foot' }, t('aiFallback'), ' ', h('a', { href: csv }, 'babynamesIL.csv'))),
    h('div', { class: 'card' }, h('h3', {}, t('dlH')), h('ul', {},
      h('li', {}, h('a', { href: csv }, 'babynamesIL.csv'), ': ', t('dlMain')),
      h('li', {}, h('a', { href: totals }, 'babynamesIL_totals.csv'), ': ', t('dlTotals')))),
    h('div', { class: 'card' }, h('h3', {}, t('apiH')), h('p', { class: 'desc' }, t('apiD')),
      h('ul', { class: 'code' }, ex('/api/search?name=נועם'), ex(`/api/top?year=${db.y1}&sector=Jewish&sex=M&n=10`),
        ex('/api/trend?name=נועם&sector=Jewish'), ex('/api/compare?names=דוד,יוסף&sector=Jewish'),
        ex('/api/search-pattern?pattern=אור&sector=Jewish')),
      h('p', {}, h('a', { href: `${SITE}/api/docs` }, t('apiDocs')))),
    h('div', { class: 'card' }, h('h3', {}, t('mcpH')), h('p', { class: 'desc' }, t('mcpD')),
      h('p', {}, 'Claude Code:'), codeBlock(`claude mcp add babynamesIL --transport sse ${SITE}/sse`),
      h('p', {}, t('mcpDesktop')),
      codeBlock(JSON.stringify({ mcpServers: { babynamesIL: { command: 'npx', args: ['-y', 'mcp-remote', `${SITE}/sse`] } } }, null, 2))),
    h('div', { class: 'card' }, h('h3', {}, t('notesH')),
      h('ul', {}, t('notes', db.sectors.every(s => L.hasBirths(db, s))).map(x => h('li', {}, x))),
      h('p', {}, h('a', { href: CBS_URL }, he ? 'קובץ הנתונים של הלמ״ס' : 'CBS data file'))),
    h('div', { class: 'card' }, h('h3', {}, t('rH')), h('p', { class: 'desc' }, t('rD')),
      h('pre', { dir: 'ltr' }, 'install.packages("babynamesIL")'),
      h('p', {}, h('a', { href: PKGDOWN }, t('articles')), ' · ', h('a', { href: GITHUB }, 'GitHub'))),
  );
}

// ---- shell ---------------------------------------------------------------------------

function render() {
  const root = document.documentElement;
  root.lang = state.lang;
  root.dir = state.lang === 'he' ? 'rtl' : 'ltr';
  document.title = state.page === 'name' && state.name ? `${state.name} · ${t('brand')}` : t('brand');

  document.querySelector('header').replaceChildren(h('div', { class: 'wrap bar' },
    go({ page: 'name' }, h('span', { class: 'brand' }, t('brand'))),
    h('nav', {}, PAGES.map(p => go({ page: p }, t('nav')[p]))),
    h('button', { type: 'button', class: 'lang', 'aria-label': t('langLabel'), onclick: () => set({ lang: state.lang === 'he' ? 'en' : 'he' }) }, t('langBtn'))));
  document.querySelectorAll('nav a').forEach((a, i) => { if (PAGES[i] === state.page) { a.className = 'on'; a.setAttribute('aria-current', 'page'); } });

  const main = document.querySelector('main');
  main.replaceChildren();
  if (!db) { main.append(h('p', { class: 'muted' }, t('loading'))); return; }
  ({ name: renderName, trends: renderTrends, data: renderData })[state.page](main);
  document.querySelector('footer').replaceChildren(h('div', { class: 'wrap' }, t('footer', db.y0, db.y1), ' · ',
    go({ page: 'data' }, t('nav').data), ' · ', h('a', { href: PKGDOWN }, 'R'), ' · ', h('a', { href: GITHUB }, 'GitHub')));
}

async function main() {
  readURL();
  window.addEventListener('popstate', () => { readURL(); render(); });
  render();
  try {
    db = L.decode(await (await fetch('data.json')).json());
  } catch (e) {
    document.querySelector('main').replaceChildren(h('p', {}, t('loadError')));
    throw e;
  }
  history.replaceState(null, '', urlFor(state));
  render();
  const r = await (await fetch('rare.json')).json();
  L.addRare(db, r);
  if (state.page === 'name' && !listedIn(state.sector, state.name)) render(); // the name may be a rare one
}

main();
