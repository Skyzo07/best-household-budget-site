// Hearth & Home Budget — auto-save rules: money that moves itself.
// A rule is a standing instruction — on payday, or on the last day of
// the month — to move a fixed amount, or the month's round-ups, into a
// savings goal or a big purchase's pot. Every figure on the page is
// worked out from the household's own records: a fixed rule's total
// moved is its runs times its amount, a round-up rule's total is the
// round-ups of the months it actually swept (the same maths as the
// round-up pot on the Savings page), and the next-run date is worked
// out from today and the rule's day — never typed in by hand. Running
// a rule moves real money: the destination goal or pot grows at once,
// and the Goals, Big purchases and Savings pages all agree, because
// they read the same numbers. A rule can only run once a day, and a
// round-up rule finds nothing to move in a month the round-up pot
// already swept — the same cents can never be saved twice. Lazy-loaded:
// it only loads when the Auto-save nav link is opened, so it never
// touches the first load.
import { money, money0, monthLabel, shiftMonth, todayISO, uid, autosaveStore } from './data.js';
import { roundUpForMonth, challenges } from './savings.js';
import { addToPot } from './bigbuys.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function daySuffix(day) {
  if (day >= 11 && day <= 13) return day + 'th';
  const last = day % 10;
  return day + (last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th');
}

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function lastDayISO(key) {
  return key + '-' + String(daysInMonth(key)).padStart(2, '0');
}

// ---- What a rule moves, this month ----
// A fixed rule moves its amount. A round-up rule moves whatever the
// month's expenses rounded up to — so far, this month, that is the
// figure on the Savings page, and it grows every time a purchase is
// added.
export function ruleAmount(state, rule, key) {
  if (!rule) return 0;
  if (rule.kind === 'roundup') return roundUpForMonth(state, key || state.currentMonth).total;
  return Math.round((Number(rule.amount) || 0) * 100) / 100;
}

// ---- Where the money lands ----
export function destName(state, rule) {
  if (!rule) return '—';
  if (rule.destKind === 'goal') {
    const g = (state.goals || []).find((x) => x.id === rule.destId);
    return g ? g.name : 'a savings goal that no longer exists';
  }
  if (rule.destKind === 'bigbuy') {
    const b = (state.bigbuys || []).find((x) => x.id === rule.destId);
    return b ? b.name + ' pot' : 'a big purchase that no longer exists';
  }
  return '—';
}

export function destLink(rule) {
  if (!rule) return '#/goals';
  return rule.destKind === 'bigbuy' ? '#/bigbuys' : '#/goals';
}

// ---- When a rule runs next ----
// A fixed rule runs on its day of the month: this month's day if it
// has not passed yet, otherwise next month's. A round-up rule runs on
// the last day of the month. A date that has already passed — or a
// run that already happened — pushes the next run one period on, so
// the date on the page is always in the future.
export function nextRunISO(state, rule) {
  const today = todayISO();
  const key = state.currentMonth;
  let cand;
  if (rule.kind === 'roundup' || Number(rule.day) === 0) {
    cand = lastDayISO(key);
    // A month the round-up pot already swept has nothing left for the
    // rule to move, so the next run is the following month's last day.
    if ((challenges(state).roundUp.swept || []).includes(key)) cand = lastDayISO(shiftMonth(key, 1));
    else if (cand < today || (rule.lastRun && cand <= rule.lastRun)) cand = lastDayISO(shiftMonth(key, 1));
  } else {
    const day = Math.min(Math.max(1, Number(rule.day) || 1), daysInMonth(key));
    cand = key + '-' + String(day).padStart(2, '0');
    if (cand < today || (rule.lastRun && cand <= rule.lastRun)) {
      const next = shiftMonth(key, 1);
      const d2 = Math.min(day, daysInMonth(next));
      cand = next + '-' + String(d2).padStart(2, '0');
    }
  }
  return cand;
}

// ---- What a rule has moved, in total ----
// Fixed rules: runs times amount — the record is the maths. Round-up
// rules: the months they actually swept, from the rule's own monthly
// ledger — September's $4.60 is the only sweep so far, because
// October's round-ups went to the round-up pot instead (the pot was
// swept first that month, so the rule found nothing left to move).
// The ledger is also what "moved this month" adds up: a rule that
// runs twice in one month counts both runs, not just the last one.
export function totalMoved(state, rule) {
  if (!rule) return 0;
  if (rule.kind === 'roundup') {
    const ledger = (rule.monthly && typeof rule.monthly === 'object') ? rule.monthly : {};
    return Math.round(Object.values(ledger).reduce((a, v) => a + (Number(v) || 0), 0) * 100) / 100;
  }
  return Math.round(((Number(rule.runs) || 0) * (Number(rule.amount) || 0)) * 100) / 100;
}

export function movedThisMonth(state) {
  const key = state.currentMonth;
  let total = 0;
  for (const r of autosaveStore(state)) {
    const ledger = (r.monthly && typeof r.monthly === 'object') ? r.monthly : {};
    total += Number(ledger[key]) || 0;
  }
  return Math.round(total * 100) / 100;
}

export function autosaveSummary(state) {
  const rules = autosaveStore(state);
  const active = rules.filter((r) => r.active);
  const total = Math.round(rules.reduce((a, r) => a + totalMoved(state, r), 0) * 100) / 100;
  const monthlyFixed = Math.round(active.filter((r) => r.kind === 'fixed').reduce((a, r) => a + (Number(r.amount) || 0), 0) * 100) / 100;
  let next = null;
  for (const r of active) {
    const date = nextRunISO(state, r);
    const amount = ruleAmount(state, r, date.slice(0, 7));
    if (!next || date < next.date) next = { rule: r, date, amount };
  }
  return { rules, activeCount: active.length, total, movedMonth: movedThisMonth(state), monthlyFixed, next };
}

// ---- Running a rule: the money really moves ----
// Returns { moved, dest } — moved is 0 when there was nothing to move
// (paused, already run today, a round-up month the pot already swept,
// or a destination that no longer exists). A fixed rule adds its
// amount to its goal or its big-purchase pot; a round-up rule sweeps
// the month's round-ups into its goal and marks the month swept, so
// the Savings page's pot sweep finds the same month already done.
export function runRule(state, ruleId) {
  const rules = autosaveStore(state);
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return { moved: 0, reason: 'no rule' };
  if (!rule.active) return { moved: 0, reason: 'paused' };
  const today = todayISO();
  if (rule.lastRun === today) return { moved: 0, reason: 'today' };
  let amount = 0;
  if (rule.kind === 'roundup') {
    const key = state.currentMonth;
    const swept = (challenges(state).roundUp.swept || []).includes(key);
    if (swept) return { moved: 0, reason: 'swept' };
    amount = roundUpForMonth(state, key).total;
    if (amount <= 0) return { moved: 0, reason: 'nothing' };
    const goal = (state.goals || []).find((g) => g.id === rule.destId);
    if (!goal) return { moved: 0, reason: 'destination' };
    goal.saved = Math.round((goal.saved + amount) * 100) / 100;
    challenges(state).roundUp.swept = (challenges(state).roundUp.swept || []).concat([key]);
  } else {
    amount = Math.round((Number(rule.amount) || 0) * 100) / 100;
    if (amount <= 0) return { moved: 0, reason: 'nothing' };
    if (rule.destKind === 'goal') {
      const goal = (state.goals || []).find((g) => g.id === rule.destId);
      if (!goal) return { moved: 0, reason: 'destination' };
      goal.saved = Math.round((goal.saved + amount) * 100) / 100;
    } else if (rule.destKind === 'bigbuy') {
      if (addToPot(state, rule.destId, amount) <= 0) return { moved: 0, reason: 'destination' };
    } else {
      return { moved: 0, reason: 'destination' };
    }
  }
  rule.lastRun = today;
  rule.lastAmount = amount;
  rule.runs = (Number(rule.runs) || 0) + 1;
  if (!rule.monthly || typeof rule.monthly !== 'object') rule.monthly = {};
  const mKey = state.currentMonth;
  rule.monthly[mKey] = Math.round(((Number(rule.monthly[mKey]) || 0) + amount) * 100) / 100;
  state.sample = false;
  return { moved: amount, dest: destName(state, rule) };
}

// Run every active rule once — the ones already run today, and the
// round-up rules whose month the pot already swept, are skipped and
// named in the result instead of failing the whole batch.
export function runAllActive(state) {
  const ran = [];
  const skipped = [];
  for (const r of autosaveStore(state)) {
    if (!r.active) { skipped.push({ name: r.name, why: 'paused' }); continue; }
    const res = runRule(state, r.id);
    if (res.moved > 0) ran.push({ name: r.name, moved: res.moved, dest: res.dest });
    else skipped.push({ name: r.name, why: res.reason || 'nothing' });
  }
  const total = Math.round(ran.reduce((a, x) => a + x.moved, 0) * 100) / 100;
  return { ran, skipped, total };
}

export function toggleRule(state, ruleId) {
  const rule = autosaveStore(state).find((r) => r.id === ruleId);
  if (!rule) return false;
  rule.active = !rule.active;
  state.sample = false;
  return true;
}

export function deleteRule(state, ruleId) {
  const rules = autosaveStore(state);
  const i = rules.findIndex((r) => r.id === ruleId);
  if (i === -1) return false;
  rules.splice(i, 1);
  state.sample = false;
  return true;
}

// Add a rule from the form on the page. dest is "goal:<id>" or
// "bigbuy:<id>"; day is 1–28, or 0 for the last day of the month.
// Returns the new rule, or null when the form is not filled in right.
export function addRule(state, name, kind, amountRaw, destRaw, dayRaw) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  if (kind !== 'fixed' && kind !== 'roundup') return null;
  const amount = Math.round((Number(amountRaw) || 0) * 100) / 100;
  if (kind === 'fixed' && amount <= 0) return null;
  const [destKind, destId] = String(destRaw || '').split(':');
  if (destKind !== 'goal' && destKind !== 'bigbuy') return null;
  if (destKind === 'goal' && !(state.goals || []).some((g) => g.id === destId)) return null;
  if (destKind === 'bigbuy' && !(state.bigbuys || []).some((b) => b.id === destId)) return null;
  const day = Number(dayRaw);
  if (!Number.isInteger(day) || day < 0 || day > 28) return null;
  const rule = {
    id: uid('as'),
    name: cleanName,
    kind,
    amount: kind === 'fixed' ? amount : 0,
    destKind,
    destId,
    day,
    active: true,
    lastRun: '',
    lastAmount: 0,
    runs: 0,
    monthly: {},
  };
  autosaveStore(state).push(rule);
  state.sample = false;
  return rule;
}

export function renderAutosave(state, root) {
  const s = autosaveSummary(state);
  const key = state.currentMonth;
  const today = todayISO();

  const ruleCards = s.rules.map((r) => {
    const next = nextRunISO(state, r);
    const nextAmt = ruleAmount(state, r, next.slice(0, 7));
    const total = totalMoved(state, r);
    const when = r.kind === 'roundup'
      ? 'Sweeps ' + monthLabel(key) + '’s round-ups (' + money(ruleAmount(state, r, key)) + ' so far) on the last day of the month'
      : money(r.amount) + ' on the ' + daySuffix(Number(r.day) || 1) + ' of every month';
    const lastLine = r.lastRun
      ? 'Last run: ' + fmtDate(r.lastRun) + ' — moved ' + money(r.lastAmount || 0)
      : 'Never run yet — press “Run now” to move the first ' + (r.kind === 'roundup' ? money(ruleAmount(state, r, key)) + ' of round-ups' : money(r.amount));
    return '<div class="card"><h2 style="margin-top:0">' + esc(r.name) + ' ' + (r.active ? '<span class="pill">On</span>' : '<span class="pill over">Paused</span>') + '</h2>'
      + '<p style="margin-top:0">' + esc(when) + ' into <a href="' + destLink(r) + '">' + esc(destName(state, r)) + '</a>.</p>'
      + '<div class="grid kpis" style="margin:12px 0">'
      + '<div class="card kpi"><div class="kpi-label">Next run</div><div class="kpi-value num" style="font-size:1.2rem">' + fmtDate(next) + '</div><div class="kpi-sub">' + money(nextAmt) + (r.kind === 'roundup' ? ' of round-ups so far' : '') + '</div></div>'
      + '<div class="card kpi"><div class="kpi-label">Moved so far</div><div class="kpi-value num" style="font-size:1.2rem">' + money(total) + '</div><div class="kpi-sub">' + (Number(r.runs) || 0) + ' run' + (Number(r.runs) === 1 ? '' : 's') + '</div></div>'
      + '<div class="card kpi"><div class="kpi-label">Destination now</div><div class="kpi-value num" style="font-size:1.2rem">' + (r.destKind === 'goal'
        ? money(((state.goals || []).find((g) => g.id === r.destId) || {}).saved || 0)
        : money0(((state.bigbuys || []).find((b) => b.id === r.destId) || {}).saved || 0)) + '</div><div class="kpi-sub">' + esc(destName(state, r)) + '</div></div>'
      + '</div>'
      + '<p class="muted small">' + esc(lastLine) + '. ' + (r.active ? 'Pause it and the money stays in the main account until you resume it — nothing moves on its own while it is paused.' : 'Paused — press Resume and it runs again on ' + fmtDate(next) + '.') + '</p>'
      + '<p><button type="button" class="btn small primary" data-as-run="' + r.id + '"' + ((!r.active || r.lastRun === today) ? ' disabled' : '') + '>Run now' + (r.kind === 'roundup' ? ' (' + money(ruleAmount(state, r, key)) + ')' : ' (' + money(r.amount) + ')') + '</button> '
      + '<button type="button" class="btn small ' + (r.active ? 'ghost' : 'primary') + '" data-as-toggle="' + r.id + '">' + (r.active ? 'Pause rule' : 'Resume rule') + '</button> '
      + '<button type="button" class="btn small danger" data-as-del="' + r.id + '">Delete rule</button></p></div>';
  }).join('');

  const destOptions = (state.goals || []).map((g) => '<option value="goal:' + g.id + '">' + esc(g.name) + ' — goal (' + money(g.saved) + ' of ' + money(g.target) + ')</option>').join('')
    + (state.bigbuys || []).map((b) => '<option value="bigbuy:' + b.id + '">' + esc(b.name) + ' — big purchase (' + money(b.saved || 0) + ' of ' + money(b.cost) + ')</option>').join('');
  const dayOptions = '<option value="0">Last day of the month</option>' + Array.from({ length: 28 }, (_, i) => '<option value="' + (i + 1) + '"' + (i === 0 ? ' selected' : '') + '>Day ' + (i + 1) + ' (payday)</option>').join('');

  const octRoundups = roundUpForMonth(state, '2026-10').total;

  root.innerHTML =
    '<div class="page-head"><div><h1>Auto-save rules</h1><p class="muted">Money that moves itself. Set a rule once — payday moves a fixed amount into a goal or a big purchase, and the last day of the month sweeps the spare change into one — and the household saves without remembering to. Every rule below is a real instruction: pause it, run it now, or delete it, and the money moves (or stops moving) for real.</p></div>'
    + '<div><button class="btn primary" data-as-run-all="1">Run all active rules now</button> <a class="btn ghost" href="#/goals">Savings goals →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi good"><div class="kpi-label">Auto-saved so far in 2026</div><div class="kpi-value num">' + money(s.total) + '</div><div class="kpi-sub">Across ' + s.rules.length + ' rules — the payday rules moved ' + money(s.total - totalMoved(state, s.rules.find((r) => r.kind === 'roundup') || { kind: 'roundup', lastRun: '' })) + ' of it, the round-up rule the rest</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Moved in ' + monthLabel(key).split(' ')[0] + '</div><div class="kpi-value num">' + money(s.movedMonth) + '</div><div class="kpi-sub">Payday rules move ' + money(s.monthlyFixed) + ' on the 1st; round-ups sweep on the last day of the month</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Active rules</div><div class="kpi-value num">' + s.activeCount + ' of ' + s.rules.length + '</div><div class="kpi-sub">' + money(s.monthlyFixed) + ' a month in fixed payday moves, plus the round-ups on top</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Next run</div><div class="kpi-value num" style="font-size:1.25rem">' + (s.next ? fmtDate(s.next.date) : '—') + '</div><div class="kpi-sub">' + (s.next ? esc(s.next.rule.name) + ' — ' + money(s.next.amount) + (s.next.rule.kind === 'roundup' ? ' of round-ups so far' : '') : 'No active rules — add one below') + '</div></div>'
    + '</div>'

    + '<div style="margin-top:16px;display:grid;gap:16px">' + (ruleCards || '<p class="empty">No auto-save rules yet — add the first one below.</p>') + '</div>'

    + '<div class="card" style="margin-top:16px"><h2>Add an auto-save rule</h2>'
    + '<p class="muted small" style="margin-top:0">Pick what moves, where it lands, and when. A fixed rule moves the same amount every month on payday; a round-up rule sweeps the month’s spare change on the last day. The destination is any savings goal or any big purchase — the rule follows the pot, so if the goal grows by hand, the rule still lands in the same place.</p>'
    + '<div class="form-row"><label>Rule name <input id="as-add-name" type="text" maxlength="60" placeholder="e.g. Payday: $25 to the holiday"></label>'
    + '<label>What moves <select id="as-add-kind"><option value="fixed">Fixed amount every month</option><option value="roundup">This month’s round-ups</option></select></label></div>'
    + '<div class="form-row"><label>Amount ($) <input id="as-add-amount" type="number" min="1" step="1" placeholder="25"></label>'
    + '<label>Into <select id="as-add-dest">' + destOptions + '</select></label></div>'
    + '<div class="form-row"><label>When <select id="as-add-day">' + dayOptions + '</select></label>'
    + '<span class="muted small" style="align-self:end">A fixed rule needs an amount; a round-up rule ignores the amount box and sweeps whatever the month rounded up to. A rule can only run once a day, and a round-up rule finds nothing in a month the round-up pot already swept.</span></div>'
    + '<p style="margin-top:12px"><button type="button" class="btn primary" data-as-add="1">Add rule</button></p></div>'

    + '<div class="card" style="margin-top:16px"><h2>How the rules fit together</h2>'
    + '<p>Payday is the 1st, when both salaries land — ' + money(4200 + 1450) + ' in November — so the three payday rules move ' + money(s.monthlyFixed) + ' before the month’s spending starts, and what is left is what the household can actually spend. The round-up rule is the quiet one: September’s round-ups were ' + money(totalMoved(state, s.rules.find((r) => r.kind === 'roundup') || { kind: 'roundup', lastRun: '' })) + ' into the holiday fund, and October’s ' + money(octRoundups) + ' went to the round-up pot instead — the pot was swept first that month, so the rule found nothing left to move, which is exactly how it should work: the same cents are never saved twice. November’s round-ups so far are ' + money(ruleAmount(state, s.rules.find((r) => r.kind === 'roundup'), key)) + ', and they land in the holiday fund on Nov 30 unless the pot is swept first.</p>'
    + '<p class="muted small">The rules are the household’s autopilot; the <a href="#/streaks">Streaks &amp; wins</a> page is the proof they kept flying — the 52-week challenge is the same idea by hand, one deposit a week. And if a month gets tight, pause a rule instead of deleting it: the record of what it already moved stays, and it picks up again on its next date.</p></div>';
}
