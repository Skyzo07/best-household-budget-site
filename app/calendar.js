// Hearth & Home Budget — money calendar: the whole month on one
// page, every money event plotted on the day it lands. Payday from
// the recurring income rules, bill due days from the Bills page
// (paid or still to pay, exactly as that page records them),
// auto-save runs from the Auto-save rules, the month's debt payment
// from the Debt-free calendar's own schedule, the big purchases'
// monthly set-asides from the Big purchases plan, subscription
// renewals, the money meeting, and the household's no-spend days.
// Press any day to see everything on it, with the buttons that do
// the work — mark a bill paid, run an auto-save rule — right there.
// Weekly totals underneath show which week of the month carries the
// most money. Every figure is computed live from state; nothing is
// typed in by hand, so an edited bill, rule or transaction moves the
// calendar at once. Lazy-loaded: it only loads when the Money
// calendar nav link is opened, so it never touches the first load.
import { money, money0, monthLabel, shiftMonth, todayISO, monthTransactions, meetingForMonth, meetingStore, autosaveStore, subscriptionStore, subMonthly } from './data.js';
import { buildSchedule, debtfreeStore } from './debtfree.js';
import { bigbuyPlan } from './bigbuys.js';
import { ruleAmount, destName } from './autosave.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function clampDay(key, day) {
  return Math.min(Math.max(1, Number(day) || 1), daysInMonth(key));
}

const round2 = (n) => Math.round(n * 100) / 100;

// Which day the page has open underneath the grid, and which kind of
// event the grid is filtered to. Module state only — it never touches
// the saved data, so it cannot disagree with it.
let calDay = '';
let calFilter = 'all';
export function setCalDay(iso) { calDay = iso || ''; }
export function setCalFilter(kind) { calFilter = kind || 'all'; }
export function calOpenDay() { return calDay; }

// Every money event in a month, each on the day it lands. Amounts are
// signed the way a bank statement reads them: money in is positive,
// money out is negative, a no-spend day carries no amount at all.
// `action` names the working button the day detail shows for the
// event: a bill can be marked paid, an auto-save rule can run now.
export function calendarEvents(state, key) {
  const last = daysInMonth(key);
  const events = [];
  const add = (day, kind, label, amount, note, href, action) => {
    const d = clampDay(key, day);
    events.push({ date: key + '-' + String(d).padStart(2, '0'), day: d, kind, label, amount: amount === null ? null : round2(amount), note: note || '', href: href || '', action: action || '' });
  };
  // Payday — the active income rules, on the day they land.
  for (const r of (state.recurring || [])) {
    if (!r.active || r.kind !== 'income') continue;
    add(r.day, 'income', r.name, Number(r.amount) || 0, 'Payday — lands in the account', '#/bills');
  }
  // Bills — on their due day, paid or still to pay as the Bills page
  // records them. A bill still unpaid after its day has passed is
  // overdue, and the detail says so.
  const today = todayISO();
  for (const b of (state.bills || [])) {
    const paid = (b.paidMonths || []).includes(key);
    const date = key + '-' + String(clampDay(key, b.day)).padStart(2, '0');
    add(b.day, 'bill', b.name, -Math.abs(Number(b.amount) || 0),
      paid ? 'Paid ✓' + (b.autoPay ? ' · auto-pay' : ' · paid by hand') : (date < today ? 'Overdue — due ' + fmtDate(date) : 'Due ' + fmtDate(date) + (b.autoPay ? ' · auto-pay' : ' · pay by hand')),
      '#/bills', 'bill:' + b.id);
  }
  // Auto-save — fixed rules on their day, round-ups on the last day.
  // A round-up rule's amount is whatever this month's spending has
  // rounded up to so far, so it grows as the month is spent.
  for (const r of autosaveStore(state)) {
    if (!r.active) continue;
    const day = (r.kind === 'roundup' || Number(r.day) === 0) ? last : Number(r.day) || 1;
    const amt = ruleAmount(state, r, key);
    add(day, 'save', r.name, -Math.abs(amt),
      'Auto-save → ' + destName(state, r) + (r.kind === 'roundup' ? (amt > 0 ? ' · round-ups so far' : ' · nothing to sweep yet — no spending this month') : ''),
      '#/autosave', 'as:' + r.id);
  }
  // Debt — the month's payment from the Debt-free calendar's own
  // schedule (minimums plus the shared extra, plus a one-off if one
  // is booked for this month). Debts have no single due day in the
  // household's records, so the payment is shown on the 1st — the
  // total is exact, the day is the convention, and the page says so.
  const extra = Number(state.payoffExtra) || 0;
  const method = state.payoffMethod === 'snowball' ? 'snowball' : 'avalanche';
  const oneOff = Number(debtfreeStore(state).oneOff) || 0;
  const sched = buildSchedule(state.debts, extra, oneOff, method, shiftMonth(key, -1));
  if (sched.rows.length && sched.rows[0].paid > 0) {
    add(1, 'debt', 'Debt payments', -sched.rows[0].paid,
      'Minimums ' + money(sched.monthlyMin) + ' + extra ' + money(extra) + (oneOff > 0 && sched.rows[0].key === key ? ' + one-off ' + money(oneOff) : '') + ' · ' + money(sched.rows[0].interest) + ' of it interest, ' + money(sched.rows[0].balance) + ' still owed after',
      '#/debtfree');
  }
  // Big purchases — each purchase's monthly set-aside from the plan,
  // on the 1st, so the month starts by funding what is coming.
  const plan = bigbuyPlan(state);
  for (const row of plan.rows) {
    if (row.needed > 0) {
      add(1, 'save', 'Set aside — ' + row.b.name, -row.needed,
        money(row.needed) + ' a month · ' + money(row.remaining) + ' still to save, ready ' + (row.readyKey ? monthLabel(row.readyKey) : '—'),
        '#/bigbuys');
    }
  }
  // Subscriptions — a monthly one renews on the day of the month it
  // was last used; a yearly one on its anniversary. The household's
  // records hold no other renewal date, so the last-used date is the
  // honest source — change it on the Subscriptions page and the
  // renewal moves with it.
  for (const s of subscriptionStore(state)) {
    if (s.status !== 'active') continue;
    const [ly, lm, ld] = String(s.lastUsed || '').split('-').map(Number);
    if (!ly || !lm || !ld) continue;
    if (s.billed === 'yearly') {
      if (lm === Number(key.slice(5, 7))) add(ld, 'sub', s.name + ' renews', -subYearly(s), 'Yearly renewal · ' + money(subYearly(s)) + ' a year', '#/subscriptions');
    } else {
      add(ld, 'sub', s.name + ' renews', -subMonthly(s), 'Monthly renewal · ' + money(subMonthly(s)) + ' a month', '#/subscriptions');
    }
  }
  // Money meeting — the next date the household set, wherever it was
  // written: a meeting's next date lives on the month that set it, so
  // December's meeting (6 December) is found in November's record.
  // A meeting held in this month is read from this month's own record.
  let meetDate = '';
  for (const k2 of Object.keys(meetingStore(state))) {
    const rec = meetingStore(state)[k2];
    if (rec && typeof rec.nextDate === 'string' && rec.nextDate.slice(0, 7) === key) meetDate = rec.nextDate;
  }
  const ownMeeting = meetingForMonth(state, key);
  const meetDone = ownMeeting.doneOn && ownMeeting.doneOn.slice(0, 7) === key ? ownMeeting.doneOn : '';
  if (meetDate) {
    add(Number(meetDate.slice(8, 10)), 'meeting', 'Money meeting', null, 'The household’s monthly money meeting' + (meetDone ? ' · held ' + fmtDate(meetDone) : ' · not held yet'), '#/meeting');
  }
  // No-spend days — the household's own marks, carried over from the
  // Savings page.
  const noSpend = (state.challenges && state.challenges.noSpend && state.challenges.noSpend[key]) || [];
  for (const d of noSpend) {
    add(d, 'nospend', 'No-spend day ✓', null, 'A day with no spending at all — the streak counts it', '#/savings');
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || (b.amount ?? 0) - (a.amount ?? 0));
  return events;
}

function subYearly(s) {
  if (s.billed === 'yearly' && Number(s.yearly) > 0) return Math.round((s.downgraded ? s.yearly / 2 : s.yearly) * 100) / 100;
  return Math.round(subMonthly(s) * 12 * 100) / 100;
}

// Planned money in and out for a list of events (no-spend days and
// the meeting carry no amount and never count).
function eventTotals(events) {
  let inflow = 0, outflow = 0;
  for (const ev of events) {
    if (ev.amount === null) continue;
    if (ev.amount > 0) inflow += ev.amount; else outflow += -ev.amount;
  }
  return { inflow: round2(inflow), outflow: round2(outflow) };
}

// What the household actually spent, day by day, from Transactions —
// the grid's small "spent" line under each day, so the plan and the
// reality sit on the same square.
function daySpent(state, key) {
  const out = {};
  for (const t of monthTransactions(state, key)) {
    if (t.kind !== 'expense') continue;
    const d = Number(t.date.slice(8, 10));
    out[d] = round2((out[d] || 0) + t.amount);
  }
  return out;
}

const KIND_LABEL = { income: 'Money in', bill: 'Bills', save: 'Saving', debt: 'Debt', sub: 'Subscriptions', meeting: 'Meeting', nospend: 'No-spend' };

function chipClass(kind) {
  return 'mcal-chip ' + (kind === 'income' ? 'in' : kind === 'bill' ? 'bill' : kind === 'save' ? 'save' : kind === 'debt' ? 'debt' : kind === 'sub' ? 'sub' : kind === 'meeting' ? 'meet' : 'nospend');
}

export function renderCalendar(state, root) {
  const key = state.currentMonth;
  const events = calendarEvents(state, key);
  const totals = eventTotals(events);
  const spent = daySpent(state, key);
  const [y, m] = key.split('-').map(Number);
  const last = daysInMonth(key);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const today = todayISO();
  // The open day: today when it falls in this month, else the first
  // day with an event, else the 1st. A stored day from another month
  // resets the same way.
  let open = calDay;
  if (!open || !open.startsWith(key)) {
    open = today.startsWith(key) ? today : ((events[0] || {}).date || key + '-01');
    calDay = open;
  }
  const openDay = Number(open.slice(8, 10));
  const shown = calFilter === 'all' ? events : events.filter((e) => e.kind === calFilter);
  const byDay = {};
  for (const e of shown) (byDay[e.day] = byDay[e.day] || []).push(e);
  // Busiest day: the day with the most planned money going out.
  let busiest = null, busiestOut = 0;
  for (let d = 1; d <= last; d++) {
    const out = (events.filter((e) => e.day === d && e.amount !== null && e.amount < 0).reduce((a, e) => a + -e.amount, 0));
    if (out > busiestOut) { busiestOut = round2(out); busiest = d; }
  }
  const unpaidBills = (state.bills || []).filter((b) => !(b.paidMonths || []).includes(key));
  const unpaidTotal = round2(unpaidBills.reduce((a, b) => a + (Number(b.amount) || 0), 0));
  // Weekly totals: each Sunday-to-Saturday row of the grid, money in
  // against money out, from the events — not from Transactions, so a
  // week with nothing booked yet reads $0 honestly.
  const weeks = [];
  for (let d = 1; d <= last; d++) {
    const wi = Math.floor((firstWeekday + d - 1) / 7);
    if (!weeks[wi]) weeks[wi] = { start: null, inflow: 0, outflow: 0 };
    const w = weeks[wi];
    if (w.start === null) {
      const sunday = new Date(y, m - 1, d - ((firstWeekday + d - 1) % 7));
      w.start = sunday.getFullYear() + '-' + String(sunday.getMonth() + 1).padStart(2, '0') + '-' + String(sunday.getDate()).padStart(2, '0');
    }
    for (const e of events) {
      if (e.day !== d || e.amount === null) continue;
      if (e.amount > 0) w.inflow = round2(w.inflow + e.amount); else w.outflow = round2(w.outflow + -e.amount);
    }
  }

  let cells = '';
  for (let i = 0; i < firstWeekday; i++) cells += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= last; d++) {
    const list = byDay[d] || [];
    const iso = key + '-' + String(d).padStart(2, '0');
    const chips = list.slice(0, 3).map((e) => '<span class="' + chipClass(e.kind) + '">' + esc(e.label.length > 24 ? e.label.slice(0, 23) + '…' : e.label) + (e.amount === null ? '' : ' · ' + money0(Math.abs(e.amount))) + '</span>').join('');
    const more = list.length > 3 ? '<span class="mcal-more">+' + (list.length - 3) + ' more</span>' : '';
    const spentLine = spent[d] ? '<span class="mcal-spent">spent ' + money0(spent[d]) + '</span>' : '';
    cells += '<div class="cal-cell money-cell' + (iso === today ? ' today' : '') + (d === openDay ? ' selected' : '') + (list.length ? ' has-events' : '') + '" data-cal-day="' + iso + '" role="button" tabindex="0" title="Press to see ' + fmtDate(iso) + '"><span class="cal-day">' + d + '</span>' + chips + more + spentLine + '</div>';
  }
  const weekHeads = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => '<div class="cal-head">' + w + '</div>').join('');
  const filterBtns = ['all', 'income', 'bill', 'save', 'debt', 'sub', 'meeting'].map((k) => '<button class="btn small' + (calFilter === k ? ' primary' : ' ghost') + '" data-cal-filter="' + k + '"' + (calFilter === k ? ' aria-pressed="true"' : '') + '>' + (k === 'all' ? 'Everything' : KIND_LABEL[k]) + '</button>').join(' ');
  // The open day's detail: every event with its note, the working
  // button where one exists, and what the household actually spent
  // that day, transaction by transaction.
  const dayEvents = events.filter((e) => e.day === openDay);
  const dayTx = monthTransactions(state, key).filter((t) => Number(t.date.slice(8, 10)) === openDay)
    .sort((a, b) => a.date.localeCompare(b.date));
  const dayIn = round2(dayEvents.filter((e) => e.amount !== null && e.amount > 0).reduce((a, e) => a + e.amount, 0));
  const dayOut = round2(dayEvents.filter((e) => e.amount !== null && e.amount < 0).reduce((a, e) => a + -e.amount, 0));
  const daySpentTotal = round2(dayTx.filter((t) => t.kind === 'expense').reduce((a, t) => a + t.amount, 0));
  const detailRows = dayEvents.length ? dayEvents.map((e) => {
    const paidBill = e.action && e.action.startsWith('bill:') ? (state.bills || []).find((b) => b.id === e.action.slice(5)) : null;
    const btn = paidBill
      ? ((paidBill.paidMonths || []).includes(key)
        ? '<button class="btn small" data-bill-paid="' + paidBill.id + '">Paid ✓ — press to undo</button>'
        : '<button class="btn small primary" data-bill-paid="' + paidBill.id + '">Mark paid</button>')
      : (e.action && e.action.startsWith('as:')
        ? '<button class="btn small" data-as-run="' + e.action.slice(3) + '">Run now</button>'
        : (e.href ? '<a class="btn small ghost" href="' + e.href + '">Open →</a>' : ''));
    return '<tr><td><span class="' + chipClass(e.kind) + '">' + esc(KIND_LABEL[e.kind]) + '</span></td><td><b>' + esc(e.label) + '</b><span class="muted small" style="display:block">' + esc(e.note) + '</span></td>'
      + '<td class="amount">' + (e.amount === null ? '—' : '<span class="' + (e.amount > 0 ? 'pos' : 'neg') + '">' + (e.amount > 0 ? '+' : '−') + money(Math.abs(e.amount)) + '</span>') + '</td><td>' + btn + '</td></tr>';
  }).join('') : '<tr><td colspan="4" class="muted">Nothing is booked for this day — no payday, no bill, no saving run. The quietest kind of day.</td></tr>';
  const txRows = dayTx.length ? dayTx.map((t) => '<tr><td><b>' + esc(t.description) + '</b>' + (t.note ? '<span class="muted small" style="display:block">' + esc(t.note) + '</span>' : '') + '</td><td class="amount"><span class="' + (t.kind === 'income' ? 'pos' : 'neg') + '">' + (t.kind === 'income' ? '+' : '−') + money(t.amount) + '</span></td></tr>').join('')
    : '<tr><td colspan="2" class="muted">No transactions recorded on this day yet.</td></tr>';

  root.innerHTML =
    '<div class="page-head"><div><h1>Money calendar</h1><p class="muted">' + esc(monthLabel(key)) + ' on one page — every payday, bill, saving run, debt payment, set-aside, renewal and meeting, on the day it lands. Press any day to open it; the totals below are the month’s plan, worked out from the household’s own records.</p></div>'
    + '<div><button class="btn ghost" data-cal-prev>‹ Prev month</button> <button class="btn ghost" data-cal-next>Next month ›</button> <button class="btn plain" data-cal-today>This month</button></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Money in — planned</div><div class="kpi-value num">' + money(totals.inflow) + '</div><div class="kpi-sub">' + events.filter((e) => e.kind === 'income').length + ' paydays this month</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Money out — planned</div><div class="kpi-value num">' + money(totals.outflow) + '</div><div class="kpi-sub">Bills, debt, saving runs, set-asides and renewals together</div></div>'
    + '<div class="card kpi ' + (unpaidBills.length ? 'warn' : 'good') + '"><div class="kpi-label">Bills still to pay</div><div class="kpi-value num">' + money(unpaidTotal) + '</div><div class="kpi-sub">' + unpaidBills.length + ' of ' + (state.bills || []).length + ' bills unpaid in ' + esc(monthLabel(key).split(' ')[0]) + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Busiest day</div><div class="kpi-value num">' + (busiest ? fmtDate(key + '-' + String(busiest).padStart(2, '0')) : '—') + '</div><div class="kpi-sub">' + (busiest ? money(busiestOut) + ' of planned money out on that one day' : 'Nothing is booked this month') + '</div></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>' + esc(monthLabel(key)) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Green is money in, gold is a bill, blue is money moved to saving, red is the debt payment, purple is a subscription renewing, teal is the meeting, grey is a no-spend day. The small “spent” line under a day is what the household actually spent that day, from Transactions — plan and reality on the same square. Press a day to open it below.</p>'
    + '<p class="chip-row">' + filterBtns + '</p>'
    + '<div class="cal-grid money-cal">' + weekHeads + cells + '</div>'
    + '<p class="muted small">Two honest conventions, so nothing here pretends to know more than it does: debts have no single due day in the household’s records, so the month’s debt payment is shown on the 1st (the total is exact); a subscription’s renewal day is the day of the month it was last used (change the last-used date on Subscriptions and the renewal moves).</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>' + esc(fmtDate(open) + ' — ' + monthLabel(key)) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Planned in ' + money(dayIn) + ' · planned out ' + money(dayOut) + ' · actually spent ' + money(daySpentTotal) + '.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Kind</th><th>What</th><th class="amount">Amount</th><th></th></tr></thead><tbody>' + detailRows + '</tbody></table></div>'
    + '<h3 style="margin-top:16px">Transactions on this day</h3>'
    + '<div class="table-scroll"><table><tbody>' + txRows + '</tbody></table></div>'
    + '<p style="margin:12px 0 0"><button class="btn small" data-cal-add-tx>+ Add transaction on this day</button> <span class="muted small">It opens already dated to this day.</span></p></div>'
    + '<div class="card" style="margin-top:16px"><h2>Which week carries the money</h2>'
    + '<p class="muted small" style="margin-top:0">Planned money in against planned money out, week by week — the 1st lands heaviest, because payday, the rent, the debt payment, the auto-save runs and the set-asides all fall on it.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Week starting</th><th class="amount">Money in</th><th class="amount">Money out</th><th class="amount">Net</th></tr></thead><tbody>'
    + weeks.map((w) => '<tr><td><b>' + esc(fmtDate(w.start)) + '</b></td><td class="amount"><span class="pos">+' + money(w.inflow) + '</span></td><td class="amount"><span class="neg">−' + money(w.outflow) + '</span></td><td class="amount"><b class="' + (w.inflow - w.outflow >= 0 ? 'pos' : 'neg') + '">' + money(w.inflow - w.outflow) + '</b></td></tr>').join('')
    + '</tbody></table></div>'
    + '<p class="muted small">Month total: ' + money(totals.inflow) + ' in, ' + money(totals.outflow) + ' out, ' + money(round2(totals.inflow - totals.outflow)) + ' left over on the plan. The real month-end will differ — the “spent” lines on the grid are the running truth.</p></div>';
}
