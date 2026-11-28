// Hearth & Home Budget — annual overview: the whole year at a glance.
// Twelve-month bars, year totals, best and worst months, and a plan for
// next year built from the household's own average spending.
import { CATEGORIES, categoryById, money, money0, monthLabel, monthTotals, categorySpend, lastMonths } from './data.js';
import { drawTrend, drawBars } from './charts.js';
import { forecastSummary } from './forecast.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shortMonth(key) {
  return monthLabel(key).split(' ')[0].slice(0, 3);
}

export function yearMonths(state) {
  const year = Number(state.currentMonth.slice(0, 4));
  const curMonth = Number(state.currentMonth.slice(5, 7));
  const keys = [];
  for (let m = 1; m <= curMonth; m++) {
    keys.push(year + '-' + String(m).padStart(2, '0'));
  }
  return keys;
}

export function renderAnnual(state, root) {
  const key = state.currentMonth;
  const year = key.slice(0, 4);
  const keys = yearMonths(state);
  const points = keys.map((k) => {
    const t = monthTotals(state, k);
    return { label: shortMonth(k), income: t.income, expense: t.expense };
  });
  const rows = keys.map((k) => {
    const t = monthTotals(state, k);
    return { key: k, label: monthLabel(k), income: t.income, expense: t.expense, saved: t.saved };
  });
  const totIncome = rows.reduce((a, r) => a + r.income, 0);
  const totExpense = rows.reduce((a, r) => a + r.expense, 0);
  const totSaved = totIncome - totExpense;
  const months = rows.length || 1;
  const avgSpend = totExpense / months;
  const avgSaved = totSaved / months;
  const rate = totIncome ? (totSaved / totIncome) * 100 : 0;
  const best = rows.slice().sort((a, b) => b.saved - a.saved)[0];
  const worst = rows.slice().sort((a, b) => a.saved - b.saved)[0];
  const biggestSpendMonth = rows.slice().sort((a, b) => b.expense - a.expense)[0];
  // Biggest category of the year so far.
  const yearSpend = {};
  for (const k of keys) {
    const s = categorySpend(state, k);
    for (const id of Object.keys(s)) yearSpend[id] = (yearSpend[id] || 0) + s[id];
  }
  const topCats = Object.entries(yearSpend).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, v]) => ({ label: categoryById(id).label.split(' ')[0], value: v, color: categoryById(id).color }));
  const emergencyTarget = avgSpend * 3;
  const emergencySaved = state.goals.find((g) => /emergency/i.test(g.name));
  const emergencyHave = emergencySaved ? emergencySaved.saved : 0;

  const tableRows = rows.map((r) => {
    const mark = r.key === best.key ? ' <span class="pill">best month</span>' : r.key === worst.key ? ' <span class="pill warn">tightest month</span>' : '';
    return '<tr class="month-row" data-annual-month="' + r.key + '" title="Press to see this month’s breakdown"><td><b>' + esc(r.label) + '</b>' + mark + ' <span class="muted small">▸ detail</span></td><td class="amount"><span class="pos">' + money(r.income) + '</span></td>'
      + '<td class="amount"><span class="neg">' + money(r.expense) + '</span></td>'
      + '<td class="amount"><b>' + money(r.saved) + '</b></td></tr>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Annual overview — ' + year + '</h1><p class="muted">January to ' + shortMonth(key) + ' ' + year + ' · ' + months + ' months of real figures. December hasn’t happened yet, so it isn’t counted.</p></div>'
    + '<div><a class="btn ghost" href="#/insights">Monthly insights →</a> <a class="btn plain" href="#/reports">Year-end report →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Income, year to date</div><div class="kpi-value num">' + money(totIncome) + '</div><div class="kpi-sub">Average ' + money(totIncome / months) + ' a month</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Spent, year to date</div><div class="kpi-value num">' + money(totExpense) + '</div><div class="kpi-sub">Average ' + money(avgSpend) + ' a month</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Saved, year to date</div><div class="kpi-value num">' + money(totSaved) + '</div><div class="kpi-sub">' + rate.toFixed(1) + '% savings rate · ' + money(avgSaved) + ' a month on average</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Best month</div><div class="kpi-value num">' + esc(shortMonth(best.key)) + ' ' + money0(best.saved) + '</div><div class="kpi-sub">Saved the most · tightest was ' + esc(shortMonth(worst.key)) + ' (' + money(worst.saved) + ')</div></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Income vs spending — every month of ' + year + '</h2><div class="chart-wrap"><canvas id="chart-annual" class="chart" height="280"></canvas></div>'
    + '<p class="muted small">Green bars are income, gold bars are spending, the red line is what stayed saved. ' + esc(monthLabel(biggestSpendMonth.key)) + ' was the biggest-spending month at ' + money(biggestSpendMonth.expense) + '.</p></div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Month by month</h2><p class="muted small" style="margin-top:0">Press any month to open its breakdown — top categories and biggest transactions.</p><div class="table-scroll"><table><thead><tr><th>Month</th><th class="amount">Income</th><th class="amount">Spent</th><th class="amount">Saved</th></tr></thead><tbody>'
    + tableRows
    + '<tr><td><b>Total</b></td><td class="amount"><b>' + money(totIncome) + '</b></td><td class="amount"><b>' + money(totExpense) + '</b></td><td class="amount"><b>' + money(totSaved) + '</b></td></tr>'
    + '</tbody></table></div></div>'
    + '<div><div class="card"><h2>Biggest categories of the year</h2><canvas id="chart-annual-cats" class="chart" height="200" style="margin-top:8px"></canvas>'
    + '<p class="muted small">Housing leads because rent never takes a month off — the moveable money is in the categories below it.</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>Plan for next year</h2>'
    + '<p>At the current pace this household spends about <b>' + money(avgSpend) + ' a month</b>. A safe budget for next year starts there, then trims the one category that grew fastest.</p>'
    + '<p>An emergency fund worth three months of spending is <b>' + money(emergencyTarget) + '</b>. This household has <b>' + money(emergencyHave) + '</b> in its emergency goal — ' + (emergencyHave >= emergencyTarget ? 'fully covered. Well done.' : money(Math.max(0, emergencyTarget - emergencyHave)) + ' still to go, about ' + Math.max(1, Math.ceil(Math.max(0, emergencyTarget - emergencyHave) / Math.max(1, avgSaved))) + ' months at the current savings pace.') + '</p>'
    + '<p class="muted small">Rule of thumb: if the savings rate stays above 20% all year, the plan is working — no heroics needed, just the same month repeated twelve times.</p></div></div></div>'
    + (() => {
      // 2027 projection (v21): the Forecast page's December projection,
      // held flat for twelve months. Nothing here is typed in — change
      // the forecast method or the extra saving on the Forecast page
      // and this card moves with it.
      const proj = forecastSummary(state);
      const nextYear = Number(year) + 1;
      const inc12 = Math.round(proj.projectedIncome * 12 * 100) / 100;
      const spend12 = Math.round(proj.projectedSpend * 12 * 100) / 100;
      const save12 = Math.round(proj.projectedSaved * 12 * 100) / 100;
      const rate27 = proj.projectedIncome ? (proj.projectedSaved / proj.projectedIncome) * 100 : 0;
      const paceLine = avgSaved > 0
        ? (proj.projectedSaved >= avgSaved
          ? 'That is ' + money(proj.projectedSaved - avgSaved) + ' a month more than the ' + money(avgSaved) + ' actually saved a month in ' + year + ' — the trend expects the good months to keep coming.'
          : 'That is ' + money(avgSaved - proj.projectedSaved) + ' a month less than the ' + money(avgSaved) + ' actually saved a month in ' + year + ' — the trend expects December’s spending to run a little higher than the year’s average month, so the year saves a touch less.')
        : '';
      return '<div class="card" style="margin-top:16px"><h2>' + nextYear + ' projection — if December’s plan holds</h2>'
        + '<p>Built from the Forecast page’s ' + esc(proj.method === 'trend' ? 'trend' : proj.method === 'average' ? '6-month average' : 'budget plan') + ' projection for ' + esc(monthLabel(proj.nextKey)) + ' — income ' + money(proj.projectedIncome) + ', spending ' + money(proj.projectedSpend) + ', saving ' + money(proj.projectedSaved) + ' — held flat for twelve months. Change the method or the extra saving on the Forecast page and this projection moves with it.</p>'
        + '<div class="grid kpis"><div class="card kpi"><div class="kpi-label">Income in ' + nextYear + '</div><div class="kpi-value num">' + money(inc12) + '</div><div class="kpi-sub">' + money(proj.projectedIncome) + ' a month</div></div>'
        + '<div class="card kpi"><div class="kpi-label">Spending in ' + nextYear + '</div><div class="kpi-value num">' + money(spend12) + '</div><div class="kpi-sub">' + money(proj.projectedSpend) + ' a month</div></div>'
        + '<div class="card kpi good"><div class="kpi-label">Saving in ' + nextYear + '</div><div class="kpi-value num">' + money(save12) + '</div><div class="kpi-sub">' + rate27.toFixed(1) + '% savings rate · ' + money(proj.projectedSaved) + ' a month</div></div></div>'
        + '<p>' + paceLine + '</p>'
        + (proj.riser ? '<p><b>Watch ' + esc(proj.riser.label) + ':</b> December is projected at ' + money(proj.riser.projected) + ' against a ' + money(proj.riser.avg) + ' six-month average — ' + money(proj.riser.rise) + ' above its own average, the biggest riser. If that month is a one-off (school costs land in lumps), the year saves more than this.</p>' : '')
        + '<p class="muted small">' + esc(proj.fundLine) + ' <a href="#/forecast">Open the forecast →</a></p></div>';
    })();
  drawTrend(root.querySelector('#chart-annual'), points);
  const catCanvas = root.querySelector('#chart-annual-cats');
  if (catCanvas) drawBars(catCanvas, topCats, { valueLabel: (v) => money0(v) });
  // Month drill-down: press a row to open (or close) that month's detail.
  if (!root.dataset.annualBound) {
    root.dataset.annualBound = '1';
    root.addEventListener('click', (e) => {
      const row = e.target.closest('[data-annual-month]');
      if (!row) return;
      const next = row.nextElementSibling;
      if (next && next.classList.contains('month-detail')) { next.remove(); return; }
      const k = row.dataset.annualMonth;
      const spend = categorySpend(state, k);
      const topSpend = Object.entries(spend).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const txs = state.transactions.filter((t) => t.date.slice(0, 7) === k && t.kind === 'expense')
        .sort((a, b) => b.amount - a.amount).slice(0, 3);
      const detail = document.createElement('tr');
      detail.className = 'month-detail';
      detail.innerHTML = '<td colspan="4"><b>' + esc(monthLabel(k)) + ' — where it went:</b> '
        + (topSpend.length ? topSpend.map(([id, v]) => esc(categoryById(id).label) + ' ' + money(v)).join(' · ') : 'No spending recorded.')
        + (txs.length ? '<br><span class="muted">Biggest single spends: ' + txs.map((t) => esc(t.description) + ' (' + money(t.amount) + ')').join(' · ') + '</span>' : '')
        + '</td>';
      row.after(detail);
    });
  }
}
