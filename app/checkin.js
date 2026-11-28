// Hearth & Home Budget — weekly check-in: five minutes, once a week,
// with the household's own figures. The month is split into weeks
// (days 1–7, 8–14, 15–21, 22–28, 29–end); each flexible category is
// measured against its weekly share of the monthly budget (budget /
// 4.33, the average weeks in a month). Rent and utilities are shown
// separately — they land once a month, so a weekly share would call
// week 1 "over" every single month, which would be a lie told by the
// page itself. Pick one action for next week from the list the
// flagged categories suggest, save the check-in, and the history below
// keeps every week you have checked in. Lazy-loaded: it only loads
// when the Weekly check-in nav link is opened, so it never touches
// the first load.
import { CATEGORIES, categoryById, checkinStore, money, monthLabel, monthTransactions, todayISO } from './data.js';
import { drawBars } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Flexible categories: the ones a habit can move week to week.
// Housing and utilities are fixed — they land on one day a month.
export const FLEX_CATS = ['groceries', 'dining', 'fun', 'transport', 'kids', 'health', 'shopping', 'other'];
export const FIXED_CATS = ['housing', 'utilities'];
export const WEEKS_PER_MONTH = 4.33;

// The weeks of a month: 1–7, 8–14, 15–21, 22–28, 29–end. A 30-day
// month has five weeks; February has four.
export function weekRanges(key) {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const bounds = [[1, 7], [8, 14], [15, 21], [22, 28], [29, last]];
  return bounds
    .filter(([a]) => a <= last)
    .map(([a, b], i) => {
      const end = Math.min(b, last);
      return {
        n: i + 1,
        key: key + '-w' + (i + 1),
        start: key + '-' + String(a).padStart(2, '0'),
        end: key + '-' + String(end).padStart(2, '0'),
        label: 'Week ' + (i + 1),
        range: a + '–' + end + ' ' + monthLabel(key),
      };
    });
}

export function weekByKey(weekKey) {
  const m = /^(\d{4}-\d{2})-w(\d+)$/.exec(weekKey || '');
  if (!m) return null;
  const weeks = weekRanges(m[1]);
  return weeks.find((w) => w.n === Number(m[2])) || null;
}

// The weekly share of a monthly budget: the budget split across the
// average 4.33 weeks in a month, so a week is judged against a fair
// slice, not against the whole month.
export function weeklyShare(budget) {
  return Math.round(((Number(budget) || 0) / WEEKS_PER_MONTH) * 100) / 100;
}

// Everything the page needs for one week, all from the household's
// own transactions and budgets: per-category spend against its weekly
// share, the flexible total against the flexible share, and the fixed
// costs as they landed that week.
export function weekSummary(state, weekKey) {
  const week = weekByKey(weekKey);
  if (!week) return null;
  const txs = state.transactions.filter((t) => t.kind === 'expense' && t.date >= week.start && t.date <= week.end);
  const spend = {};
  for (const t of txs) spend[t.category] = Math.round(((spend[t.category] || 0) + t.amount) * 100) / 100;
  const flexRows = FLEX_CATS.map((id) => {
    const cat = categoryById(id);
    const spent = spend[id] || 0;
    const share = weeklyShare(state.budgets[id] || 0);
    const diff = Math.round((spent - share) * 100) / 100;
    return { id, cat, spent, share, diff, over: diff > 0 };
  }).sort((a, b) => b.spent - a.spent);
  const fixedRows = FIXED_CATS.map((id) => {
    const cat = categoryById(id);
    return { id, cat, spent: spend[id] || 0, budget: Number(state.budgets[id]) || 0 };
  });
  const flexSpent = Math.round(flexRows.reduce((a, r) => a + r.spent, 0) * 100) / 100;
  const flexShare = Math.round(flexRows.reduce((a, r) => a + r.share, 0) * 100) / 100;
  const flexDiff = Math.round((flexSpent - flexShare) * 100) / 100;
  const overRows = flexRows.filter((r) => r.over);
  const fixedSpent = Math.round(fixedRows.reduce((a, r) => a + r.spent, 0) * 100) / 100;
  return { week, flexRows, fixedRows, flexSpent, flexShare, flexDiff, overRows, fixedSpent, txCount: txs.length };
}

// The week the page opens on: the latest week in the viewed month
// that has any spending in it — the week that most needs checking.
// A month with no spending at all opens on week 1.
export function defaultWeekKey(state) {
  const key = state.currentMonth;
  const txs = monthTransactions(state, key).filter((t) => t.kind === 'expense');
  if (!txs.length) return key + '-w1';
  const latest = txs.map((t) => t.date).sort().pop();
  const weeks = weekRanges(key);
  const week = weeks.find((w) => latest >= w.start && latest <= w.end) || weeks[weeks.length - 1];
  return week.key;
}

// The week being shown, remembered while the page is open. Switching
// months resets it to that month's default week.
let selectedWeek = '';
let selectedMonth = '';
export function setCheckinWeek(key) {
  selectedWeek = key;
}
export function currentCheckinWeek(state) {
  if (selectedMonth !== state.currentMonth || !selectedWeek || !weekByKey(selectedWeek)) {
    selectedMonth = state.currentMonth;
    selectedWeek = defaultWeekKey(state);
  }
  return selectedWeek;
}

// One action for next week. The first six are tied to a category that
// came in over its weekly share — they only appear when that category
// is flagged. The last two are always there: a habit any week can use.
export const CHECKIN_ACTIONS = [
  { id: 'groc-shop', cat: 'groceries', label: 'One big shop, no top-ups — write the list first and shop once' },
  { id: 'cook-home', cat: 'dining', label: 'Cook at home 5 nights — one takeaway at most, on Friday' },
  { id: 'free-fun', cat: 'fun', label: 'One free family activity — park, library, board games at home' },
  { id: 'carshare', cat: 'transport', label: 'Car-share the school run twice — one car, two families' },
  { id: 'school-due', cat: 'kids', label: 'Ask the school what is due next month — no surprise fees' },
  { id: 'no-shop', cat: 'shopping', label: 'No non-essential shopping next week — the list waits seven days' },
  { id: 'move-25', cat: '', label: 'Move $25 into the Emergency fund on payday' },
  { id: 'env-sunday', cat: '', label: 'Check the envelopes on Sunday — move cash before the week starts' },
];

export function actionById(id) {
  return CHECKIN_ACTIONS.find((a) => a.id === id) || null;
}

// The actions offered for a week: the flagged categories' actions
// first, in the order the categories went over, then the two habits
// any week can use. When nothing went over, the first two habit
// actions are offered anyway, so the week still ends with a plan.
export function suggestedActions(summary) {
  const overIds = new Set(summary.overRows.map((r) => r.id));
  const tied = CHECKIN_ACTIONS.filter((a) => a.cat && overIds.has(a.cat));
  const generic = CHECKIN_ACTIONS.filter((a) => !a.cat);
  const habits = tied.length ? tied.concat(generic) : CHECKIN_ACTIONS.filter((a) => a.id === 'cook-home' || a.id === 'groc-shop').concat(generic);
  return habits;
}

// Save (or re-save) the check-in for a week: the action picked for
// next week and one optional line on how the week went. Re-saving
// updates the record — the history holds one row per week, never two.
export function saveCheckin(state, weekKey, actionId, note) {
  const list = checkinStore(state);
  const action = actionById(actionId);
  if (!action || !weekByKey(weekKey)) return false;
  const cleanNote = String(note || '').trim().slice(0, 120);
  const existing = list.find((c) => c.weekKey === weekKey);
  if (existing) {
    existing.action = action.id;
    existing.note = cleanNote;
    existing.savedOn = todayISO();
  } else {
    list.push({ weekKey, action: action.id, note: cleanNote, savedOn: todayISO() });
  }
  state.sample = false;
  return true;
}

export function deleteCheckin(state, weekKey) {
  const list = checkinStore(state);
  const before = list.length;
  state.checkins = list.filter((c) => c.weekKey !== weekKey);
  if (state.checkins.length !== before) state.sample = false;
  return state.checkins.length !== before;
}

export function renderCheckin(state, root) {
  const key = state.currentMonth;
  const weeks = weekRanges(key);
  const wk = currentCheckinWeek(state);
  const s = weekSummary(state, wk);
  const history = checkinStore(state).slice().sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  const saved = history.find((c) => c.weekKey === wk);
  const latestHist = history[0] || null;
  const latestWeek = latestHist ? weekByKey(latestHist.weekKey) : null;
  const actions = suggestedActions(s);
  const verdict = s.flexDiff > 0
    ? '<span class="pill over">Over by ' + money(s.flexDiff) + '</span> — the flexible spending ran past its weekly share. ' + s.overRows.length + ' categor' + (s.overRows.length === 1 ? 'y' : 'ies') + ' over: ' + s.overRows.map((r) => esc(r.cat.label)).join(', ') + '.'
    : s.flexDiff < 0
      ? '<span class="pill">Under by ' + money(Math.abs(s.flexDiff)) + '</span> — the week stayed inside its share.' + (s.overRows.length ? ' Still over, one by one: ' + s.overRows.map((r) => esc(r.cat.label) + ' +' + money(r.diff)).join(', ') + '.' : ' Nothing went over at all.')
      : '<span class="pill">Exactly on share</span> — the flexible spending matched its weekly slice to the dollar.';
  const weekBtns = weeks.map((w) => '<button type="button" class="btn small' + (w.key === wk ? '' : ' ghost') + '" data-checkin-week="' + w.key + '"' + (w.key === wk ? ' aria-pressed="true"' : '') + '>' + esc(w.label) + ' · ' + esc(w.range) + '</button>').join(' ');
  const flexRows = s.flexRows.map((r) => {
    const pill = r.spent === 0
      ? '<span class="pill">Nothing spent</span>'
      : r.over
        ? '<span class="pill over">Over by ' + money(r.diff) + '</span>'
        : '<span class="pill">Under by ' + money(Math.abs(r.diff)) + '</span>';
    return '<tr><td><span class="cat-dot" style="background:' + r.cat.color + '"></span><b>' + esc(r.cat.label) + '</b></td>'
      + '<td class="amount">' + money(r.spent) + '</td><td class="amount">' + money(r.share) + '</td><td>' + pill + '</td></tr>';
  }).join('');
  const fixedRows = s.fixedRows.map((r) => '<tr><td><span class="cat-dot" style="background:' + r.cat.color + '"></span><b>' + esc(r.cat.label) + '</b></td>'
    + '<td class="amount">' + money(r.spent) + '</td><td class="amount">' + money(r.budget) + ' / month</td><td><span class="muted small">Fixed — lands once a month, not judged weekly</span></td></tr>').join('');
  const actionRows = actions.map((a) => '<label class="checkin-action"><input type="radio" name="checkin-action" value="' + a.id + '"' + (saved && saved.action === a.id ? ' checked' : '') + '> <span><b>' + esc(a.label) + '</b>' + (a.cat ? ' <span class="muted small">· for ' + esc(categoryById(a.cat).label) + ', over by ' + money(s.flexRows.find((r) => r.id === a.cat).diff) + ' this week</span>' : '') + '</span></label>').join('');
  const historyRows = history.length ? history.map((c) => {
    const hs = weekSummary(state, c.weekKey);
    const a = actionById(c.action);
    const w = hs ? hs.week : null;
    const line = !hs ? ''
      : 'Flexible spending ' + money(hs.flexSpent) + ' vs a ' + money(hs.flexShare) + ' weekly share — ' + (hs.flexDiff > 0 ? 'over by ' + money(hs.flexDiff) : hs.flexDiff < 0 ? 'under by ' + money(Math.abs(hs.flexDiff)) : 'exactly on share') + (hs.overRows.length ? ' · over: ' + hs.overRows.map((r) => esc(r.cat.label)).join(', ') : ' · nothing over');
    return '<li><span class="tx-main"><b>' + (w ? esc(w.label) + ' · ' + esc(w.range) : esc(c.weekKey)) + '</b><span>' + line + '</span><span>Next week’s job: <b>' + esc(a ? a.label : c.action) + '</b>' + (c.note ? ' — “' + esc(c.note) + '”' : '') + '</span></span><span><button type="button" class="icon-btn" data-checkin-del="' + esc(c.weekKey) + '">Remove</button></span></li>';
  }).join('') : '<p class="empty">No check-ins saved yet — save your first one above and it lands here.</p>';

  root.innerHTML =
    '<div class="page-head"><div><h1>Weekly check-in</h1><p class="muted">Five minutes, once a week. This week’s spending against its fair share of the month — then one job for next week, picked from what actually went over. Every figure is worked out from this household’s own transactions and budgets.</p></div>'
    + '<div><a class="btn ghost" href="#/budgets">Budgets →</a> <a class="btn plain" href="#/whatif">What-if planner →</a></div></div>'
    + '<div class="card"><h2>Pick a week — ' + monthLabel(key) + '</h2><p style="margin-top:0">' + weekBtns + '</p>'
    + '<p class="muted small">The page opens on the latest week with any spending in it. Weeks run 1–7, 8–14, 15–21, 22–28, then 29 to the end of the month.</p></div>'
    + '<div class="grid kpis" style="margin-top:16px">'
    + '<div class="card kpi ' + (s.flexDiff > 0 ? 'warn' : 'good') + '"><div class="kpi-label">Flexible spending · ' + esc(s.week.label) + '</div><div class="kpi-value num">' + money(s.flexSpent) + '</div><div class="kpi-sub">Weekly share ' + money(s.flexShare) + ' · ' + s.txCount + ' expense' + (s.txCount === 1 ? '' : 's') + ' this week</div></div>'
    + '<div class="card kpi ' + (s.overRows.length ? 'warn' : 'good') + '"><div class="kpi-label">Categories over their share</div><div class="kpi-value num">' + s.overRows.length + ' of ' + s.flexRows.length + '</div><div class="kpi-sub">' + (s.overRows.length ? s.overRows.map((r) => esc(r.cat.label) + ' +' + money(r.diff)).join(' · ') : 'Nothing went over — every flexible category stayed inside its share') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Fixed costs landed this week</div><div class="kpi-value num">' + money(s.fixedSpent) + '</div><div class="kpi-sub">Rent and bills — shown, not judged: they land once a month</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Check-ins saved</div><div class="kpi-value num">' + history.length + '</div><div class="kpi-sub">' + (latestHist ? 'Latest: ' + esc(latestWeek ? latestWeek.label + ' · ' + latestWeek.range : latestHist.weekKey) + ' — ' + esc((actionById(latestHist.action) || {}).label || latestHist.action) : 'Save this week’s check-in below to start the habit') + '</div></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>This week at a glance</h2><div class="chart-wrap"><canvas id="chart-checkin-week" class="chart" height="200" aria-label="Flexible spending this week by category"></canvas></div><p class="muted small">Flexible spending this week, by category — the bars are what actually went out; the table below judges each one against its weekly share.</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>This week, category by category</h2><p class="muted small" style="margin-top:0">' + verdict + '</p>'
    + '<table><thead><tr><th>Category</th><th class="amount">Spent this week</th><th class="amount">Weekly share</th><th>How it went</th></tr></thead><tbody>' + flexRows + '</tbody></table>'
    + '<p class="muted small">Weekly share is the monthly budget divided by 4.33, the average weeks in a month — so a $620 grocery budget is $143.19 a week, and a $240 dining budget is $55.43.</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>Fixed costs this week</h2><table><thead><tr><th>Category</th><th class="amount">Paid this week</th><th class="amount">Monthly budget</th><th>Note</th></tr></thead><tbody>' + fixedRows + '</tbody></table>'
    + '<p class="muted small">Rent lands on the 1st and the electricity and water bills on the 3rd, so week 1 always looks heavy — that is the calendar, not overspending. Judge the flexible table above instead.</p></div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>One job for next week</h2><p class="muted small" style="margin-top:0">Pick one — the list is the flagged categories’ answers first, then the two habits any week can use. One job, kept, beats five jobs forgotten.</p>'
    + actionRows
    + '<p style="margin-top:12px"><label class="inline-label">One line on how this week went (optional) <input id="checkin-note" type="text" maxlength="120" placeholder="e.g. The big shop really did stop the top-ups" value="' + esc(saved ? (saved.note || '') : '') + '"></label></p>'
    + '<p><button type="button" class="btn primary" data-checkin-save="1">' + (saved ? 'Update this check-in' : 'Save this check-in') + '</button> ' + (saved ? '<span class="muted small">Checked in on ' + esc(saved.savedOn || '') + ' — saving again updates it, it never doubles up.</span>' : '<span class="muted small">Saved in this browser, alongside your budgets — it survives a reload.</span>') + '</p></div>'
    + '<div class="card"><h2>Why a weekly check-in works</h2><p>A monthly budget fails quietly — by the time the month ends, the money is gone. A week is short enough to fix: catch groceries running $43 over its share on the 7th and one big shop next week puts it right. The rule is small on purpose: look at the flags, pick one job, do it, come back next week. The history on this page is the proof it happened.</p><p class="muted small">The weekly share is a fair slice, not a trap: a category can be over its share one week and under the next, and the month still lands on budget. What matters is the pattern — the same category over three weeks running is a habit, not a spike.</p></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>Check-in history</h2>'
    + (history.length ? '<ul class="tx-list">' + historyRows + '</ul>' : historyRows)
    + '<p class="muted small">Each row is one week, with its own figures recomputed from Transactions — so if you edit a transaction, the history follows the records instead of freezing a stale number.</p></div>';
  const barsCanvas = root.querySelector('#chart-checkin-week');
  if (barsCanvas) {
    drawBars(barsCanvas, s.flexRows.map((r) => ({ label: r.cat.label.split(' ')[0], value: r.spent, color: r.cat.color })), { valueLabel: (v) => '$' + Math.round(v) });
  }
}
