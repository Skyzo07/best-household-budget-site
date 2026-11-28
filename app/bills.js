// Hearth & Home Budget — bills & recurring: due-date list with paid
// toggles, recurring rules that post real transactions, and pocket-money
// allowances per person. All figures come from state; nothing is faked.
import { categoryById, money, money0, monthLabel, monthTransactions, uid, todayISO } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function daySuffix(day) {
  if (day >= 11 && day <= 13) return day + 'th';
  const last = day % 10;
  return day + (last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th');
}

// ---- Bills: paid state is a list of month keys on each bill. ----
export function billPaidIn(bill, key) {
  return Array.isArray(bill.paidMonths) && bill.paidMonths.includes(key);
}

export function billsForMonth(state, key) {
  const today = todayISO();
  const todayDay = Number(today.slice(8, 10));
  const inMonth = today.slice(0, 7) === key;
  return (state.bills || []).slice().sort((a, b) => a.day - b.day).map((bill) => {
    const paid = billPaidIn(bill, key);
    const overdue = !paid && inMonth && bill.day < todayDay;
    const dueIn = !paid && inMonth ? bill.day - todayDay : null;
    return Object.assign({}, bill, { paid, overdue, dueIn });
  });
}

export function billsTotals(state, key) {
  const list = billsForMonth(state, key);
  let due = 0, paid = 0, unpaid = 0;
  for (const b of list) {
    due += b.amount;
    if (b.paid) paid += b.amount; else unpaid += b.amount;
  }
  const next = list.find((b) => !b.paid) || null;
  return { due, paid, unpaid, count: list.length, paidCount: list.filter((b) => b.paid).length, next };
}

export function toggleBillPaid(state, billId, key) {
  const bill = (state.bills || []).find((b) => b.id === billId);
  if (!bill) return;
  bill.paidMonths = Array.isArray(bill.paidMonths) ? bill.paidMonths.slice() : [];
  const i = bill.paidMonths.indexOf(key);
  if (i === -1) bill.paidMonths.push(key); else bill.paidMonths.splice(i, 1);
  state.sample = false;
}

// ---- Recurring rules: posting one writes a real transaction. ----
export function rulePostedIn(rule, key) {
  return rule.lastPosted === key;
}

export function postRule(state, rule, key) {
  if (!rule || !rule.active || rulePostedIn(rule, key)) return null;
  const date = key + '-' + String(Math.min(rule.day, 28)).padStart(2, '0');
  const tx = {
    id: uid('tx'),
    date,
    kind: rule.kind,
    category: rule.category,
    amount: Math.round(rule.amount * 100) / 100,
    description: rule.name + ' (recurring)',
    note: 'Posted automatically from Bills & recurring',
  };
  state.transactions.push(tx);
  rule.lastPosted = key;
  state.sample = false;
  return tx;
}

export function postAllDue(state, key) {
  const today = todayISO();
  const todayDay = Number(today.slice(8, 10));
  const inMonth = today.slice(0, 7) === key;
  const posted = [];
  for (const rule of state.recurring || []) {
    if (!rule.active || rulePostedIn(rule, key)) continue;
    if (inMonth && rule.day > todayDay) continue;
    const tx = postRule(state, rule, key);
    if (tx) posted.push(tx);
  }
  return posted;
}

// ---- Allowances: spent comes from transactions tagged with who. ----
export function allowanceSpent(state, key, whoId) {
  let spent = 0;
  for (const t of monthTransactions(state, key)) {
    if (t.kind === 'expense' && t.who === whoId) spent += t.amount;
  }
  return spent;
}

// ---- Bill calendar: the month as a grid, one chip per bill on its due day. ----
// A chip is a real button — pressing it marks that bill paid (or undoes it),
// so the calendar is a working view of the month, not a picture of one.
export function billCalendar(state, key) {
  const [y, m] = key.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const bills = billsForMonth(state, key);
  const byDay = {};
  for (const b of bills) (byDay[b.day] = byDay[b.day] || []).push(b);
  let cells = '';
  for (let i = 0; i < firstWeekday; i++) cells += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const list = byDay[d] || [];
    const chips = list.map((b) => {
      const cls = b.paid ? 'paid' : b.overdue ? 'over' : 'due';
      const mark = b.paid ? ' ✓' : '';
      return '<button class="cal-chip ' + cls + '" data-bill-paid="' + b.id + '" title="' + esc(b.name) + ' — ' + money(b.amount) + (b.paid ? ' (paid, press to undo)' : ' (press to mark paid)') + '">' + esc(b.name.length > 22 ? b.name.slice(0, 21) + '…' : b.name) + ' · ' + money0(b.amount) + mark + '</button>';
    }).join('');
    cells += '<div class="cal-cell' + (list.length ? ' has-bills' : '') + '"><span class="cal-day">' + d + '</span>' + chips + '</div>';
  }
  const weekHeads = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => '<div class="cal-head">' + w + '</div>').join('');
  return '<div class="card" style="margin-top:16px"><h2>Bill calendar — ' + monthLabel(key) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Every bill on the day it falls due. Green is paid, gold is still to pay, red is overdue. Press any chip to mark that bill paid — or undo it.</p>'
    + '<div class="cal-grid">' + weekHeads + cells + '</div>'
    + '<p class="muted small">Bills due after today still show as “due in Nd” in the table below; the calendar is the quickest way to see which week of the month carries the most money.</p></div>';
}

// ---- Year at a glance (v10): twelve months of bills in one grid. ----
// Each cell is a real button: press it and the month switcher jumps
// to that month. Months before the first month any bill records a
// payment for are honest about it — "not tracked" — instead of
// pretending those bills were missed, and a future month reads
// "not yet due". Paid months show what was paid against what was due.
export function billYearGrid(state, key) {
  const year = key.slice(0, 4);
  const curMonth = Number(key.slice(5, 7));
  // The first month any bill records a payment for is where the
  // household's bill records start; earlier months were never tracked.
  let firstTracked = null;
  for (const b of state.bills || []) {
    for (const m of b.paidMonths || []) {
      if (!firstTracked || m < firstTracked) firstTracked = m;
    }
  }
  let yearDue = 0, yearPaid = 0, trackedMonths = 0, cleanMonths = 0;
  const cells = [];
  for (let m = 1; m <= 12; m++) {
    const k = year + '-' + String(m).padStart(2, '0');
    const monthName = monthLabel(k).split(' ')[0];
    const due = (state.bills || []).reduce((a, b) => a + b.amount, 0);
    const paidBills = (state.bills || []).filter((b) => (b.paidMonths || []).includes(k));
    const paid = paidBills.reduce((a, b) => a + b.amount, 0);
    const unpaid = (state.bills || []).length - paidBills.length;
    let cls, line;
    if (m > curMonth) {
      cls = 'flat';
      line = 'Not yet due · ' + money(due) + ' due';
    } else if (firstTracked && k < firstTracked) {
      cls = 'flat';
      line = 'Not tracked — records start ' + monthLabel(firstTracked);
    } else {
      trackedMonths++;
      yearDue += due;
      yearPaid += paid;
      if (unpaid === 0) { cls = 'ok'; cleanMonths++; line = 'All ' + (state.bills || []).length + ' paid ✓ · ' + money(paid); }
      else { cls = 'warn'; line = unpaid + ' unpaid · ' + money(due - paid) + ' still to pay'; }
    }
    cells.push('<button class="year-cell ' + cls + (k === key ? ' current' : '') + '" data-bill-goto-month="' + k + '" title="Open ' + monthName + ' ' + year + '"><b>' + monthName + '</b><span class="muted">' + line + '</span></button>');
  }
  return '<div class="card" style="margin-top:16px"><h2>The whole year of bills — ' + year + '</h2>'
    + '<p class="muted small" style="margin-top:0">Twelve months, one press each: green is every bill paid, gold still has money to pay, grey is not tracked yet (or not due). Press any month to open it.</p>'
    + '<div class="year-grid">' + cells.join('') + '</div>'
    + '<p class="muted small">Across the ' + trackedMonths + ' tracked months so far: ' + money(yearDue) + ' due, ' + money(yearPaid) + ' paid, ' + cleanMonths + ' month' + (cleanMonths === 1 ? '' : 's') + ' with every bill paid. ' + (cleanMonths === trackedMonths && trackedMonths > 0 ? 'Not one bill has been missed since the records began.' : 'The months in gold are the ones to finish first — oldest first, so nothing goes overdue twice.') + '</p></div>';
}

export function renderBills(state, root) {
  const key = state.currentMonth;
  const totals = billsTotals(state, key);
  const bills = billsForMonth(state, key);
  const rules = (state.recurring || []).slice().sort((a, b) => a.day - b.day);
  const dueCount = rules.filter((r) => r.active && !rulePostedIn(r, key)).length;

  const billRows = bills.map((b) => {
    const cat = categoryById(b.category);
    const status = b.paid
      ? '<span class="pill">Paid ✓</span>'
      : b.overdue
        ? '<span class="pill over">Overdue ' + (0 - b.dueIn) + 'd</span>'
        : b.dueIn === 0
          ? '<span class="pill warn">Due today</span>'
          : b.dueIn > 0
            ? '<span class="pill warn">Due in ' + b.dueIn + 'd</span>'
            : '<span class="pill warn">Due ' + daySuffix(b.day) + '</span>';
    return '<tr><td><b>' + esc(b.name) + '</b><span class="muted small" style="display:block">' + esc(cat.label) + '</span></td>'
      + '<td class="num">' + daySuffix(b.day) + ' ' + monthLabel(key).split(' ')[0] + '</td>'
      + '<td class="amount"><b>' + money(b.amount) + '</b></td>'
      + '<td>' + status + '</td>'
      + '<td><button class="icon-btn" data-bill-paid="' + b.id + '">' + (b.paid ? 'Undo' : 'Mark paid') + '</button> '
      + '<button class="icon-btn" data-bill-edit="' + b.id + '">Edit</button> '
      + '<button class="icon-btn" data-bill-del="' + b.id + '">Delete</button></td></tr>';
  }).join('');

  const ruleRows = rules.map((r) => {
    const cat = categoryById(r.category);
    const posted = rulePostedIn(r, key);
    return '<li><span class="tx-ico" style="background:' + cat.color + '22;color:' + cat.color + '">' + cat.icon + '</span>'
      + '<span class="tx-main"><b>' + esc(r.name) + '</b><span>' + (r.kind === 'income' ? 'Income' : 'Expense') + ' · ' + esc(cat.label) + ' · every month, day ' + r.day + ' · ' + (r.active ? 'active' : 'paused') + '</span></span>'
      + '<span class="tx-amt ' + (r.kind === 'income' ? 'in' : 'out') + '">' + (r.kind === 'income' ? '+' : '−') + money(r.amount) + '</span>'
      + '<span class="rule-actions"><button class="icon-btn" data-rule-post="' + r.id + '"' + (posted || !r.active ? ' disabled' : '') + '>' + (posted ? 'Posted ✓' : 'Post now') + '</button> '
      + '<button class="icon-btn" data-rule-toggle="' + r.id + '">' + (r.active ? 'Pause' : 'Resume') + '</button> '
      + '<button class="icon-btn" data-rule-edit="' + r.id + '">Edit</button> '
      + '<button class="icon-btn" data-rule-del="' + r.id + '">Delete</button></span></li>';
  }).join('');

  const allowanceRows = (state.allowances || []).map((a) => {
    const spent = allowanceSpent(state, key, a.id);
    const left = Math.max(0, a.monthly - spent);
    const pct = a.monthly ? Math.min(100, (spent / a.monthly) * 100) : 0;
    return '<div class="bar-row"><div class="bar-top"><span><b>' + esc(a.who) + '</b> <span class="muted">· ' + esc(a.role) + '</span></span>'
      + '<span class="budget-edit">$<input type="number" min="0" step="5" value="' + a.monthly + '" data-allowance="' + a.id + '" aria-label="Monthly allowance for ' + esc(a.who) + '"> / mo · spent ' + money(spent) + ' · ' + money(left) + ' left</span></div>'
      + '<div class="bar"><i class="' + (pct > 100 ? 'over' : pct > 85 ? 'amber' : '') + '" style="width:' + pct.toFixed(1) + '%"></i></div></div>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Bills &amp; recurring</h1><p class="muted">Every regular bill for ' + monthLabel(key) + ', with its due date — plus the rules that post themselves so nothing is forgotten.</p></div>'
    + '<div><button class="btn primary" id="btn-add-bill">+ Add bill</button> <button class="btn ghost" id="btn-add-rule">+ Add recurring rule</button></div></div>'
    + '<div class="grid kpis" style="margin-bottom:16px">'
    + '<div class="card kpi"><div class="kpi-label">Due this month</div><div class="kpi-value num">' + money(totals.due) + '</div><div class="kpi-sub">' + totals.count + ' bills</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Already paid</div><div class="kpi-value num">' + money(totals.paid) + '</div><div class="kpi-sub">' + totals.paidCount + ' of ' + totals.count + ' bills</div></div>'
    + '<div class="card kpi ' + (totals.unpaid > 0 ? 'warn' : '') + '"><div class="kpi-label">Still to pay</div><div class="kpi-value num">' + money(totals.unpaid) + '</div><div class="kpi-sub">' + (totals.next ? 'Next: ' + esc(totals.next.name) + ' — ' + money(totals.next.amount) + ' on day ' + totals.next.day : 'Nothing left this month') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Recurring not yet posted</div><div class="kpi-value num">' + dueCount + '</div><div class="kpi-sub">' + (dueCount ? 'Press “Post all due” below to write them into Transactions.' : 'Everything due is already in Transactions.') + '</div></div>'
    + '</div>'
    + billCalendar(state, key)
    + billYearGrid(state, key)
    + '<div class="card" style="margin-top:16px"><h2>Bills due in ' + monthLabel(key) + '</h2>'
    + (bills.length ? '<table><thead><tr><th>Bill</th><th>Due</th><th class="amount">Amount</th><th>Status</th><th></th></tr></thead><tbody>' + billRows + '</tbody></table>'
      : '<p class="empty">No bills yet — add the first one above.</p>')
    + '<p class="muted small">Tip: pay the big fixed bills (rent, insurance) the day payday lands, and keep the due dates spread across the month so one week never carries everything.</p></div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Recurring rules</h2><p class="muted small">A rule posts one real transaction into the current month — once per month, never twice. Pause a rule instead of deleting it when a subscription is on hold.</p>'
    + '<ul class="tx-list">' + (ruleRows || '<li class="empty">No recurring rules yet.</li>') + '</ul>'
    + '<p style="margin-top:12px"><button class="btn" id="btn-post-due">Post all due now</button></p></div>'
    + '<div class="card"><h2>Pocket money &amp; allowances <a href="#/members">Everyone’s page →</a></h2><p class="muted small">Each person gets a monthly amount to spend freely — no questions asked, no category to justify. Spent is counted from transactions tagged with that person.</p>'
    + allowanceRows
    + '<p class="muted small">Amounts save as you type. Kids learn the limit by seeing what is left; parents keep their own fun money separate from the household plan.</p></div></div>';
}
