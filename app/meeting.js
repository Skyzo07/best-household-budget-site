// Hearth & Home Budget — monthly money meeting: once a month, around
// the table. The page builds the agenda itself from the household's
// own records — the wins are the year's own numbers (months inside
// the budget, the net-worth crossing, the 52-week run, the auto-save
// total), the flags are this month's (the category with cents of
// slack, the week that ran over, the bills past their due day, the
// subscriptions the audit flags, the dearest debt), and the decisions
// are the ones those figures force: cancel or downgrade a
// subscription, raise the debt extra, move money toward a big
// purchase, pay the next challenge week. Saying yes DOES the thing —
// it cancels the subscription, raises the extra payment, moves the
// money, pays the week — and the page it lands on already shows it.
// The notes save as you type, the meeting can be marked done, and
// the next meeting is the first Sunday of next month. Lazy-loaded:
// it only loads when the Money meeting nav link is opened, so it
// never touches the first load.
import { categorySpend, meetingForMonth, money, monthEndISO, monthLabel, monthTotals, networthSummary, subscriptionStore, subVerdict, subYearly, todayISO } from './data.js';
import { reviewSummary } from './review.js';
import { budgetStreak, noSpendRun, payNextWeek, weekRun } from './streaks.js';
import { weekRanges, weekSummary } from './checkin.js';
import { simulatePayoff } from './debt.js';
import { autosaveSummary } from './autosave.js';
import { cancelSub, downgradeSub } from './subscriptions.js';
import { effectiveSaved } from './bigbuys.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDayMonth(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// The first Sunday of next month — the meeting's standing date, so
// the next meeting never needs a diary check to set.
export function firstSundayNextMonth(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function subById(state, id) {
  return subscriptionStore(state).find((s) => s.id === id) || null;
}

// ---- The decisions on the table ----
// Each one is generated from live figures and carries its own effect:
// deciding yes runs the effect once, and the page the effect lands
// on already shows it. A decision whose subject has gone away (a
// subscription deleted on its own page, a purchase already funded)
// simply leaves the table — the agenda never shows a dead question.
export function decisionDefs(state) {
  const key = state.currentMonth;
  const ref = monthEndISO(key);
  const defs = [];
  const subs = subscriptionStore(state);
  const subDef = (id, kind) => {
    const s = subs.find((x) => x.id === id);
    if (!s) return null;
    const v = subVerdict(s, ref);
    const yearly = subYearly(s);
    if (kind === 'cancel') {
      return {
        id: 'mt-cancel-' + id.replace('sub-', ''),
        kind: 'cancel',
        title: 'Cancel ' + s.name,
        figure: 'Last used ' + fmtDate(s.lastUsed) + ' — ' + v.days + ' days ago. ' + money(s.monthly) + ' a month, ' + money(yearly) + ' a year, and nothing coming back for it.',
        yesLine: 'Decide yes and it is cancelled on the spot — the Subscriptions page shows it cancelled and the ' + money(yearly) + ' a year stops.',
        link: '#/subscriptions',
        linkLabel: 'Subscription audit →',
        yearlySaving: yearly,
        apply: () => { cancelSub(state, id); state.sample = false; return 'Cancelled — ' + s.name + ' is off the bill list.'; },
        doneNote: () => {
          const now = subById(state, id);
          return now && now.status === 'cancelled'
            ? 'Decided yes — cancelled, and the Subscriptions page shows it.'
            : 'Decided yes, but this subscription is active again — it can be cancelled on the Subscriptions page.';
        },
      };
    }
    return {
      id: 'mt-downgrade-' + id.replace('sub-', ''),
      kind: 'downgrade',
      title: 'Downgrade ' + s.name,
      figure: 'Last used ' + fmtDate(s.lastUsed) + ' — ' + v.days + ' days ago. ' + money(s.monthly) + ' a month; a cheaper tier halves it and saves ' + money(Math.round(yearly / 2 * 100) / 100) + ' a year.',
      yesLine: 'Decide yes and it drops to the cheaper tier on the spot — the Subscriptions page shows it downgraded.',
      link: '#/subscriptions',
      linkLabel: 'Subscription audit →',
      yearlySaving: Math.round(yearly / 2 * 100) / 100,
      apply: () => { downgradeSub(state, id); state.sample = false; return 'Downgraded — ' + s.name + ' now costs half.'; },
      doneNote: () => {
        const now = subById(state, id);
        return now && now.downgraded
          ? 'Decided yes — downgraded, and the Subscriptions page shows it at half price.'
          : 'Decided yes, but the tier is back to full price — it can be downgraded on the Subscriptions page.';
      },
    };
  };
  const cancel1 = subDef('sub-duolingo', 'cancel');
  const cancel2 = subDef('sub-natgeo', 'cancel');
  const down1 = subDef('sub-googleone', 'downgrade');
  const down2 = subDef('sub-xbox', 'downgrade');
  for (const d of [cancel1, cancel2, down1, down2]) if (d) defs.push(d);

  // ---- The debt extra: $50 now, $100 on the table ----
  const extra = Number(state.payoffExtra) || 0;
  const debts = state.debts || [];
  if (debts.length && extra < 100) {
    const now = simulatePayoff(debts, extra, 'avalanche', key);
    const raised = simulatePayoff(debts, 100, 'avalanche', key);
    const card = (debts.find((d) => d.id === 'debt-card') || debts[0]);
    defs.push({
      id: 'mt-debt-extra',
      kind: 'debt',
      title: 'Raise the debt extra to $100 a month',
      figure: 'At ' + money(extra) + ' extra a month the household is debt-free in ' + monthLabel(now.payoffKey) + ', paying ' + money(now.interest) + ' of interest. At $100: ' + monthLabel(raised.payoffKey) + ', ' + money(raised.interest) + ' — ' + money(Math.max(0, Math.round((now.interest - raised.interest) * 100) / 100)) + ' less interest, ' + Math.max(0, now.months - raised.months) + ' months sooner. The credit card (' + money(card.balance) + ' at ' + card.apr + '% APR) clears in ' + (raised.perDebt.find((p) => p.id === card.id) || {}).months + ' months instead of ' + (now.perDebt.find((p) => p.id === card.id) || {}).months + '.',
      yesLine: 'Decide yes and the extra payment is $100 from this month — the Reports page already shows the new debt-free date.',
      link: '#/reports',
      linkLabel: 'Debt payoff planner →',
      yearlySaving: 0,
      interestSaving: Math.max(0, Math.round((now.interest - raised.interest) * 100) / 100),
      apply: () => { state.payoffExtra = 100; state.sample = false; return 'Extra payment raised to $100 a month — debt-free ' + monthLabel(raised.payoffKey) + ' now.'; },
      doneNote: () => (Number(state.payoffExtra) || 0) >= 100
        ? 'Decided yes — the extra payment is ' + money(Number(state.payoffExtra) || 0) + ' a month, and the Reports page shows the new date.'
        : 'Decided yes, but the extra payment is back at ' + money(Number(state.payoffExtra) || 0) + ' — raise it on the Reports page.',
    });
  }

  // ---- The washing machine: $100 from the holiday fund ----
  const washer = (state.bigbuys || []).find((b) => b.id === 'bb-washer');
  const holiday = (state.goals || []).find((g) => g.id === 'goal-holiday');
  if (washer && holiday) {
    const washerSaved = effectiveSaved(state, washer);
    const short = Math.round((washer.cost - washerSaved) * 100) / 100;
    if (short > 0 && holiday.saved >= 100) {
      defs.push({
        id: 'mt-washer-move',
        kind: 'move',
        title: 'Move $100 from the holiday fund to the washing machine',
        figure: 'The washing machine needs ' + money(washer.cost) + ' by ' + fmtDate(washer.target) + ' and has ' + money(washerSaved) + ' set aside — ' + money(short) + ' to go. The holiday fund holds ' + money(holiday.saved) + ' for a July trip. Moving $100 now puts the machine at ' + money(washerSaved + 100) + ' and the holiday at ' + money(holiday.saved - 100) + '.',
        yesLine: 'Decide yes and the $100 moves on the spot — the Goals and Big purchases pages already agree.',
        link: '#/bigbuys',
        linkLabel: 'Big purchases →',
        yearlySaving: 0,
        apply: () => {
          const h = (state.goals || []).find((g) => g.id === 'goal-holiday');
          const w = (state.bigbuys || []).find((b) => b.id === 'bb-washer');
          if (!h || !w || h.saved < 100) return 'The holiday fund is under $100 now — nothing moved.';
          h.saved = Math.round((h.saved - 100) * 100) / 100;
          w.saved = Math.round(((w.saved || 0) + 100) * 100) / 100;
          state.sample = false;
          return 'Moved $100 — washing machine pot ' + money(effectiveSaved(state, w)) + ', holiday fund ' + money(h.saved) + '.';
        },
        doneNote: () => {
          const h = (state.goals || []).find((g) => g.id === 'goal-holiday');
          const w = (state.bigbuys || []).find((b) => b.id === 'bb-washer');
          return 'Decided yes — the washing machine pot is ' + money(w ? effectiveSaved(state, w) : 0) + ' now and the holiday fund ' + money(h ? h.saved : 0) + '.';
        },
      });
    }
  }

  // ---- Groceries: keep the $620 budget ----
  const spend = categorySpend(state, key);
  const grocSpent = Math.round((spend.groceries || 0) * 100) / 100;
  const grocBudget = Number(state.budgets.groceries) || 0;
  if (grocBudget > 0) {
    const slack = Math.round((grocBudget - grocSpent) * 100) / 100;
    defs.push({
      id: 'mt-groceries-keep',
      kind: 'commit',
      title: 'Keep the groceries budget at ' + money(grocBudget) + ' for December',
      figure: slack >= 0
        ? 'Groceries used ' + money(grocSpent) + ' of the ' + money(grocBudget) + ' budget — ' + money(slack) + ' of slack. One unplanned shop breaks it, and the month still lands inside the plan.'
        : 'Groceries ran ' + money(Math.abs(slack)) + ' over the ' + money(grocBudget) + ' budget — the limit needs a look, not a shrug.',
      yesLine: 'Decide yes and the household commits: keep the ' + money(grocBudget) + ' budget for December and plan next week’s shop from the pantry first.',
      link: '#/grocery',
      linkLabel: 'Groceries & meals →',
      yearlySaving: 0,
      apply: null,
      doneNote: () => 'Decided yes — committed: ' + money(grocBudget) + ' for December, pantry-first shop.',
    });
  }

  // ---- The 52-week challenge: pay next week at the table ----
  const wk = weekRun(state);
  if (wk.next) {
    defs.push({
      id: 'mt-pay-week',
      kind: 'challenge',
      title: 'Pay week ' + wk.next + ' of the 52-week challenge now (' + money(wk.nextAmount) + ')',
      figure: 'The challenge is ' + wk.weeksDone + ' weeks in, ' + money(wk.saved) + ' of ' + money(wk.target) + ' — one deposit a week without a miss. Week ' + wk.next + ' is ' + money(wk.nextAmount) + ' — pay it at the meeting and the run reaches ' + (wk.current + 1) + ' weeks.',
      yesLine: 'Decide yes and week ' + wk.next + ' is paid on the spot — the Streaks page shows the run at ' + (wk.current + 1) + ' weeks.',
      link: '#/streaks',
      linkLabel: 'Streaks & wins →',
      yearlySaving: 0,
      apply: () => {
        const paid = payNextWeek(state);
        if (!paid) return 'All 52 weeks are already paid — nothing left to pay.';
        state.sample = false;
        return 'Week ' + paid + ' paid — ' + money(wk.saved + wk.nextAmount) + ' saved in the challenge now.';
      },
      doneNote: () => {
        const now = weekRun(state);
        return 'Decided yes — the challenge is at week ' + now.weeksDone + ' now, ' + money(now.saved) + ' saved.';
      },
    });
  }
  return defs;
}

// ---- What a decision does when the household says yes ----
// Returns { changed, effect, choice }. The effect runs only on the
// transition INTO yes — deciding yes twice does not move the money
// twice, and changing a yes to a no leaves what already happened in
// place (cancelled stays cancelled, moved stays moved); undo it on
// the page it landed on.
export function applyDecision(state, id, choice) {
  if (choice !== 'yes' && choice !== 'no' && choice !== 'later') return { changed: false, effect: '', choice: '' };
  const def = decisionDefs(state).find((d) => d.id === id);
  if (!def) return { changed: false, effect: '', choice: '' };
  const m = meetingForMonth(state, state.currentMonth);
  const prev = m.decisions[id] || '';
  if (prev === choice) return { changed: false, effect: '', choice };
  m.decisions[id] = choice;
  state.sample = false;
  let effect = '';
  if (choice === 'yes' && prev !== 'yes' && typeof def.apply === 'function') effect = def.apply(state) || '';
  return { changed: true, effect, choice };
}

// ---- The wins and the flags, both computed live ----
export function renderMeeting(state, root) {
  const key = state.currentMonth;
  const t = monthTotals(state, key);
  const rate = t.income ? (t.saved / t.income * 100) : 0;
  const bs = budgetStreak(state);
  const wk = weekRun(state);
  const ns = noSpendRun(state);
  const rev = reviewSummary(state);
  const as = autosaveSummary(state);
  const nw = networthSummary(state);
  const m = meetingForMonth(state, key);
  const defs = decisionDefs(state);
  const decided = defs.filter((d) => m.decisions[d.id]);
  const yesCount = defs.filter((d) => m.decisions[d.id] === 'yes').length;
  const noCount = defs.filter((d) => m.decisions[d.id] === 'no').length;
  const laterCount = defs.filter((d) => m.decisions[d.id] === 'later').length;
  const subSaving = Math.round(defs.reduce((a, d) => a + (d.yearlySaving || 0), 0) * 100) / 100;
  const interestSaving = Math.round(defs.reduce((a, d) => a + (d.interestSaving || 0), 0) * 100) / 100;
  const nextDefault = firstSundayNextMonth(key);
  const nextDate = m.nextDate || nextDefault;
  const todayDay = Number(todayISO().slice(8, 10));
  const ref = monthEndISO(key);

  // ---- Wins: the year's own numbers, good news first ----
  const wins = [];
  wins.push({ title: bs.insideCount + ' of ' + bs.count + ' months inside the ' + money(bs.totalBudget) + ' plan', detail: 'Best run ' + bs.best + ' months · tightest month ' + monthLabel(bs.highest.key) + ' (' + money(bs.highest.spent) + ', still ' + money(bs.highest.headroom) + ' inside).' });
  if (nw.firstPositive) wins.push({ title: 'Net worth positive since ' + monthLabel(nw.firstPositive.key), detail: 'Crossed zero in April with ' + money(nw.firstPositive.net) + ' — now ' + money(nw.net) + ' after ' + money(nw.liabilities) + ' owed.' });
  wins.push({ title: '52-week challenge: ' + wk.weeksDone + ' weeks, ' + money(wk.saved) + ' saved', detail: 'One deposit a week without a miss — ' + money(wk.target - wk.saved) + ' still to save, and the run is the longest habit in the house.' });
  wins.push({ title: 'Auto-save moved ' + money(as.total) + ' in 2026', detail: money(as.monthlyFixed) + ' a month on payday, plus the round-ups on the last day — ' + as.activeCount + ' of ' + as.rules.length + ' rules active.' });
  wins.push({ title: 'No-spend streak: ' + ns.current + ' days in a row', detail: ns.quietCount + ' quiet days in ' + monthLabel(key) + ', ' + ns.markedCount + ' marked on the calendar — the longest quiet run this month.' });
  wins.push({ title: 'Best month: ' + rev.best.label + ' — ' + money(rev.best.saved) + ' saved', detail: 'Saved ' + money(rev.totSaved) + ' across the year so far, a ' + rev.rate.toFixed(1) + '% savings rate — more than double the 20% rule of thumb.' });

  // ---- Flags: this month's, each one with a number on it ----
  const flags = [];
  const spend = categorySpend(state, key);
  const grocSpent = Math.round((spend.groceries || 0) * 100) / 100;
  const grocBudget = Number(state.budgets.groceries) || 0;
  if (grocBudget > 0) {
    const slack = Math.round((grocBudget - grocSpent) * 100) / 100;
    if (slack < 20) flags.push({ title: slack >= 0 ? 'Groceries used ' + money(grocSpent) + ' of ' + money(grocBudget) + ' — ' + money(slack) + ' of slack' : 'Groceries ran ' + money(Math.abs(slack)) + ' over the ' + money(grocBudget) + ' budget', detail: 'One unplanned shop breaks it, and the month still lands inside the plan — the decision below is whether to hold the line at ' + money(grocBudget) + ' for December.' });
  }
  const weekSums = weekRanges(key).map((w) => weekSummary(state, w.key)).filter(Boolean);
  const overWeeks = weekSums.filter((s) => s.flexDiff > 0).sort((a, b) => b.flexDiff - a.flexDiff);
  const backWeeks = weekSums.filter((s) => s.flexSpent > 0 && s.flexDiff < 0).sort((a, b) => a.flexDiff - b.flexDiff);
  if (overWeeks.length) {
    const worst = overWeeks[0];
    flags.push({ title: 'Week ' + worst.week.n + ' (' + worst.week.range + ') ran ' + money(worst.flexDiff) + ' over its flexible share', detail: money(worst.flexSpent) + ' against a ' + money(worst.flexShare) + ' share — ' + worst.overRows.map((r) => esc(r.cat.label) + ' +' + money(r.diff)).join(', ') + '.' + (backWeeks.length ? ' Week ' + backWeeks[0].week.n + ' pulled ' + money(Math.abs(backWeeks[0].flexDiff)) + ' of it back.' : '') });
  }
  const overdue = (state.bills || []).filter((b) => !(b.paidMonths || []).includes(key) && Number(b.day) < todayDay);
  if (overdue.length) {
    const total = Math.round(overdue.reduce((a, b) => a + (Number(b.amount) || 0), 0) * 100) / 100;
    flags.push({ title: overdue.length + ' bill' + (overdue.length === 1 ? '' : 's') + ' past ' + (overdue.length === 1 ? 'its' : 'their') + ' due day — ' + money(total) + ' to pay', detail: overdue.map((b) => esc(b.name) + ' ' + money(b.amount) + ' (due ' + fmtDayMonth(key + '-' + String(b.day).padStart(2, '0')) + ')').join(', ') + '. Pay them on the Bills page, or switch them on auto-pay so it never happens again.' });
  }
  const cancelSubs = subscriptionStore(state).filter((s) => s.status !== 'cancelled' && subVerdict(s, ref).kind === 'cancel');
  if (cancelSubs.length) {
    const monthly = Math.round(cancelSubs.reduce((a, s) => a + (Number(s.monthly) || 0), 0) * 100) / 100;
    const yearly = Math.round(cancelSubs.reduce((a, s) => a + subYearly(s), 0) * 100) / 100;
    flags.push({ title: cancelSubs.length + ' subscription' + (cancelSubs.length === 1 ? '' : 's') + ' the audit says cancel — ' + money(monthly) + ' a month', detail: cancelSubs.map((s) => esc(s.name) + ' (' + money(s.monthly) + '/mo, last used ' + fmtDate(s.lastUsed) + ')').join(', ') + ' — ' + money(yearly) + ' a year back if the decisions below go yes.' });
  }
  const card = (state.debts || []).find((d) => d.id === 'debt-card') || (state.debts || []).slice().sort((a, b) => (b.apr || 0) - (a.apr || 0))[0];
  if (card) {
    const sim = simulatePayoff(state.debts, Number(state.payoffExtra) || 0, 'avalanche', key);
    const cardSim = sim.perDebt.find((p) => p.id === card.id);
    flags.push({ title: 'The ' + card.name.toLowerCase() + ' still owes ' + money(card.balance) + ' at ' + card.apr + '% APR', detail: 'Avalanche pays it first — it clears in ' + (cardSim ? cardSim.months : '—') + ' months at the current extra payment of ' + money(Number(state.payoffExtra) || 0) + ' a month. The decision below is whether to raise that to $100.' });
  }

  // ---- Decisions ----
  const choicePill = (d) => {
    const c = m.decisions[d.id] || '';
    if (c === 'yes') return '<span class="pill">Decided: yes ✓</span>';
    if (c === 'no') return '<span class="pill over">Decided: no</span>';
    if (c === 'later') return '<span class="pill warn">Decide later</span>';
    return '<span class="pill">Not decided yet</span>';
  };
  const decCards = defs.map((d) => {
    const c = m.decisions[d.id] || '';
    const btn = (choice, label) => '<button type="button" class="btn small ' + (c === choice ? 'primary' : 'ghost') + '" data-mt-decide="' + d.id + ':' + choice + '"' + (c === choice ? ' aria-pressed="true"' : '') + '>' + label + '</button>';
    return '<div class="card"><h2 style="margin-top:0">' + esc(d.title) + ' ' + choicePill(d) + '</h2>'
      + '<p style="margin-top:0">' + esc(d.figure) + '</p>'
      + '<p class="muted small">' + esc(d.yesLine) + '</p>'
      + (c === 'yes' && typeof d.doneNote === 'function' ? '<div class="tip good"><strong>Done:</strong> ' + esc(d.doneNote()) + '</div>' : '')
      + (c === 'yes' ? '<p class="muted small">A yes already happened — changing it to no or later records the change, but does not undo what moved. Undo it on the page it landed on.</p>' : '')
      + '<p>' + btn('yes', 'Yes — do it') + ' ' + btn('no', 'No') + ' ' + btn('later', 'Decide later') + ' <a class="btn small ghost" href="' + d.link + '">' + esc(d.linkLabel) + '</a></p></div>';
  }).join('');

  const yesParts = [];
  if (subSaving > 0) yesParts.push(money(subSaving) + ' a year back from subscriptions');
  if (interestSaving > 0) yesParts.push(money(interestSaving) + ' less interest on the debts');
  if (defs.some((d) => d.id === 'mt-washer-move')) yesParts.push('$100.00 closer to the washing machine');
  if (defs.some((d) => d.id === 'mt-pay-week')) yesParts.push('week ' + wk.next + ' of the challenge paid');
  const yesLine = yesParts.length > 1
    ? 'If every decision goes yes: ' + yesParts.slice(0, -1).join(', ') + ', and ' + yesParts[yesParts.length - 1] + '.'
    : yesParts.length === 1 ? 'If every decision goes yes: ' + yesParts[0] + '.' : '';

  const attendees = (state.allowances || []).map((a) => esc(a.who) + ' (' + esc(a.role || 'household') + ')').join(', ');

  const winRows = wins.map((w) => '<div class="mt-row"><span class="mt-ico good">✓</span><div class="mt-body"><b>' + esc(w.title) + '</b><span>' + esc(w.detail) + '</span></div></div>').join('');
  const flagRows = flags.length ? flags.map((f) => '<div class="mt-row"><span class="mt-ico flag">!</span><div class="mt-body"><b>' + esc(f.title) + '</b><span>' + esc(f.detail) + '</span></div></div>').join('') : '<p class="empty">Nothing flagged this month — every category, week and bill is where it should be.</p>';

  root.innerHTML =
    '<div class="page-head"><div><h1>Money meeting — ' + monthLabel(key) + '</h1><p class="muted">Once a month, around the table: what went well, what needs a decision, and who does what next. Everything below is worked out from this household’s own records — the wins are the year’s own numbers, the flags are this month’s, and every decision does something real when the household says yes. At the table: ' + attendees + '.</p></div>'
    + '<div>' + (m.doneOn ? '<span class="pill">Meeting done — ' + fmtDate(m.doneOn) + '</span> <button type="button" class="btn ghost" data-mt-reopen="1">Reopen the meeting</button>' : '<button type="button" class="btn primary" data-mt-done="1">Mark this meeting done</button>') + '</div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Money in · ' + monthLabel(key) + '</div><div class="kpi-value num">' + money(t.income) + '</div><div class="kpi-sub">Spent ' + money(t.expense) + ' · saved ' + money(t.saved) + ' (' + rate.toFixed(1) + '% of income)</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Decisions made</div><div class="kpi-value num">' + decided.length + ' of ' + defs.length + '</div><div class="kpi-sub">' + yesCount + ' yes · ' + noCount + ' no · ' + laterCount + ' later' + (decided.length < defs.length ? ' · ' + (defs.length - decided.length) + ' still open' : ' · the agenda is settled') + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Wins to celebrate</div><div class="kpi-value num">' + wins.length + '</div><div class="kpi-sub">' + esc(wins[0].title) + '</div></div>'
    + '<div class="card kpi' + (flags.length ? ' warn' : ' good') + '"><div class="kpi-label">Flags to settle</div><div class="kpi-value num">' + flags.length + '</div><div class="kpi-sub">' + (subSaving > 0 ? 'Worth ' + money(subSaving) + ' a year if the subscription decisions go yes' : 'Nothing on the table costs money this month') + '</div></div>'
    + '</div>'

    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Wins — what went well</h2><p class="muted small" style="margin-top:0">Start with the good news: every line below is the household’s own record, not a pep talk.</p>' + winRows + '</div>'
    + '<div class="card"><h2>Flags — what needs a decision</h2><p class="muted small" style="margin-top:0">Nothing here is a scolding — each flag is a number with a decision attached below it.</p>' + flagRows + '</div>'
    + '</div>'

    + '<div class="card" style="margin-top:16px"><h2>The agenda — ' + defs.length + ' decisions</h2>'
    + '<p class="muted small" style="margin-top:0">One decision at a time. Saying yes does the thing at once — it cancels the subscription, raises the extra payment, moves the money, pays the week — and the page it lands on already shows it. Saying no or later just records the choice; nothing moves. ' + esc(yesLine) + '</p></div>'
    + '<div style="margin-top:16px;display:grid;gap:16px">' + decCards + '</div>'

    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>Notes from the table</h2>'
    + '<p class="muted small" style="margin-top:0">Who said what, what got promised, what to check next time. Saves as you type — it lives in this browser with the budgets.</p>'
    + '<label>Meeting notes <textarea id="mt-notes" rows="4" maxlength="300" placeholder="e.g. Maya will call the school about term 1 fees before Friday.">' + esc(m.notes) + '</textarea></label>'
    + '<p><label class="inline-label">Next meeting <input id="mt-next-date" type="date" value="' + esc(nextDate) + '"></label></p>'
    + '<p class="muted small">Standing date: the first Sunday of next month (' + fmtDate(nextDefault) + '). Change it and the new date sticks — the next meeting opens on whatever is written here.</p>'
    + '<p>' + (m.doneOn ? '<span class="pill">Meeting done — ' + fmtDate(m.doneOn) + '</span> <button type="button" class="btn ghost" data-mt-reopen="1">Reopen the meeting</button>' : '<button type="button" class="btn primary" data-mt-done="1">Mark this meeting done</button>') + '</p></div>'
    + '<div class="card"><h2>What happens after the meeting</h2>'
    + '<p>A yes already happened — the subscription is cancelled, the extra payment is raised, the $100 has moved, the week is paid. Check the pages they landed on: <a href="#/subscriptions">Subscriptions</a>, <a href="#/reports">Reports</a>, <a href="#/bigbuys">Big purchases</a>, <a href="#/streaks">Streaks &amp; wins</a>. A no or a later is just a record — the question comes back at the next meeting with fresh figures.</p>'
    + '<p class="muted small">The meeting is monthly because the budget is monthly: the figures it reads are ' + monthLabel(key) + '’s. Switch months with the switcher at the top and the agenda rebuilds from that month’s own records — last month’s decisions stay with last month, they never leak forward.</p>'
    + '<p><a class="btn ghost" href="#/checkin">Weekly check-in →</a> <a class="btn plain" href="#/streaks">Streaks &amp; wins →</a></p></div>'
    + '</div>';
}

