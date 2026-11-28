// Hearth & Home Budget — savings challenges: the fun way to save small
// amounts on purpose. Three challenges, all tied to the household's real
// figures and all saved in localStorage with the rest of the budget:
//   1. The 52-week challenge — deposit a little more each week of the year
//      ($1 in week 1, $2 in week 2 … $52 in week 52 adds up to $1,378).
//   2. No-spend days — mark the days you spent nothing; the page shows
//      how many days you kept and roughly what they were worth.
//   3. The round-up pot — every expense rounded up to the next whole
//      dollar, swept into a pot once a month, then moved into the
//      emergency-fund goal with one press.
// Loaded on demand, so it stays out of the first load.
import { money, money0, monthLabel, monthTotals, monthTransactions, categorySpend } from './data.js';
import { ringSVG } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function challenges(state) {
  if (!state.challenges) state.challenges = { fiftyTwo: { mode: 'grow', paid: [] }, noSpend: {}, roundUp: { pot: 0, swept: [] } };
  if (!state.challenges.fiftyTwo) state.challenges.fiftyTwo = { mode: 'grow', paid: [] };
  if (!Array.isArray(state.challenges.fiftyTwo.paid)) state.challenges.fiftyTwo.paid = [];
  if (!state.challenges.noSpend) state.challenges.noSpend = {};
  if (!state.challenges.roundUp) state.challenges.roundUp = { pot: 0, swept: [] };
  return state.challenges;
}

// What week n asks you to put in, under each plan.
export function weekAmount(mode, week) {
  if (mode === 'reverse') return 53 - week;
  if (mode === 'flat') return 10;
  return week;
}

export function challengeTarget(mode) {
  return mode === 'flat' ? 520 : 1378;
}

export function challengeSaved(state) {
  const c = challenges(state).fiftyTwo;
  const mode = c.mode || 'grow';
  let saved = 0;
  for (const w of c.paid) saved += weekAmount(mode, w);
  return { saved, target: challengeTarget(mode), weeksDone: c.paid.length, mode };
}

export function nextUnpaidWeek(state) {
  const paid = new Set(challenges(state).fiftyTwo.paid);
  for (let w = 1; w <= 52; w++) if (!paid.has(w)) return w;
  return 0;
}

export function toggleWeek(state, week) {
  const c = challenges(state).fiftyTwo;
  const i = c.paid.indexOf(week);
  if (i >= 0) c.paid.splice(i, 1); else c.paid.push(week);
  c.paid.sort((a, b) => a - b);
  state.sample = false;
}

// Round-ups for one month: each expense rounded up to the next dollar.
export function roundUpForMonth(state, key) {
  let total = 0;
  const lines = [];
  for (const t of monthTransactions(state, key)) {
    if (t.kind !== 'expense') continue;
    const cents = Math.round(t.amount * 100) % 100;
    if (cents === 0) continue;
    const up = Math.round((100 - cents)) / 100;
    total += up;
    lines.push({ desc: t.description, amount: t.amount, up });
  }
  return { total: Math.round(total * 100) / 100, lines };
}

export function sweepRoundUp(state, key) {
  const c = challenges(state).roundUp;
  if ((c.swept || []).includes(key)) return 0;
  const { total } = roundUpForMonth(state, key);
  if (total <= 0) return 0;
  c.pot = Math.round(((c.pot || 0) + total) * 100) / 100;
  c.swept = (c.swept || []).concat([key]);
  state.sample = false;
  return total;
}

export function movePotToGoal(state) {
  const c = challenges(state).roundUp;
  const pot = Math.round((c.pot || 0) * 100) / 100;
  if (pot <= 0) return 0;
  let goal = state.goals.find((g) => /emergency/i.test(g.name));
  if (!goal) goal = state.goals[0];
  if (!goal) return 0;
  goal.saved = Math.round((goal.saved + pot) * 100) / 100;
  c.pot = 0;
  state.sample = false;
  return pot;
}

export function setChallengeMode(state, mode) {
  const c = challenges(state).fiftyTwo;
  if (!['grow', 'reverse', 'flat'].includes(mode)) return;
  c.mode = mode;
  state.sample = false;
}

export function toggleNoSpend(state, key, day) {
  const c = challenges(state);
  if (!Array.isArray(c.noSpend[key])) c.noSpend[key] = [];
  const days = c.noSpend[key];
  const i = days.indexOf(day);
  if (i >= 0) days.splice(i, 1); else days.push(day);
  days.sort((a, b) => a - b);
  state.sample = false;
}

// Longest run of consecutive marked days in the month.
export function noSpendStreak(days) {
  const set = new Set(days);
  let best = 0, run = 0;
  for (let d = 1; d <= 31; d++) {
    if (set.has(d)) { run++; best = Math.max(best, run); } else run = 0;
  }
  return best;
}

export function renderSavings(state, root) {
  const key = state.currentMonth;
  const c = challenges(state);
  const ch = challengeSaved(state);
  const pct = ch.target ? (ch.saved / ch.target) * 100 : 0;
  const next = nextUnpaidWeek(state);
  const mode = ch.mode;
  const pot = Math.round((c.roundUp.pot || 0) * 100) / 100;
  const swept = (c.roundUp.swept || []).includes(key);
  const ru = roundUpForMonth(state, key);
  const noSpendDays = (c.noSpend[key] || []).slice();
  const [y, m] = key.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const spend = categorySpend(state, key);
  const variable = (spend.groceries || 0) + (spend.dining || 0) + (spend.fun || 0) + (spend.shopping || 0) + (spend.other || 0);
  const dailyVariable = variable / daysInMonth;
  const kept = Math.round(noSpendDays.length * dailyVariable * 100) / 100;
  const streak = noSpendStreak(noSpendDays);
  const t = monthTotals(state, key);

  const weekCells = [];
  for (let w = 1; w <= 52; w++) {
    const paid = c.fiftyTwo.paid.includes(w);
    weekCells.push('<button type="button" class="week-cell' + (paid ? ' paid' : '') + (w === next ? ' next' : '') + '" data-ch-week="' + w + '" aria-pressed="' + paid + '" title="Week ' + w + ' — deposit ' + money(weekAmount(mode, w)) + (paid ? ' (paid)' : '') + '">'
      + '<span class="week-num">' + w + '</span><span class="week-amt">' + money0(weekAmount(mode, w)) + '</span></button>');
  }

  const dayCells = [];
  for (let i = 0; i < firstWeekday; i++) dayCells.push('<span class="day-cell blank" aria-hidden="true"></span>');
  for (let d = 1; d <= daysInMonth; d++) {
    const marked = noSpendDays.includes(d);
    dayCells.push('<button type="button" class="day-cell' + (marked ? ' marked' : '') + '" data-nospend-day="' + d + '" aria-pressed="' + marked + '" title="' + monthLabel(key) + ' ' + d + (marked ? ' — no-spend day' : ' — press to mark a no-spend day') + '">' + d + '</button>');
  }

  const ruLines = ru.lines.slice().sort((a, b) => b.up - a.up).slice(0, 8).map((l) =>
    '<tr><td>' + esc(l.desc) + '</td><td class="amount">' + money(l.amount) + '</td><td class="amount"><span class="pos">+' + money(l.up) + '</span></td></tr>').join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Savings challenges</h1><p class="muted">Small wins, on purpose. Three challenges that turn spare change and quiet days into real savings — every figure comes from this household’s own spending.</p></div>'
    + '<div><a class="btn ghost" href="#/goals">Savings goals →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">52-week challenge</div><div class="kpi-value num">' + money(ch.saved) + '</div><div class="kpi-sub">' + ch.weeksDone + ' of 52 weeks paid · ' + pct.toFixed(0) + '% of ' + money(ch.target) + (next ? ' · next: week ' + next + ' (' + money(weekAmount(mode, next)) + ')' : ' · all 52 weeks paid!') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">No-spend days — ' + monthLabel(key) + '</div><div class="kpi-value num">' + noSpendDays.length + ' days</div><div class="kpi-sub">Best streak ' + streak + ' day' + (streak === 1 ? '' : 's') + ' · roughly ' + money(kept) + ' kept in the household</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Round-up pot</div><div class="kpi-value num">' + money(pot) + '</div><div class="kpi-sub">' + (swept ? 'This month’s round-ups are already in the pot' : money(ru.total) + ' waiting to sweep from ' + monthLabel(key)) + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Saved this month</div><div class="kpi-value num">' + money(t.saved) + '</div><div class="kpi-sub">Income ' + money(t.income) + ' − spent ' + money(t.expense) + ' · challenges ride on top of it</div></div>'
    + '</div>'

    + '<div class="card" style="margin-top:16px"><h2>The 52-week challenge <span class="pill">' + money(ch.target) + ' by week 52</span></h2>'
    + '<p class="muted small" style="margin-top:0">Put a little aside every week. The classic plan starts at $1 and grows by a dollar a week; the reverse plan starts big while motivation is high; the flat plan is $10 every week, no thinking. Press any week to mark it paid — or unmark it if you need the money back.</p>'
    + '<div class="mode-row" role="group" aria-label="Challenge plan">'
    + '<button type="button" class="btn small' + (mode === 'grow' ? ' primary' : ' ghost') + '" data-ch-mode="grow">Growing · $1 → $52</button>'
    + '<button type="button" class="btn small' + (mode === 'reverse' ? ' primary' : ' ghost') + '" data-ch-mode="reverse">Reverse · $52 → $1</button>'
    + '<button type="button" class="btn small' + (mode === 'flat' ? ' primary' : ' ghost') + '" data-ch-mode="flat">Flat · $10 a week</button>'
    + (next ? '<button type="button" class="btn small" data-ch-pay-next="1">Pay week ' + next + ' (' + money(weekAmount(mode, next)) + ')</button>' : '<span class="pill">Challenge complete — $' + ch.target.toLocaleString('en-US') + ' saved!</span>')
    + '</div>'
    + '<div class="challenge-flex"><div class="challenge-ring">' + ringSVG(pct, '#1d6b4f') + '<div class="ring-label"><b>' + Math.round(pct) + '%</b><span>saved</span></div></div>'
    + '<div class="week-grid" role="group" aria-label="52 weeks">' + weekCells.join('') + '</div></div>'
    + '<p class="muted small">Paid weeks are green. ' + money(ch.target - ch.saved) + ' still to go — at ' + money(weekAmount(mode, Math.max(1, next || 52))) + ' a week, the rest takes about ' + (next ? Math.max(1, 52 - ch.weeksDone) : 0) + ' more weeks. The money is yours to hold wherever you keep savings; this page is the record.</p></div>'

    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>No-spend days — ' + monthLabel(key) + '</h2>'
    + '<p class="muted small" style="margin-top:0">A no-spend day is a day with no variable spending at all — no shops, no takeaway, no extras. Bills and rent don’t count. Press a day to mark it; press again to unmark it.</p>'
    + '<div class="weekday-row"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>'
    + '<div class="day-grid">' + dayCells.join('') + '</div>'
    + '<p class="muted small">' + noSpendDays.length + ' no-spend day' + (noSpendDays.length === 1 ? '' : 's') + ' this month · best streak ' + streak + ' · variable spending runs about ' + money(dailyVariable) + ' a day, so these days kept roughly ' + money(kept) + ' in the household.</p></div>'
    + '<div class="card"><h2>Round-up pot</h2>'
    + '<p class="muted small" style="margin-top:0">Every card payment rounded up to the next whole dollar — the spare cents pile up without you noticing. A $46.80 dinner leaves $0.20; a $89.99 jacket leaves $0.01.</p>'
    + '<p style="font-size:1.05rem">In the pot now: <b>' + money(pot) + '</b> · ' + monthLabel(key) + ' round-ups: <b>' + money(ru.total) + '</b> across ' + ru.lines.length + ' purchases.</p>'
    + (ru.lines.length ? '<table><thead><tr><th>Purchase</th><th class="amount">Paid</th><th class="amount">Rounded up</th></tr></thead><tbody>' + ruLines + (ru.lines.length > 8 ? '<tr><td colspan="3" class="muted small">…and ' + (ru.lines.length - 8) + ' more small round-ups this month.</td></tr>' : '') + '</tbody></table>' : '<p class="empty">No round-ups this month yet — every expense landed on a whole dollar.</p>')
    + '<div class="dialog-actions" style="margin-top:12px">'
    + (swept
        ? '<span class="pill">Swept for ' + monthLabel(key) + ' — next sweep opens next month</span>'
        : '<button type="button" class="btn primary" data-roundup-sweep="1"' + (ru.total <= 0 ? ' disabled' : '') + '>Sweep ' + money(ru.total) + ' into the pot</button>')
    + '<button type="button" class="btn" data-pot-to-goal="1"' + (pot <= 0 ? ' disabled' : '') + '>Move ' + money(pot) + ' to the emergency fund</button>'
    + '</div>'
    + '<p class="muted small">Moving the pot into the emergency fund adds it to that goal on the Savings goals page and empties the pot. Sweeping twice in one month is impossible — each month sweeps once.</p></div>'
    + '</div>'

    + '<div class="card" style="margin-top:16px"><h2>Why small challenges work</h2>'
    + '<p>The 52-week challenge ends the year with ' + money(challengeTarget('grow')) + ' from deposits most weeks barely notice. No-spend days attack the spending you never planned — the average household leaks ' + money(dailyVariable) + ' a day on variable spending, so five quiet days a month is roughly ' + money(Math.round(dailyVariable * 5 * 100) / 100) + ' kept. Round-ups are the gentlest of all: ' + money(ru.total) + ' this month from purchases you already made. Stack all three and the household saves hundreds a year without a single big sacrifice.</p>'
    + '<p class="muted small">Tip: pay the 52-week deposit on payday, the same day the salary lands — what leaves first never gets spent.</p></div>';
}
