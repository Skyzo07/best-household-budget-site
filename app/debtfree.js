// Hearth & Home Budget — debt-free calendar: the household's own
// debts laid out month by month, from the next payment to the last.
// Avalanche order by default (highest APR first — the cheapest order),
// snowball on request (smallest balance first). Every figure is
// computed live from state.debts, the shared monthly extra payment
// (state.payoffExtra, the same figure the Reports payoff planner
// edits) and a one-off extra payment for the first month of the
// schedule. Change any of those and the whole calendar — months,
// interest, debt-free date, every row — recomputes at once. The
// schedule agrees with debt.js simulatePayoff to the cent: same
// order of operations every month (interest, then minimums, then the
// extra to the target debt), same month labels.
import { money, monthLabel, shiftMonth } from './data.js';
import { simulatePayoff } from './debt.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const round2 = (n) => Math.round(n * 100) / 100;

// The one-off extra payment for the first month of the schedule lives
// on state so it survives a reload. Older saves get none.
export function debtfreeStore(state) {
  if (!state.debtfree || typeof state.debtfree !== 'object') state.debtfree = { oneOff: 0 };
  if (typeof state.debtfree.oneOff !== 'number' || state.debtfree.oneOff < 0) state.debtfree.oneOff = 0;
  return state.debtfree;
}

// Months the household has opened (clicked) to see the per-debt split
// of that month's payment. Module state only — it never touches the
// saved data, so it cannot disagree with it.
const openMonths = new Set();
export function toggleDebtfreeMonth(key) {
  if (openMonths.has(key)) openMonths.delete(key);
  else openMonths.add(key);
}

// Month-by-month payoff schedule. Month 1 is the month after
// startKey — the next payment still to make — so a 40-month plan that
// starts from November 2026 ends in March 2030, the same debt-free
// date simulatePayoff reports. The one-off extra lands only in month
// 1; the monthly extra lands every month. Caps at 600 months; a
// schedule whose minimums never clear a debt stops with months -1,
// the same signal simulatePayoff uses.
export function buildSchedule(debts, extra, oneOff, method, startKey) {
  const target = method === 'snowball' ? 'snowball' : 'avalanche';
  const work = (debts || [])
    .map((d) => ({
      id: d.id,
      name: d.name,
      balance: Math.max(0, Number(d.balance) || 0),
      apr: Math.max(0, Number(d.apr) || 0),
      min: Math.max(0, Number(d.minPayment) || 0),
    }))
    .filter((d) => d.balance > 0);
  const totalOwed = round2(work.reduce((a, d) => a + d.balance, 0));
  const monthlyMin = round2(work.reduce((a, d) => a + d.min, 0));
  if (!work.length) return { rows: [], months: 0, interest: 0, payoffKey: null, totalPaid: 0, order: [], totalOwed, monthlyMin, target };
  const rows = [];
  let totalInterest = 0;
  let totalPaid = 0;
  const order = [];
  const clearedAt = {};
  let guard = 0;
  while (work.some((d) => d.balance > 0.01) && guard < 600) {
    guard++;
    const key = shiftMonth(startKey, guard);
    const detail = [];
    let monthInterest = 0;
    let monthPrincipal = 0;
    // 1. Interest accrues on every open debt.
    for (const d of work) {
      if (d.balance <= 0.01) continue;
      const interest = d.balance * (d.apr / 100 / 12);
      d.balance += interest;
      totalInterest += interest;
      monthInterest += interest;
      detail.push({ id: d.id, name: d.name, interest, principal: 0, balance: d.balance });
    }
    const byId = {};
    for (const x of detail) byId[x.id] = x;
    // 2. The minimum goes to every open debt.
    for (const d of work) {
      if (d.balance <= 0.01) continue;
      const pay = Math.min(d.balance, d.min);
      d.balance -= pay;
      monthPrincipal += pay;
      totalPaid += pay;
      byId[d.id].principal += pay;
      byId[d.id].balance = d.balance;
      if (d.balance <= 0.01 && !clearedAt[d.id]) { clearedAt[d.id] = key; order.push(d.name); }
    }
    // 3. The extra — monthly, plus the one-off in month 1 — goes to
    // one target debt at a time, rolling on when that debt clears.
    let remaining = Math.max(0, Number(extra) || 0) + (guard === 1 ? Math.max(0, Number(oneOff) || 0) : 0);
    const open = work.filter((d) => d.balance > 0.01);
    open.sort((a, b) => (target === 'snowball' ? a.balance - b.balance : b.apr - a.apr));
    for (const d of open) {
      if (remaining <= 0) break;
      const pay = Math.min(d.balance, remaining);
      d.balance -= pay;
      remaining -= pay;
      monthPrincipal += pay;
      totalPaid += pay;
      byId[d.id].principal += pay;
      byId[d.id].balance = d.balance;
      if (d.balance <= 0.01 && !clearedAt[d.id]) { clearedAt[d.id] = key; order.push(d.name); }
    }
    const cleared = order.filter((n) => Object.entries(clearedAt).some(([id, k]) => k === key && work.find((w) => w.id === id && w.name === n)));
    rows.push({
      key,
      label: monthLabel(key),
      paid: round2(monthInterest + monthPrincipal),
      interest: round2(monthInterest),
      principal: round2(monthPrincipal),
      balance: round2(work.reduce((a, d) => a + Math.max(0, d.balance), 0)),
      cleared,
      detail: detail.map((x) => ({ name: x.name, interest: round2(x.interest), principal: round2(x.principal), balance: round2(Math.max(0, x.balance)) })),
    });
  }
  const stuck = work.some((d) => d.balance > 0.01);
  return {
    rows,
    months: stuck ? -1 : rows.length,
    interest: round2(totalInterest),
    payoffKey: stuck ? null : (rows.length ? rows[rows.length - 1].key : null),
    totalPaid: round2(totalPaid),
    order,
    totalOwed,
    monthlyMin,
    target,
  };
}

// Per-debt clear month under the current plan, from simulatePayoff's
// own per-debt figures (month 1 is the month after startKey, so the
// clear key is startKey shifted by that many months).
function clearKeyFor(sim, id, startKey) {
  const p = (sim.perDebt || []).find((x) => x.id === id);
  if (!p || !p.months) return null;
  return shiftMonth(startKey, p.months);
}

export function renderDebtfree(state, root) {
  const store = debtfreeStore(state);
  const startKey = state.currentMonth;
  const firstKey = shiftMonth(startKey, 1);
  const extra = Number(state.payoffExtra) || 0;
  const method = state.payoffMethod === 'snowball' ? 'snowball' : 'avalanche';
  const oneOff = Number(store.oneOff) || 0;
  const debts = state.debts || [];
  const sim = simulatePayoff(debts, extra, method, startKey);
  const sched = buildSchedule(debts, extra, oneOff, method, startKey);
  const noExtra = simulatePayoff(debts, 0, method, startKey);
  const noOneOff = buildSchedule(debts, extra, 0, method, startKey);

  if (!debts.length || sched.totalOwed <= 0) {
    root.innerHTML = '<div class="page-head"><div><h1>Debt-free calendar</h1><p class="muted">No debts on the books — add one and this page plans every payment to the last.</p></div>'
      + '<div><a class="btn plain" href="#/reports">Add a debt on Reports →</a></div></div>'
      + '<div class="card"><h2>Nothing owed</h2><p>Every debt the household adds on the Reports page — balance, APR and minimum payment — lands here as a month-by-month payoff calendar, with a "pay extra this month" button that pulls the debt-free date forward.</p></div>';
    return;
  }
  if (sched.months < 0) {
    root.innerHTML = '<div class="page-head"><div><h1>Debt-free calendar</h1><p class="muted">The minimums never clear these debts — the interest each month is bigger than the payment.</p></div></div>'
      + '<div class="card"><h2>The minimums are not enough</h2><p>At the current balances and APRs the minimum payments do not cover the interest, so the balance never falls. Raise the extra payment below — or raise a minimum on the Reports page — and the calendar appears.</p></div>';
    return;
  }

  const savedVsNone = round2(noExtra.interest - sched.interest);
  const monthsVsNone = noExtra.months > 0 ? noExtra.months - sched.months : 0;
  const oneOffSaves = oneOff > 0 ? { months: Math.max(0, noOneOff.months - sched.months), interest: round2(noOneOff.interest - sched.interest) } : null;

  const debtCards = debts.map((d) => {
    const ck = clearKeyFor(sim, d.id, startKey);
    const p = (sim.perDebt || []).find((x) => x.id === d.id);
    return '<div class="card"><h2>' + esc(d.name) + '</h2>'
      + '<div class="kpi-value num">' + money(d.balance) + '</div>'
      + '<p class="muted small" style="margin:4px 0 0">' + d.apr + '% APR · minimum ' + money(d.minPayment) + ' a month</p>'
      + '<p style="margin:8px 0 0">Clears in <b>' + (ck ? esc(monthLabel(ck)) : '—') + '</b>' + (p ? ' — ' + money(p.interest) + ' of interest on this one under the current plan' : '') + '.</p></div>';
  }).join('');

  const rowsHtml = sched.rows.map((r, i) => {
    const open = openMonths.has(r.key);
    const clearMark = r.cleared.length ? ' <span class="pill">' + esc(r.cleared.join(', ')) + ' cleared ✓</span>' : '';
    const detailRow = open
      ? '<tr class="month-detail"><td colspan="6">' + r.detail.map((x) => '<b>' + esc(x.name) + ':</b> ' + money(x.principal) + ' off the balance, ' + money(x.interest) + ' interest, ' + money(x.balance) + ' left').join('<br>') + '</td></tr>'
      : '';
    return '<tr class="month-row" data-df-month="' + r.key + '" title="Press to see this month’s split per debt"><td><b>' + esc(r.label) + '</b>' + clearMark + ' <span class="muted small">▸ split</span></td>'
      + '<td class="amount">' + money(r.paid) + '</td>'
      + '<td class="amount"><span class="neg">' + money(r.interest) + '</span></td>'
      + '<td class="amount"><span class="pos">' + money(r.principal) + '</span></td>'
      + '<td class="amount"><b>' + money(r.balance) + '</b></td>'
      + '<td class="amount">' + (i === sched.rows.length - 1 ? '<span class="pill">debt-free ✓</span>' : (r.balance <= 0 ? '—' : '')) + '</td></tr>'
      + detailRow;
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Debt-free calendar</h1><p class="muted">Every payment from ' + esc(monthLabel(firstKey)) + ' to the last one, worked out from the household’s own debts — ' + esc(sim.order.join(' → ')) + ' under ' + (method === 'avalanche' ? 'avalanche (highest APR first)' : 'snowball (smallest balance first)') + '.</p></div>'
    + '<div><a class="btn ghost" href="#/reports">Payoff planner →</a> <a class="btn plain" href="#/networth">Net worth →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi"><div class="kpi-label">Still owed</div><div class="kpi-value num">' + money(sched.totalOwed) + '</div><div class="kpi-sub">' + debts.length + ' debts · minimums ' + money(sched.monthlyMin) + ' a month</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Paying each month</div><div class="kpi-value num">' + money(sched.monthlyMin + extra) + '</div><div class="kpi-sub">Minimums ' + money(sched.monthlyMin) + ' + extra ' + money(extra) + ' a month' + (oneOff > 0 ? ' + ' + money(oneOff) + ' once in ' + esc(monthLabel(firstKey)) : '') + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Debt-free</div><div class="kpi-value num">' + esc(sched.payoffKey ? monthLabel(sched.payoffKey) : '—') + '</div><div class="kpi-sub">' + sched.months + ' months · ' + money(sched.interest) + ' of interest in total</div></div>'
    + '<div class="card kpi"><div class="kpi-label">What the extra buys</div><div class="kpi-value num">' + money(savedVsNone) + ' saved</div><div class="kpi-sub">No extra: ' + noExtra.months + ' months, ' + money(noExtra.interest) + ' interest, debt-free ' + esc(noExtra.payoffKey ? monthLabel(noExtra.payoffKey) : '—') + ' — the ' + money(extra) + ' a month finishes ' + monthsVsNone + ' month' + (monthsVsNone === 1 ? '' : 's') + ' sooner</div></div>'
    + '</div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Change the plan</h2>'
    + '<p style="margin-top:0">Payoff order — the same choice the Reports page keeps:</p>'
    + '<p><button class="btn small' + (method === 'avalanche' ? ' primary' : ' ghost') + '" data-payoff-method="avalanche"' + (method === 'avalanche' ? ' aria-pressed="true"' : '') + '>Avalanche — highest APR first</button> '
    + '<button class="btn small' + (method === 'snowball' ? ' primary' : ' ghost') + '" data-payoff-method="snowball"' + (method === 'snowball' ? ' aria-pressed="true"' : '') + '>Snowball — smallest balance first</button></p>'
    + '<p class="muted small">' + (() => {
      const other = simulatePayoff(debts, extra, method === 'avalanche' ? 'snowball' : 'avalanche', startKey);
      if (method === 'avalanche') {
        const gap = other.months > 0 ? other.months - sched.months : 0;
        return 'Avalanche is the cheapest order for this household — snowball takes ' + other.months + ' months and ' + money(other.interest) + ' of interest at the same extra payment' + (gap ? ', ' + gap + ' month' + (gap === 1 ? '' : 's') + ' longer than avalanche' : '') + '.';
      }
      const first = (sim.perDebt || []).find((x) => x.months > 0 && x.months === Math.min.apply(null, (sim.perDebt || []).filter((y) => y.months > 0).map((y) => y.months)));
      const firstName = first ? first.name : 'the smallest debt';
      const firstMonths = first ? first.months : 0;
      return 'Snowball clears ' + esc(firstName) + ' first, in ' + firstMonths + ' month' + (firstMonths === 1 ? '' : 's') + ' — the quickest win — but costs ' + money(round2(sim.interest - other.interest)) + ' more interest than avalanche at the same extra payment.';
    })() + '</p>'
    + '<label>Extra every month ($) <input type="number" min="0" step="5" value="' + extra + '" data-df-extra></label>'
    + '<p class="muted small">The same figure the Reports payoff planner edits — change it here and that page agrees at once. Raise it to $100 and the plan falls to ' + (() => { const s100 = simulatePayoff(debts, 100, method, startKey); return s100.months + ' months, ' + money(s100.interest) + ' of interest'; })() + '.</p>'
    + '</div>'
    + '<div class="card"><h2>Pay extra this month</h2>'
    + '<p style="margin-top:0">One extra payment, in ' + esc(monthLabel(firstKey)) + ' only — a bonus, a tax refund, a quiet month — and the whole calendar below moves at once.</p>'
    + '<label>Extra in ' + esc(monthLabel(firstKey)) + ' ($) <input id="df-oneoff-amount" type="number" min="1" step="10" value="' + (oneOff > 0 ? oneOff : 500) + '"></label>'
    + '<p><button class="btn primary" data-df-oneoff-apply>Pay extra this month</button> ' + (oneOff > 0 ? '<button class="btn ghost" data-df-oneoff-clear>Clear the extra</button>' : '') + '</p>'
    + (oneOff > 0
      ? '<p><b>' + money(oneOff) + ' extra in ' + esc(monthLabel(firstKey)) + ' is on the plan.</b> Against the same plan without it, that brings the debt-free date ' + oneOffSaves.months + ' month' + (oneOffSaves.months === 1 ? '' : 's') + ' sooner and saves ' + money(oneOffSaves.interest) + ' of interest (' + noOneOff.months + ' months, ' + money(noOneOff.interest) + ' interest without it).</p>'
      : '<p class="muted small">Nothing extra booked yet — the calendar below is the plan on minimums plus the ' + money(extra) + ' a month.</p>')
    + '<p class="muted small">The extra goes to the ' + (method === 'avalanche' ? 'credit card first — the highest APR' : 'store card first — the smallest balance') + ', then rolls on to the next debt when that one clears.</p></div></div>'
    + '<div class="grid three" style="margin-top:16px">' + debtCards + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>The calendar — ' + sched.months + ' payments to debt-free</h2>'
    + '<p class="muted small" style="margin-top:0">Press any month to see that payment split per debt — how much interest each debt charged, how much principal it paid, and what it still owes. Green is principal paid down; the balance column is what is still owed after that month.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Month</th><th class="amount">Paid</th><th class="amount">Interest</th><th class="amount">Principal</th><th class="amount">Balance left</th><th class="amount"></th></tr></thead><tbody>'
    + rowsHtml
    + '<tr><td><b>Total</b></td><td class="amount"><b>' + money(sched.totalPaid) + '</b></td><td class="amount"><b>' + money(sched.interest) + '</b></td><td class="amount"><b>' + money(sched.totalOwed) + '</b></td><td class="amount"><b>$0.00</b></td><td></td></tr>'
    + '</tbody></table></div>'
    + '<p class="muted small">Total paid ' + money(sched.totalPaid) + ' = the ' + money(sched.totalOwed) + ' owed plus ' + money(sched.interest) + ' of interest. Edit any balance, APR or minimum on the Reports page and this calendar rebuilds itself.</p></div>';
}
