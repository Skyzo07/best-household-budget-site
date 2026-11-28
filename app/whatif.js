// Hearth & Home Budget — what-if planner: try a change to the plan
// before making it, and see what it does to the whole household. Three
// levers, all from the household's own figures: trim a category, save
// extra each month into a goal of your choice, pay extra off the debts.
// The page recomputes live, side by side against the current plan —
// next month's month-end, the net-worth pace, the debt-free date and
// the net-worth target date — and "Apply this plan" writes the levers
// into the real budgets, the payoff planner and the forecast, with an
// Undo that puts everything back. Lazy-loaded: it only loads when the
// What-if nav link is opened, so it never touches the first load.
import { categoryById, money, monthLabel, networthSummary, shiftMonth } from './data.js';
import { forecastSummary } from './forecast.js';
import { simulatePayoff } from './debt.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// The what-if settings live on state so a plan survives a reload.
// `applied` records what "Apply this plan" last wrote into the budgets
// and the payoff planner, so Undo can put it all back. Older saves get
// the defaults.
export function whatifStore(state) {
  if (!state.whatif || typeof state.whatif !== 'object') {
    state.whatif = { extraSave: 100, cuts: { dining: 50, groceries: 30, fun: 20 }, extraDebt: 50, goalId: 'goal-emergency', applied: null };
  }
  const w = state.whatif;
  if (typeof w.extraSave !== 'number' || w.extraSave < 0) w.extraSave = 0;
  if (typeof w.extraDebt !== 'number' || w.extraDebt < 0) w.extraDebt = 0;
  if (!w.cuts || typeof w.cuts !== 'object') w.cuts = {};
  for (const c of ['dining', 'groceries', 'fun']) {
    if (typeof w.cuts[c] !== 'number' || w.cuts[c] < 0) w.cuts[c] = 0;
  }
  if (typeof w.goalId !== 'string' || !(state.goals || []).some((g) => g.id === w.goalId)) {
    w.goalId = ((state.goals || []).find((g) => g.id === 'goal-emergency') || (state.goals || [])[0] || {}).id || '';
  }
  if (w.applied !== null && typeof w.applied !== 'object') w.applied = null;
  return w;
}

// The three categories the household can actually trim by habit —
// housing, bills and school fees do not move by deciding to.
export const CUT_CATS = ['dining', 'groceries', 'fun'];

// Everything the page needs: the current plan and the scenario, side
// by side, all computed from the household's own figures. The current
// plan's month-end comes from the Forecast page (the six-month trend,
// read one month ahead); the current net-worth pace comes from the Net
// worth page (the cash actually kept, January to now). A cut frees
// money every month, so it lifts both. An extra debt payment comes out
// of the freed cash, so month-end cash falls by it — but net worth
// still rises by the full freed amount, because paying principal down
// is worth a dollar of net worth for every dollar paid.
export function whatifSummary(state) {
  const w = whatifStore(state);
  const fc = forecastSummary(state);
  const nw = networthSummary(state);
  const freed = CUT_CATS.reduce((a, c) => a + (Number(w.cuts[c]) || 0), 0);
  const baseMonthEnd = fc.projectedSaved;
  const scenMonthEnd = Math.round((baseMonthEnd + freed - w.extraDebt) * 100) / 100;
  const basePace = nw.pace;
  const scenPace = Math.round((basePace + freed) * 100) / 100;
  const baseYearly = Math.round(basePace * 12 * 100) / 100;
  const scenYearly = Math.round(scenPace * 12 * 100) / 100;
  const method = state.payoffMethod === 'snowball' ? 'snowball' : 'avalanche';
  const baseExtra = Number(state.payoffExtra) || 0;
  const basePayoff = simulatePayoff(state.debts || [], baseExtra, method, state.currentMonth);
  const scenPayoff = simulatePayoff(state.debts || [], baseExtra + w.extraDebt, method, state.currentMonth);
  const interestSaved = Math.max(0, Math.round((basePayoff.interest - scenPayoff.interest) * 100) / 100);
  const monthsSaved = basePayoff.months > 0 && scenPayoff.months > 0 ? basePayoff.months - scenPayoff.months : 0;
  // Net-worth target: same target the Net worth page measures, same
  // gap, two different paces.
  const gap = nw.gap;
  const baseMonths = gap <= 0 ? 0 : (basePace > 0 ? Math.ceil(gap / basePace) : -1);
  const scenMonths = gap <= 0 ? 0 : (scenPace > 0 ? Math.ceil(gap / scenPace) : -1);
  const baseTargetKey = baseMonths > 0 ? shiftMonth(state.currentMonth, baseMonths) : (gap <= 0 ? state.currentMonth : null);
  const scenTargetKey = scenMonths > 0 ? shiftMonth(state.currentMonth, scenMonths) : (gap <= 0 ? state.currentMonth : null);
  // The chosen goal: how long the extra saving alone takes it to its
  // target — counting only the extra, on top of whatever the household
  // already puts in, so the date is honest, not flattering.
  const goal = (state.goals || []).find((g) => g.id === w.goalId) || null;
  const goalGap = goal ? Math.max(0, Math.round((goal.target - goal.saved) * 100) / 100) : 0;
  const goalMonths = !goal ? -1 : goalGap <= 0 ? 0 : (w.extraSave > 0 ? Math.ceil(goalGap / w.extraSave) : -1);
  const goalKey = goalMonths > 0 ? shiftMonth(state.currentMonth, goalMonths) : null;
  // Per-category rows: budget, six-month average spend, the cut, and
  // the new limit the cut would set.
  const fcRows = {};
  for (const r of fc.rows) fcRows[r.cat.id] = r;
  const cutRows = CUT_CATS.map((id) => {
    const cat = categoryById(id);
    const budget = Number(state.budgets[id]) || 0;
    const avg = fcRows[id] ? fcRows[id].avg : 0;
    const cut = Number(w.cuts[id]) || 0;
    const newLimit = Math.max(0, Math.round((budget - cut) * 100) / 100);
    const effective = Math.round((budget - newLimit) * 100) / 100;
    return { id, cat, budget, avg, cut, newLimit, effective };
  });
  const effectiveFreed = cutRows.reduce((a, r) => a + r.effective, 0);
  return {
    w, fc, nw, freed, effectiveFreed, baseMonthEnd, scenMonthEnd,
    basePace, scenPace, baseYearly, scenYearly, method, baseExtra,
    basePayoff, scenPayoff, interestSaved, monthsSaved,
    gap, baseMonths, scenMonths, baseTargetKey, scenTargetKey,
    goal, goalGap, goalMonths, goalKey, cutRows,
    applied: w.applied,
  };
}

// Write the scenario into the real plan: the cuts become the new budget
// limits, the extra debt payment joins the payoff planner's extra, and
// the extra saving joins the forecast's extra. The deltas are recorded
// so Undo can put every figure back exactly.
export function applyWhatif(state) {
  const s = whatifSummary(state);
  const w = s.w;
  if (w.applied) return null;
  const applied = { cuts: {}, extraDebt: w.extraDebt, extraSave: w.extraSave };
  for (const r of s.cutRows) {
    applied.cuts[r.id] = r.effective;
    state.budgets[r.id] = r.newLimit;
  }
  state.payoffExtra = Math.round(((Number(state.payoffExtra) || 0) + w.extraDebt) * 100) / 100;
  if (!state.forecast || typeof state.forecast !== 'object') state.forecast = { method: 'trend', extra: 0 };
  state.forecast.extra = Math.round(((Number(state.forecast.extra) || 0) + w.extraSave) * 100) / 100;
  w.applied = applied;
  // The plan is now the current plan, so the levers reset to zero:
  // the page previews the NEXT change, not the one just applied.
  w.extraSave = 0;
  w.cuts = { dining: 0, groceries: 0, fun: 0 };
  w.extraDebt = 0;
  state.sample = false;
  return applied;
}

// Put back exactly what Apply wrote: budgets up, payoff extra down,
// forecast extra down. Nothing else moves.
export function undoWhatif(state) {
  const w = whatifStore(state);
  const a = w.applied;
  if (!a) return false;
  for (const id of Object.keys(a.cuts || {})) {
    state.budgets[id] = Math.round(((Number(state.budgets[id]) || 0) + (Number(a.cuts[id]) || 0)) * 100) / 100;
  }
  state.payoffExtra = Math.max(0, Math.round(((Number(state.payoffExtra) || 0) - (Number(a.extraDebt) || 0)) * 100) / 100);
  if (state.forecast && typeof state.forecast === 'object') {
    state.forecast.extra = Math.max(0, Math.round(((Number(state.forecast.extra) || 0) - (Number(a.extraSave) || 0)) * 100) / 100);
  }
  w.applied = null;
  state.sample = false;
  return true;
}

// One preset in one press: the levers jump to a named plan. Reset
// restores the page's starting plan.
export function applyPreset(state, name) {
  const w = whatifStore(state);
  if (name === 'debt') { w.extraSave = 0; w.cuts = { dining: 50, groceries: 50, fun: 50 }; w.extraDebt = 200; }
  else if (name === 'save') { w.extraSave = 200; w.cuts = { dining: 50, groceries: 30, fun: 20 }; w.extraDebt = 0; }
  else if (name === 'tighten') { w.extraSave = 100; w.cuts = { dining: 80, groceries: 50, fun: 40 }; w.extraDebt = 100; }
  else { w.extraSave = 100; w.cuts = { dining: 50, groceries: 30, fun: 20 }; w.extraDebt = 50; }
  state.sample = false;
}

export function renderWhatif(state, root) {
  const s = whatifSummary(state);
  const w = s.w;
  const diff = (a, b, suffix) => {
    const d = Math.round((b - a) * 100) / 100;
    if (d === 0) return '<span class="muted">No change</span>';
    return '<span class="' + (d > 0 ? 'pos' : 'neg') + '"><b>' + (d > 0 ? '+' : '−') + money(Math.abs(d)) + (suffix || '') + '</b></span>';
  };
  const cutRows = s.cutRows.map((r) => '<tr><td><span class="cat-dot" style="background:' + r.cat.color + '"></span><b>' + esc(r.cat.label) + '</b></td>'
    + '<td class="amount">' + money(r.budget) + '</td>'
    + '<td class="amount">' + money(r.avg) + '</td>'
    + '<td><input type="number" min="0" step="5" value="' + r.cut + '" data-wi-cut="' + r.id + '" aria-label="Cut from ' + esc(r.cat.label) + ' per month" style="width:90px"> / mo</td>'
    + '<td class="amount"><b>' + money(r.newLimit) + '</b>' + (r.effective < r.cut ? ' <span class="pill warn">capped at $0</span>' : '') + '</td></tr>').join('');
  const goalOptions = (state.goals || []).map((g) => '<option value="' + g.id + '"' + (s.goal && g.id === s.goal.id ? ' selected' : '') + '>' + esc(g.name) + ' — ' + money(g.saved) + ' of ' + money(g.target) + '</option>').join('');
  const targetLine = s.gap <= 0
    ? 'Already there — net worth clears the ' + money(s.nw.target) + ' target today, so the plan below is about what comes next, not catching up.'
    : s.scenMonths > 0
      ? 'The ' + money(s.nw.target) + ' net-worth target lands in <b>' + esc(monthLabel(s.scenTargetKey)) + '</b> — ' + s.scenMonths + ' months from now — against ' + (s.baseMonths > 0 ? esc(monthLabel(s.baseTargetKey)) + ' (' + s.baseMonths + ' months)' : 'no date yet') + ' on the current plan. ' + (s.baseMonths > 0 && s.baseMonths - s.scenMonths > 0 ? 'That is ' + (s.baseMonths - s.scenMonths) + ' month' + ((s.baseMonths - s.scenMonths) === 1 ? '' : 's') + ' sooner, from ' + money(s.effectiveFreed) + ' a month of freed spending.' : s.baseMonths > 0 ? 'The same month as the current plan — the target is only ' + s.baseMonths + ' months out, so a ' + money(s.effectiveFreed) + '-a-month trim cannot pull it into an earlier month. Raise the target on the Net worth page and the gap opens up.' : 'A date where the current plan has none, from ' + money(s.effectiveFreed) + ' a month of freed spending.')
      : 'The ' + money(s.nw.target) + ' target has no date on either plan — the household is not keeping money on average, so the first step is a month back in the black, not a bigger plan.';
  const debtLine = s.scenPayoff.months > 0
    ? 'Debt-free by <b>' + esc(monthLabel(s.scenPayoff.payoffKey)) + '</b> — ' + s.scenPayoff.months + ' months, ' + money(s.scenPayoff.interest) + ' of interest on the ' + s.method + ' order.'
      + (s.monthsSaved > 0 ? ' That is ' + s.monthsSaved + ' month' + (s.monthsSaved === 1 ? '' : 's') + ' sooner than the current plan (' + s.basePayoff.months + ' months, ' + money(s.basePayoff.interest) + '), saving <b>' + money(s.interestSaved) + '</b> of interest.' : ' Same date as the current plan — the extra payment is $0, so set one above to move it.')
    : '<strong>At the minimums alone this debt never clears</strong> — the minimum payment does not cover the monthly interest. The extra payment above is what breaks that, not the cuts.';
  const goalLine = !s.goal
    ? 'No savings goal to aim the extra saving at — add one on the Goals page first.'
    : s.goalGap <= 0
      ? 'The ' + esc(s.goal.name) + ' is already fully funded — ' + money(s.goal.saved) + ' saved against a ' + money(s.goal.target) + ' target. Pick another goal above, or raise this one’s target.'
      : w.extraSave > 0
        ? 'The ' + esc(s.goal.name) + ' still needs ' + money(s.goalGap) + '. At ' + money(w.extraSave) + ' extra a month it reaches its ' + money(s.goal.target) + ' target in <b>' + esc(monthLabel(s.goalKey)) + '</b> — ' + s.goalMonths + ' month' + (s.goalMonths === 1 ? '' : 's') + ' from now — counting only the extra, on top of whatever the household already puts in.'
        : 'The ' + esc(s.goal.name) + ' still needs ' + money(s.goalGap) + '. Set an extra monthly saving above and this line gives it a date.';
  const appliedLine = s.applied
    ? '<div class="tip good"><strong>This plan is applied.</strong> Budgets fell by ' + money(Object.values(s.applied.cuts).reduce((a, b) => a + b, 0)) + ' a month in total, the payoff planner’s extra rose by ' + money(s.applied.extraDebt) + ' and the forecast’s extra saving rose by ' + money(s.applied.extraSave) + '. The figures above now measure the new plan — the levers are back to zero, so move one again to preview the next change. Press Undo to put every figure back exactly as it was.</div>'
    : '<div class="tip">Nothing is applied yet — the figures above are a preview. Press <strong>Apply this plan</strong> and the budgets, the payoff planner and the forecast all change at once; Undo puts them back.</div>';

  root.innerHTML =
    '<div class="page-head"><div><h1>What-if planner</h1><p class="muted">Try a change before you make it. Trim a category, save extra into a goal, pay extra off the debts — and see what happens to next month, the debt-free date and the net-worth target, before a single dollar moves. Every figure below is worked out from this household’s own records.</p></div>'
    + '<div><a class="btn ghost" href="#/forecast">Forecast →</a> <a class="btn plain" href="#/networth">Net worth →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi ' + (s.scenMonthEnd < 0 ? 'warn' : 'good') + '"><div class="kpi-label">Month-end · ' + esc(monthLabel(s.fc.nextKey)) + '</div><div class="kpi-value num">' + money(s.scenMonthEnd) + '</div><div class="kpi-sub">Current plan: ' + money(s.baseMonthEnd) + ' · ' + diff(s.baseMonthEnd, s.scenMonthEnd) + ' with this plan</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Net-worth pace</div><div class="kpi-value num">' + money(s.scenPace) + ' / mo</div><div class="kpi-sub">Current pace: ' + money(s.basePace) + ' / mo · ' + money(s.scenYearly) + ' a year vs ' + money(s.baseYearly) + '</div></div>'
    + '<div class="card kpi ' + (s.scenPayoff.months > 0 ? 'good' : 'warn') + '"><div class="kpi-label">Debt-free date</div><div class="kpi-value num">' + (s.scenPayoff.payoffKey ? esc(monthLabel(s.scenPayoff.payoffKey)) : 'Never') + '</div><div class="kpi-sub">' + (s.basePayoff.payoffKey ? 'Current plan: ' + esc(monthLabel(s.basePayoff.payoffKey)) : 'Current plan: never at the minimums') + (s.monthsSaved > 0 ? ' · ' + s.monthsSaved + ' mo sooner, ' + money(s.interestSaved) + ' less interest' : '') + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Net-worth target · ' + money(s.nw.target) + '</div><div class="kpi-value num">' + (s.scenTargetKey ? esc(monthLabel(s.scenTargetKey)) : 'No date yet') + '</div><div class="kpi-sub">' + (s.baseTargetKey ? 'Current plan: ' + esc(monthLabel(s.baseTargetKey)) : 'Current plan: no date yet') + (s.baseMonths > 0 && s.scenMonths > 0 && s.baseMonths - s.scenMonths > 0 ? ' · ' + (s.baseMonths - s.scenMonths) + ' mo sooner' : '') + '</div></div>'
    + '</div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Trim the spending — free ' + money(s.effectiveFreed) + ' a month</h2>'
    + '<p class="muted small" style="margin-top:0">Three categories the household can actually trim by habit. Housing, bills and school fees do not move by deciding to, so they are not here. Type a cut and every figure on this page moves at once — the new limit is what the budget becomes if you apply it.</p>'
    + '<table><thead><tr><th>Category</th><th class="amount">Budget now</th><th class="amount">6-mo average</th><th>Cut / mo</th><th class="amount">New limit</th></tr></thead><tbody>' + cutRows + '</tbody></table>'
    + '<p class="muted small">Groceries averages ' + money(s.cutRows[1].avg) + ' a month, so a $30 cut still leaves the limit above what the household usually spends. Dining out averages ' + money(s.cutRows[0].avg) + ' — a $50 cut means one fewer takeaway a week, not none at all.</p></div>'
    + '<div class="card"><h2>Put the freed money to work</h2>'
    + '<p class="muted small" style="margin-top:0">The cuts free <b>' + money(s.effectiveFreed) + '</b> a month. The two boxes below decide where it goes — the extra debt payment comes out of next month’s cash, the extra saving goes into a goal and stays yours.</p>'
    + '<p><label class="inline-label">Extra saving each month: $<input type="number" min="0" step="10" value="' + w.extraSave + '" data-wi-extra-save style="width:110px"> into <select data-wi-goal aria-label="Goal for the extra saving">' + goalOptions + '</select></label></p>'
    + '<p class="muted small" style="margin-top:0">' + goalLine + '</p>'
    + '<p><label class="inline-label">Extra debt payment each month: $<input type="number" min="0" step="10" value="' + w.extraDebt + '" data-wi-extra-debt style="width:110px"> <span class="muted small">on top of the ' + money(s.baseExtra) + ' already in the payoff planner, ' + s.method + ' order</span></label></p>'
    + '<p class="muted small" style="margin-top:0">' + debtLine + '</p></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Try a named plan, or build your own</h2>'
    + '<p style="margin-top:0"><button class="btn small" data-wi-preset="debt">Debt-first — $150 of cuts, $200 extra to the debts</button> <button class="btn small" data-wi-preset="save">Save-first — $100 of cuts, $200 extra into a goal</button> <button class="btn small" data-wi-preset="tighten">Tighten everything — $170 of cuts, $100 + $100</button> <button class="btn small ghost" data-wi-preset="reset">Back to the starting plan</button></p>'
    + '<p class="muted small">Each preset sets all five boxes at once — press one, watch the four cards at the top move, then change any box by hand if the preset is nearly right.</p>'
    + '<div class="tip good" style="margin-top:12px">' + targetLine + '</div>'
    + '<div style="margin-top:12px">' + appliedLine + '</div>'
    + '<p style="margin-top:12px">' + (s.applied
        ? '<button class="btn" data-wi-undo>Undo the applied plan</button> <span class="muted small">Budgets, payoff extra and forecast extra all go back to where they were.</span>'
        : '<button class="btn primary" data-wi-apply>Apply this plan</button> <span class="muted small">Writes the cuts into Budgets, the extra debt payment into the payoff planner and the extra saving into the Forecast — and the figures above become the new current plan.</span>')
    + '</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>How the maths works — and what it leaves out</h2>'
    + '<p>Three rules, all from your own records. <b>One:</b> a cut frees its full amount every month, because the month-end on the Forecast page is income minus spending — spend $50 less and $50 more is left. <b>Two:</b> an extra debt payment comes out of that month’s cash, so the month-end falls by it — but net worth still rises by the full freed amount, because a dollar of principal paid down is a dollar less owed. <b>Three:</b> the debt-free date runs the same month-by-month simulation as the Reports page (' + s.method + ' order, minimums on everything, the extra on one target debt at a time), and the net-worth target date divides the gap by the new pace — the same division the Net worth page does.</p>'
    + '<p class="muted small">What it leaves out, honestly: the forecast’s trend is a straight line through six months, so a one-off month (a repair, a holiday) bends it; the debts are held at their current balance with no new borrowing; and the goal date counts only the extra saving, so the household’s normal saving shortens it further. Apply the plan, live a month with it, and the whole app — budgets, forecast, net worth — measures the real month against this preview.</p>'
    + '<p class="muted small">Current plan, for the record: next month ends at ' + money(s.baseMonthEnd) + ', the household keeps ' + money(s.basePace) + ' a month on average, the debts clear ' + (s.basePayoff.payoffKey ? 'in ' + esc(monthLabel(s.basePayoff.payoffKey)) + ' for ' + money(s.basePayoff.interest) + ' of interest' : 'never at the minimums alone') + ', and the ' + money(s.nw.target) + ' net-worth target lands ' + (s.baseTargetKey ? 'in ' + esc(monthLabel(s.baseTargetKey)) : 'with no date yet') + '.</p></div>';
}
