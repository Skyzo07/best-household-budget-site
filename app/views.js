// Hearth & Home Budget — views: dashboard, transactions, budgets,
// savings goals and insights. Each view renders from state + current month.
import { CATEGORIES, categoryById, envelopeTotals, money, money0, monthLabel, monthTotals, monthTransactions, categorySpend, lastMonths, shiftMonth, subTotals, todayISO } from './data.js';
import { drawDonut, drawBars, drawTrend, ringSVG } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Tiny inline sparkline: six monthly values as an SVG polyline, no canvas,
// no extra file. Width 120, height 28.
function sparkSVG(values, color) {
  const max = Math.max.apply(null, values.concat([1]));
  const pts = values.map((v, i) => ((i / Math.max(values.length - 1, 1)) * 116 + 2).toFixed(1) + ',' + (26 - (v / max) * 22).toFixed(1)).join(' ');
  const last = values[values.length - 1] || 0;
  const lx = ((values.length - 1) / Math.max(values.length - 1, 1)) * 116 + 2;
  const ly = 26 - (last / max) * 22;
  return '<svg class="spark" width="120" height="28" viewBox="0 0 120 28" role="img" aria-label="Six-month spending trend"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3" fill="' + color + '"/></svg>';
}

function txRow(t) {
  const cat = categoryById(t.category);
  const sign = t.kind === 'income' ? '+' : '−';
  return '<li><span class="tx-ico" style="background:' + cat.color + '22;color:' + cat.color + '">' + cat.icon + '</span>'
    + '<span class="tx-main"><b>' + esc(t.description) + '</b><span>' + fmtDate(t.date) + ' · ' + esc(cat.label) + (t.note ? ' · ' + esc(t.note) : '') + '</span></span>'
    + '<span class="tx-amt ' + (t.kind === 'income' ? 'in' : 'out') + '">' + sign + money(t.amount) + '</span></li>';
}

function budgetBars(state, key) {
  const spend = categorySpend(state, key);
  const rows = CATEGORIES.filter((c) => c.budget > 0).map((c) => {
    const spent = spend[c.id] || 0;
    const pct = c.budget > 0 ? (spent / c.budget) * 100 : 0;
    const cls = pct > 100 ? 'over' : pct > 85 ? 'amber' : '';
    const pill = pct > 100 ? '<span class="pill over">Over by ' + money(spent - c.budget) + '</span>'
      : pct > 85 ? '<span class="pill warn">Almost there</span>' : '<span class="pill">On track</span>';
    return '<div class="bar-row"><div class="bar-top"><span><span class="cat-dot" style="background:' + c.color + '"></span><b>' + esc(c.label) + '</b> — ' + money(spent) + ' of ' + money(c.budget) + '</span>' + pill + '</div>'
      + '<div class="bar"><i class="' + cls + '" style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div></div>';
  }).join('');
  return rows;
}

export function renderDashboard(state, root) {
  const key = state.currentMonth;
  const t = monthTotals(state, key);
  const prev = monthTotals(state, shiftMonth(key, -1));
  const spend = categorySpend(state, key);
  const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const over = CATEGORIES.filter((c) => c.budget > 0 && (spend[c.id] || 0) > c.budget);
  const incomeDelta = prev.income ? ((t.income - prev.income) / prev.income) * 100 : 0;
  const spendDelta = prev.expense ? ((t.expense - prev.expense) / prev.expense) * 100 : 0;
  const recent = state.transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const slices = CATEGORIES.filter((c) => c.budget > 0 && (spend[c.id] || 0) > 0)
    .map((c) => ({ label: c.label, value: spend[c.id], color: c.color }))
    .sort((a, b) => b.value - a.value);
  const safe = Math.max(0, t.income - t.expense);
  const goalTotal = state.goals.reduce((a, g) => a + g.saved, 0);
  const goalTarget = state.goals.reduce((a, g) => a + g.target, 0);
  // Bills due soon: unpaid bills for this month, earliest first.
  const unpaidBills = (state.bills || []).filter((b) => !(b.paidMonths || []).includes(key)).sort((a, b) => a.day - b.day);
  const stillToPay = unpaidBills.reduce((a, b) => a + b.amount, 0);
  const todayDay = Number(todayISO().slice(8, 10));
  // Year to date: January through the current month.
  const curYear = Number(key.slice(0, 4));
  const curMonthNum = Number(key.slice(5, 7));
  let ytdIncome = 0, ytdExpense = 0, bestYtd = null;
  for (let m = 1; m <= curMonthNum; m++) {
    const k = curYear + '-' + String(m).padStart(2, '0');
    const mt = monthTotals(state, k);
    ytdIncome += mt.income; ytdExpense += mt.expense;
    if (!bestYtd || mt.saved > bestYtd.saved) bestYtd = { key: k, saved: mt.saved };
  }
  const ytdSaved = ytdIncome - ytdExpense;
  // Pocket-money allowances: spent counts transactions tagged with the person.
  const allowanceRows = (state.allowances || []).map((a) => {
    let spent = 0;
    for (const tx of monthTransactions(state, key)) if (tx.kind === 'expense' && tx.who === a.id) spent += tx.amount;
    const left = Math.max(0, a.monthly - spent);
    const pct = a.monthly ? Math.min(100, (spent / a.monthly) * 100) : 0;
    return '<div class="allow-chip"><b>' + esc(a.who) + '</b><span>' + money(spent) + ' of ' + money(a.monthly) + '</span><span class="' + (left <= 0 ? 'neg' : 'pos') + '">' + money(left) + ' left</span><div class="bar"><i style="width:' + pct.toFixed(0) + '%"></i></div></div>';
  }).join('');
  // Grocery list at a glance: what is still to buy this week.
  const grocList = (state.grocery && state.grocery.list) || [];
  let grocToBuy = 0, grocTotal = 0, grocLeft = 0;
  for (const item of grocList) {
    const line = item.price * (item.qty || 1);
    grocTotal += line;
    if (item.checked) continue;
    grocToBuy += line; grocLeft++;
  }
  // 50/30/20 rule: needs vs wants vs savings, as shares of income.
  const NEEDS = ['housing', 'utilities', 'transport', 'groceries', 'health', 'kids'];
  const WANTS = ['dining', 'fun', 'shopping', 'other'];
  const needs = NEEDS.reduce((a, id) => a + (spend[id] || 0), 0);
  const wants = WANTS.reduce((a, id) => a + (spend[id] || 0), 0);
  const ruleRows = [
    { label: 'Needs', sub: 'rent, bills, food, transport, health, school', value: needs, target: 50, color: '#1d6b4f' },
    { label: 'Wants', sub: 'eating out, fun, shopping', value: wants, target: 30, color: '#d9a441' },
    { label: 'Savings', sub: 'what stayed in the household', value: Math.max(0, t.saved), target: 20, color: '#2b5f8a' },
  ].map((r) => {
    const pct = t.income ? (r.value / t.income) * 100 : 0;
    const over = pct > r.target;
    return '<div class="bar-row"><div class="bar-top"><span><b>' + r.label + '</b> <span class="muted">· ' + r.sub + '</span></span><span>' + money(r.value) + ' · ' + pct.toFixed(0) + '% of income <span class="pill ' + (over ? 'warn' : '') + '">target ' + r.target + '%</span></span></div>'
      + '<div class="bar"><i style="width:' + Math.min(100, pct).toFixed(1) + '%;background:' + r.color + '"></i></div></div>';
  }).join('');

  // Savings challenges at a glance: 52-week progress, no-spend days, pot.
  const ch52 = state.challenges && state.challenges.fiftyTwo;
  const chPaid = (ch52 && Array.isArray(ch52.paid)) ? ch52.paid : [];
  const chMode = (ch52 && ch52.mode) || 'grow';
  const chWeekAmt = (w) => chMode === 'reverse' ? 53 - w : chMode === 'flat' ? 10 : w;
  const chSaved = chPaid.reduce((a, w) => a + chWeekAmt(w), 0);
  const chTarget = chMode === 'flat' ? 520 : 1378;
  const chNext = (() => { for (let w = 1; w <= 52; w++) if (!chPaid.includes(w)) return w; return 0; })();
  const chNoSpend = (state.challenges && state.challenges.noSpend && state.challenges.noSpend[key]) || [];
  const chPot = (state.challenges && state.challenges.roundUp && state.challenges.roundUp.pot) || 0;
  const savingsStrip = '<div class="card" style="margin-top:16px"><h2>Savings challenges <a href="#/savings">Play along →</a></h2><div class="savings-strip"><p style="margin:0">52-week challenge: <b>' + money(chSaved) + ' of ' + money(chTarget) + '</b> · ' + chPaid.length + ' of 52 weeks paid' + (chNext ? ' · next week ' + chNext + ' is ' + money(chWeekAmt(chNext)) : ' · complete!') + '</p><p style="margin:0"><b>' + chNoSpend.length + ' no-spend days</b> this month · round-up pot <b>' + money(chPot) + '</b></p><p style="margin:0"><a class="btn small ghost" href="#/savings">Open challenges</a></p></div></div>';

  // Cash envelopes at a glance: filled, spent and left across the six
  // envelopes, with any empty one named so it reads at a glance.
  const envT = envelopeTotals(state, key);
  const envStrip = '<div class="card" style="margin-top:16px"><h2>Cash envelopes <a href="#/envelopes">Open envelopes →</a></h2><div class="savings-strip"><p style="margin:0">Filled <b>' + money(envT.filled) + '</b> · spent <b>' + money(envT.spent) + '</b> · <b>' + money(envT.left) + '</b> still in the envelopes, ' + money(envT.rolled) + ' of it rolled over from last month</p><p style="margin:0">' + (envT.over.length ? '<b>' + envT.over.map((e) => esc(e.label)).join(', ') + '</b> ' + (envT.over.length > 1 ? 'are' : 'is') + ' empty — move cash in from a fuller envelope' : 'No envelope is empty') + ' · next month opens with <b>' + money(envT.nextFilled) + '</b></p><p style="margin:0"><a class="btn small ghost" href="#/envelopes">Move cash</a></p></div></div>';

  // Subscription audit at a glance: what the household pays every
  // month for subscriptions, and what the audit says could be saved.
  const subT = subTotals(state, key);
  const subStrip = '<div class="card" style="margin-top:16px"><h2>Subscription audit <a href="#/subscriptions">Audit subscriptions →</a></h2><div class="savings-strip"><p style="margin:0">' + subT.activeCount + ' subscriptions cost <b>' + money(subT.monthly) + ' a month</b> · ' + money(subT.yearly) + ' a year</p><p style="margin:0">' + (subT.totalSaving > 0 ? 'Cancel the ' + subT.cancelCount + ' unused and downgrade the ' + subT.downgradeCount + ' barely-used to save <b>' + money(subT.totalSaving) + ' a year</b>' : 'Every subscription earned its place this month — nothing to cancel') + '</p><p style="margin:0"><a class="btn small ghost" href="#/subscriptions">See the verdicts</a></p></div></div>';

  root.innerHTML =
    (state.sample ? '<div class="sample-note"><strong>Sample household loaded</strong> — the Hartono family’s November budget. Edit or delete anything, or press <strong>Reset sample data</strong> to start clean.</div>' : '')
    + '<div class="page-head"><div><h1>Your month at a glance</h1><p class="muted">' + monthLabel(key) + ' · Two incomes, two kids, one plan. Here is where the household stands right now.</p></div>'
    + '<div><button class="btn ghost" id="btn-add-tx">+ Add transaction</button> <button class="btn plain" id="btn-export">Export CSV</button> <button class="btn plain" id="btn-reset">Reset sample data</button></div></div>'
    + (over.length ? '<div class="alert" role="alert"><strong>Heads up:</strong> ' + over.map((c) => esc(c.label)).join(', ') + ' ' + (over.length > 1 ? 'are' : 'is') + ' over budget this month. See Budgets for the detail.</div>'
      : '<div class="alert ok"><strong>All budgets on track.</strong> No category is over its monthly limit.</div>')
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Income</div><div class="kpi-value num">' + money(t.income) + '</div><div class="kpi-sub">' + (incomeDelta >= 0 ? '<span class="delta-up">▲ ' + incomeDelta.toFixed(1) + '%</span>' : '<span class="delta-down">▼ ' + Math.abs(incomeDelta).toFixed(1) + '%</span>') + ' vs ' + monthLabel(shiftMonth(key, -1)) + '</div></div>'
    + '<div class="card kpi ' + (t.expense > t.income ? 'warn' : '') + '"><div class="kpi-label">Spent</div><div class="kpi-value num">' + money(t.expense) + '</div><div class="kpi-sub">' + (spendDelta <= 0 ? '<span class="delta-up">▼ ' + Math.abs(spendDelta).toFixed(1) + '%</span> vs last month' : '<span class="delta-down">▲ ' + spendDelta.toFixed(1) + '%</span> vs last month') + ' · budget ' + money(totalBudget) + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Saved this month</div><div class="kpi-value num">' + money(t.saved) + '</div><div class="kpi-sub">' + (t.income ? (t.saved / t.income * 100).toFixed(1) + '% savings rate' : 'No income recorded') + ' · target 20%</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Safe to spend</div><div class="kpi-value num">' + money(safe) + '</div><div class="kpi-sub">Left after spending · goals ' + money(goalTotal) + ' of ' + money(goalTarget) + '</div></div>'
    + '</div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Bills due soon <a href="#/bills">All bills →</a></h2>'
    + (unpaidBills.length
      ? '<ul class="tx-list">' + unpaidBills.slice(0, 3).map((b) => {
          const cat = categoryById(b.category);
          const late = b.day < todayDay;
          return '<li><span class="tx-ico" style="background:' + cat.color + '22;color:' + cat.color + '">' + cat.icon + '</span>'
            + '<span class="tx-main"><b>' + esc(b.name) + '</b><span>Due day ' + b.day + ' · ' + esc(cat.label) + '</span></span>'
            + '<span class="tx-amt ' + (late ? 'out' : '') + '">' + money(b.amount) + (late ? ' · overdue' : '') + '</span></li>';
        }).join('') + '</ul><p class="muted small">' + money(stillToPay) + ' still to pay across ' + unpaidBills.length + ' bill' + (unpaidBills.length === 1 ? '' : 's') + ' this month.</p>'
      : '<p class="muted">Every bill for this month is paid. Nothing due — enjoy the quiet.</p>')
    + '</div>'
    + '<div class="card"><h2>' + curYear + ' so far <a href="#/annual">Annual overview →</a></h2>'
    + '<p style="font-size:1.05rem">Saved <b>' + money(ytdSaved) + '</b> in ' + curMonthNum + ' months · income ' + money(ytdIncome) + ' · spent ' + money(ytdExpense) + '.</p>'
    + '<p class="muted small">Best month was ' + monthLabel(bestYtd.key) + ' (' + money(bestYtd.saved) + ' saved). At this pace the household saves about ' + money(Math.round(ytdSaved / curMonthNum)) + ' a month — see the Annual page for the full year plan.</p>'
    + '<p><a class="btn small ghost" href="#/reports">Print this month’s report</a></p></div>'
    + '</div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Where the money went <a href="#/transactions">All transactions →</a></h2><div class="chart-wrap"><canvas id="chart-donut" class="chart" height="150" aria-label="Spending by category chart"></canvas></div><ul class="legend">'
    + slices.map((s) => '<li><span class="cat-dot" style="background:' + s.color + '"></span>' + esc(s.label) + ' — <b>' + money(s.value) + '</b> (' + (t.expense ? Math.round(s.value / t.expense * 100) : 0) + '%)</li>').join('')
    + '</ul></div>'
    + '<div class="card"><h2>Budget vs actual <a href="#/budgets">Manage budgets →</a></h2>' + budgetBars(state, key) + '</div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>The 50 / 30 / 20 check</h2><p class="muted small" style="margin-top:0">A classic household rule: about 50% of income to needs, 30% to wants, 20% to savings. Here is how ' + monthLabel(key) + ' measures up.</p>' + ruleRows
    + '<p class="muted small">Needs are running ' + (t.income ? Math.round(needs / t.income * 100) : 0) + '% of income. If needs creep over 50%, the fix is usually a bill to renegotiate — not a smaller grocery shop.</p></div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Recent transactions <a href="#/transactions">See all →</a></h2><ul class="tx-list">' + recent.map(txRow).join('') + '</ul></div>'
    + '<div class="card"><h2>Savings goals <a href="#/goals">All goals →</a></h2>'
    + state.goals.map((g) => {
        const pct = g.target ? (g.saved / g.target) * 100 : 0;
        return '<div class="bar-row"><div class="bar-top"><span><b>' + esc(g.name) + '</b></span><span>' + money(g.saved) + ' / ' + money(g.target) + ' · ' + pct.toFixed(0) + '%</span></div><div class="bar"><i style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div></div>';
      }).join('')
    + '<p class="muted small">Tip: move your saved amount into a goal the day payday lands — what you don’t see, you don’t spend.</p></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Pocket money &amp; allowances <a href="#/members">Everyone’s page →</a></h2><p class="muted small" style="margin-top:0">Each person’s free-spending money for ' + monthLabel(key) + ' — counted from their own tagged spending. No questions asked, no category to justify.</p><div class="allow-grid">' + allowanceRows + '</div></div>'
    + savingsStrip
    + envStrip
    + subStrip
    + (grocList.length ? '<div class="card" style="margin-top:16px"><h2>Groceries &amp; meals <a href="#/grocery">Plan &amp; list →</a></h2><p style="margin-top:0">Dinner is planned for all 7 nights this week. The grocery list stands at <b>' + money(grocToBuy) + ' still to buy</b> — ' + grocLeft + ' of ' + grocList.length + ' items left, ' + money(grocTotal) + ' in total. Tick items off in the store, then post the shop into Transactions with one press.</p></div>' : '');
  drawDonut(root.querySelector('#chart-donut'), slices, 'spent', money0(t.expense));
}

export function renderTransactions(state, root, filter) {
  const key = state.currentMonth;
  const f = filter || { q: '', cat: 'all', kind: 'all' };
  let list = monthTransactions(state, key).slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  if (f.cat !== 'all') list = list.filter((t) => t.category === f.cat);
  if (f.kind !== 'all') list = list.filter((t) => t.kind === f.kind);
  if (f.q) { const q = f.q.toLowerCase(); list = list.filter((t) => (t.description + ' ' + (t.note || '')).toLowerCase().includes(q)); }
  const t = monthTotals(state, key);
  const catOptions = ['<option value="all">All categories</option>'].concat(CATEGORIES.map((c) => '<option value="' + c.id + '"' + (f.cat === c.id ? ' selected' : '') + '>' + esc(c.label) + '</option>')).join('');
  root.innerHTML =
    '<div class="page-head"><div><h1>Transactions</h1><p class="muted">' + monthLabel(key) + ' · ' + list.length + ' shown · Income ' + money(t.income) + ' · Spent ' + money(t.expense) + ' · Saved ' + money(t.saved) + '</p></div>'
    + '<div><button class="btn primary" id="btn-add-tx">+ Add transaction</button> <button class="btn ghost" id="btn-export">Export CSV</button></div></div>'
    + '<div class="card"><div class="toolbar"><input type="search" id="f-q" placeholder="Search transactions…" value="' + esc(f.q) + '" aria-label="Search transactions">'
    + '<select id="f-cat" aria-label="Filter by category">' + catOptions + '</select>'
    + '<select id="f-kind" aria-label="Filter by type"><option value="all"' + (f.kind === 'all' ? ' selected' : '') + '>Income + expenses</option><option value="income"' + (f.kind === 'income' ? ' selected' : '') + '>Income only</option><option value="expense"' + (f.kind === 'expense' ? ' selected' : '') + '>Expenses only</option></select></div>'
    + (list.length ? '<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="hide-m">Note</th><th class="amount">Amount</th><th></th></tr></thead><tbody>'
      + list.map((tx) => {
          const cat = categoryById(tx.category);
          return '<tr><td class="num">' + fmtDate(tx.date) + '</td><td><b>' + esc(tx.description) + '</b></td><td><span class="cat-dot" style="background:' + cat.color + '"></span>' + esc(cat.label) + '</td><td class="hide-m muted">' + esc(tx.note || '—') + '</td>'
            + '<td class="amount"><span class="' + (tx.kind === 'income' ? 'pos' : 'neg') + '">' + (tx.kind === 'income' ? '+' : '−') + money(tx.amount) + '</span></td>'
            + '<td><button class="icon-btn" data-edit="' + tx.id + '">Edit</button> <button class="icon-btn" data-del="' + tx.id + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="empty">No transactions match. Try clearing the search, or add the first one for this month.</p>')
    + '</div>';
}

export function renderBudgets(state, root) {
  const key = state.currentMonth;
  const spend = categorySpend(state, key);
  const t = monthTotals(state, key);
  const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  root.innerHTML =
    '<div class="page-head"><div><h1>Monthly budgets</h1><p class="muted">Set a limit for each category for ' + monthLabel(key) + '. Budgets repeat every month — change a figure any time and it applies from this month on.</p></div>'
    + '<div><button class="btn ghost" id="btn-add-tx">+ Add transaction</button></div></div>'
    + '<div class="grid two-even"><div class="card"><h2>Budget vs actual</h2>' + budgetBars(state, key)
    + '<p class="muted small">Total budgeted ' + money(totalBudget) + ' · actually spent ' + money(t.expense) + ' · ' + (totalBudget - t.expense >= 0 ? money(totalBudget - t.expense) + ' still inside the plan' : money(t.expense - totalBudget) + ' over the plan') + '.</p></div>'
    + '<div class="card"><h2>Edit limits</h2><p class="muted small">A good starting rule: housing under 30% of income, food under 15%, and at least 20% to savings before anything else.</p>'
    + CATEGORIES.filter((c) => c.budget > 0 || (state.budgets[c.id] || 0) > 0).map((c) => {
        const b = state.budgets[c.id] || 0;
        const spent = spend[c.id] || 0;
        return '<div class="bar-row"><div class="bar-top"><span><span class="cat-dot" style="background:' + c.color + '"></span><b>' + esc(c.label) + '</b> <span class="muted">· spent ' + money(spent) + '</span></span>'
          + '<span class="budget-edit">$<input type="number" min="0" step="10" value="' + b + '" data-budget="' + c.id + '" aria-label="Monthly budget for ' + esc(c.label) + '"> / mo</span></div></div>';
      }).join('')
    + '<p class="muted small">Limits save automatically as you type. Set a category to 0 to hide it from the plan.</p></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>Six-month history</h2><p class="muted small" style="margin-top:0">What each category actually cost, ' + monthLabel(lastMonths(key, 6)[0]) + ' to ' + monthLabel(key) + ' — the line is the trend, the dot is this month.</p>'
    + CATEGORIES.filter((c) => c.budget > 0).map((c) => {
        const vals = lastMonths(key, 6).map((k) => categorySpend(state, k)[c.id] || 0);
        const avg = vals.reduce((a, b) => a + b, 0) / 6;
        const last = vals[vals.length - 1];
        const trend = last > avg * 1.1 ? '▲ above its 6-month average' : last < avg * 0.9 ? '▼ below its 6-month average' : '≈ at its 6-month average';
        return '<div class="bar-row"><div class="bar-top"><span><span class="cat-dot" style="background:' + c.color + '"></span><b>' + esc(c.label) + '</b> <span class="muted">· this month ' + money(last) + ' · 6-mo avg ' + money(avg) + '</span></span><span>' + sparkSVG(vals, c.color) + ' <span class="muted small">' + trend + '</span></span></div></div>';
      }).join('')
    + '</div>';
}

export function renderGoals(state, root) {
  const totalSaved = state.goals.reduce((a, g) => a + g.saved, 0);
  const totalTarget = state.goals.reduce((a, g) => a + g.target, 0);
  const pctAll = totalTarget ? Math.round(totalSaved / totalTarget * 100) : 0;
  root.innerHTML =
    '<div class="page-head"><div><h1>Savings goals</h1><p class="muted">Give every dollar a job before the month starts. ' + money(totalSaved) + ' saved toward ' + money(totalTarget) + ' in goals — ' + pctAll + '% of the way there.</p></div>'
    + '<div><button class="btn primary" id="btn-add-goal">+ New goal</button></div></div>'
    + '<div class="goal-grid">'
    + state.goals.map((g) => {
        const pct = g.target ? (g.saved / g.target) * 100 : 0;
        const left = Math.max(0, g.target - g.saved);
        const color = pct >= 100 ? '#1d6b4f' : pct >= 50 ? '#2b5f8a' : '#d9a441';
        const nextMile = [25, 50, 75, 100].find((m) => pct < m);
        const mileLine = nextMile
          ? (() => { const need = Math.round((g.target * nextMile / 100 - g.saved) * 100) / 100; const months = Math.max(1, Math.ceil(need / 100)); return '<p class="goal-mile">Next milestone: <b>' + nextMile + '% (' + money(g.target * nextMile / 100) + ')</b> — ' + money(need) + ' to go · about ' + months + ' month' + (months === 1 ? '' : 's') + ' at $100 a month</p>'; })()
          : '<p class="goal-mile">All milestones reached — 100% saved.</p>';
        return '<div class="card goal-card"><h3>' + esc(g.name) + '</h3>'
          + '<div class="goal-ring">' + ringSVG(pct, color) + '<div class="ring-label"><b>' + Math.round(pct) + '%</b><span>saved</span></div></div>'
          + '<p class="goal-amt"><b>' + money(g.saved) + '</b> of ' + money(g.target) + '</p>'
          + '<p class="goal-date">' + (left > 0 ? money(left) + ' to go' : 'Goal reached — well done!') + (g.date ? ' · by ' + fmtDate(g.date) : '') + '</p>'
          + mileLine
          + '<div class="goal-actions"><button class="btn small" data-add-goal="' + g.id + '">+ $100</button><button class="btn small ghost" data-edit-goal="' + g.id + '">Edit</button><button class="btn small danger" data-del-goal="' + g.id + '">Delete</button></div></div>';
      }).join('')
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>How to reach a goal faster</h2><p>Pick the date first, then work backwards: a $2,400 holiday in 8 months is $300 a month — less than most households spend on takeaway. Automate the transfer on payday, and round every grocery shop down to the nearest $10 and move the difference here.</p><p class="muted small">Press <strong>+ $100</strong> on a card to record a contribution, or Edit to change the target, the amount saved, or the date.</p></div>';
}

export function renderInsights(state, root) {
  const key = state.currentMonth;
  const keys = lastMonths(key, 6);
  const points = keys.map((k) => {
    const t = monthTotals(state, k);
    const short = monthLabel(k).split(' ')[0].slice(0, 3);
    return { label: short, income: t.income, expense: t.expense };
  });
  const cur = monthTotals(state, key);
  const prev = monthTotals(state, shiftMonth(key, -1));
  const spend = categorySpend(state, key);
  const prevSpend = categorySpend(state, shiftMonth(key, -1));
  const top = Object.entries(spend).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const biggestJump = Object.entries(spend)
    .map(([id, v]) => ({ id, delta: v - (prevSpend[id] || 0) }))
    .sort((a, b) => b.delta - a.delta)[0];
  const tips = [];
  if (cur.saved < cur.income * 0.2 && cur.income > 0) tips.push({ cls: 'bad', text: '<strong>Savings rate ' + (cur.income ? (cur.saved / cur.income * 100).toFixed(1) : '0') + '% — below the 20% target.</strong> The quickest win is usually dining out: this month it is ' + money(spend.dining || 0) + '. One home-cooked swap a week frees roughly $50 a month.' });
  else tips.push({ cls: 'good', text: '<strong>Savings rate on target.</strong> You saved ' + (cur.income ? (cur.saved / cur.income * 100).toFixed(1) : '0') + '% of income this month — at or above the 20% rule of thumb. Keep the habit.' });
  if (biggestJump && biggestJump.delta > 30) tips.push({ cls: '', text: '<strong>' + esc(categoryById(biggestJump.id).label) + ' jumped ' + money(biggestJump.delta) + ' vs last month.</strong> Check whether it was a one-off (a bill, a repair) or a new habit — one-offs need no action, habits need a new limit.' });
  const groceryAvg = keys.slice(0, 5).reduce((a, k) => a + (categorySpend(state, k).groceries || 0), 0) / 5;
  tips.push({ cls: '', text: '<strong>Groceries average ' + money(groceryAvg) + ' a month</strong> over the last five months. A weekly meal plan and one big shop instead of daily top-ups typically cuts this by 8–12%.' });
  tips.push({ cls: 'good', text: '<strong>Housing is ' + (cur.income ? Math.round((spend.housing || 0) / cur.income * 100) : 0) + '% of income.</strong> Under 30% leaves room for savings — this household is inside the healthy range.' });

  root.innerHTML =
    '<div class="page-head"><div><h1>Insights</h1><p class="muted">Six months of your household’s money, compared. Spotting the pattern is half the saving. For the printable summary and the debt plan, see <a href="#/reports">Reports</a>.</p></div>'
    + '<div><button class="btn ghost" id="btn-export">Export CSV</button></div></div>'
    + '<div class="card"><h2>Income vs spending — last 6 months</h2><div class="chart-wrap"><canvas id="chart-trend" class="chart" height="280"></canvas></div>'
    + '<p class="muted small">Green bars are income, gold bars are spending, the red line is what stayed saved each month.</p></div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Biggest spending this month</h2>'
    + (top.length ? '<canvas id="chart-top" class="chart" height="200" style="margin-top:8px"></canvas>' : '<p class="empty">No spending recorded this month yet.</p>')
    + '<p class="muted small">Housing is a fixed cost — the categories you can actually move are the ones below it.</p></div>'
    + '<div class="card"><h2>What to do next</h2>' + tips.map((t) => '<div class="tip ' + t.cls + '">' + t.text + '</div>').join('')
    + '<p class="muted small">Month over month: income ' + (prev.income ? ((cur.income - prev.income) / prev.income * 100).toFixed(1) : '0') + '% · spending ' + (prev.expense ? ((cur.expense - prev.expense) / prev.expense * 100).toFixed(1) : '0') + '% vs ' + monthLabel(shiftMonth(key, -1)) + '.</p></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>Savings rate — last 6 months</h2><div class="chart-wrap"><canvas id="chart-saverate" class="chart" height="200"></canvas></div>'
    + '<p class="muted small">Share of income saved each month. Green is at or above the 20% rule of thumb; gold is below it. Months above 20% are the ones building the emergency fund.</p></div>';
  drawTrend(root.querySelector('#chart-trend'), points);
  const topCanvas = root.querySelector('#chart-top');
  if (topCanvas) drawBars(topCanvas, top.map(([id, v]) => ({ label: categoryById(id).label.split(' ')[0], value: v, color: categoryById(id).color })), { valueLabel: (v) => money0(v) });
  const rateCanvas = root.querySelector('#chart-saverate');
  if (rateCanvas) drawBars(rateCanvas, points.map((p) => ({ label: p.label, value: p.income ? Math.max(0, (p.income - p.expense) / p.income * 100) : 0, color: (p.income && (p.income - p.expense) / p.income >= 0.2) ? '#1d6b4f' : '#d9a441' })), { valueLabel: (v) => v.toFixed(0) + '%' });
}
