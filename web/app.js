import * as L from './lib.js';
import { lineChart, chartPNG, svgEl, DASH } from './chart.js';

const SITE = 'https://babynames.lifshitz.xyz';
const CBS_URL = 'https://www.cbs.gov.il/he/mediarelease/DocLib/2025/391/11_25_391t1.xlsx';
const PKGDOWN = 'https://aviezerl.github.io/babynamesIL/';
const GITHUB = 'https://github.com/aviezerl/babynamesIL';
const COLOR = { M: 'var(--m)', F: 'var(--f)' };
// compare mode: colour = name (Okabe-Ito, colour-blind safe; the main name in ink), line type = sex
// Okabe-Ito hues, darkened so the line-end labels reach 4.5:1 contrast on white
const CMP_COLORS = ['var(--ink)', '#B35C00', '#00785A', '#A3407A', '#1A6FA8'];
const SYM = { M: '♂', F: '♀' };
const MAX_NAMES = 5;
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
    sub: (s, a, b) => `${s} sector · ${a}-${b}`, copied: 'Copied',
    share: 'Share', linkCopied: 'Link copied', srcShort: 'Data: Israel CBS',
    shareOne: (n, name, sec, y) => `${n} babies in Israel's ${sec} sector have been named ${name} since ${y}`,
    shareMany: (sec, y, list) => `Babies given each name in Israel's ${sec} sector since ${y}: ${list}`,
    cmpAdd: 'Add a name to compare', cmpBoth: 'boys & girls', cmpMax: `Up to ${MAX_NAMES} names.`,
    cmpSwitch: n => `Show boys, girls or both for ${n}`, cmpRemove: n => `Remove ${n}`, cmpAddSim: n => `Add ${n} to the comparison`,
    cmpPct: 'In percent, each line is out of the babies of its own sex.',
    cmpDropped: (s, names) => `Removed from the comparison (not in the ${s} sector): ${names}`,
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
    jumpH: 'Names that jumped in one year',
    jumpD: 'Names whose babies at least tripled from one year to the next, to 100 or more, with the likely reason. "Probably" marks a reason that fits the name and the timing, but that no source ties to the names directly.',
    jumpNone: 'No name in this sector jumped this way.', jumpUnknown: 'No known reason.', probably: 'Probably', source: 'source',
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
    intlH: 'In other countries', il: 'Israel',
    cty: { US: 'US', EW: 'England & Wales', FR: 'France', CA: 'Canada' },
    intlD: s => `Share of ${s} given the name each year, out of the ${s} whose names each country lists. The spelling used for each country is marked; pick another, or search for any spelling below.`,
    intlAddPh: 'Search another spelling', intlTag: 'other countries', intlSub: 'In the US, England & Wales, France and Canada',
    intlDW: s => `Share of ${s} given the name each year, out of the ${s} whose names each country lists.`,
    intlIL: 'Matching names in Israel:', intlNoIL: 'No Israeli name is matched to this spelling.',
    intlNotFound: n => `${n} is not in the data of the US, England & Wales, France or Canada.`,
    intlShareW: n => `How common the name ${n} is in the US, England & Wales, France and Canada`,
    intlMissing: 'Not in the data:', intlHead: s => `Share of ${s} given the name, by year`,
    intlShare: n => `How common the name ${n} is in Israel and in other countries`,
    intlSrcShort: 'Data: Israel CBS, SSA, ONS, INSEE, Statistics Canada',
    intlSrc: 'Sources: US Social Security Administration (names given to 5+ babies a year), ONS for England & Wales (3+, from 1996), INSEE France (counts in multiples of 5), Statistics Canada (5+, from 1991). Spellings are matched to the Hebrew name automatically, and by hand for the common names.',
  },
  he: {
    brand: 'שמות תינוקות בישראל', nav: { name: 'חיפוש שם', trends: 'מגמות', data: 'נתונים ו-API' },
    langBtn: 'EN', langLabel: 'English',
    sec: { Jewish: 'יהודי', Muslim: 'מוסלמי', 'Christian-Arab': 'נוצרי-ערבי', Druze: 'דרוזי' },
    boys: 'בנים', girls: 'בנות', sexes: { M: 'בנים', F: 'בנות' },
    heroQ: 'שמות תינוקות בישראל',
    heroSub: (a, b) => `כל שם שניתן ל-5 תינוקות לפחות בשנה בישראל, ${a}-${b}, לפי מגזר ומין. נתוני הלשכה המרכזית לסטטיסטיקה.`,
    searchPh: 'הקלידו שם, בעברית או באנגלית', popularIn: y => `פופולריים ב-${y}:`, sector: 'מגזר',
    sub: (s, a, b) => `מגזר ${s} · ${a}-${b}`, copied: 'הועתק',
    share: 'שיתוף', linkCopied: 'הקישור הועתק', srcShort: 'נתוני הלמ״ס',
    shareOne: (n, name, sec, y) => `${n} תינוקות במגזר ה${sec} בישראל נקראו ${name} מאז ${y}`,
    shareMany: (sec, y, list) => `מספר התינוקות שקיבלו כל שם במגזר ה${sec} בישראל מאז ${y}: ${list}`,
    cmpAdd: 'הוסיפו שם להשוואה', cmpBoth: 'בנים ובנות', cmpMax: `עד ${MAX_NAMES} שמות.`,
    cmpSwitch: n => `הצגת בנים, בנות או שניהם עבור ${n}`, cmpRemove: n => `הסרת ${n}`, cmpAddSim: n => `הוספת ${n} להשוואה`,
    cmpPct: 'באחוזים, כל קו מחושב מתוך התינוקות מאותו מין.',
    cmpDropped: (s, names) => `הוסרו מההשוואה (לא קיימים במגזר ה${s}): ${names}`,
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
    jumpH: 'שמות שקפצו בשנה אחת',
    jumpD: 'שמות שמספר התינוקות שקיבלו אותם גדל פי 3 לפחות משנה לשנה, ל-100 או יותר, והסיבה האפשרית. "כנראה" מסמן סיבה שמתאימה לשם ולתזמון, אבל אין מקור שקושר אותה לשמות במפורש.',
    jumpNone: 'אין במגזר הזה שם שקפץ כך.', jumpUnknown: 'אין סיבה ידועה.', probably: 'כנראה', source: 'מקור',
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
    intlH: 'בעולם', il: 'ישראל',
    cty: { US: 'ארה״ב', EW: 'אנגליה ווילס', FR: 'צרפת', CA: 'קנדה' },
    intlD: s => `אחוז ה${s} שקיבלו את השם בכל שנה, מתוך ה${s} ששמם מופיע בנתוני כל מדינה. האיות שנבחר לכל מדינה מסומן; אפשר לבחור איות אחר, או לחפש כל איות למטה.`,
    intlAddPh: 'חיפוש איות אחר (באותיות לטיניות)', intlTag: 'בעולם', intlSub: 'בארה״ב, אנגליה ווילס, צרפת וקנדה',
    intlDW: s => `אחוז ה${s} שקיבלו את השם בכל שנה, מתוך ה${s} ששמם מופיע בנתוני כל מדינה.`,
    intlIL: 'שמות תואמים בישראל:', intlNoIL: 'אין שם ישראלי שהותאם לאיות הזה.',
    intlNotFound: n => `השם ${n} לא נמצא בנתוני ארה״ב, אנגליה ווילס, צרפת וקנדה.`,
    intlShareW: n => `כמה נפוץ השם ${n} בארה״ב, אנגליה ווילס, צרפת וקנדה`,
    intlMissing: 'לא נמצא בנתוני:', intlHead: s => `אחוז ה${s} שקיבלו את השם, לפי שנה`,
    intlShare: n => `כמה נפוץ השם ${n} בישראל ובמדינות אחרות`,
    intlSrcShort: 'נתונים: הלמ״ס, SSA, ONS, INSEE, הלשכה לסטטיסטיקה של קנדה',
    intlSrc: 'מקורות: מינהל הביטוח הלאומי של ארה״ב (שמות שניתנו ל-5 תינוקות לפחות בשנה), ONS לאנגליה ווילס (3 לפחות, מ-1996), INSEE בצרפת (המספרים בכפולות של 5), הלשכה לסטטיסטיקה של קנדה (5 לפחות, מ-1991). האיות בכל מדינה הותאם לשם העברי אוטומטית, ובשמות הנפוצים ידנית.',
  },
};

// ---- helpers -----------------------------------------------------------------------

let db = null;
const state = { page: 'name', lang: 'he', sector: 'Jewish', name: null, stat: null, year: null, cmp: '', msex: null, spell: null };
let cmpNotice = null; // names dropped from the comparison by the last sector change
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
  if (s.page === 'intl' && s.spell) p.set('name', s.spell);
  if (s.sector !== 'Jewish' || (s.page === 'name' && s.name)) p.set('sector', s.sector);
  if (s.page === 'name' && s.cmp) { p.set('cmp', s.cmp); if (s.msex) p.set('sex', s.msex); }
  if (s.page === 'name' && (s.stat || db)) p.set('stat', (s.stat || defaultStat(s.sector)) === 'n' ? 'n' : 'p');
  if (s.page === 'trends' && s.year && db && s.year !== db.y1) p.set('year', s.year);
  return '?' + p.toString(); // no lang: a shared link opens in each reader's own language
}

// Language: ?lang= in the link, else the last choice (remembered), else Hebrew if it is
// anywhere in the browser's language list, else English.
function pickLang(fromURL) {
  if (fromURL === 'he' || fromURL === 'en') { saveLang(fromURL); return fromURL; }
  try { const v = localStorage.getItem('lang'); if (v === 'he' || v === 'en') return v; } catch {}
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  return langs.some(l => /^(he|iw)\b/i.test(l)) ? 'he' : 'en';
}
function saveLang(l) { try { localStorage.setItem('lang', l); } catch {} }

function readURL() {
  const p = new URLSearchParams(location.search);
  state.lang = pickLang(p.get('lang'));
  state.page = [...PAGES, 'intl'].includes(p.get('page')) ? p.get('page') : 'name';
  state.sector = ['Jewish', 'Muslim', 'Christian-Arab', 'Druze'].includes(p.get('sector')) ? p.get('sector') : 'Jewish';
  const name = p.get('name');
  state.name = name && state.page !== 'intl' ? L.normalize(name).slice(0, 40) : null; // checked against the data in renderName
  state.spell = name && state.page === 'intl' ? L.normalize(name).slice(0, 40) : null; // a spelling in the other countries
  const st = p.get('stat');
  state.stat = st === 'n' ? 'n' : st === 'p' || st === 'prop' ? 'prop' : null;
  state.cmp = (p.get('cmp') || '').slice(0, 400); // checked against the data in renderName
  state.msex = ['M', 'F', 'B'].includes(p.get('sex')) ? p.get('sex') : null;
  const y = parseInt(p.get('year'), 10);
  state.year = Number.isFinite(y) ? y : null;
}

function set(patch, push = false) {
  if ('name' in patch && patch.name !== state.name && !('msex' in patch)) patch = { ...patch, msex: null };
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

const defaultStat = (sector = state.sector) => (L.hasBirths(db, sector) ? 'prop' : 'n');

// ---- page: name --------------------------------------------------------------------

// Combobox with keyboard-accessible suggestions. idp: id prefix (unique per instance).
function autocomplete({ idp, ph, source, onPick, small = false }) {
  const input = h('input', {
    type: 'search', id: idp, role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false',
    'aria-controls': idp + '-sugg', autocomplete: 'off', spellcheck: 'false', dir: 'auto',
    placeholder: ph, 'aria-label': ph,
  });
  const list = h('ul', { id: idp + '-sugg', role: 'listbox', class: 'sugg', hidden: true });
  let items = [], active = -1;
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
  const pick = e => { close(); onPick(e); };
  const paint = () => {
    list.replaceChildren(...items.map((e, i) => h('li', {
      id: `${idp}-opt${i}`, role: 'option', 'aria-selected': String(i === active), class: i === active ? 'on' : null,
      onmousedown: ev => { ev.preventDefault(); pick(e); },
    }, h('span', { class: 'sname' }, e.name),
    e.tag ? h('span', { class: 'ssec' }, e.tag) : e.sector && e.sector !== state.sector ? h('span', { class: 'ssec' }, secLabel(e.sector)) : null,
    h('span', { class: 'scount' }, fmtInt(e.total)))));
    if (active >= 0) input.setAttribute('aria-activedescendant', `${idp}-opt${active}`);
  };
  let seq = 0;
  input.addEventListener('input', async () => { // source may return a promise; keep only the latest answer
    const my = ++seq, r = await source(input.value);
    if (my !== seq) return;
    items = r;
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
  return h('div', { class: 'searchwrap' + (small ? ' small' : '') },
    h('label', { class: 'search' },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, small ? '+' : '⌕'), input), list);
}

// Change sector; remember compared names that don't exist there, to say so once.
function switchSector(sector, patch = {}) {
  if (state.cmp && db) {
    const gone = L.parseCmp(db, state.cmp, state.sector, state.name).filter(e => !listedIn(sector, e.name)).map(e => e.name);
    if (gone.length) cmpNotice = { sector, names: gone };
  }
  set({ ...patch, sector }, true);
}

function searchBox() {
  return autocomplete({
    idp: 'q', ph: t('searchPh'),
    // Latin letters: the Hebrew names they spell, then the same spelling in the other countries
    source: q => {
      const he = L.suggest(db, q, state.sector);
      return /[a-z]/i.test(q) ? spSuggest(q).then(w => [...he.slice(0, 5), ...w.map(o => ({ ...o, tag: t('intlTag') }))]) : he;
    },
    onPick: e => (e.e ? set({ page: 'intl', spell: e.name }, true)
      : e.sector !== state.sector ? switchSector(e.sector, { page: 'name', name: e.name })
      : set({ page: 'name', name: e.name }, true)),
  });
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

// entries: [{name, sex: 'M'|'F'|'B'}], the main name first. Colour = name, dashed = girls.
function cmpChart(entries, stat) {
  const xs = Array.from({ length: db.nY }, (_, i) => db.y0 + i);
  const series = entries.flatMap((e, i) => (e.sex === 'B' ? L.SEXES : [e.sex]).map(sx => {
    const o = db.series.get(`${state.sector}|${sx}|${e.name}`);
    return {
      label: e.sex === 'B' ? `${e.name} ${SYM[sx]}` : e.name, tip: `${e.name} (${t('sexes')[sx]})`,
      color: CMP_COLORS[i], dash: sx === 'F', values: stat === 'n' ? Array.from(o.n) : L.share(db, o),
    };
  }));
  return lineChart({ x: xs, series, fmt: stat === 'n' ? v => fmtInt(v) : pctFmt,
    aria: `${entries.map(e => e.name).join(', ')}, ${secLabel(state.sector)}, ${db.y0}-${db.y1}` });
}

const lineSample = dash => {
  const s = svgEl('svg', { width: 26, height: 10, 'aria-hidden': 'true', class: 'linesample' });
  s.append(svgEl('line', { x1: 1, x2: 25, y1: 5, y2: 5, stroke: 'currentColor', 'stroke-width': 2.25, ...(dash ? { 'stroke-dasharray': DASH } : {}) }));
  return s;
};

const shareIcon = () => {
  const s = svgEl('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'aria-hidden': 'true' });
  s.append(svgEl('circle', { cx: 18, cy: 5, r: 3 }), svgEl('circle', { cx: 6, cy: 12, r: 3 }), svgEl('circle', { cx: 18, cy: 19, r: 3 }),
    svgEl('line', { x1: 8.6, y1: 13.5, x2: 15.4, y2: 17.5 }), svgEl('line', { x1: 15.4, y1: 6.5, x2: 8.6, y2: 10.5 }));
  return s;
};

const nameList = names => new Intl.ListFormat(state.lang, { type: 'conjunction' }).format(names);

// In English text, a mark after a Hebrew name keeps "name number, name number" in order
// (without it the bidi algorithm runs the names and numbers together right-to-left).
const LRM = String.fromCharCode(0x200e);
const nm = name => (state.lang === 'en' ? name + LRM : name);

// All-time totals for sharing: { text: the message, totals: items for the line on the picture }.
// entries: [{name, sex}] as in the comparison; one entry counts every sex, like the KPI tiles.
function shareTotals(sector, entries) {
  const tot = (info, s) => (info[s] ? info[s].total : info['rare' + s]) || 0;
  const sec = secLabel(sector), since = `${t('totalSince', db.y0)}: `;
  if (entries.length === 1) {
    const info = L.lookup(db, sector, entries[0].name);
    const sexes = L.SEXES.filter(s => tot(info, s));
    const by = sexes.map(s => `${fmtInt(tot(info, s))} ${t('sexes')[s]}`);
    const n = sexes.reduce((a, s) => a + tot(info, s), 0);
    return { text: t('shareOne', fmtInt(n), nm(info.name), sec, db.y0) + (by.length > 1 ? ` (${by.join(', ')})` : ''),
      totals: [since + by.join(' · ')] };
  }
  const items = entries.map(e => {
    const info = L.lookup(db, sector, e.name);
    const n = (e.sex === 'B' ? L.SEXES : [e.sex]).reduce((a, s) => a + tot(info, s), 0);
    return `${nm(e.name)}${e.sex === 'B' ? '' : ' ' + SYM[e.sex]} ${fmtInt(n)}`;
  });
  return { text: t('shareMany', sec, db.y0, items.join(', ')), totals: [since + items[0], ...items.slice(1)] };
}

// Share sheet on phones (navigator.share), with a picture of the chart where the browser can share
// files; elsewhere copy the URL. The URL holds the whole view. image: () => Promise<Blob>, optional.
function shareBtn(names, text, image) {
  const msg = h('span', { class: 'sharemsg', role: 'status', 'aria-live': 'polite' });
  // Start drawing on pointerdown so the picture is ready by click: iOS may refuse share() after a long await.
  let png;
  const prep = () => (png ||= image ? image().catch(() => null) : Promise.resolve(null));
  const b = h('button', { type: 'button', class: 'sharebtn', onpointerdown: navigator.share ? prep : null, onclick: async () => {
    const url = location.href;
    if (navigator.share) {
      const data = { title: `${names.join(', ')} · ${t('brand')}`, text, url };
      const blob = await prep();
      const file = blob && new File([blob], 'babynames.png', { type: 'image/png' });
      if (file && navigator.canShare?.({ ...data, files: [file] })) data.files = [file];
      try { await navigator.share(data); return; }
      catch (e) { if (e.name === 'AbortError') return; } // closed by the user; other errors fall back to copying
    }
    try { await navigator.clipboard.writeText(url); msg.textContent = t('linkCopied'); } catch { msg.textContent = url; }
    setTimeout(() => { msg.textContent = ''; }, 2500);
  } }, shareIcon(), h('span', {}, t('share')));
  return h('span', { class: 'share' }, b, msg);
}

// ---- comparison state helpers (state.cmp is the canonical "name:sex,..." string) ----

const cmpList = () => L.parseCmp(db, state.cmp, state.sector, state.name);

function addCmp(name, sex) {
  const cur = cmpList();
  if (name === state.name || cur.length >= MAX_NAMES - 1 || cur.some(e => e.name === name)) return;
  const s = L.validSex(db, state.sector, name, sex) || L.defaultSex(db, state.sector, name);
  if (!s) return;
  cur.push({ name, sex: s });
  set({ cmp: L.cmpParam(cur) }, true);
  requestAnimationFrame(() => document.getElementById('cq')?.focus());
}

function setCmpSex(i, sex) {
  if (i === 0) return set({ msex: sex });
  const cur = cmpList();
  cur[i - 1].sex = sex;
  set({ cmp: L.cmpParam(cur) });
}

function removeCmp(name) {
  const cur = cmpList().filter(e => e.name !== name);
  set({ cmp: L.cmpParam(cur), msex: cur.length ? state.msex : null }, true);
}

function cmpChip(e, i) {
  const opts = ['B', 'M', 'F'].filter(sx => L.validSex(db, state.sector, e.name, sx));
  const next = opts[(opts.indexOf(e.sex) + 1) % opts.length];
  const sexLabel = sx => (sx === 'B' ? t('cmpBoth') : t('sexes')[sx]);
  return h('span', { class: 'chip cmpchip' },
    h('i', { class: 'sw', style: `background:${CMP_COLORS[i]}` }), h('span', {}, e.name),
    h('button', { type: 'button', class: 'sexbtn', disabled: opts.length < 2, title: t('cmpSwitch', e.name), onclick: () => setCmpSex(i, next) },
      sexLabel(e.sex), opts.length > 1 ? ' ⇄' : null),
    i > 0 ? h('button', { type: 'button', class: 'xbtn', title: t('cmpRemove', e.name), 'aria-label': t('cmpRemove', e.name), onclick: () => removeCmp(e.name) }, '✕') : null);
}

function cmpControls(entries) {
  const box = h('div', { class: 'cmp' });
  if (entries.length > 1) box.append(h('div', { class: 'chips' }, entries.map(cmpChip)));
  if (entries.length < MAX_NAMES) box.append(autocomplete({
    idp: 'cq', small: true, ph: t('cmpAdd'),
    source: q => L.suggest(db, q, state.sector, 40)
      .filter(x => x.sector === state.sector && x.listed && !entries.some(e => e.name === x.name)).slice(0, 8),
    onPick: x => addCmp(x.name),
  }));
  else box.append(h('p', { class: 'foot' }, t('cmpMax')));
  return box;
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
    sectorSeg(s => switchSector(s, { name: existsIn(s, name) ? name : defaultName(s), stat: null }))));

  const info = L.lookup(db, sector, name);
  const head = h('div', { class: 'namehead' }, h('h2', {}, name), h('span', { class: 'sub' }, t('sub', secLabel(sector), db.y0, db.y1)));
  const card = h('div', { class: 'card' }, head);
  main.append(card);

  if (info.M || info.F) {
    // validate the comparison against the data and keep the URL canonical
    const cmp = cmpList(), canon = L.cmpParam(cmp);
    const msexOk = cmp.length && L.validSex(db, sector, name, state.msex) ? state.msex : null;
    if (canon !== state.cmp || msexOk !== state.msex) {
      state.cmp = canon; state.msex = msexOk;
      history.replaceState(null, '', urlFor(state));
    }
    const entries = [{ name, sex: msexOk || L.defaultSex(db, sector, name) }, ...cmp];
    const comparing = entries.length > 1;
    const stat = state.stat || defaultStat();
    const heading = stat === 'n' ? t('chartN') : L.hasBirths(db, sector) ? t('chartPBirths') : t('chartPListed');
    const chart = comparing ? cmpChart(entries, stat) : nameChart(info, stat);
    const names = entries.map(e => e.name);
    const { text, totals } = shareTotals(sector, entries);
    head.append(shareBtn(names, text, () => chartPNG(chart, {
      title: nameList(names), sub: t('sub', secLabel(sector), db.y0, db.y1), totals, heading, rtl: state.lang === 'he',
      key: comparing ? L.SEXES.map(s => ({ label: t('sexes')[s], dash: s === 'F' })) : [],
      foot: `${location.host} · ${t('srcShort')}`,
    })));

    card.append(...[kpis(info),
      h('div', { class: 'charthead' },
        h('h3', {}, heading),
        h('div', { class: 'seg' }, [['n', t('statN')], ['prop', t('statP')]].map(([k, l]) =>
          h('button', { type: 'button', 'aria-pressed': String(stat === k), class: stat === k ? 'on' : null, onclick: () => set({ stat: k }) }, l)))),
      chart,
      comparing ? h('div', { class: 'legend linekey' }, h('span', {}, lineSample(false), t('sexes').M), h('span', {}, lineSample(true), t('sexes').F)) : null,
      comparing && stat === 'prop' ? h('div', { class: 'foot' }, t('cmpPct')) : null,
      h('div', { class: 'foot' }, t('chartFoot')),
      cmpNotice ? h('p', { class: 'foot notice' }, t('cmpDropped', secLabel(cmpNotice.sector), cmpNotice.names.join(', '))) : null,
      cmpControls(entries)].filter(Boolean));
    cmpNotice = null;

    const canAdd = entries.length < MAX_NAMES;
    const sim = L.SEXES.filter(s => info[s]).map(s => [s, L.similar(db, sector, s, name)]);
    main.append(h('div', { class: 'card' }, h('h3', {}, t('similarH')), h('p', { class: 'desc' }, t('similarD')),
      sim.map(([s, list]) => h('div', { class: 'chips' }, dot(s),
        list ? list.map(o => h('span', { class: 'simchip' },
          h('button', { type: 'button', class: 'chip', onclick: () => set({ name: o.name }, true) }, o.name),
          canAdd && !entries.some(e => e.name === o.name)
            ? h('button', { type: 'button', class: 'chip plus', title: t('cmpAddSim', o.name), 'aria-label': t('cmpAddSim', o.name), onclick: () => addCmp(o.name, s) }, '+')
            : null))
          : h('span', { class: 'muted' }, t('similarNone'))))));
    main.append(intlCard(info));
  } else if (info.rareM != null || info.rareF != null) {
    head.append(shareBtn([name], shareTotals(sector, [{ name }]).text));
    card.append(h('p', {}, t('rareOnly')), kpis(info));
  } else {
    const elsewhere = db.sectors.filter(s => s !== sector && existsIn(s, name));
    card.append(h('p', {}, t('notFound', name, secLabel(sector))));
    if (elsewhere.length) card.append(h('div', { class: 'chips' }, h('span', { class: 'label' }, t('foundIn')),
      elsewhere.map(s => h('button', { type: 'button', class: 'chip', onclick: () => switchSector(s, { stat: null }) }, secLabel(s)))));
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

// ---- other countries: intl/<code of the first letter>.json per Hebrew name, intl/sp/<two letters>.json per search

const COUNTRIES = ['US', 'EW', 'FR', 'CA'];
const jsonFiles = new Map();
const getJSON = url => {
  if (!jsonFiles.has(url)) jsonFiles.set(url, fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null));
  return jsonFiles.get(url);
};
const intlFile = name => getJSON(`intl/${name.charCodeAt(0)}.json`);
const spFile = key => getJSON(`intl/sp/${L.spShard(key)}.json`);
// name or plain spelling -> sex shown, "name|sex|country" -> spelling picked, "hide|IL" / "hide|<country>" -> line hidden (until reload)
const intlPick = new Map();

// The spellings in one intl/sp/ file grouped by plain form: {key, name (the most common spelling), total,
// M, F (babies in the four countries), by: {"country|sex": that country's most common spelling}}
function spIndex(d) {
  if (d.ix) return d.ix;
  const ix = new Map(), best = new Map();
  for (const [k, [, n]] of Object.entries(d.sp)) {
    const [c, sex, sp] = k.split('|'), key = L.plainLatin(sp), tot = n.reduce((a, b) => a + b, 0), bk = `${key}|${c}|${sex}`;
    let e = ix.get(key);
    if (!e) ix.set(key, e = { key, name: sp, total: 0, M: 0, F: 0, by: {}, top: 0 });
    e.total += tot; e[sex] += tot;
    if (!(best.get(bk) >= tot)) { best.set(bk, tot); e.by[`${c}|${sex}`] = sp; }
    if (tot > e.top) { e.top = tot; e.name = sp; }
  }
  return (d.ix = ix);
}

// Spellings starting with q (2+ letters): the exact one first, then the most common. sex: given to that sex.
async function spSuggest(q, sex = null, k = 4) {
  const key = L.plainLatin(L.normalize(q));
  if (key.length < 2 || !/^[a-z]/.test(key)) return [];
  const d = await spFile(key);
  if (!d) return [];
  const n = e => (sex ? e[sex] : e.total);
  return [...spIndex(d).values()].filter(e => e.key.startsWith(key) && n(e) > 0)
    .sort((a, b) => (b.key === key) - (a.key === key) || n(b) - n(a)).slice(0, k)
    .map(e => ({ name: e.name, total: n(e), e, d }));
}

// Share of one sex's babies given a spelling in country c, out of the babies with a listed name there,
// and the counts for the tooltip (none in years the name is under the country's cutoff).
function countryLine(d, c, sex, sp, xs) {
  const [f, n] = d.sp[`${c}|${sex}|${sp}`], [tf, tn] = d.tot[c][sex];
  return { values: xs.map(y => (tn[y - tf] ? (n[y - f] || 0) / tn[y - tf] : null)), counts: xs.map(y => n[y - f]) };
}

// One row per line, with a checkbox to show or hide it; returns the chart's series and the rows.
// lines: [{k, label, tip, row (row label, default label), color, values, counts, chips}]
function lineRows(lines, sex, redraw) {
  const series = [], rows = [];
  for (const l of lines) {
    const on = !intlPick.get('hide|' + l.k);
    if (on) series.push({ label: l.label, tip: l.tip, color: l.color, values: l.values,
      note: i => (l.counts[i] ? `${fmtInt(l.counts[i])} ${t('sexes')[sex]}` : '') });
    rows.push(h('div', { class: 'chips intlrow' + (on ? '' : ' off') },
      h('label', { class: 'label' }, h('input', { type: 'checkbox', checked: on, 'data-k': 'hide|' + l.k,
        onchange: ev => { intlPick.set('hide|' + l.k, !ev.target.checked); redraw('hide|' + l.k); } }),
        h('i', { class: 'sw', style: `background:${l.color}` }), l.row || l.label), l.chips || null));
  }
  return { series, rows };
}

const sexSeg = (sexes, sex, onPick) => (sexes.length > 1 ? h('div', { class: 'intlctl' }, h('div', { class: 'seg' },
  sexes.map(sx => h('button', { type: 'button', 'aria-pressed': String(sx === sex), class: sx === sex ? 'on' : null, onclick: () => onPick(sx) }, t('sexes')[sx])))) : null);

const intlPNG = (chart, title, sub, spelled, sex) => () => chartPNG(chart, { title, sub, totals: spelled,
  heading: t('intlHead', t('sexes')[sex]), rtl: state.lang === 'he', foot: `${location.host} · ${t('intlSrcShort')}` });

// Share of babies of one sex given the name, Israel (this sector) vs the other countries,
// each out of the babies whose names that country lists, plus a search for any other spelling.
function intlCard(info) {
  const { name, sector } = info;
  const card = h('div', { class: 'card', hidden: true });
  intlFile(name).then(d => {
    if (!d || state.name !== name || state.sector !== sector) return;
    // a name with no spelling matched gets an empty entry, which a searched spelling can fill
    const spells = sx => d.m[`${name}|${sx}|${sector}`] || (d.m[`${name}|${sx}|`] ||= {});
    const sexes = L.SEXES.filter(sx => info[sx]).sort((a, b) => info[b].total - info[a].total);
    const xs = Array.from({ length: db.nY }, (_, i) => db.y0 + i);
    const draw = focusKey => {
      const sex = sexes.includes(intlPick.get(name)) ? intlPick.get(name) : sexes[0], m = spells(sex);
      const listed = db.listed.get(`${sector}|${sex}`), il = `${t('il')} (${secLabel(sector)})`;
      const lines = [{ k: 'IL', label: t('il'), tip: il, row: il, color: CMP_COLORS[0], counts: info[sex].n,
        values: xs.map((_, i) => (listed[i] ? info[sex].n[i] / listed[i] : 0)) }];
      const missing = [], spelled = [];
      COUNTRIES.forEach((c, j) => {
        if (!m[c]) return missing.push(t('cty')[c]);
        const key = `${name}|${sex}|${c}`, sp = m[c].includes(intlPick.get(key)) ? intlPick.get(key) : m[c][0];
        lines.push({ k: c, label: t('cty')[c], tip: `${t('cty')[c]} (${sp})`, color: CMP_COLORS[j + 1], ...countryLine(d, c, sex, sp, xs),
          chips: m[c].map(o => h('button', { type: 'button', class: 'chip' + (o === sp ? ' on' : ''), 'aria-pressed': String(o === sp), 'data-k': `${key}|${o}`, dir: 'ltr',
            onclick: () => { intlPick.set(key, o); draw(`${key}|${o}`); } }, o)) });
        if (!intlPick.get('hide|' + c)) spelled.push(`${t('cty')[c]}: ${sp}`);
      });
      const { series, rows } = lineRows(lines, sex, draw);
      const chart = lineChart({ x: xs, series, fmt: pctFmt, aria: `${name}, ${xs[0]}-${xs[xs.length - 1]}` });
      // any other spelling: picked (and shown) in every country that has it for this sex
      const search = autocomplete({ idp: 'iq', ph: t('intlAddPh'), small: true, source: q => spSuggest(q, sex, 6), onPick: o => {
        for (const c of COUNTRIES) {
          const sp = o.e.by[`${c}|${sex}`];
          if (!sp) continue;
          d.sp[`${c}|${sex}|${sp}`] ||= o.d.sp[`${c}|${sex}|${sp}`];
          if (!m[c]?.includes(sp)) m[c] = [...(m[c] || []), sp];
          intlPick.set(`${name}|${sex}|${c}`, sp);
          intlPick.set('hide|' + c, false);
        }
        draw('iq');
      } });
      card.replaceChildren(...[
        h('div', { class: 'namehead' }, h('h3', {}, t('intlH')),
          shareBtn([name], t('intlShare', nm(name)), intlPNG(chart, name, `${t('intlH')} · ${secLabel(sector)}`, spelled, sex))),
        h('p', { class: 'desc' }, t('intlD', t('sexes')[sex])),
        sexSeg(sexes, sex, sx => { intlPick.set(name, sx); draw(); }),
        chart, ...rows, h('div', { class: 'intlsearch' }, search),
        missing.length ? h('p', { class: 'foot' }, `${t('intlMissing')} ${missing.join(', ')}`) : null,
        h('p', { class: 'foot' }, t('intlSrc'))].filter(Boolean));
      card.hidden = false;
      if (focusKey) card.querySelector(focusKey === 'iq' ? '#iq' : `[data-k="${CSS.escape(focusKey)}"]`)?.focus();
    };
    draw();
  });
  return card;
}

// ---- page: a name in the other countries (picked in the search) ---------------------

function renderIntl(main) {
  const q = state.spell || '', key = L.plainLatin(q);
  main.append(h('section', { class: 'hero' }, searchBox()));
  const card = h('div', { class: 'card' }, h('p', { class: 'muted' }, t('loading')));
  main.append(card);
  (key.length >= 2 ? spFile(key) : Promise.resolve(null)).then(d => {
    if (state.page !== 'intl' || state.spell !== q) return;
    const e = d && spIndex(d).get(key);
    if (!e) return card.replaceChildren(h('p', {}, t('intlNotFound', q)));
    // shown as searched if some country spells it so (Raphael, not France's Raphaël), else the most common spelling
    const shown = Object.values(e.by).find(sp => sp.toLowerCase() === q.toLowerCase()) || e.name;
    const sexes = L.SEXES.filter(s => e[s]).sort((a, b) => e[b] - e[a]);
    const last = Math.max(...COUNTRIES.flatMap(c => L.SEXES.map(s => d.tot[c][s][0] + d.tot[c][s][1].length - 1)));
    const xs = Array.from({ length: last - db.y0 + 1 }, (_, i) => db.y0 + i);
    const draw = focusKey => {
      const sex = sexes.includes(intlPick.get(key)) ? intlPick.get(key) : sexes[0];
      const lines = [], missing = [], spelled = [];
      COUNTRIES.forEach((c, j) => {
        const sp = e.by[`${c}|${sex}`];
        if (!sp) return missing.push(t('cty')[c]);
        const tip = sp === shown ? t('cty')[c] : `${t('cty')[c]} (${sp})`;
        lines.push({ k: c, label: t('cty')[c], tip, row: tip, color: CMP_COLORS[j + 1], ...countryLine(d, c, sex, sp, xs) });
        if (sp !== shown && !intlPick.get('hide|' + c)) spelled.push(`${t('cty')[c]}: ${sp}`);
      });
      const { series, rows } = lineRows(lines, sex, draw);
      const chart = lineChart({ x: xs, series, fmt: pctFmt, aria: `${shown}, ${xs[0]}-${xs[xs.length - 1]}` });
      // Israeli names matched to this spelling, in their sector ("" = the sector where the name is most common)
      const il = [];
      for (const r of d.il[key] || []) {
        const [n, sx, sec] = r.split('|');
        const o = sx === sex && (sec ? [sec] : db.sectors).map(s => db.series.get(`${s}|${sx}|${n}`)).filter(Boolean).sort((a, b) => b.total - a.total)[0];
        if (o && !il.includes(o)) il.push(o);
      }
      il.sort((a, b) => b.total - a.total);
      const link = o => { const a = nameLink(o.name, o.sector); a.className = 'chip'; a.append(' ', h('span', { class: 'ssec' }, secLabel(o.sector))); return a; };
      card.replaceChildren(...[
        h('div', { class: 'namehead' }, h('h2', { dir: 'ltr' }, shown), h('span', { class: 'sub' }, t('intlSub')),
          shareBtn([shown], t('intlShareW', shown), intlPNG(chart, shown, t('intlSub'), spelled, sex))),
        h('p', { class: 'desc' }, t('intlDW', t('sexes')[sex])),
        sexSeg(sexes, sex, sx => { intlPick.set(key, sx); draw(); }),
        chart, ...rows,
        h('div', { class: 'chips intlil' }, h('span', { class: 'label' }, t('intlIL')),
          il.length ? il.slice(0, 8).map(link) : h('span', { class: 'muted' }, t('intlNoIL'))),
        missing.length ? h('p', { class: 'foot' }, `${t('intlMissing')} ${missing.join(', ')}`) : null,
        h('p', { class: 'foot' }, t('intlSrc'))].filter(Boolean));
      if (focusKey) card.querySelector(`[data-k="${CSS.escape(focusKey)}"]`)?.focus();
    };
    draw();
  });
}

// ---- page: trends ------------------------------------------------------------------

function nameLink(name, sector) {
  return go({ page: 'name', name, sector, stat: null, cmp: '', msex: null }, name);
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

  const jumps = L.jumps(db, sector);
  // no line break inside "5-10" or "ב-21": split there, right-to-left text reads them in the wrong order
  const nobreak = str => str.split(/(\d+-\d+|[\u05d0-\u05ea]-\d+)/).map((x, i) => (i % 2 ? h('span', { class: 'nw' }, x) : x));
  main.append(h('div', { class: 'card' }, h('h3', {}, t('jumpH')), h('p', { class: 'desc' }, t('jumpD')),
    jumps.length ? h('ul', { class: 'jumps' }, jumps.map(r => {
      const w = db.why.get(`${sector}|${r.sex}|${r.name}|${r.year}`), text = w && (state.lang === 'he' ? w.he : w.en);
      return h('li', {}, h('div', { class: 'jhead' }, dot(r.sex), nameLink(r.name, sector), h('span', { class: 'yr' }, r.year),
        h('bdi', { dir: 'ltr', class: 'num' }, `${r.from ? fmtInt(r.from) : '<5'} → ${fmtInt(r.to)}`)),
        text && w.conf !== 'none'
          ? h('p', { class: 'why' }, nobreak(w.conf === 'probable' ? `${t('probably')}: ${text}` : text),
            w.src ? [' ', h('a', { href: w.src, target: '_blank', rel: 'noopener' }, `(${t('source')})`)] : null)
          : h('p', { class: 'why muted' }, t('jumpUnknown')));
    })) : h('p', { class: 'muted' }, t('jumpNone'))));

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
  const titled = state.page === 'name' ? state.name : state.page === 'intl' ? state.spell : null;
  document.title = titled ? `${titled} · ${t('brand')}` : t('brand');

  document.querySelector('header').replaceChildren(h('div', { class: 'wrap bar' },
    go({ page: 'name' }, h('span', { class: 'brand' }, t('brand'))),
    h('nav', {}, PAGES.map(p => go({ page: p }, t('nav')[p]))),
    h('button', { type: 'button', class: 'lang', 'aria-label': t('langLabel'), onclick: () => { const l = state.lang === 'he' ? 'en' : 'he'; saveLang(l); set({ lang: l }); } }, t('langBtn'))));
  document.querySelectorAll('nav a').forEach((a, i) => { if (PAGES[i] === state.page) { a.className = 'on'; a.setAttribute('aria-current', 'page'); } });

  const main = document.querySelector('main');
  main.replaceChildren();
  if (!db) { main.append(h('p', { class: 'muted' }, t('loading'))); return; }
  ({ name: renderName, trends: renderTrends, data: renderData, intl: renderIntl })[state.page](main);
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
