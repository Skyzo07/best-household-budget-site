// Hearth & Home Budget — streaks & wins: the household's money
// habits told back as streaks, every figure computed live from its
// own records — nothing typed in by hand, nothing made up.
//   * Months inside the budget — January to the month being viewed,
//     each month judged against the household's own total budget.
//   * No-spend streak — days in a row with nothing spent at all,
//     counted from Transactions (a day with no expense row counts).
//   * 52-week challenge — the run of consecutive weeks paid.
//   * One personal challenge per member — banked unspent allowance
//     against that person's own target.
//   * Milestones already reached, and the next one in line.
// Each streak shows its current count, its best, what keeps it alive
// and what breaks it. The two buttons on the page do real work:
// mark today on the no-spend calendar, and pay the next 52-week
// deposit. Lazy-loaded: it only loads when the Streaks nav link is
// opened, so it never touches the first load.
import { money, money0, monthLabel, monthTotals, monthTransactions, shiftMonth, todayISO, networthSummary, subTotals, memberChallengeStore } from './data.js';
import { challengeSaved, nextUnpaidWeek, toggleWeek, toggleNoSpend, weekAmount } from './savings.js';
import { memberBankedTotal, memberBankedThisMonth } from './members.js';
import { drawBars, ringSVG } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---- Months inside the budget ----
// Every month of the year so far, judged against the household's own
// total budget. The streak is the run ending in the month being
// viewed; the best is the longest run anywhere in the year.
export function budgetStreak(state) {
  const year = Number(state.currentMonth.slice(0, 4));
  const curMonth = Number(state.currentMonth.slice(5, 7));
  const totalBudget = Object.values(state.budgets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const months = [];
  for (let m = 1; m <= curMonth; m++) {
    const key = year + '-' + String(m).padStart(2, '0');
    const spent = Math.round(monthTotals(state, key).expense * 100) / 100;
    months.push({ key, label: monthLabel(key), spent, inside: spent <= totalBudget, headroom: Math.round((totalBudget - spent) * 100) / 100 });
  }
  let best = 0, run = 0;
  for (const mo of months) {
    run = mo.inside ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  for (let i = months.length - 1; i >= 0; i--) {
    if (!months[i].inside) break;
    current++;
  }
  const insideCount = months.filter((mo) => mo.inside).length;
  const lowest = months.slice().sort((a, b) => a.spent - b.spent)[0];
  const highest = months.slice().sort((a, b) => b.spent - a.spent)[0];
  return { totalBudget, months, current, best, insideCount, count: months.length, lowest, highest };
}

// ---- No-spend streak ----
// Days of the month being viewed with no expense at all in
// Transactions, up to today. The streak is the run ending today; the
// best is the longest run anywhere in the month so far.
export function noSpendRun(state) {
  const key = state.currentMonth;
  const [y, m] = key.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayDay = Math.min(Number(todayISO().slice(8, 10)), daysInMonth);
  const spentDays = new Set();
  for (const t of monthTransactions(state, key)) {
    if (t.kind === 'expense') spentDays.add(Number(t.date.slice(8, 10)));
  }
  const quiet = [];
  for (let d = 1; d <= todayDay; d++) if (!spentDays.has(d)) quiet.push(d);
  const quietSet = new Set(quiet);
  let best = 0, run = 0;
  for (let d = 1; d <= todayDay; d++) {
    run = quietSet.has(d) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  for (let d = todayDay; d >= 1; d--) {
    if (!quietSet.has(d)) break;
    current++;
  }
  const marked = ((state.challenges && state.challenges.noSpend && state.challenges.noSpend[key]) || []).slice();
  return { todayDay, quiet, quietCount: quiet.length, current, best, marked, markedCount: marked.length, daysInMonth };
}

// ---- 52-week challenge run ----
// The paid weeks are a run when they are consecutive from week 1;
// the streak is how many weeks in a row are paid, ending at the
// highest paid week. Missing one week breaks the run until it is paid.
export function weekRun(state) {
  const ch = challengeSaved(state);
  const paid = new Set((state.challenges && state.challenges.fiftyTwo && state.challenges.fiftyTwo.paid) || []);
  let current = 0;
  for (let w = 1; w <= 52; w++) {
    if (paid.has(w)) current++;
    else break;
  }
  const next = nextUnpaidWeek(state);
  return { saved: ch.saved, target: ch.target, weeksDone: ch.weeksDone, mode: ch.mode, current, best: current, next, nextAmount: next ? weekAmount(ch.mode, next) : 0 };
}

// ---- One personal challenge per member ----
// Progress is the unspent allowance banked into savings — the banked
// records are the progress, so the challenge and the banked money can
// never disagree.
export function memberStreaks(state) {
  const chs = memberChallengeStore(state);
  return (state.allowances || []).map((a) => {
    const c = chs[a.id] || { target: 100, name: a.who + '’s challenge' };
    const banked = memberBankedTotal(state, a.id);
    const thisMonth = memberBankedThisMonth(state, a.id, state.currentMonth);
    const pct = c.target > 0 ? Math.min(100, Math.round((banked / c.target) * 100)) : 0;
    return { id: a.id, who: a.who, name: c.name, target: c.target, banked, thisMonth, pct, done: banked >= c.target };
  });
}

// Mark today on the no-spend calendar (the Savings page's calendar).
// Returns true when today was newly marked.
export function markTodayNoSpend(state) {
  const key = state.currentMonth;
  const day = Math.min(Number(todayISO().slice(8, 10)), new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0).getDate());
  const before = ((state.challenges && state.challenges.noSpend && state.challenges.noSpend[key]) || []).includes(day);
  toggleNoSpend(state, key, day);
  state.sample = false;
  return !before;
}

// Pay the next unpaid 52-week deposit. Returns the week paid, or 0.
export function payNextWeek(state) {
  const next = nextUnpaidWeek(state);
  if (!next) return 0;
  toggleWeek(state, next);
  state.sample = false;
  return next;
}

export function renderStreaks(state, root) {
  const key = state.currentMonth;
  const bs = budgetStreak(state);
  const ns = noSpendRun(state);
  const wk = weekRun(state);
  const members = memberStreaks(state);
  const nw = networthSummary(state);
  const subT = subTotals(state, key);
  const memberTotalBanked = Math.round(members.reduce((a, m) => a + m.banked, 0) * 100) / 100;
  const memberTotalTarget = members.reduce((a, m) => a + m.target, 0);
  const memberPct = memberTotalTarget ? Math.round((memberTotalBanked / memberTotalTarget) * 100) : 0;
  const fund = (state.goals || []).find((g) => /emergency/i.test(g.name)) || (state.goals || [])[0];
  const fundPct = fund && fund.target ? Math.round((fund.saved / fund.target) * 100) : 0;

  // ---- Milestones: reached ones from the household's own records,
  // and the next one in line for each thread. ----
  const reached = [];
  if (nw.firstPositive) reached.push({ label: 'Net worth turned positive', detail: 'Owns ' + money(nw.assets) + ' against ' + money(nw.liabilities) + ' owed — the month the household crossed zero.', when: monthLabel(nw.firstPositive.key) });
  if (bs.insideCount >= 10) reached.push({ label: bs.insideCount + ' months inside the budget', detail: 'Every month of ' + key.slice(0, 4) + ' so far came in under the ' + money(bs.totalBudget) + ' plan — tightest was ' + monthLabel(bs.highest.key) + ' (' + money(bs.highest.spent) + ').', when: monthLabel(bs.months[bs.months.length - 1].key) });
  if (fund && fundPct >= 50) reached.push({ label: 'Emergency fund past halfway', detail: money(fund.saved) + ' of ' + money(fund.target) + ' — ' + fundPct + '% there.', when: 'Reached before ' + monthLabel(key) });
  if (wk.weeksDone >= 20) reached.push({ label: '52-week challenge: ' + wk.weeksDone + ' weeks paid', detail: money(wk.saved) + ' of ' + money(wk.target) + ' saved one small deposit at a time.', when: 'Week ' + wk.weeksDone + ' paid' });
  if (ns.current >= 7) reached.push({ label: 'A full week without spending', detail: ns.current + ' days in a row with nothing spent at all — the longest quiet run this month.', when: 'Running now' });
  const nextMiles = [];
  if (fund) {
    const nextPct = [25, 50, 75, 100].find((p) => fundPct < p);
    if (nextPct) nextMiles.push({ label: 'Emergency fund to ' + nextPct + '%', detail: money(Math.max(0, Math.round((fund.target * nextPct / 100 - fund.saved) * 100) / 100)) + ' to go — ' + money(fund.target * nextPct / 100) + ' of ' + money(fund.target) + '.' });
  }
  if (nw.gap > 0) nextMiles.push({ label: 'Net worth to ' + money(nw.target), detail: money(nw.gap) + ' to go — at the ' + money(nw.pace) + '-a-month pace it lands in ' + monthLabel(nw.targetKey) + '.' });
  if (wk.next) nextMiles.push({ label: '52-week challenge: week ' + wk.next, detail: 'Pay ' + money(wk.nextAmount) + ' and the run reaches ' + (wk.current + 1) + ' weeks — ' + money(wk.target - wk.saved - wk.nextAmount) + ' still to save after it.' });

  const monthDots = bs.months.map((mo) => '<span class="streak-dot' + (mo.inside ? ' in' : ' out') + '" title="' + esc(mo.label) + ' — spent ' + money(mo.spent) + ' of ' + money(bs.totalBudget) + (mo.inside ? ' · inside' : ' · over') + '">' + esc(mo.label.split(' ')[0].slice(0, 3)) + '</span>').join('');

  const dayCells = [];
  for (let d = 1; d <= ns.daysInMonth; d++) {
    const isQuiet = ns.quiet.includes(d);
    const isMarked = ns.marked.includes(d);
    const isToday = d === ns.todayDay;
    dayCells.push('<span class="streak-day' + (isQuiet ? ' quiet' : '') + (isMarked ? ' marked' : '') + (isToday ? ' today' : '') + '" title="' + monthLabel(key) + ' ' + d + (isQuiet ? ' — nothing spent' : ' — spending recorded') + (isMarked ? ' · marked a no-spend day' : '') + (isToday ? ' · today' : '') + '">' + d + '</span>');
  }

  const expenseDays = monthTransactions(state, key).filter((t) => t.kind === 'expense').map((t) => Number(t.date.slice(8, 10)));
  const lastSpendDay = expenseDays.length ? Math.max.apply(null, expenseDays) : 0;
  const lastSpendLine = lastSpendDay
    ? 'The last spending was ' + fmtDate(key + '-' + String(lastSpendDay).padStart(2, '0')) + ', and every day since has been quiet.'
    : 'Nothing spent at all in ' + monthLabel(key) + ' yet — the whole month so far has been quiet.';

  const memberRows = members.map((m) => '<div class="bar-row"><div class="bar-top"><span><b>' + esc(m.who) + '</b> <span class="muted">· ' + esc(m.name) + '</span></span><span>' + money(m.banked) + ' of ' + money(m.target) + ' · ' + m.pct + '%</span></div>'
    + '<div class="bar"><i style="width:' + m.pct + '%"></i></div>'
    + '<p class="muted small" style="margin:4px 0 0">' + (m.done ? 'Challenge complete — ' + esc(m.who) + ' banked the whole target.' : m.thisMonth > 0 ? 'Banked ' + money(m.thisMonth) + ' this month · ' + money(Math.max(0, m.target - m.banked)) + ' to go — bank unspent allowance before the month ends.' : 'Nothing banked this month yet · ' + money(Math.max(0, m.target - m.banked)) + ' to go — bank unspent allowance before the month ends.') + ' <a href="#/members/' + m.id + '">' + esc(m.who) + '’s page →</a></p></div>').join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Streaks &amp; wins</h1><p class="muted">The household’s money habits, told back as streaks. Every number below is worked out from the household’s own records — the months it stayed inside the budget, the days nothing was spent, the weeks it kept paying into the challenge, and what each person has banked. A streak is only as honest as the records behind it.</p></div>'
    + '<div><a class="btn ghost" href="#/savings">Savings challenges →</a> <a class="btn plain" href="#/checkin">Weekly check-in →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Months inside budget</div><div class="kpi-value num">' + bs.current + ' in a row</div><div class="kpi-sub">' + bs.insideCount + ' of ' + bs.count + ' months this year · best run ' + bs.best + ' · tightest month ' + monthLabel(bs.highest.key) + ' (' + money(bs.highest.spent) + ')</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">No-spend streak</div><div class="kpi-value num">' + ns.current + ' day' + (ns.current === 1 ? '' : 's') + '</div><div class="kpi-sub">' + ns.quietCount + ' quiet days so far in ' + monthLabel(key) + ' · best run ' + ns.best + ' day' + (ns.best === 1 ? '' : 's') + ' · ' + ns.markedCount + ' days marked on the calendar</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">52-week challenge</div><div class="kpi-value num">' + wk.current + ' weeks in a row</div><div class="kpi-sub">' + money(wk.saved) + ' of ' + money(wk.target) + ' · ' + wk.weeksDone + ' of 52 weeks paid · next week ' + (wk.next ? wk.next + ' is ' + money(wk.nextAmount) : '— all paid!') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Everyone’s challenges</div><div class="kpi-value num">' + money(memberTotalBanked) + '</div><div class="kpi-sub">Banked into savings across ' + members.length + ' people · ' + memberPct + '% of ' + money(memberTotalTarget) + ' in targets · ' + members.filter((m) => m.done).length + ' of ' + members.length + ' complete</div></div>'
    + '</div>'

    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Months inside the budget <a href="#/budgets">Budgets →</a></h2>'
    + '<p style="margin-top:0">' + bs.insideCount + ' of ' + bs.count + ' months in ' + key.slice(0, 4) + ' came in under the ' + money(bs.totalBudget) + ' plan — the current run is <b>' + bs.current + ' months</b>, and the best run is ' + bs.best + '.</p>'
    + '<p class="streak-dots">' + monthDots + '</p>'
    + '<div class="chart-wrap"><canvas id="chart-streaks-budget" class="chart" height="200" aria-label="Monthly spending against the budget"></canvas></div>'
    + '<p class="muted small">Green is a month inside the plan. Cheapest month: ' + monthLabel(bs.lowest.key) + ' (' + money(bs.lowest.spent) + '). Most expensive: ' + monthLabel(bs.highest.key) + ' (' + money(bs.highest.spent) + ') — still ' + money(bs.highest.headroom) + ' inside the plan.</p>'
    + '<p class="goal-mile"><b>What keeps it alive:</b> December stays under ' + money(bs.totalBudget) + ' — the fixed bills alone are ' + money(1450 + 132.40 + 58.20 + 79 + 120) + ', so the flexible spending has ' + money(bs.totalBudget - (1450 + 132.40 + 58.20 + 79 + 120)) + ' of room. <b>What breaks it:</b> any month over ' + money(bs.totalBudget) + ' — one big unplanned spend resets the run to zero.</p></div>'
    + '<div class="card"><h2>No-spend streak <a href="#/savings">No-spend calendar →</a></h2>'
    + '<p style="margin-top:0"><b>' + ns.current + ' day' + (ns.current === 1 ? '' : 's') + ' in a row</b> with nothing spent at all — counted from Transactions, not from memory. ' + lastSpendLine + '</p>'
    + '<div class="weekday-row"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>'
    + '<div class="day-grid">' + dayCells.join('') + '</div>'
    + '<p class="muted small">' + ns.quietCount + ' quiet days in ' + monthLabel(key) + ' · best run ' + ns.best + ' day' + (ns.best === 1 ? '' : 's') + ' · ' + ns.markedCount + ' days marked on the no-spend calendar (green ring).</p>'
    + '<p><button type="button" class="btn small" data-streak-nospend="1">Mark today a no-spend day</button></p>'
    + '<p class="goal-mile"><b>What keeps it alive:</b> one more quiet day — shop from the pantry, cook at home, skip the top-up run. <b>What breaks it:</b> any spending at all, even the weekly grocery shop — a planned shop ends the run, so a long run is a run of planned quiet days, not a run of going without.</p></div>'
    + '</div>'

    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>52-week challenge <a href="#/savings">Challenge →</a></h2>'
    + '<div class="challenge-flex"><div class="challenge-ring">' + ringSVG(wk.target ? (wk.saved / wk.target) * 100 : 0, '#1d6b4f') + '<div class="ring-label"><b>' + Math.round(wk.target ? (wk.saved / wk.target) * 100 : 0) + '%</b><span>saved</span></div></div>'
    + '<div><p style="margin-top:0"><b>' + wk.current + ' weeks in a row</b> paid — weeks 1 to ' + wk.weeksDone + ' without a miss, ' + money(wk.saved) + ' of ' + money(wk.target) + '.</p>'
    + (wk.next
      ? '<p><button type="button" class="btn small" data-streak-pay-week="1">Pay week ' + wk.next + ' (' + money(wk.nextAmount) + ')</button></p>'
      : '<p><span class="pill">Challenge complete — ' + money(wk.target) + ' saved!</span></p>')
    + '<p class="goal-mile"><b>What keeps it alive:</b> pay week ' + (wk.next || 52) + ' (' + money(wk.nextAmount) + ') before the week ends — payday is the day to do it. <b>What breaks it:</b> a missed week. The money can be paid late, but the run only counts weeks paid in order.</p></div></div></div>'
    + '<div class="card"><h2>Everyone’s challenges <a href="#/members">Household members →</a></h2>'
    + '<p class="muted small" style="margin-top:0">Each person’s own target, filled by banking unspent allowance — the banked records are the progress. ' + money(memberTotalBanked) + ' banked so far, ' + money(Math.max(0, memberTotalTarget - memberTotalBanked)) + ' still to go across the household.</p>'
    + memberRows
    + '<p class="goal-mile"><b>What keeps them alive:</b> bank the unspent allowance before the month ends — what stays in the pocket gets spent. <b>What breaks them:</b> a month the allowance is spent in full banks $0, and the target date slips a month.</p></div>'
    + '</div>'

    + '<div class="card" style="margin-top:16px"><h2>Milestones already reached</h2>'
    + '<p class="muted small" style="margin-top:0">Wins the household has already banked — each one from its own records, with the month it happened.</p>'
    + '<ul class="tx-list">' + reached.map((m) => '<li><span class="tx-ico" style="background:#1d6b4f22;color:#1d6b4f">✓</span><span class="tx-main"><b>' + esc(m.label) + '</b><span>' + esc(m.detail) + '</span></span><span class="tx-amt pos">' + esc(m.when) + '</span></li>').join('') + '</ul>'
    + '<h3 style="margin-top:14px">Next in line</h3>'
    + '<ul class="tx-list">' + nextMiles.map((m) => '<li><span class="tx-ico" style="background:#d9a44122;color:#9a6b12">→</span><span class="tx-main"><b>' + esc(m.label) + '</b><span>' + esc(m.detail) + '</span></span></li>').join('') + '</ul>'
    + (subT.totalSaving > 0 ? '<p class="muted small">One more win on the table: the subscription audit says cancelling the unused and downgrading the barely-used saves <b>' + money(subT.totalSaving) + ' a year</b> — ' + subT.cancelCount + ' to cancel, ' + subT.downgradeCount + ' to downgrade. <a href="#/subscriptions">See the audit →</a></p>' : '')
    + '</div>';
  const budgetCanvas = root.querySelector('#chart-streaks-budget');
  if (budgetCanvas) {
    drawBars(budgetCanvas, bs.months.map((mo) => ({ label: mo.label.split(' ')[0].slice(0, 3), value: mo.spent, color: mo.inside ? '#1d6b4f' : '#b3382e' })), { valueLabel: (v) => money0(v) });
  }
}
