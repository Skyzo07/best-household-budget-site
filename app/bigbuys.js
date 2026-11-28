// Hearth & Home Budget — big purchases planner: the things the
// household knows are coming — a washing machine, school fees, a car
// service, a new sofa — each with a cost, a date it is needed by, and
// what is already set aside. The page works the plan out live from
// the household's own saving pace: how much has to be set aside every
// month for each purchase, whether the pace covers them all, and the
// month each one is ready. Nothing here is stored except the purchases
// themselves — edit a transaction and the pace, the monthly set-aside
// and the ready dates all move with it. A purchase can be linked to a
// savings goal instead of its own pot, and then its set-aside follows
// the goal's balance live. Lazy-loaded: it only loads when the Big
// purchases nav link is opened, so it never touches the first load.
import { bigbuyStore, lastMonths, money, monthLabel, monthTotals, shiftMonth, todayISO, uid } from './data.js';
import { drawBars } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// The last add-form error, shown on the page until the next render.
let bbError = '';

// What is already set aside for a purchase: its own pot, or — when it
// is linked to a savings goal — that goal's balance, read live. Adding
// money here moves the goal too, so the two pages can never disagree.
export function effectiveSaved(state, b) {
  if (b.goalId) {
    const g = (state.goals || []).find((x) => x.id === b.goalId);
    if (g) return Math.round(g.saved * 100) / 100;
  }
  return Math.round((Number(b.saved) || 0) * 100) / 100;
}

// The household's saving pace: income minus spending, averaged over
// the last three months that have any transactions. A month with no
// records at all is skipped, so a fresh household is not judged on
// empty months. November saved $2,791.51 and October $2,710.65, so
// the pace lands near $2,700 a month — the plan is measured against
// that, not against a wish.
export function savingPace(state) {
  const keys = lastMonths(state.currentMonth, 3);
  let sum = 0, n = 0;
  for (const k of keys) {
    const t = monthTotals(state, k);
    if (t.income === 0 && t.expense === 0) continue;
    sum += t.income - t.expense;
    n++;
  }
  if (!n) return 0;
  return Math.round((sum / n) * 100) / 100;
}

// Whole months from the viewed month to a target date, counting the
// viewed month itself: a target of 31 January while viewing November
// is three paydays away (November, December, January). A target
// already past is one month — due now.
export function monthsToTarget(state, targetISO) {
  const [y, m] = state.currentMonth.split('-').map(Number);
  const [ty, tm] = String(targetISO || '').split('-').map(Number);
  if (!ty || !tm) return 1;
  return Math.max(1, (ty - y) * 12 + (tm - m) + 1);
}

// The whole plan, worked out live: per purchase what is still to
// save, what that means a month, how much of the pace it gets, and
// the month it is ready. The pace is handed out by earliest target
// first — school fees before the sofa — so the urgent things are
// funded before the ones that can wait. A purchase whose monthly
// need is covered is ready by its target date; one that only gets
// part of its need slips, and the ready month says by how far.
export function bigbuyPlan(state) {
  const pace = savingPace(state);
  const buys = bigbuyStore(state).slice().sort((a, b) => a.target.localeCompare(b.target));
  let left = pace;
  let totalCost = 0, totalSaved = 0, totalNeeded = 0;
  const rows = buys.map((b) => {
    const saved = effectiveSaved(state, b);
    const remaining = Math.max(0, Math.round((b.cost - saved) * 100) / 100);
    const monthsLeft = monthsToTarget(state, b.target);
    const needed = remaining > 0 ? Math.ceil((remaining / monthsLeft) * 100) / 100 : 0;
    const allocated = remaining > 0 ? Math.min(needed, Math.max(0, Math.round(left * 100) / 100)) : 0;
    left = Math.max(0, Math.round((left - allocated) * 100) / 100);
    let readyKey = null;
    if (remaining <= 0) readyKey = state.currentMonth;
    else if (allocated > 0) readyKey = shiftMonth(state.currentMonth, Math.ceil(remaining / allocated) - 1);
    const targetKey = b.target.slice(0, 7);
    const onTrack = remaining <= 0 || (readyKey !== null && readyKey <= targetKey);
    const pct = b.cost ? Math.min(100, Math.round((saved / b.cost) * 100)) : 0;
    totalCost = Math.round((totalCost + b.cost) * 100) / 100;
    totalSaved = Math.round((totalSaved + saved) * 100) / 100;
    totalNeeded = Math.round((totalNeeded + needed) * 100) / 100;
    return { b, saved, remaining, monthsLeft, needed, allocated, readyKey, targetKey, onTrack, pct };
  });
  const spare = Math.max(0, Math.round((pace - totalNeeded) * 100) / 100);
  const totalRemaining = Math.round((totalCost - totalSaved) * 100) / 100;
  return { pace, rows, totalCost, totalSaved, totalRemaining, totalNeeded, spare, fits: totalNeeded <= pace };
}

// Add money to a purchase's pot: to its own pot, or straight into the
// linked goal when it has one. Returns the amount added, or 0.
export function addToPot(state, id, amount) {
  const b = bigbuyStore(state).find((x) => x.id === id);
  if (!b || !amount || amount <= 0) return 0;
  if (b.goalId) {
    const g = (state.goals || []).find((x) => x.id === b.goalId);
    if (!g) return 0;
    g.saved = Math.round((g.saved + amount) * 100) / 100;
  } else {
    b.saved = Math.round(((Number(b.saved) || 0) + amount) * 100) / 100;
  }
  state.sample = false;
  return amount;
}

export function removeBigBuy(state, id) {
  const list = bigbuyStore(state);
  const before = list.length;
  state.bigbuys = list.filter((x) => x.id !== id);
  if (state.bigbuys.length !== before) state.sample = false;
  return state.bigbuys.length !== before;
}

// Add a purchase from the form on the page. Returns the new purchase,
// or false when the form is not filled in properly — the reason is
// shown on the page, not swallowed.
export function addBigBuy(state, name, cost, target, saved, goalId) {
  bbError = '';
  const cleanName = String(name || '').trim();
  const amount = Number(cost);
  const already = Number(saved) || 0;
  if (!cleanName) { bbError = 'Please name the purchase.'; return false; }
  if (!Number.isFinite(amount) || amount <= 0) { bbError = 'The cost must be more than $0.'; return false; }
  if (!target) { bbError = 'Please pick the date it is needed by — the plan is worked out from that date.'; return false; }
  if (target < todayISO()) { bbError = 'The target date is in the past — pick a date still ahead.'; return false; }
  if (already < 0 || already > amount) { bbError = 'Already set aside cannot be more than the cost.'; return false; }
  const goal = goalId ? (state.goals || []).find((x) => x.id === goalId) : null;
  if (goalId && !goal) { bbError = 'That savings goal no longer exists — pick another, or its own pot.'; return false; }
  const b = {
    id: uid('bb'), name: cleanName, cost: Math.round(amount * 100) / 100,
    target, saved: goal ? 0 : Math.round(already * 100) / 100, goalId: goal ? goal.id : '',
  };
  bigbuyStore(state).push(b);
  state.sample = false;
  return b;
}

const POT_COLORS = ['#2b5f8a', '#1d6b4f', '#b3382e', '#7a5c1e', '#6a4a8a', '#c25e7a'];

export function renderBigbuys(state, root) {
  const plan = bigbuyPlan(state);
  const goalName = (id) => {
    const g = (state.goals || []).find((x) => x.id === id);
    return g ? g.name : '';
  };
  const verdict = plan.rows.length === 0
    ? '<div class="alert ok"><strong>No big purchases planned.</strong> Add the first one below — a washing machine, school fees, a car service — and the page works out what to set aside every month.</div>'
    : plan.fits
      ? '<div class="alert ok"><strong>The plan fits the pace.</strong> The big purchases need ' + money(plan.totalNeeded) + ' a month between them, and this household saves about ' + money(plan.pace) + ' a month — so ' + money(plan.spare) + ' a month is still free for the savings goals and the debts. ' + (plan.rows.every((r) => r.onTrack) ? 'Every purchase is ready by its target date.' : 'All but one are ready on time — the one that slips is marked below.') + '</div>'
      : '<div class="alert" role="alert"><strong>The plan is bigger than the pace.</strong> The purchases need ' + money(plan.totalNeeded) + ' a month, but the household saves about ' + money(plan.pace) + ' a month — ' + money(plan.totalNeeded - plan.pace) + ' a month short. Push a target date out, or trim a cost, and the ready dates move at once.</div>';
  const kpiCards =
    '<div class="card kpi"><div class="kpi-label">Saving pace · last 3 months</div><div class="kpi-value num">' + money(plan.pace) + ' / mo</div><div class="kpi-sub">Income minus spending, averaged over September, October and November 2026</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Set aside so far</div><div class="kpi-value num">' + money(plan.totalSaved) + '</div><div class="kpi-sub">of ' + money(plan.totalCost) + ' planned · ' + money(plan.totalRemaining) + ' still to save</div></div>'
    + '<div class="card kpi ' + (plan.fits ? 'good' : 'warn') + '"><div class="kpi-label">Set aside every month</div><div class="kpi-value num">' + money(plan.totalNeeded) + ' / mo</div><div class="kpi-sub">' + (plan.rows.length ? 'Across ' + plan.rows.length + ' purchase' + (plan.rows.length === 1 ? '' : 's') + ' · ' + money(plan.spare) + ' a month of pace to spare' : 'Add a purchase below to see the monthly figure') + '</div></div>'
    + '<div class="card kpi ' + (plan.rows.every((r) => r.onTrack) ? 'good' : 'warn') + '"><div class="kpi-label">Ready on time</div><div class="kpi-value num">' + plan.rows.filter((r) => r.onTrack).length + ' of ' + plan.rows.length + '</div><div class="kpi-sub">' + (plan.rows.length ? (plan.rows.every((r) => r.onTrack) ? 'Every purchase lands by its target date' : plan.rows.filter((r) => !r.onTrack).map((r) => esc(r.b.name)).join(', ') + ' slip' + (plan.rows.filter((r) => !r.onTrack).length === 1 ? 's' : '') + ' past ' + (plan.rows.filter((r) => !r.onTrack).length === 1 ? 'its' : 'their') + ' target') : 'Nothing planned yet') + '</div></div>';

  const rowsHtml = plan.rows.map((r, i) => {
    const color = POT_COLORS[i % POT_COLORS.length];
    const pill = r.remaining <= 0
      ? '<span class="pill">Ready — fully saved</span>'
      : r.onTrack
        ? '<span class="pill">On track</span>'
        : '<span class="pill over">Slips ' + (r.readyKey ? 'to ' + monthLabel(r.readyKey) : 'past its date') + '</span>';
    const readyLine = r.remaining <= 0
      ? 'Saved in full'
      : r.readyKey
        ? 'Ready ' + monthLabel(r.readyKey) + (r.onTrack ? ' — by the target' : ' — ' + (r.readyKey > r.targetKey ? 'after the ' + fmtDate(r.b.target) + ' target' : ''))
        : 'No pace left for this one — it waits until an earlier purchase is done';
    return '<tr><td><span class="cat-dot" style="background:' + color + '"></span><b>' + esc(r.b.name) + '</b>'
      + '<span class="muted small" style="display:block">Needed by ' + fmtDate(r.b.target) + (r.b.goalId ? ' · set aside in the ' + esc(goalName(r.b.goalId)) + ' goal' : ' · its own pot') + '</span>'
      + '<span class="bar-row" style="margin-top:6px"><span class="bar"><i style="width:' + r.pct + '%;background:' + color + '"></i></span></span></td>'
      + '<td class="amount">' + money(r.b.cost) + '</td>'
      + '<td class="amount">' + money(r.saved) + '<span class="muted small" style="display:block">' + r.pct + '% saved</span></td>'
      + '<td class="amount">' + money(r.remaining) + '<span class="muted small" style="display:block">' + r.monthsLeft + ' month' + (r.monthsLeft === 1 ? '' : 's') + ' to go</span></td>'
      + '<td class="amount">' + (r.remaining > 0 ? money(r.needed) + '<span class="muted small" style="display:block">gets ' + money(r.allocated) + ' of the pace</span>' : '—') + '</td>'
      + '<td>' + readyLine + '<span class="muted small" style="display:block">' + pill + '</span></td>'
      + '<td><button type="button" class="btn small ghost" data-bb-pot="' + r.b.id + ':25">+ $25</button> <button type="button" class="btn small ghost" data-bb-pot="' + r.b.id + ':50">+ $50</button> <button type="button" class="btn small ghost" data-bb-del="' + r.b.id + '">Remove</button></td></tr>';
  }).join('');

  const goalOpts = '<option value="">Its own pot — set aside here</option>' + (state.goals || []).map((g) => '<option value="' + g.id + '">' + esc(g.name) + ' (' + money(g.saved) + ' saved)</option>').join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Big purchases</h1><p class="muted">The washing machine that is dying, the school fees due in January, the car service, the sofa — the big things a household knows are coming, planned before they arrive instead of paid for on a credit card afterwards. ' + money(plan.totalRemaining) + ' still to save across ' + plan.rows.length + ' purchases, at ' + money(plan.totalNeeded) + ' a month — measured against the ' + money(plan.pace) + ' a month this household actually saves.</p></div>'
    + '<div><a class="btn ghost" href="#/goals">Savings goals →</a> <a class="btn plain" href="#/forecast">Forecast →</a></div></div>'
    + verdict
    + '<div class="grid kpis" style="margin-top:16px">' + kpiCards + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Still to save, purchase by purchase</h2><p class="muted small" style="margin-top:0">The pace is handed out by earliest date first — school fees before the sofa — so the urgent things are funded before the ones that can wait.</p><div class="chart-wrap"><canvas id="chart-bigbuys" class="chart" height="200" aria-label="Still to save per purchase"></canvas></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>The plan</h2>'
    + (plan.rows.length
      ? '<table><thead><tr><th>Purchase</th><th class="amount">Cost</th><th class="amount">Set aside</th><th class="amount">Still to save</th><th class="amount">A month</th><th>Ready by</th><th>Do it</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>'
      : '<p class="empty">No big purchases planned yet — add the first one below.</p>')
    + '<p class="muted small">“A month” is what is still to save, divided by the months until the target date. “Gets” is the share of the saving pace this purchase actually receives — the earliest target is funded first, so a later purchase can get less than it needs and slip. Press + $25 or + $50 to move money into a pot; the ready date moves at once.</p></div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Plan a big purchase</h2>'
    + '<p class="muted small" style="margin-top:0">Name it, price it, date it — the page works out the monthly set-aside the moment it lands. Link it to a savings goal and the pot follows that goal’s balance live: add $50 here and the goal moves too.</p>'
    + '<p class="move-row"><span class="inline-label">Purchase <input id="bb-add-name" type="text" maxlength="60" placeholder="e.g. New fridge" aria-label="Purchase name"></span></p>'
    + '<p class="move-row"><span class="inline-label">Cost $ <input id="bb-add-cost" type="number" min="1" step="1" placeholder="800" aria-label="Purchase cost"></span>'
    + '<span class="inline-label">Needed by <input id="bb-add-target" type="date" value="2027-06-30" aria-label="Target date"></span></p>'
    + '<p class="move-row"><span class="inline-label">Already set aside $ <input id="bb-add-saved" type="number" min="0" step="1" placeholder="0" aria-label="Already set aside"></span>'
    + '<span class="inline-label">Set aside in <select id="bb-add-goal" aria-label="Savings goal to link">' + goalOpts + '</select></span></p>'
    + '<p><button type="button" class="btn small" data-bb-add="1">Add purchase</button></p>'
    + (bbError ? '<p class="form-error">' + esc(bbError) + '</p>' : '')
    + '</div>'
    + '<div class="card"><h2>How the plan is worked out</h2>'
    + '<p>The saving pace is the household’s own: income minus spending, averaged over the last three months with records. ' + (() => { const ks = lastMonths(state.currentMonth, 3); const saved = ks.map((k) => ({ k, s: monthTotals(state, k).income - monthTotals(state, k).expense })).filter((x) => x.s !== 0 || monthTotals(state, x.k).income !== 0); return saved.length >= 2 ? 'Right now that is ' + money(plan.pace) + ' a month — ' + monthLabel(saved[saved.length - 1].k) + ' saved ' + money(saved[saved.length - 1].s) + ' and ' + monthLabel(saved[saved.length - 2].k) + ' ' + money(saved[saved.length - 2].s) + ' — so the plan is measured against real money, not a wish.' : 'Right now that is ' + money(plan.pace) + ' a month, so the plan is measured against real money, not a wish.'; })() + '</p>'
    + '<p>Each purchase’s monthly set-aside is what is still to save divided by the months until it is needed. The pace is then handed out by earliest target first, and the ready month is the month the pot fills at the pace it actually receives. A purchase already fully saved is ready now. Push a target date out on the Savings goals page or trim a cost, and every ready date on this page moves with it.</p>'
    + '<p class="muted small">The rule that makes it work: a big purchase is never a surprise. Price it when you first think of it, set aside a little every month, and the money is there when the date comes.</p></div></div>';
  const barsCanvas = root.querySelector('#chart-bigbuys');
  if (barsCanvas) {
    drawBars(barsCanvas, plan.rows.map((r, i) => ({ label: r.b.name.replace(/^New /, '').split(' ')[0], value: r.remaining, color: POT_COLORS[i % POT_COLORS.length] })), { valueLabel: (v) => '$' + Math.round(v) });
  }
}
