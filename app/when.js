// Hearth & Home Budget — when we spend: spending rhythms from the
// household's own transactions. Which weekday costs the most, which
// costs the least, weekends against weekdays, which week of the month
// carries the money, and the single priciest day — every figure
// computed live from Transactions, so an edited or added transaction
// moves the page at once. Two controls change what the page measures:
// the scope (this month, the last three months, or all time) and
// whether rent and bills count (everyday spending only, or everything
// including the rent and the utilities). Lazy-loaded: it only loads
// when the When we spend nav link is opened, so it never touches
// the first load.
import { money, money0, monthLabel, monthTransactions, categoryById, shiftMonth, lastMonths, todayISO } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function weekdayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0 = Sunday
}

const round2 = (n) => Math.round(n * 100) / 100;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Rent and the utilities are the fixed bills — the same two
// categories the Bills page charges every month. Everyday spending
// leaves them out, so the rhythms are the household's own choices
// (groceries, dining, the kids, fun) rather than the rent landing
// on the 1st and swamping whichever weekday that is.
const FIXED_CATS = ['housing', 'utilities'];

// Module state only — which scope and which spending the page is
// measuring. It never touches the saved data, so it cannot disagree
// with it.
let whenScope = 'month'; // 'month' | '3mo' | 'all'
let whenFixed = false; // false = everyday spending, true = include rent & bills
export function setWhenScope(s) { if (s === 'month' || s === '3mo' || s === 'all') whenScope = s; }
export function setWhenFixed(v) { whenFixed = v === true || v === 'true'; }
export function whenScopeNow() { return whenScope; }
export function whenFixedNow() { return whenFixed; }

// The months a scope covers, from the month on screen backwards.
function scopeMonths(state) {
  const key = state.currentMonth;
  if (whenScope === 'month') return [key];
  if (whenScope === '3mo') return lastMonths(key, 3);
  const keys = new Set();
  for (const t of (state.transactions || [])) keys.add(t.date.slice(0, 7));
  const out = Array.from(keys).sort();
  return out.length ? out : [key];
}

function scopeLabel(keys) {
  if (keys.length === 1) return monthLabel(keys[0]);
  return monthLabel(keys[0]) + ' – ' + monthLabel(keys[keys.length - 1]);
}

// How many times each weekday occurs inside the covered months, so
// an average "per Monday" divides by the Mondays that actually
// happened — five in November 2026, four in most other months.
function weekdayOccurrences(keys) {
  const occ = [0, 0, 0, 0, 0, 0, 0];
  for (const k of keys) {
    const [y, m] = k.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    for (let d = 1; d <= last; d++) occ[new Date(y, m - 1, d).getDay()]++;
  }
  return occ;
}

function lastDayOf(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

// Everything the page shows, worked out from the transactions in
// scope. `fixed` decides whether rent and the utilities count.
function whenStats(state) {
  const keys = scopeMonths(state);
  const occ = weekdayOccurrences(keys);
  const inScope = (t) => keys.includes(t.date.slice(0, 7));
  const counted = (t) => t.kind === 'expense' && inScope(t) && (whenFixed || !FIXED_CATS.includes(t.category));
  const list = (state.transactions || []).filter(counted);
  const total = round2(list.reduce((a, t) => a + t.amount, 0));
  // Spending by weekday, Monday first so the working week reads left
  // to right the way a calendar does.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const byDay = order.map((wd) => {
    const rows = list.filter((t) => weekdayOf(t.date) === wd);
    const sum = round2(rows.reduce((a, t) => a + t.amount, 0));
    return { wd, name: DAYS[wd], short: SHORT[wd], total: sum, trips: rows.length, occ: occ[wd], avg: occ[wd] ? round2(sum / occ[wd]) : 0, share: total > 0 ? round2((sum / total) * 100) : 0 };
  });
  const maxDay = Math.max.apply(null, byDay.map((d) => d.total).concat([0]));
  const priciest = byDay.reduce((a, b) => (b.total > a.total ? b : a), byDay[0]);
  const cheapest = byDay.reduce((a, b) => (b.total < a.total ? b : a), byDay[0]);
  // What drives the priciest weekday: its biggest category.
  const catOnPriciest = {};
  for (const t of list) {
    if (weekdayOf(t.date) !== priciest.wd) continue;
    catOnPriciest[t.category] = round2((catOnPriciest[t.category] || 0) + t.amount);
  }
  let topCat = null, topCatTotal = 0;
  for (const [id, sum] of Object.entries(catOnPriciest)) {
    if (sum > topCatTotal) { topCat = id; topCatTotal = sum; }
  }
  // Weekend (Saturday + Sunday) against the working week.
  const weekendTotal = round2(byDay.filter((d) => d.wd === 0 || d.wd === 6).reduce((a, d) => a + d.total, 0));
  const weekdayTotal = round2(total - weekendTotal);
  const weekendDays = occ[0] + occ[6];
  const weekdayDays = occ.reduce((a, n) => a + n, 0) - weekendDays;
  const weekendAvg = weekendDays ? round2(weekendTotal / weekendDays) : 0;
  const weekdayAvg = weekdayDays ? round2(weekdayTotal / weekdayDays) : 0;
  // Which week of the month: days 1–7, 8–14, 15–21, 22 to the end.
  const weeks = [0, 1, 2, 3].map((w) => {
    const rows = list.filter((t) => Math.min(3, Math.floor((Number(t.date.slice(8, 10)) - 1) / 7)) === w);
    const sum = round2(rows.reduce((a, t) => a + t.amount, 0));
    return { w, label: w === 3 ? 'Week 4 (22nd to month end)' : 'Week ' + (w + 1) + ' (days ' + (w * 7 + 1) + '–' + (w * 7 + 7) + ')', total: sum, trips: rows.length, share: total > 0 ? round2((sum / total) * 100) : 0 };
  });
  const maxWeek = Math.max.apply(null, weeks.map((w) => w.total).concat([0]));
  const heaviestWeek = weeks.reduce((a, b) => (b.total > a.total ? b : a), weeks[0]);
  // The single priciest day in scope, with what was bought on it.
  const byDate = {};
  for (const t of list) byDate[t.date] = (byDate[t.date] || []).concat(t);
  let priciestDate = '', priciestDayTotal = 0, priciestDayRows = [];
  for (const [date, rows] of Object.entries(byDate)) {
    const sum = round2(rows.reduce((a, t) => a + t.amount, 0));
    if (sum > priciestDayTotal) { priciestDate = date; priciestDayTotal = sum; priciestDayRows = rows.slice().sort((a, b) => b.amount - a.amount); }
  }
  // The biggest single transaction inside the heaviest week, named
  // so the week has a reason, not just a number.
  const heavyRows = list.filter((t) => Math.min(3, Math.floor((Number(t.date.slice(8, 10)) - 1) / 7)) === heaviestWeek.w);
  const heavyTop = heavyRows.length ? heavyRows.slice().sort((a, b) => b.amount - a.amount)[0] : null;
  return { keys, label: scopeLabel(keys), total, byDay, maxDay, priciest, cheapest, topCat, topCatTotal, weekendTotal, weekdayTotal, weekendAvg, weekdayAvg, weekendShare: total > 0 ? round2((weekendTotal / total) * 100) : 0, weeks, maxWeek, heaviestWeek, priciestDate, priciestDayTotal, priciestDayRows, heavyTop };
}

function barRows(rows, max, valueOf) {
  return rows.map((r) => {
    const v = valueOf(r);
    const pct = max > 0 ? Math.min(100, (v / max) * 100) : 0;
    return '<div class="bar-row"><div class="bar-top"><span><b>' + esc(r.label) + '</b> — ' + money(v) + (r.sub ? ' <span class="muted">· ' + esc(r.sub) + '</span>' : '') + '</span><span>' + r.share + '%</span></div>'
      + '<div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div></div>';
  }).join('');
}

export function renderWhen(state, root) {
  const s = whenStats(state);
  const key = state.currentMonth;
  const stillRunning = s.keys.includes(todayISO().slice(0, 7)) && Number(todayISO().slice(8, 10)) < lastDayOf(todayISO().slice(0, 7));
  const scopeBtns = [['month', 'This month'], ['3mo', 'Last 3 months'], ['all', 'All time']].map(([v, label]) =>
    '<button class="btn small' + (whenScope === v ? ' primary' : ' ghost') + '" data-when-scope="' + v + '"' + (whenScope === v ? ' aria-pressed="true"' : '') + '>' + label + '</button>').join(' ');
  const fixedBtns = [['false', 'Everyday spending'], ['true', 'Include rent & bills']].map(([v, label]) =>
    '<button class="btn small' + (String(whenFixed) === v ? ' primary' : ' ghost') + '" data-when-fixed="' + v + '"' + (String(whenFixed) === v ? ' aria-pressed="true"' : '') + '>' + label + '</button>').join(' ');

  const dayRows = s.byDay.map((d) => ({
    label: d.name + (d.wd === s.priciest.wd ? ' ★ priciest' : d.wd === s.cheapest.wd ? ' · cheapest' : ''),
    sub: d.trips + ' spend' + (d.trips === 1 ? '' : 's') + ' · ' + money(d.avg) + ' a ' + d.name.toLowerCase(),
    share: d.share,
    total: d.total,
  }));
  const weekendRows = [
    { label: 'Weekends (Sat + Sun)', sub: money(s.weekendAvg) + ' a weekend day', share: s.weekendShare, total: s.weekendTotal },
    { label: 'Weekdays (Mon – Fri)', sub: money(s.weekdayAvg) + ' a weekday', share: round2(100 - s.weekendShare), total: s.weekdayTotal },
  ];
  const weekRows = s.weeks.map((w) => ({ label: w.label, sub: w.trips + ' spend' + (w.trips === 1 ? '' : 's'), share: w.share, total: w.total }));

  const dayTxRows = s.priciestDayRows.map((t) => {
    const cat = categoryById(t.category);
    return '<tr><td><b>' + esc(t.description) + '</b>' + (t.note ? '<span class="muted small" style="display:block">' + esc(t.note) + '</span>' : '') + '</td><td><span class="cat-dot" style="background:' + cat.color + '"></span>' + esc(cat.label) + '</td><td class="amount"><span class="neg">−' + money(t.amount) + '</span></td></tr>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>When we spend</h1><p class="muted">The household’s spending rhythms, read straight off its own transactions for ' + esc(s.label) + ' — which weekday costs the most, whether the weekends or the weekdays carry the money, and which week of the month lands heaviest. ' + (whenFixed ? 'Rent and the utilities are counted, so the 1st swamps whichever weekday it falls on.' : 'Rent and the utilities are left out, so these are the household’s own choices — groceries, dining, the kids, fun — not the fixed bills.') + '</p></div>'
    + '<div><a class="btn ghost" href="#/transactions">See the transactions →</a></div></div>'
    + '<div class="card"><p class="chip-row" style="margin:0">' + scopeBtns + ' <span class="muted">·</span> ' + fixedBtns + '</p>'
    + '<p class="muted small" style="margin:10px 0 0">' + esc(s.label) + ' · ' + money(s.total) + ' of ' + (whenFixed ? 'all spending' : 'everyday spending') + ' in scope. The month switcher at the top moves “This month”; the other two scopes count back from it.</p></div>'
    + '<div class="grid kpis" style="margin-top:16px">'
    + '<div class="card kpi"><div class="kpi-label">Priciest weekday</div><div class="kpi-value num">' + esc(s.priciest.name) + '</div><div class="kpi-sub">' + money(s.priciest.total) + ' · ' + money(s.priciest.avg) + ' a ' + esc(s.priciest.name.toLowerCase()) + ' on average</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Cheapest weekday</div><div class="kpi-value num">' + esc(s.cheapest.name) + '</div><div class="kpi-sub">' + money(s.cheapest.total) + ' · ' + money(s.cheapest.avg) + ' a ' + esc(s.cheapest.name.toLowerCase()) + ' on average</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Weekends’ share</div><div class="kpi-value num">' + s.weekendShare + '%</div><div class="kpi-sub">' + money(s.weekendTotal) + ' of ' + money(s.total) + ' lands on a Saturday or Sunday</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Priciest single day</div><div class="kpi-value num">' + (s.priciestDate ? esc(fmtDate(s.priciestDate)) : '—') + '</div><div class="kpi-sub">' + (s.priciestDate ? money(s.priciestDayTotal) + ' in one day — ' + esc(s.priciestDayRows[0] ? s.priciestDayRows[0].description : '') : 'No spending in scope yet') + '</div></div>'
    + '</div>'
    + '<div class="grid two-even" style="margin-top:16px"><div class="card"><h2>Spending by weekday</h2><p class="muted small" style="margin-top:0">Every ' + esc(s.label) + ' spend, grouped by the day of the week it landed on. The bar is the weekday’s total against the priciest one.</p>'
    + barRows(dayRows, s.maxDay, (r) => r.total)
    + '<p class="muted small">' + esc(s.priciest.name) + 's cost the most (' + money(s.priciest.total) + ') and ' + esc(s.cheapest.name) + 's the least (' + money(s.cheapest.total) + ') — a ' + money(round2(s.priciest.total - s.cheapest.total)) + ' gap between the two ends of the week.' + (s.topCat ? ' ' + esc(s.priciest.name) + 's are driven by ' + esc(categoryById(s.topCat).label) + ' (' + money(s.topCatTotal) + ' of the ' + money(s.priciest.total) + ').' : '') + '</p></div>'
    + '<div class="card"><h2>Weekend vs weekday</h2><p class="muted small" style="margin-top:0">Two days against five — the split shows whether the money goes out while the household is working or while it is off.</p>'
    + barRows(weekendRows, Math.max(s.weekendTotal, s.weekdayTotal, 1), (r) => r.total)
    + '<p class="muted small">A weekend day averages ' + money(s.weekendAvg) + ' against ' + money(s.weekdayAvg) + ' for a weekday — ' + (s.weekendAvg > s.weekdayAvg ? 'the weekends run hotter, day for day, than the working week.' : 'the working week runs hotter, day for day, than the weekends.') + '</p>'
    + '<h2 style="margin-top:18px">Which week of the month</h2><p class="muted small" style="margin-top:0">Days 1–7, 8–14, 15–21, then the 22nd to the end — the rent week, the school-fees week, and the quiet end of the month.</p>'
    + barRows(weekRows, s.maxWeek, (r) => r.total)
    + '<p class="muted small">' + esc(s.heaviestWeek.label.split(' (')[0]) + ' carries the most (' + money(s.heaviestWeek.total) + ')' + (s.heavyTop ? ' — the biggest single spend in it is ' + esc(s.heavyTop.description) + ' at ' + money(s.heavyTop.amount) + ' on ' + esc(fmtDate(s.heavyTop.date)) + '.' : '.') + (stillRunning ? ' ' + esc(monthLabel(key)) + ' is still running, so the last week reads low until the month ends.' : '') + '</p></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>What this tells us</h2><ul class="when-list">'
    + '<li><b>' + esc(s.priciest.name) + ' is the expensive day.</b> ' + money(s.priciest.total) + ' in ' + esc(s.label) + ', ' + money(s.priciest.avg) + ' every ' + esc(s.priciest.name.toLowerCase()) + ' on average' + (s.topCat ? ', and ' + esc(categoryById(s.topCat).label) + ' is what makes it expensive (' + money(s.topCatTotal) + ').' : '.') + ' If one day needs a closer look, it is this one.</li>'
    + '<li><b>Weekends take ' + s.weekendShare + '% of the money.</b> ' + money(s.weekendTotal) + ' of ' + money(s.total) + ' lands on Saturdays and Sundays — ' + money(s.weekendAvg) + ' a weekend day against ' + money(s.weekdayAvg) + ' a weekday. ' + (s.weekendAvg > s.weekdayAvg ? 'A quiet weekend is the cheapest lever the household has.' : 'The working week, not the weekend, is where the money goes.') + '</li>'
    + '<li><b>The month is front-loaded.</b> ' + esc(s.heaviestWeek.label) + ' is the heaviest at ' + money(s.heaviestWeek.total) + ' (' + s.heaviestWeek.share + '% of the month), while the last week is the lightest at ' + money(s.weeks[3].total) + '. Money planned for the first half of the month needs to be in the account before the 1st, not after it.</li>'
    + '</ul></div>'
    + '<div class="card" style="margin-top:16px"><h2>The priciest day, transaction by transaction — ' + (s.priciestDate ? esc(fmtDate(s.priciestDate)) : '—') + '</h2>'
    + '<p class="muted small" style="margin-top:0">' + (s.priciestDate ? money(s.priciestDayTotal) + ' went out on that one day. Nothing is hidden behind the total — here is every spend on it.' : 'No spending in scope yet, so there is no priciest day to open.') + '</p>'
    + (s.priciestDayRows.length ? '<div class="table-scroll"><table><thead><tr><th>What</th><th>Category</th><th class="amount">Amount</th></tr></thead><tbody>' + dayTxRows + '</tbody></table></div>' : '')
    + '</div>';
}
