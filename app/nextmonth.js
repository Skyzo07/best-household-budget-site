// Hearth & Home Budget — next month: a plan for the month after this
// one, built from this month's own figures. Nothing here is typed in
// by hand: the suggested budgets come from what each category actually
// spent against its budget, the envelope fills are those suggested
// budgets plus whatever rolled over unspent, the bills are the ones
// that come due every month, the big purchases are the ones with a
// target date coming up, and the auto-save runs are the rules' own
// next-run dates. "Adopt this plan" writes the suggested budgets and
// envelope fills into the real data — Budgets and Envelopes already
// show them afterwards — and Undo puts the old budgets and fills back.
// Lazy-loaded: it only loads when the Next month nav link is opened,
// so it never touches the first load.
import { CATEGORIES, categorySpend, envelopeRollover, ENVELOPE_DEFS, envelopeFill, meetingForMonth, money, money0, monthLabel, monthTotals, nextmonthStore, shiftMonth, autosaveStore } from './data.js';
import { nextRunISO, destName, ruleAmount } from './autosave.js';
import { bigbuyPlan } from './bigbuys.js';
import { weekRun } from './streaks.js';
import { setEnvFill } from './envelopes.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/</g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDay(day, nextKey) {
  const [y, m] = nextKey.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// The first Sunday of a month — the money meeting's standing date.
export function firstSundayOfMonth(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Round a figure up to the next whole ten dollars — budgets are
// round numbers, spending is not, so a suggestion never lands a
// dollar short of what the household actually spent.
function round10Up(v) {
  return Math.ceil(Math.max(0, v) / 10) * 10;
}

// One category's suggested budget for next month, from this month's
// own figures: spent more than the budget → cover what was actually
// spent; spent well under (more than $20 of slack) → trim the budget
// to what was actually spent; close to the budget → keep it, because
// a budget that already fits is not a problem to fix.
export function suggestBudget(spent, budget) {
  if (spent > budget) return round10Up(spent);
  if (spent < budget - 20) return round10Up(spent);
  return budget;
}

// The whole plan, computed live from the household's own records.
// `key` is the month the plan is built from (the month on screen);
// `nextKey` is the month the plan is for.
export function nextmonthPlan(state) {
  const key = state.currentMonth;
  const nextKey = shiftMonth(key, 1);
  const spend = categorySpend(state, key);
  const incomeRules = (state.recurring || []).filter((r) => r.kind === 'income' && r.active);
  const income = Math.round(incomeRules.reduce((a, r) => a + (Number(r.amount) || 0), 0) * 100) / 100;
  const oldTotal = Math.round(CATEGORIES.filter((c) => c.budget > 0).reduce((a, c) => a + (Number(state.budgets[c.id]) || 0), 0) * 100) / 100;

  const budgetRows = CATEGORIES.filter((c) => c.budget > 0).map((c) => {
    const spent = Math.round((spend[c.id] || 0) * 100) / 100;
    const budget = Number(state.budgets[c.id]) || 0;
    const suggested = suggestBudget(spent, budget);
    const slack = Math.round((budget - spent) * 100) / 100;
    let why = '';
    if (spent > budget) why = 'Ran ' + money(spent - budget) + ' over — the budget never covered it, so the plan covers what was actually spent.';
    else if (spent < budget - 20) why = money(slack) + ' never got spent — trim the budget to what the month actually used and the money is free for goals instead.';
    else if (slack >= 0 && slack < 1) why = 'Only ' + money(slack) + ' of slack — tight, but it held. Keep it and plan the shop from the pantry first.';
    else why = 'Close to the budget — ' + money(slack) + ' of slack. Keep it as it is.';
    return { id: c.id, label: c.label, icon: c.icon, color: c.color, spent, budget, suggested, why };
  });
  const newTotal = Math.round(budgetRows.reduce((a, r) => a + r.suggested, 0) * 100) / 100;
  const freed = Math.round((oldTotal - newTotal) * 100) / 100;

  // Envelope fills for next month: each envelope's suggested budgets
  // plus whatever rolled over unspent from this month. The rollover
  // is measured against this month's budget, so a good month is
  // rewarded once and the reward never compounds.
  const envRows = ENVELOPE_DEFS.map((env) => {
    const roll = envelopeRollover(state, nextKey, env);
    const suggested = Math.round((env.cats.reduce((a, id) => {
      const row = budgetRows.find((r) => r.id === id);
      return a + (row ? row.suggested : Number(state.budgets[id]) || 0);
    }, 0) + roll) * 100) / 100;
    const current = envelopeFill(state, nextKey, env);
    const spent = Math.round(env.cats.reduce((a, id) => a + (spend[id] || 0), 0) * 100) / 100;
    return { id: env.id, label: env.label, icon: env.icon, color: env.color, roll, suggested, current, spent };
  });
  const envTotal = Math.round(envRows.reduce((a, r) => a + r.suggested, 0) * 100) / 100;

  // Bills due next month: every bill comes due once a month, so the
  // list is the household's own bills with their due days.
  const bills = (state.bills || []).slice().sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0));
  const billsTotal = Math.round(bills.reduce((a, b) => a + (Number(b.amount) || 0), 0) * 100) / 100;
  const autoTotal = Math.round(bills.filter((b) => b.autoPay).reduce((a, b) => a + (Number(b.amount) || 0), 0) * 100) / 100;
  const handTotal = Math.round((billsTotal - autoTotal) * 100) / 100;

  // Big purchases coming up: the set-aside plan, earliest target
  // first, with how much each one still needs a month.
  const plan = bigbuyPlan(state);
  const buyRows = plan.rows.map((r) => ({
    name: r.b.name, cost: r.b.cost, saved: r.saved, remaining: r.remaining,
    needed: r.needed, readyKey: r.readyKey, target: r.b.target,
    monthsAway: Math.max(1, r.monthsLeft - 1),
  }));

  // Auto-save runs scheduled inside next month: each active rule's
  // next run, if it falls in the month the plan is for.
  const runs = autosaveStore(state).filter((r) => r.active).map((r) => {
    const date = nextRunISO(state, r);
    return { rule: r, date, inMonth: date.slice(0, 7) === nextKey };
  }).filter((x) => x.inMonth);
  const fixedRuns = runs.filter((x) => x.rule.kind === 'fixed');
  const fixedTotal = Math.round(fixedRuns.reduce((a, x) => a + (Number(x.rule.amount) || 0), 0) * 100) / 100;
  // The round-up rule runs on the last day of every month, so its
  // December run is the last day of December — its amount follows
  // December's card spending, and this month's round-ups so far are
  // the honest preview of what a month like it moves.
  const roundupRule = autosaveStore(state).find((r) => r.active && r.kind === 'roundup') || null;
  const [ny, nm] = nextKey.split('-').map(Number);
  const lastDayNext = new Date(ny, nm, 0).getDate();
  const roundupRun = roundupRule
    ? { rule: roundupRule, date: nextKey + '-' + String(lastDayNext).padStart(2, '0'), thisMonth: Math.round(ruleAmount(state, roundupRule, key) * 100) / 100 }
    : null;

  const wk = weekRun(state);
  const meeting = meetingForMonth(state, nextKey);
  const meetingDate = meeting.nextDate || firstSundayOfMonth(nextKey);

  // The year so far: what the household actually saved from January
  // to this month, and the emergency fund's own figures — both read
  // live, so the "what this plan does to the year" line never goes
  // stale when a figure changes.
  const year = key.slice(0, 4);
  const curMonth = Number(key.slice(5, 7));
  let yearSaved = 0;
  for (let m = 1; m <= curMonth; m++) {
    yearSaved += monthTotals(state, year + '-' + String(m).padStart(2, '0')).saved;
  }
  yearSaved = Math.round(yearSaved * 100) / 100;
  const emergency = (state.goals || []).find((g) => /emergency/i.test(g.name)) || null;
  const emergencyRule = autosaveStore(state).find((r) => r.active && r.kind === 'fixed' && r.destKind === 'goal' && emergency && r.destId === emergency.id) || null;
  const emergencyMonthly = emergencyRule ? Number(emergencyRule.amount) || 0 : 0;
  const biggestBill = bills.slice().sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))[0] || null;
  const biggestRollover = envRows.slice().sort((a, b) => b.roll - a.roll)[0] || null;

  return {
    key, nextKey, income, incomeRules, oldTotal, newTotal, freed,
    projectedSaved: Math.round((income - newTotal) * 100) / 100,
    budgetRows, envRows, envTotal,
    bills, billsTotal, autoTotal, handTotal,
    buyRows, buyTotalNeeded: plan.totalNeeded, buySpare: plan.spare,
    runs, fixedTotal, roundupRun,
    challengeWeek: wk.next, challengeAmount: wk.nextAmount,
    challengeSaved: wk.saved, challengeWeeks: wk.weeksDone,
    meetingDate, yearSaved, year, curMonth,
    emergencySaved: emergency ? emergency.saved : 0,
    emergencyTarget: emergency ? emergency.target : 0, emergencyMonthly,
    biggestBill, biggestRollover,
  };
}

// ---- Adopt the plan: write the suggested budgets and envelope
// fills into the real data. The old budgets and fills are kept in
// the record, so Undo puts them back exactly. Adopting twice for
// the same month does nothing the second time — the plan is already
// in place, and the original figures are not overwritten.
export function adoptNextmonth(state) {
  const plan = nextmonthPlan(state);
  const rec = nextmonthStore(state);
  if (rec && rec.adoptedFor === plan.nextKey) return { adopted: false, reason: 'already', plan };
  const prevBudgets = {};
  for (const c of CATEGORIES) if (c.budget > 0) prevBudgets[c.id] = Number(state.budgets[c.id]) || 0;
  const fills = (state.envelopes && state.envelopes.fills && state.envelopes.fills[plan.nextKey]) || {};
  const prevFills = {};
  for (const env of ENVELOPE_DEFS) prevFills[env.id] = (typeof fills[env.id] === 'number' ? fills[env.id] : null);
  const adoptedBudgets = {};
  for (const row of plan.budgetRows) {
    state.budgets[row.id] = row.suggested;
    adoptedBudgets[row.id] = row.suggested;
  }
  const adoptedFills = {};
  for (const env of plan.envRows) {
    setEnvFill(state, plan.nextKey, env.id, env.suggested);
    adoptedFills[env.id] = env.suggested;
  }
  state.nextmonth = { adoptedFor: plan.nextKey, prevBudgets, prevFills, adoptedBudgets, adoptedFills };
  state.sample = false;
  return { adopted: true, reason: '', plan };
}

// ---- Undo an adopted plan: budgets and envelope fills go back to
// what they were before Adopt. A fill that was never set by hand
// before is removed again, so the envelope falls back to budget
// plus rollover — exactly where it was.
export function undoNextmonth(state) {
  const rec = nextmonthStore(state);
  if (!rec || !rec.adoptedFor) return false;
  for (const id of Object.keys(rec.prevBudgets || {})) state.budgets[id] = rec.prevBudgets[id];
  if (!state.envelopes) state.envelopes = { fills: {}, rolloverOn: {} };
  if (!state.envelopes.fills) state.envelopes.fills = {};
  if (!state.envelopes.fills[rec.adoptedFor]) state.envelopes.fills[rec.adoptedFor] = {};
  for (const env of ENVELOPE_DEFS) {
    const prev = rec.prevFills ? rec.prevFills[env.id] : null;
    if (prev === null || prev === undefined) delete state.envelopes.fills[rec.adoptedFor][env.id];
    else state.envelopes.fills[rec.adoptedFor][env.id] = prev;
  }
  state.nextmonth = null;
  state.sample = false;
  return true;
}

export function renderNextmonth(state, root) {
  const plan = nextmonthPlan(state);
  const rec = nextmonthStore(state);
  const adopted = !!(rec && rec.adoptedFor === plan.nextKey);
  const cutRows = plan.budgetRows.filter((r) => r.suggested < r.budget);
  const raisedRows = plan.budgetRows.filter((r) => r.suggested > r.budget);
  const keptRows = plan.budgetRows.filter((r) => r.suggested === r.budget);

  const budgetTable = plan.budgetRows.map((r) => {
    const delta = Math.round((r.suggested - r.budget) * 100) / 100;
    const deltaCell = delta === 0
      ? '<span class="muted">keep</span>'
      : delta < 0
        ? '<span class="pos">−' + money(Math.abs(delta)) + '</span>'
        : '<span class="neg">+' + money(delta) + '</span>';
    return '<tr><td><span class="tx-ico" style="background:' + r.color + '22;color:' + r.color + '">' + esc(r.icon) + '</span> <b>' + esc(r.label) + '</b></td>'
      + '<td class="amount">' + money(r.spent) + '</td>'
      + '<td class="amount">' + money(r.budget) + '</td>'
      + '<td class="amount"><b>' + money(r.suggested) + '</b> ' + deltaCell + '</td>'
      + '<td class="muted small">' + esc(r.why) + '</td></tr>';
  }).join('');

  const envTable = plan.envRows.map((e) => {
    const delta = Math.round((e.suggested - e.current) * 100) / 100;
    return '<tr><td><span class="tx-ico" style="background:' + e.color + '22;color:' + e.color + '">' + esc(e.icon) + '</span> <b>' + esc(e.label) + '</b></td>'
      + '<td class="amount">' + money(e.spent) + '</td>'
      + '<td class="amount">' + (e.roll > 0 ? '<span class="pos">+' + money(e.roll) + '</span>' : money(0)) + '</td>'
      + '<td class="amount"><b>' + money(e.suggested) + '</b>' + (delta !== 0 ? ' <span class="muted small">(' + (delta > 0 ? '+' : '−') + money(Math.abs(delta)) + ' vs now)</span>' : '') + '</td></tr>';
  }).join('');

  const billRows = plan.bills.map((b) => '<tr><td><b>' + esc(b.name) + '</b></td><td>' + fmtDay(b.day, plan.nextKey) + '</td><td class="amount">' + money(b.amount) + '</td><td>' + (b.autoPay ? '<span class="pos">Auto-pay on ✓</span>' : '<span class="neg">Pay by hand</span>') + '</td></tr>').join('');

  const buyTable = plan.buyRows.map((b) => '<tr><td><b>' + esc(b.name) + '</b></td><td class="amount">' + money(b.cost) + '</td><td class="amount">' + money(b.saved) + '</td><td class="amount">' + money(b.remaining) + '</td><td class="amount"><b>' + money(b.needed) + ' / mo</b></td><td>' + esc(monthLabel(b.readyKey)) + '</td></tr>').join('');

  const runRows = plan.runs.map((x) => '<div class="mt-row"><span class="mt-ico good">↻</span><div class="mt-body"><b>' + esc(x.rule.name) + ' — ' + money(x.rule.amount) + ' on ' + fmtDate(x.date) + '</b><span>Into the ' + esc(destName(state, x.rule)) + '.</span></div></div>').join('')
    + (plan.roundupRun ? '<div class="mt-row"><span class="mt-ico good">↻</span><div class="mt-body"><b>' + esc(plan.roundupRun.rule.name) + ' — sweeps on ' + fmtDate(plan.roundupRun.date) + '</b><span>Into the ' + esc(destName(state, plan.roundupRun.rule)) + '. The amount follows December’s card spending — ' + monthLabel(plan.key) + '’s round-ups so far come to ' + money(plan.roundupRun.thisMonth) + '.</span></div></div>' : '');
  const incomeRows = plan.incomeRules.map((r) => '<div class="mt-row"><span class="mt-ico good">+$</span><div class="mt-body"><b>' + esc(r.name) + ' — ' + money(r.amount) + ' on day ' + r.day + '</b><span>Lands in ' + monthLabel(plan.nextKey) + ' as it does every month.</span></div></div>').join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Next month — ' + monthLabel(plan.nextKey) + '</h1><p class="muted">A plan for ' + monthLabel(plan.nextKey) + ' written from ' + monthLabel(plan.key) + '’s own figures: what each category actually spent, what rolled over unspent, the bills that come due, the purchases coming up, and the auto-save runs already scheduled. Nothing here is a guess — change a figure on any page it comes from and this plan changes with it.</p></div>'
    + '<div>' + (adopted
      ? '<span class="pill">Plan adopted ✓</span> <button type="button" class="btn ghost" data-nm-undo="1">Undo the plan</button>'
      : '<button type="button" class="btn primary" data-nm-adopt="1">Adopt this plan</button>')
    + ' <button type="button" class="btn ghost" data-nm-print="1">Print the plan</button></div></div>'
    + (adopted
      ? '<div class="tip good" style="margin-bottom:16px"><strong>Plan adopted for ' + monthLabel(plan.nextKey) + '.</strong> The budgets below are now the household’s budgets, and the envelope fills below are now December’s fills — the Budgets and Envelopes pages already show them. Undo puts the old budgets and fills back, exactly as they were.</div>'
      : '<div class="tip" style="margin-bottom:16px"><strong>Adopting does real work:</strong> it writes the suggested budgets into Budgets and the suggested fills into Envelopes for ' + monthLabel(plan.nextKey) + '. The old figures are kept, so Undo puts them back. Nothing is adopted until you press the button.</div>')
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Money in · ' + monthLabel(plan.nextKey) + '</div><div class="kpi-value num">' + money(plan.income) + '</div><div class="kpi-sub">' + plan.incomeRules.length + ' recurring incomes, as every month</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Planned spending</div><div class="kpi-value num">' + money(plan.newTotal) + '</div><div class="kpi-sub">Was ' + money(plan.oldTotal) + ' — ' + money(plan.freed) + ' of budget freed</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Projected saved</div><div class="kpi-value num">' + money(plan.projectedSaved) + '</div><div class="kpi-sub">If every category spends to its new budget — ' + (plan.income ? (plan.projectedSaved / plan.income * 100).toFixed(1) : '0') + '% of income</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Bills due</div><div class="kpi-value num">' + money(plan.billsTotal) + '</div><div class="kpi-sub">' + money(plan.autoTotal) + ' on auto-pay · ' + money(plan.handTotal) + ' to pay by hand</div></div>'
    + '</div>'

    + '<div class="card" style="margin-top:16px"><h2>Suggested budgets for ' + monthLabel(plan.nextKey) + '</h2>'
    + '<p class="muted small" style="margin-top:0">' + cutRows.length + ' categories trimmed, ' + raisedRows.length + ' raised to cover what was actually spent, ' + keptRows.length + ' kept as they are. The rule is simple: a budget that was never spent gets trimmed to what the month actually used, a budget that was beaten gets raised to cover it, and a budget that already fits stays put.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Category</th><th class="amount">Spent in ' + monthLabel(plan.key).split(' ')[0] + '</th><th class="amount">Budget now</th><th class="amount">Suggested</th><th>Why</th></tr></thead><tbody>' + budgetTable + '</tbody></table></div>'
    + '<p class="muted small">Suggested total <b>' + money(plan.newTotal) + '</b> against ' + money(plan.oldTotal) + ' now — <b>' + money(plan.freed) + '</b> of planned money freed. It is not saved yet: it is saved when the month is actually spent to this plan. The freed money is already spoken for below — the big purchases need ' + money(plan.buyTotalNeeded) + ' a month between them, and the auto-save rules move ' + money(plan.fixedTotal) + ' on payday.</p></div>'

    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Envelope fills for ' + monthLabel(plan.nextKey) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Cash in each envelope on the first of the month: the suggested budget for its categories, plus whatever rolled over unspent from ' + monthLabel(plan.key) + '. Adopting the plan writes these fills in — the Envelopes page shows them as December’s opening fills.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Envelope</th><th class="amount">Spent in ' + monthLabel(plan.key).split(' ')[0] + '</th><th class="amount">Rollover in</th><th class="amount">' + monthLabel(plan.nextKey).split(' ')[0] + ' fill</th></tr></thead><tbody>' + envTable + '</tbody></table></div>'
    + '<p class="muted small">Total cash in envelopes <b>' + money(plan.envTotal) + '</b>.' + (plan.biggestRollover && plan.biggestRollover.roll > 0 ? ' The biggest rollover is ' + esc(plan.biggestRollover.label) + ' (' + money(plan.biggestRollover.roll) + ') — it barely got spent in ' + monthLabel(plan.key).split(' ')[0] + '.' : ' Nothing rolled over — every envelope spent its budget out.') + '</p></div>'
    + '<div class="card"><h2>Bills due in ' + monthLabel(plan.nextKey) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Every bill comes due once a month. ' + plan.bills.filter((b) => b.autoPay).length + ' of ' + plan.bills.length + ' pay themselves on auto-pay (' + money(plan.autoTotal) + '); the other ' + plan.bills.filter((b) => !b.autoPay).length + ' (' + money(plan.handTotal) + ') need paying by hand — the two insurance bills are the ones the November meeting flagged as past due.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Bill</th><th>Due</th><th class="amount">Amount</th><th>How</th></tr></thead><tbody>' + billRows + '</tbody></table></div>'
    + '<p class="muted small">Total ' + money(plan.billsTotal) + (plan.biggestBill ? ' — ' + esc(plan.biggestBill.name) + ' alone is ' + money(plan.biggestBill.amount) + ' of it.' : '') + ' <a href="#/bills">Bills &amp; recurring →</a></p></div></div>'

    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Coming up — big purchases</h2>'
    + '<p class="muted small" style="margin-top:0">Nothing is actually due in ' + monthLabel(plan.nextKey) + ' — the nearest is the school fees on ' + fmtDate(plan.buyRows[0].target) + '. Set aside ' + money(plan.buyTotalNeeded) + ' a month between the four of them and every one lands on time; the household saves about ' + money0(plan.buySpare) + ' a month more than that, so the plan fits with room to spare.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Purchase</th><th class="amount">Cost</th><th class="amount">Set aside</th><th class="amount">To go</th><th class="amount">Per month</th><th>Ready</th></tr></thead><tbody>' + buyTable + '</tbody></table></div>'
    + '<p class="muted small">Plus the 52-week challenge: week ' + plan.challengeWeek + ' (' + money(plan.challengeAmount) + ') is next — ' + plan.challengeWeeks + ' weeks paid so far, ' + money(plan.challengeSaved) + ' saved. The money meeting is on ' + fmtDate(plan.meetingDate) + ' — <a href="#/meeting">Money meeting →</a></p></div>'
    + '<div class="card"><h2>Money in &amp; auto-save — ' + monthLabel(plan.nextKey) + '</h2>'
    + '<p class="muted small" style="margin-top:0">The income the month starts with, and the saving that happens on its own before anyone has to think about it.</p>'
    + incomeRows
    + (plan.runs.length || plan.roundupRun ? runRows : '<p class="empty">No auto-save runs fall inside ' + monthLabel(plan.nextKey) + '.</p>')
    + '<p class="muted small">Payday moves <b>' + money(plan.fixedTotal) + '</b> on ' + fmtDate(plan.runs.length ? plan.runs[0].date : plan.nextKey + '-01') + ' — ' + plan.runs.map((x) => money(x.rule.amount) + ' to the ' + esc(destName(state, x.rule))).join(', ') + ' — before the household spends a dollar. ' + (plan.roundupRun ? 'The round-ups sweep on ' + fmtDate(plan.roundupRun.date) + '.' : '') + ' <a href="#/autosave">Auto-save →</a></p></div></div>'

    + '<div class="card" style="margin-top:16px"><h2>What this plan does to the year</h2>'
    + '<p>At ' + money(plan.projectedSaved) + ' saved a month, twelve months of this plan puts away <b>' + money(plan.projectedSaved * 12) + '</b> — against ' + money(plan.yearSaved) + ' the household actually saved in the first ' + plan.curMonth + ' months of ' + plan.year + ' at the old budgets. The emergency fund (' + money(plan.emergencySaved) + ' of ' + money(plan.emergencyTarget) + ') reaches its target in about ' + (plan.emergencyMonthly > 0 ? Math.max(1, Math.ceil(Math.max(0, plan.emergencyTarget - plan.emergencySaved) / plan.emergencyMonthly)) : '—') + ' months at the payday auto-save pace alone.</p>'
    + '<p class="muted small">The plan is a suggestion until it is adopted — and it is only as good as the month it was built from. If December runs hot, January’s plan is built from December’s figures, not from a wish. <a href="#/forecast">Forecast →</a> <a href="#/whatif">What-if planner →</a></p></div>';
}
