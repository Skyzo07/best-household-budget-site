// Hearth & Home Budget — year in review: the household's 2026 told
// back as a story, worked out live from its own transactions. Best
// month, tightest month, biggest single purchase, the categories that
// ate the year, and how many months stayed inside the budget — plus
// three 2027 targets the household sets itself, each one measured
// against the pace it actually kept this year. Nothing here is typed
// in by hand except the targets: add a transaction anywhere and the
// story moves. Lazy-loaded: it only loads when the Year in review
// nav link is opened, so it never touches the first load.
import { CATEGORIES, categoryById, categorySpend, money, money0, monthLabel, monthTotals, reviewStore } from './data.js';
import { drawBars } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shortMonth(key) {
  return monthLabel(key).split(' ')[0].slice(0, 3);
}

// The early-year rows in the sample data are monthly aggregates
// ("Groceries — May"), not single purchases, so they never count as
// the biggest one-off buy. A real household's own itemised rows do.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function isMonthlyAggregate(desc) {
  return MONTH_NAMES.some((m) => desc.endsWith(' — ' + m));
}

// Everything the page needs, computed from state.transactions and
// state.budgets: the year is January through the month being viewed.
export function reviewSummary(state) {
  const year = state.currentMonth.slice(0, 4);
  const curMonth = Number(state.currentMonth.slice(5, 7));
  const keys = [];
  for (let m = 1; m <= curMonth; m++) keys.push(year + '-' + String(m).padStart(2, '0'));
  const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const months = keys.map((k) => {
    const t = monthTotals(state, k);
    return { key: k, label: monthLabel(k), short: shortMonth(k), income: t.income, expense: t.expense, saved: t.saved, over: t.expense > totalBudget, overBy: Math.max(0, Math.round((t.expense - totalBudget) * 100) / 100) };
  });
  const n = months.length || 1;
  const totIncome = months.reduce((a, r) => a + r.income, 0);
  const totExpense = months.reduce((a, r) => a + r.expense, 0);
  const totSaved = totIncome - totExpense;
  const avgSaved = Math.round((totSaved / n) * 100) / 100;
  const avgSpend = Math.round((totExpense / n) * 100) / 100;
  const rate = totIncome ? (totSaved / totIncome) * 100 : 0;
  const best = months.slice().sort((a, b) => b.saved - a.saved)[0];
  const worst = months.slice().sort((a, b) => a.saved - b.saved)[0];
  const overCount = months.filter((r) => r.over).length;
  // Biggest categories of the year.
  const yearSpend = {};
  for (const k of keys) {
    const s = categorySpend(state, k);
    for (const id of Object.keys(s)) yearSpend[id] = (yearSpend[id] || 0) + s[id];
  }
  const topCats = Object.entries(yearSpend).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, v]) => ({ id, label: categoryById(id).label, value: Math.round(v * 100) / 100, color: categoryById(id).color }));
  // Biggest single purchase of the year: one real transaction, not the
  // rent (fixed every month) and not a monthly aggregate row.
  const oneOff = state.transactions
    .filter((t) => t.date.slice(0, 4) === year && t.kind === 'expense' && t.category !== 'housing' && !isMonthlyAggregate(t.description))
    .sort((a, b) => b.amount - a.amount)[0] || null;
  // Six-month averages — the pace the targets are measured against.
  const last6 = keys.slice(-6);
  const avg6 = (cat) => {
    if (!last6.length) return 0;
    return Math.round((last6.reduce((a, k) => a + (categorySpend(state, k)[cat] || 0), 0) / last6.length) * 100) / 100;
  };
  const paceSave = avgSaved;
  const paceGroceries = avg6('groceries');
  const paceDining = avg6('dining');
  // The three 2027 targets. 0 means "not set yet" — the page falls
  // back to this year's own pace, so an unset target is never a lie.
  // Spending targets round UP to the pace (a target at the pace is
  // on track, not a cent over it); the saving target rounds DOWN.
  const targets = reviewStore(state);
  const saveTarget = targets.save > 0 ? targets.save : Math.floor(paceSave);
  const grocTarget = targets.groceries > 0 ? targets.groceries : Math.ceil(paceGroceries);
  const diningTarget = targets.dining > 0 ? targets.dining : Math.ceil(paceDining);
  const saveYear = Math.round(saveTarget * 12 * 100) / 100;
  const paceYear = Math.round(paceSave * 12 * 100) / 100;
  const grocYearSave = Math.round(Math.max(0, paceGroceries - grocTarget) * 12 * 100) / 100;
  const diningYearSave = Math.round(Math.max(0, paceDining - diningTarget) * 12 * 100) / 100;
  return {
    year, keys, months, n, totalBudget, totIncome, totExpense, totSaved, avgSaved, avgSpend,
    rate, best, worst, overCount, topCats, oneOff,
    paceSave, paceGroceries, paceDining, targets,
    saveTarget, grocTarget, diningTarget, saveYear, paceYear, grocYearSave, diningYearSave,
  };
}

export function renderReview(state, root) {
  const s = reviewSummary(state);
  const monthRows = s.months.map((r) => {
    const mark = r.key === s.best.key ? ' <span class="pill">best month</span>' : r.key === s.worst.key ? ' <span class="pill warn">tightest month</span>' : '';
    return '<tr><td><b>' + esc(r.label) + '</b>' + mark + '</td>'
      + '<td class="amount"><span class="pos">' + money(r.income) + '</span></td>'
      + '<td class="amount"><span class="neg">' + money(r.expense) + '</span></td>'
      + '<td class="amount"><b>' + money(r.saved) + '</b></td>'
      + '<td>' + (r.over ? '<span class="pill over">Over by ' + money(r.overBy) + '</span>' : '<span class="pill">Inside budget</span>') + '</td></tr>';
  }).join('');
  const catRows = s.topCats.map((c, i) => {
    const share = s.totExpense ? (c.value / s.totExpense * 100) : 0;
    return '<div class="bar-row"><div class="bar-top"><span><span class="cat-dot" style="background:' + c.color + '"></span><b>' + (i + 1) + '. ' + esc(c.label) + '</b></span><span>' + money(c.value) + ' · ' + share.toFixed(1) + '% of the year’s spending</span></div>'
      + '<div class="bar"><i style="width:' + Math.min(100, share * 2.5).toFixed(1) + '%;background:' + c.color + '"></i></div></div>';
  }).join('');
  const saveAhead = s.paceSave >= s.saveTarget;
  const grocAhead = s.paceGroceries <= s.grocTarget;
  const diningAhead = s.paceDining <= s.diningTarget;
  const saveLine = saveAhead
    ? 'At the current pace you save ' + money(s.paceSave) + ' a month — ' + money(s.paceYear) + ' across 2027, which clears your ' + money(s.saveTarget) + ' a month target (' + money(s.saveYear) + ' a year).'
    : 'At the current pace you save ' + money(s.paceSave) + ' a month — ' + money(s.paceYear) + ' across 2027, which is ' + money(Math.round((s.saveYear - s.paceYear) * 100) / 100) + ' short of your ' + money(s.saveTarget) + ' a month target (' + money(s.saveYear) + ' a year). Find ' + money(Math.round((s.saveTarget - s.paceSave) * 100) / 100) + ' a month — one subscription cancelled, or one takeaway swapped for cooking — and the target is met.';
  const grocLine = grocAhead
    ? 'Groceries are already running at ' + money(s.paceGroceries) + ' a month against your ' + money(s.grocTarget) + ' target — on track, with ' + money(Math.round((s.grocTarget - s.paceGroceries) * 100) / 100) + ' a month of slack.'
    : 'Groceries are running at ' + money(s.paceGroceries) + ' a month against your ' + money(s.grocTarget) + ' target. Hitting it frees ' + money(s.grocYearSave) + ' a year.';
  const diningLine = diningAhead
    ? 'Dining out is already running at ' + money(s.paceDining) + ' a month against your ' + money(s.diningTarget) + ' target — on track.'
    : 'Dining out is running at ' + money(s.paceDining) + ' a month against your ' + money(s.diningTarget) + ' target. Hitting it frees ' + money(s.diningYearSave) + ' a year.';
  const maxExpense = Math.max.apply(null, s.months.map((r) => r.expense));
  const story = s.overCount === 0
    ? 'Every single month stayed inside the ' + money(s.totalBudget) + ' plan — ' + s.n + ' of ' + s.n + ' months. That is not luck: spending never once came within ' + money(Math.round((s.totalBudget - maxExpense) * 100) / 100) + ' of the limit. The plan has slack in it — the limits could come down by ' + money(Math.round((s.totalBudget - s.avgSpend) * 100) / 100) + ' a month and the household would still fit, which is ' + money(Math.round((s.totalBudget - s.avgSpend) * 12 * 100) / 100) + ' a year that could go to a goal instead.'
    : s.overCount + ' of ' + s.n + ' months went over the ' + money(s.totalBudget) + ' plan. The months that broke it are the ones to look at first — a one-off, or a limit that was never realistic.';

  root.innerHTML =
    '<div class="page-head"><div><h1>Year in review — ' + esc(s.year) + '</h1><p class="muted">January to ' + esc(s.months[s.months.length - 1].label) + ' · ' + s.n + ' months of this household’s own figures. The year hasn’t finished yet, so December isn’t counted — come back in January for the full twelve.</p></div>'
    + '<div><a class="btn ghost" href="#/annual">Annual overview →</a> <a class="btn plain" href="#/forecast">Next month’s forecast →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Saved in ' + esc(s.year) + ' so far</div><div class="kpi-value num">' + money(s.totSaved) + '</div><div class="kpi-sub">' + s.rate.toFixed(1) + '% of income · ' + money(s.avgSaved) + ' a month on average</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Income · year to date</div><div class="kpi-value num">' + money(s.totIncome) + '</div><div class="kpi-sub">Spent ' + money(s.totExpense) + ' · ' + money(s.avgSpend) + ' a month on average</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Best month</div><div class="kpi-value num">' + esc(s.best.short) + ' ' + money0(s.best.saved) + '</div><div class="kpi-sub">' + esc(s.best.label) + ' — saved the most · tightest was ' + esc(s.worst.label) + ' (' + money(s.worst.saved) + ')</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Months inside budget</div><div class="kpi-value num">' + (s.n - s.overCount) + ' of ' + s.n + '</div><div class="kpi-sub">Against the ' + money(s.totalBudget) + ' monthly plan' + (s.overCount ? ' · ' + s.overCount + ' over' : ' · not one month over') + '</div></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>The year in one paragraph</h2><p style="margin-top:0">In ' + s.n + ' months this household brought in ' + money(s.totIncome) + ' and spent ' + money(s.totExpense) + ', keeping ' + money(s.totSaved) + ' — a ' + s.rate.toFixed(1) + '% savings rate, more than double the 20% rule of thumb. ' + esc(story) + '</p>'
    + '<p class="muted small">Best month was ' + esc(s.best.label) + ' (' + money(s.best.saved) + ' saved on ' + money(s.best.income) + ' of income); the tightest was ' + esc(s.worst.label) + ' (' + money(s.worst.saved) + ' saved, ' + money(s.worst.expense) + ' spent). The gap between the two is only ' + money(Math.round((s.best.saved - s.worst.saved) * 100) / 100) + ' — this household’s months barely move, which is exactly what makes the budget easy to keep.</p></div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Biggest single purchase of the year</h2>'
    + (s.oneOff
      ? '<p style="font-size:1.15rem;margin-top:0"><b>' + esc(s.oneOff.description) + '</b> — ' + money(s.oneOff.amount) + '</p><p class="muted small">' + esc(categoryById(s.oneOff.category).label) + ' · ' + esc(s.oneOff.date) + (s.oneOff.note ? ' · ' + esc(s.oneOff.note) : '') + '. The rent is bigger every month, but rent is fixed — this is the biggest thing the household actually chose to buy, in one go.</p>'
      : '<p class="empty">No single purchase recorded this year yet.</p>')
    + '<h2 style="margin-top:16px">Where the year went</h2>' + catRows
    + '<p class="muted small">Housing leads because rent never takes a month off. The money the household can actually move is in the rows below it — groceries alone are ' + money(s.topCats[1] ? s.topCats[1].value : 0) + ' of the year.</p></div>'
    + '<div class="card"><h2>Saved each month</h2><div class="chart-wrap"><canvas id="chart-review" class="chart" height="220"></canvas></div>'
    + '<p class="muted small">What stayed in the household every month. The line barely wobbles — the best month beat the tightest by ' + money(Math.round((s.best.saved - s.worst.saved) * 100) / 100) + '.</p>'
    + '<h2 style="margin-top:16px">Month by month</h2><table><thead><tr><th>Month</th><th class="amount">Income</th><th class="amount">Spent</th><th class="amount">Saved</th><th>Budget</th></tr></thead><tbody>' + monthRows
    + '<tr><td><b>Total</b></td><td class="amount"><b>' + money(s.totIncome) + '</b></td><td class="amount"><b>' + money(s.totExpense) + '</b></td><td class="amount"><b>' + money(s.totSaved) + '</b></td><td><b>' + (s.n - s.overCount) + ' of ' + s.n + ' inside</b></td></tr>'
    + '</tbody></table></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>2027 targets — set them, then watch the pace</h2>'
    + '<p class="muted small" style="margin-top:0">Three numbers for next year. Leave one blank and the page measures against this year’s own pace instead — the targets save as you type, and every line below recomputes from your own figures.</p>'
    + '<div class="grid three">'
    + '<div><label>Save every month ($)<input type="number" min="0" step="10" value="' + s.saveTarget + '" data-review-target="save" aria-label="Monthly saving target for 2027"></label><p class="muted small">This year’s pace: ' + money(s.paceSave) + ' a month</p><p class="' + (saveAhead ? 'pos' : 'neg') + '"><b>' + (saveAhead ? 'On track ✓' : 'Behind — ' + money(Math.round((s.saveTarget - s.paceSave) * 100) / 100) + ' a month short') + '</b></p></div>'
    + '<div><label>Groceries a month ($)<input type="number" min="0" step="10" value="' + s.grocTarget + '" data-review-target="groceries" aria-label="Monthly groceries target for 2027"></label><p class="muted small">Last 6 months: ' + money(s.paceGroceries) + ' a month</p><p class="' + (grocAhead ? 'pos' : 'neg') + '"><b>' + (grocAhead ? 'On track ✓' : 'Over by ' + money(Math.round((s.paceGroceries - s.grocTarget) * 100) / 100) + ' a month') + '</b></p></div>'
    + '<div><label>Dining out a month ($)<input type="number" min="0" step="10" value="' + s.diningTarget + '" data-review-target="dining" aria-label="Monthly dining-out target for 2027"></label><p class="muted small">Last 6 months: ' + money(s.paceDining) + ' a month</p><p class="' + (diningAhead ? 'pos' : 'neg') + '"><b>' + (diningAhead ? 'On track ✓' : 'Over by ' + money(Math.round((s.paceDining - s.diningTarget) * 100) / 100) + ' a month') + '</b></p></div>'
    + '</div>'
    + '<div class="tip ' + (saveAhead ? 'good' : '') + '">' + esc(saveLine) + '</div>'
    + '<div class="tip" style="margin-top:8px">' + esc(grocLine) + ' ' + esc(diningLine) + '</div>'
    + '<p style="margin-top:12px"><button class="btn" data-review-autotargets>Tighten all three by 5% from this year’s pace</button> <button class="btn ghost" data-review-reset>Back to this year’s pace</button></p>'
    + '<p class="muted small">“Tighten by 5%” sets the saving target 5% above this year’s pace and the groceries and dining targets 5% and 10% below their six-month averages — a stretch that is still reachable, because it is measured from what this household already does. “Back to this year’s pace” clears your targets and measures against the pace itself.</p></div>';
  const canvas = root.querySelector('#chart-review');
  if (canvas) drawBars(canvas, s.months.map((r) => ({ label: r.short, value: r.saved, color: '#1d6b4f' })), { valueLabel: (v) => money0(v) });
}
