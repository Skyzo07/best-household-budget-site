// Hearth & Home Budget — reports: a printable monthly summary and a
// debt-payoff planner. The planner simulates the avalanche method
// (highest APR first) month by month from the household's own debts.
import { CATEGORIES, categoryById, money, money0, monthLabel, monthTotals, categorySpend, shiftMonth } from './data.js';
import { drawBars } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function monthName(key) {
  return monthLabel(key);
}

// Simulate paying debts: minimum on every debt, plus `extra` each month
// aimed at the highest-APR balance first. Returns months, total interest
// and the date the last debt clears. Caps at 600 months (50 years).
export function simulatePayoff(debts, extra) {
  const work = debts.map((d) => ({ id: d.id, name: d.name, balance: Math.max(0, Number(d.balance) || 0), apr: Math.max(0, Number(d.apr) || 0), min: Math.max(0, Number(d.minPayment) || 0) }))
    .filter((d) => d.balance > 0);
  if (!work.length) return { months: 0, interest: 0, payoffKey: null, perDebt: [] };
  let totalInterest = 0;
  let months = 0;
  const cleared = {};
  const perDebt = work.map((d) => ({ id: d.id, name: d.name, months: 0, interest: 0 }));
  const byId = {};
  for (const p of perDebt) byId[p.id] = p;
  let guard = 0;
  while (work.some((d) => d.balance > 0.01) && guard < 600) {
    guard++;
    months++;
    // Interest accrues first.
    for (const d of work) {
      if (d.balance <= 0.01) continue;
      const interest = d.balance * (d.apr / 100 / 12);
      d.balance += interest;
      totalInterest += interest;
      byId[d.id].interest += interest;
    }
    // Minimum payments on every open debt.
    for (const d of work) {
      if (d.balance <= 0.01) continue;
      const pay = Math.min(d.balance, d.min);
      d.balance -= pay;
      if (d.balance <= 0.01 && !cleared[d.id]) { cleared[d.id] = months; byId[d.id].months = months; }
    }
    // Extra payment to the highest-APR open debt.
    let remaining = extra;
    const open = work.filter((d) => d.balance > 0.01).sort((a, b) => b.apr - a.apr);
    for (const d of open) {
      if (remaining <= 0) break;
      const pay = Math.min(d.balance, remaining);
      d.balance -= pay;
      remaining -= pay;
      if (d.balance <= 0.01 && !cleared[d.id]) { cleared[d.id] = months; byId[d.id].months = months; }
    }
    // If minimums don't even cover interest, the balance grows forever.
    if (months > 1 && work.every((d) => d.balance > 0.01) && totalInterest > 0) {
      const before = work.reduce((a, d) => a + d.balance, 0);
      if (guard > 120 && before > work.reduce((a, d) => a + d.balance, 0)) break;
    }
  }
  const stuck = work.some((d) => d.balance > 0.01);
  let payoffKey = null;
  if (!stuck) {
    const [y, m] = '2026-11'.split('-').map(Number);
    const d = new Date(y, m - 1 + months, 1);
    payoffKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  return { months: stuck ? -1 : months, interest: totalInterest, payoffKey, perDebt };
}

export function renderReports(state, root) {
  const key = state.currentMonth;
  const t = monthTotals(state, key);
  const prev = monthTotals(state, shiftMonth(key, -1));
  const spend = categorySpend(state, key);
  const incomeByCat = {};
  for (const tx of state.transactions) {
    if (tx.date.slice(0, 7) === key && tx.kind === 'income') incomeByCat[tx.category] = (incomeByCat[tx.category] || 0) + tx.amount;
  }
  const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const overCats = CATEGORIES.filter((c) => c.budget > 0 && (spend[c.id] || 0) > c.budget);
  const underCats = CATEGORIES.filter((c) => c.budget > 0 && (spend[c.id] || 0) <= c.budget);
  const billsPaid = (state.bills || []).filter((b) => Array.isArray(b.paidMonths) && b.paidMonths.includes(key)).length;
  const billsTotal = (state.bills || []).length;
  const goalSaved = state.goals.reduce((a, g) => a + g.saved, 0);
  const goalTarget = state.goals.reduce((a, g) => a + g.target, 0);
  const topSpend = Object.entries(spend).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, v]) => ({ label: categoryById(id).label.split(' ')[0], value: v, color: categoryById(id).color }));

  const spendRows = CATEGORIES.filter((c) => c.budget > 0).map((c) => {
    const spent = spend[c.id] || 0;
    const diff = c.budget - spent;
    return '<tr><td><span class="cat-dot" style="background:' + c.color + '"></span>' + esc(c.label) + '</td><td class="amount">' + money(c.budget) + '</td><td class="amount">' + money(spent) + '</td><td class="amount"><b class="' + (diff < 0 ? 'neg' : 'pos') + '">' + (diff < 0 ? '−' : '+') + money(Math.abs(diff)) + '</b></td></tr>';
  }).join('');
  const incomeRows = Object.entries(incomeByCat).map(([id, v]) => '<tr><td>' + esc(categoryById(id).label) + '</td><td class="amount">' + money(v) + '</td></tr>').join('');

  const debts = state.debts || [];
  const extra = Number(state.payoffExtra) || 0;
  const totalDebt = debts.reduce((a, d) => a + (Number(d.balance) || 0), 0);
  const withExtra = simulatePayoff(debts, extra);
  const minOnly = simulatePayoff(debts, 0);
  const savedInterest = Math.max(0, minOnly.interest - withExtra.interest);
  const monthsSaved = minOnly.months > 0 && withExtra.months > 0 ? minOnly.months - withExtra.months : 0;

  const debtRows = debts.map((d) => {
    const sim = withExtra.perDebt.find((p) => p.id === d.id);
    return '<tr><td><b>' + esc(d.name) + '</b></td>'
      + '<td><input type="number" min="0" step="10" value="' + d.balance + '" data-debt="' + d.id + ':balance" aria-label="Balance for ' + esc(d.name) + '"> </td>'
      + '<td><input type="number" min="0" step="0.1" value="' + d.apr + '" data-debt="' + d.id + ':apr" aria-label="APR for ' + esc(d.name) + '"> %</td>'
      + '<td><input type="number" min="0" step="5" value="' + d.minPayment + '" data-debt="' + d.id + ':minPayment" aria-label="Minimum payment for ' + esc(d.name) + '"></td>'
      + '<td class="amount">' + (sim && sim.months ? sim.months + ' mo' : '—') + '</td>'
      + '<td class="amount">' + (sim ? money(sim.interest) : '—') + '</td></tr>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Reports</h1><p class="muted">A plain-language summary of ' + monthName(key) + ' you can print, and a payoff plan for what the household owes.</p></div>'
    + '<div><button class="btn primary" id="btn-print">Print monthly summary</button></div></div>'
    + '<div id="print-summary"><div class="card"><h2>Monthly summary — ' + monthName(key) + '</h2>'
    + '<p><strong>Income ' + money(t.income) + '</strong> · <strong>Spent ' + money(t.expense) + '</strong> · <strong>Saved ' + money(t.saved) + '</strong> (' + (t.income ? (t.saved / t.income * 100).toFixed(1) : '0') + '% of income). '
    + 'Spending moved ' + (prev.expense ? ((t.expense - prev.expense) / prev.expense * 100).toFixed(1) : '0') + '% vs ' + monthLabel(shiftMonth(key, -1)) + '. '
    + overCats.length + ' categor' + (overCats.length === 1 ? 'y' : 'ies') + ' over budget (' + (overCats.map((c) => esc(c.label)).join(', ') || 'none') + '), ' + underCats.length + ' inside it. '
    + billsPaid + ' of ' + billsTotal + ' bills paid. Goals: ' + money(goalSaved) + ' of ' + money(goalTarget) + ' saved.</p>'
    + '<div class="grid two-even"><div><h3>Income</h3><table><thead><tr><th>Source</th><th class="amount">Amount</th></tr></thead><tbody>' + incomeRows + '<tr><td><b>Total</b></td><td class="amount"><b>' + money(t.income) + '</b></td></tr></tbody></table></div>'
    + '<div><h3>Spending vs budget</h3><table><thead><tr><th>Category</th><th class="amount">Budget</th><th class="amount">Spent</th><th class="amount">Left</th></tr></thead><tbody>' + spendRows + '<tr><td><b>Total</b></td><td class="amount"><b>' + money(totalBudget) + '</b></td><td class="amount"><b>' + money(t.expense) + '</b></td><td class="amount"><b>' + money(totalBudget - t.expense) + '</b></td></tr></tbody></table></div></div>'
    + '<canvas id="chart-report" class="chart" height="180" style="margin-top:12px"></canvas>'
    + '<p class="muted small">Hearth &amp; Home Budget · Hartono household · figures from your own records, printed ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '.</p></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>Debt payoff planner — avalanche method</h2>'
    + '<p class="muted">Total owed: <b>' + money(totalDebt) + '</b> across ' + debts.length + ' debts. The avalanche method pays the minimum on everything, then throws every spare dollar at the highest APR first — it costs the least interest of any payoff order.</p>'
    + '<p><label class="inline-label">Extra payment each month: $<input type="number" min="0" step="10" value="' + extra + '" data-extra="1" style="width:110px"> <span class="muted small">on top of the minimums</span></label></p>'
    + (debts.length ? '<table><thead><tr><th>Debt</th><th>Balance ($)</th><th>APR</th><th>Min / mo ($)</th><th class="amount">Clears in</th><th class="amount">Interest</th></tr></thead><tbody>' + debtRows + '</tbody></table>' : '<p class="empty">No debts recorded — add one below to plan a payoff.</p>')
    + '<div class="grid two-even" style="margin-top:14px"><div class="tip ' + (withExtra.months > 0 ? 'good' : 'bad') + '">'
    + (withExtra.months > 0
        ? '<strong>Debt-free by ' + monthLabel(withExtra.payoffKey) + '</strong> — ' + withExtra.months + ' months, ' + money(withExtra.interest) + ' total interest.'
        : '<strong>At the minimums alone this debt never clears</strong> — the minimum payment does not cover the monthly interest. Raise the payment or the extra amount above.')
    + '</div><div class="tip">'
    + (extra > 0 && minOnly.months > 0
        ? '<strong>Paying $' + extra + ' extra saves ' + money(savedInterest) + ' of interest</strong> and finishes ' + monthsSaved + ' months sooner than minimums only (' + minOnly.months + ' months, ' + money(minOnly.interest) + ' interest).'
        : 'Paying only the minimums takes ' + (minOnly.months > 0 ? minOnly.months + ' months and costs ' + money(minOnly.interest) + ' in interest.' : '—') + ' Try an extra amount above to see what it saves.')
    + '</div></div>'
    + '<p style="margin-top:12px"><button class="btn" id="btn-add-debt">+ Add a debt</button> <span class="muted small">Edit any balance, APR or minimum above — the plan recalculates as you type.</span></p></div>';
  const chart = root.querySelector('#chart-report');
  if (chart && topSpend.length) drawBars(chart, topSpend, { valueLabel: (v) => money0(v) });
}
