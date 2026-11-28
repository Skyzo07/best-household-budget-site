// Hearth & Home Budget — spending forecast: what next month will
// probably cost, worked out live from the household's own six-month
// history. Nothing here is typed in by hand: every figure is computed
// from state.transactions, so adding a transaction moves the forecast
// at once. Three ways to project — the 6-month trend (a straight line
// fitted through the last six months), the plain 6-month average, or
// the budgets themselves as the plan — and an "extra saving" box that
// pulls the emergency-fund date forward. Lazy-loaded: it only loads
// when the Forecast nav link is opened, so it never touches the
// first load.
import { CATEGORIES, categoryById, categorySpend, lastMonths, money, money0, monthLabel, monthTotals, shiftMonth } from './data.js';
import { drawBars } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// The forecast settings live on state so the chosen method and the
// extra-saving figure survive a reload. Older saves get the defaults.
export function forecastStore(state) {
  if (!state.forecast || typeof state.forecast !== 'object') state.forecast = { method: 'trend', extra: 0 };
  if (state.forecast.method !== 'average' && state.forecast.method !== 'budget') state.forecast.method = 'trend';
  if (typeof state.forecast.extra !== 'number' || state.forecast.extra < 0) state.forecast.extra = 0;
  return state.forecast;
}

const METHOD_LABELS = {
  trend: 'Trend — the last 6 months, extended',
  average: '6-month average',
  budget: 'Budget plan — what the limits say',
};

// One row per budgeted category: the six monthly spends, their mean,
// the projection for next month, and a confidence note from how jumpy
// the six months were (coefficient of variation). A flat line through
// steady months is worth trusting; a wild one is a rough guide only.
export function forecastRows(state) {
  const keys = lastMonths(state.currentMonth, 6);
  const method = forecastStore(state).method;
  return CATEGORIES.filter((c) => c.budget > 0).map((c) => {
    const vals = keys.map((k) => categorySpend(state, k)[c.id] || 0);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    let projected;
    if (method === 'budget') {
      projected = state.budgets[c.id] || 0;
    } else if (method === 'average') {
      projected = avg;
    } else {
      // Least-squares line through the six months, read one step ahead.
      const n = vals.length;
      const mx = (n - 1) / 2;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (i - mx) * (vals[i] - avg); den += (i - mx) * (i - mx); }
      const slope = den ? num / den : 0;
      projected = avg + slope * (n - mx);
    }
    projected = Math.max(0, Math.round(projected * 100) / 100);
    const variance = vals.reduce((a, v) => a + (v - avg) * (v - avg), 0) / vals.length;
    const sd = Math.sqrt(variance);
    const cv = avg > 0 ? sd / avg : 1;
    let conf, confCls;
    if (avg === 0) { conf = 'No spending in 6 months — nothing to project'; confCls = ''; }
    else if (cv < 0.15) { conf = 'Steady — high confidence'; confCls = 'pos'; }
    else if (cv < 0.35) { conf = 'Fairly steady'; confCls = ''; }
    else { conf = 'Variable — rough guide only'; confCls = 'neg'; }
    return { cat: c, vals, avg: Math.round(avg * 100) / 100, projected, conf, confCls, budget: state.budgets[c.id] || 0 };
  });
}

// Everything the page needs: the per-category rows, the projected
// income (mean of the last three months' income — salaries do not jump
// around, so three months is enough), the projected month-end, the
// yearly pace, and when the emergency fund reaches its target at that
// pace plus any extra saving the household types in.
export function forecastSummary(state) {
  const rows = forecastRows(state);
  const nextKey = shiftMonth(state.currentMonth, 1);
  const keys3 = lastMonths(state.currentMonth, 3);
  const incomeAvg = keys3.reduce((a, k) => a + monthTotals(state, k).income, 0) / keys3.length;
  const projectedSpend = rows.reduce((a, r) => a + r.projected, 0);
  const projectedIncome = Math.round(incomeAvg * 100) / 100;
  const projectedSaved = Math.round((projectedIncome - projectedSpend) * 100) / 100;
  const extra = forecastStore(state).extra;
  const pace = Math.round((projectedSaved + extra) * 100) / 100;
  const yearlyPace = Math.round(pace * 12 * 100) / 100;
  const fund = (state.goals || []).find((g) => g.id === 'goal-emergency') || (state.goals || [])[0];
  let fundLine = '';
  if (fund) {
    const gap = Math.max(0, Math.round((fund.target - fund.saved) * 100) / 100);
    if (gap <= 0) fundLine = 'The ' + fund.name + ' is already fully funded — ' + money(fund.saved) + ' saved against a ' + money(fund.target) + ' target.';
    else if (pace <= 0) fundLine = 'The ' + fund.name + ' still needs ' + money(gap) + ', and at the current pace the household is not saving — raise the extra saving below, or trim a category, to give it a date.';
    else {
      const months = Math.ceil(gap / pace);
      fundLine = 'The ' + fund.name + ' needs ' + money(gap) + ' more. At ' + money(pace) + ' a month it reaches its ' + money(fund.target) + ' target in ' + monthLabel(shiftMonth(state.currentMonth, months)) + ' — ' + months + ' month' + (months === 1 ? '' : 's') + ' from now' + (extra > 0 ? ', including your extra ' + money(extra) + ' a month' : '') + '.';
    }
  }
  // Biggest riser: the category whose projection sits furthest above
  // its own six-month average — the one to look at first.
  let riser = null;
  for (const r of rows) {
    const rise = r.projected - r.avg;
    if (!riser || rise > riser.rise) riser = { label: r.cat.label, rise: Math.round(rise * 100) / 100, projected: r.projected, avg: r.avg };
  }
  return { rows, nextKey, projectedIncome, projectedSpend: Math.round(projectedSpend * 100) / 100, projectedSaved, pace, yearlyPace, fundLine, riser, method: forecastStore(state).method };
}

export function renderForecast(state, root) {
  const s = forecastSummary(state);
  const methodBtns = Object.keys(METHOD_LABELS).map((m) =>
    '<button class="btn small' + (s.method === m ? ' primary' : ' ghost') + '" data-fc-method="' + m + '"' + (s.method === m ? ' aria-pressed="true"' : '') + '>' + esc(METHOD_LABELS[m].replace(/ —.*$/, '').replace(/^6-month average$/, '6-month average')) + '</button>'
  ).join(' ');
  const rows = s.rows.map((r) => {
    const over = r.projected > r.budget;
    return '<tr><td><span class="cat-dot" style="background:' + r.cat.color + '"></span><b>' + esc(r.cat.label) + '</b></td>'
      + '<td class="amount">' + money(r.avg) + '</td>'
      + '<td class="amount"><b>' + money(r.projected) + '</b></td>'
      + '<td class="amount">' + money(r.budget) + (over ? ' <span class="pill warn">over plan</span>' : '') + '</td>'
      + '<td class="' + r.confCls + '">' + esc(r.conf) + '</td></tr>';
  }).join('');
  const bars = s.rows.filter((r) => r.projected > 0).sort((a, b) => b.projected - a.projected).slice(0, 8)
    .map((r) => ({ label: r.cat.label.split(' ')[0], value: r.projected, color: r.cat.color }));

  root.innerHTML =
    '<div class="page-head"><div><h1>Forecast — next month, from your own figures</h1><p class="muted">What ' + monthLabel(s.nextKey) + ' will probably cost, worked out from the last six months of this household’s spending. Change a transaction anywhere and this page moves — nothing here is typed in by hand.</p></div>'
    + '<div><button class="btn ghost" id="btn-add-tx">+ Add transaction</button></div></div>'
    + '<div class="card"><h2>How to read the forecast</h2><p style="margin-top:0">' + methodBtns + '</p>'
    + '<p class="muted small">“Trend” fits a straight line through the last six months and reads one month ahead — it catches a category that is creeping up. “6-month average” ignores the direction and takes the mean. “Budget plan” simply asks what the month costs if every limit is spent in full. Switch between them and every figure below recomputes.</p></div>'
    + '<div class="grid kpis" style="margin-top:16px">'
    + '<div class="card kpi good"><div class="kpi-label">Projected income · ' + monthLabel(s.nextKey) + '</div><div class="kpi-value num">' + money(s.projectedIncome) + '</div><div class="kpi-sub">Average of the last 3 months’ income</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Projected spending · ' + monthLabel(s.nextKey) + '</div><div class="kpi-value num">' + money(s.projectedSpend) + '</div><div class="kpi-sub">Across ' + s.rows.length + ' budgeted categories</div></div>'
    + '<div class="card kpi ' + (s.projectedSaved < 0 ? 'warn' : 'good') + '"><div class="kpi-label">Projected month-end</div><div class="kpi-value num">' + money(s.projectedSaved) + '</div><div class="kpi-sub">' + (s.projectedSaved >= 0 ? 'Left over at the end of ' + monthLabel(s.nextKey) : 'More going out than coming in — the plan needs a trim') + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">If you keep this pace · 2027</div><div class="kpi-value num">' + money(s.yearlyPace) + '</div><div class="kpi-sub">Saved across a full year at ' + money(s.pace) + ' a month</div></div>'
    + '</div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Projected spending by category</h2><div class="chart-wrap"><canvas id="chart-forecast" class="chart" height="220"></canvas></div>'
    + '<p class="muted small">Housing is fixed — the bars that can actually move are the ones after it.</p></div>'
    + '<div class="card"><h2>When the emergency fund fills</h2><p style="margin-top:0">' + esc(s.fundLine) + '</p>'
    + '<label>Extra saving per month ($) <input type="number" min="0" step="10" value="' + forecastStore(state).extra + '" data-fc-extra aria-label="Extra saving per month"></label>'
    + '<p class="muted small">Type an extra amount — say the $50 you would save by cancelling one unused subscription — and the date above moves at once. The yearly pace moves with it.</p>'
    + (s.riser && s.riser.rise > 10 ? '<div class="tip"><strong>Watch ' + esc(s.riser.label) + '.</strong> It is projected at ' + money(s.riser.projected) + ' against a six-month average of ' + money(s.riser.avg) + ' — up ' + money(s.riser.rise) + '. If that rise is a one-off (a bill, a repair), ignore it; if it is a habit, set a tighter limit on the Budgets page.</div>' : '<div class="tip good"><strong>No category is running away.</strong> Every projection sits close to its own six-month average — next month looks like the last six.</div>')
    + '</div></div>'
    + '<div class="card" style="margin-top:16px"><h2>Category by category — ' + monthLabel(s.nextKey) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Six-month average, the projection, and the budget limit side by side. “Steady” means the last six months barely moved, so the projection is worth trusting; “Variable” means the months jumped around, so treat it as a rough guide.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Category</th><th class="amount">6-mo average</th><th class="amount">Projected</th><th class="amount">Budget</th><th>Confidence</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<p class="muted small">Projected spending ' + money(s.projectedSpend) + ' · projected income ' + money(s.projectedIncome) + ' · projected month-end ' + money(s.projectedSaved) + '. Method: ' + esc(METHOD_LABELS[s.method]) + '. Add a transaction, change a budget, or switch the method above — the whole page recomputes from your own figures.</p></div>';
  const fcCanvas = root.querySelector('#chart-forecast');
  if (fcCanvas && bars.length) drawBars(fcCanvas, bars, { valueLabel: (v) => money0(v) });
}
