// Hearth & Home Budget — house rules: the household's own money rules,
// each one checked live against the household's own records for the
// month on screen. A rule is never a slogan on a poster: "Groceries
// under $620" reads November's grocery spending ($619.35 — $0.65 of
// slack, kept), "One no-spend day a week" counts the no-spend days
// actually marked (6 in November), "Save $100 on payday" looks for
// the auto-save run that really moved on the 1st, and "No takeaway
// over $40 without talking" names the two dinners that broke it
// (Family dinner out $46.80, Lunch with friends $52.25). Two rules
// are broken in November and the page says so, with the money each
// break costs and a link to the page that fixes it. Adding a rule is
// a form, not a wish: pick the kind, the number, and the page checks
// it from the next render. Lazy-loaded: it only loads when the House
// rules nav link is opened, so it never touches the first load.
import { CATEGORIES, categoryById, categorySpend, houseRulesStore, money, money0, monthLabel, monthTotals, todayISO, uid, autosaveStore } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// The date the checks are measured against: today, capped at the end
// of the month being viewed, so a rule checked in October never
// counts November's days against it.
export function rulesRefDate(state) {
  const key = state.currentMonth;
  const [y, m] = key.split('-').map(Number);
  const endOfMonth = new Date(y, m, 0);
  const endISO = endOfMonth.getFullYear() + '-' + String(endOfMonth.getMonth() + 1).padStart(2, '0') + '-' + String(endOfMonth.getDate()).padStart(2, '0');
  const today = todayISO();
  return today < endISO ? today : endISO;
}

function daysBetween(fromISO, toISO) {
  return Math.floor((new Date(toISO + 'T00:00:00') - new Date(fromISO + 'T00:00:00')) / 86400000);
}

// One rule's live verdict for the month on screen. Every verdict
// carries the exact figure behind it, so a pass and a fail are both
// checkable against the Transactions, Bills and Subscriptions pages.
export function checkHouseRule(state, rule, key) {
  const k = key || state.currentMonth;
  const ref = rulesRefDate(state);
  const limit = Number(rule.limit) || 0;
  if (rule.kind === 'payday') {
    // The fixed auto-save rules that feed this rule's goal (or, when
    // the rule names no goal, any fixed rule moving at least the
    // limit) — the household's own ledger, not a promise.
    const runs = autosaveStore(state).filter((r) => r.kind === 'fixed' && r.active
      && (rule.goalId ? r.destId === rule.goalId : Number(r.amount) >= limit));
    const moved = runs.reduce((a, r) => a + (Number((r.monthly || {})[k]) || 0), 0);
    const hit = runs.find((r) => Number((r.monthly || {})[k]) > 0);
    if (moved >= limit) return { pass: true, actual: moved, detail: money(moved) + ' moved by auto-save in ' + monthLabel(k) + (hit ? ' — “' + hit.name + '” ran ' + (hit.lastRun || 'this month') + '.' : '.'), fix: '', fixHref: '' };
    return { pass: false, actual: moved, detail: 'Only ' + money(moved) + ' moved by auto-save in ' + monthLabel(k) + ' — the rule needs ' + money(limit) + ' on payday.', fix: 'Check the auto-save rules', fixHref: '#/autosave' };
  }
  if (rule.kind === 'cap') {
    const spend = Math.round((categorySpend(state, k)[rule.category] || 0) * 100) / 100;
    const label = categoryById(rule.category).label;
    if (spend <= limit) return { pass: true, actual: spend, detail: label + ' came to ' + money(spend) + ' in ' + monthLabel(k) + ' — ' + money(Math.round((limit - spend) * 100) / 100) + ' of slack under the ' + money(limit) + ' line.', fix: '', fixHref: '' };
    return { pass: false, actual: spend, detail: label + ' came to ' + money(spend) + ' in ' + monthLabel(k) + ' — ' + money(Math.round((spend - limit) * 100) / 100) + ' over the ' + money(limit) + ' line.', fix: 'Trim the budget for next month', fixHref: '#/nextmonth' };
  }
  if (rule.kind === 'nospend') {
    const days = ((state.challenges && state.challenges.noSpend && state.challenges.noSpend[k]) || []).length;
    if (days >= limit) return { pass: true, actual: days, detail: days + ' no-spend days marked in ' + monthLabel(k) + ' — one a week needs ' + limit + ', and the household kept ' + days + '.', fix: '', fixHref: '' };
    return { pass: false, actual: days, detail: 'Only ' + days + ' no-spend day' + (days === 1 ? '' : 's') + ' marked in ' + monthLabel(k) + ' — the rule needs ' + limit + ' (one a week).', fix: 'Mark today a no-spend day', fixHref: '#/savings' };
  }
  if (rule.kind === 'takeaway') {
    const over = (state.transactions || []).filter((t) => t.date.slice(0, 7) === k && t.kind === 'expense' && t.category === 'dining' && Number(t.amount) > limit).sort((a, b) => b.amount - a.amount);
    if (!over.length) return { pass: true, actual: 0, detail: 'No single dining spend over ' + money(limit) + ' in ' + monthLabel(k) + ' — the biggest was ' + money(Math.max.apply(null, (state.transactions || []).filter((t) => t.date.slice(0, 7) === k && t.category === 'dining').map((t) => Number(t.amount)).concat([0]))) + '.', fix: '', fixHref: '' };
    const excess = Math.round(over.reduce((a, t) => a + (Number(t.amount) - limit), 0) * 100) / 100;
    return { pass: false, actual: over.length, detail: over.length + ' dining spend' + (over.length === 1 ? '' : 's') + ' over ' + money(limit) + ' in ' + monthLabel(k) + ': ' + over.map((t) => '“' + t.description + '” ' + money(t.amount)).join(', ') + ' — ' + money(excess) + ' over the line in total.', fix: 'Talk about it at the next money meeting', fixHref: '#/meeting' };
  }
  if (rule.kind === 'saverate') {
    const t = monthTotals(state, k);
    const pct = t.income > 0 ? Math.round((t.saved / t.income) * 1000) / 10 : 0;
    if (pct >= limit) return { pass: true, actual: pct, detail: 'Saved ' + money(t.saved) + ' of ' + money(t.income) + ' in ' + monthLabel(k) + ' — ' + pct + '% against a ' + limit + '% rule.', fix: '', fixHref: '' };
    return { pass: false, actual: pct, detail: 'Saved ' + money(t.saved) + ' of ' + money(t.income) + ' in ' + monthLabel(k) + ' — only ' + pct + '% against a ' + limit + '% rule.', fix: 'See what trimming would free up', fixHref: '#/whatif' };
  }
  if (rule.kind === 'subunused') {
    const stale = (state.subscriptions || []).filter((s) => s.status === 'active' && s.lastUsed && daysBetween(s.lastUsed, ref) > limit).sort((a, b) => daysBetween(a.lastUsed, ref) - daysBetween(b.lastUsed, ref));
    if (!stale.length) return { pass: true, actual: 0, detail: 'Every active subscription was opened in the last ' + limit + ' days (checked ' + ref + ').', fix: '', fixHref: '' };
    const cost = Math.round(stale.reduce((a, s) => a + (Number(s.monthly) || 0), 0) * 100) / 100;
    return { pass: false, actual: stale.length, detail: stale.length + ' subscription' + (stale.length === 1 ? '' : 's') + ' untouched for over ' + limit + ' days: ' + stale.map((s) => s.name + ' (' + daysBetween(s.lastUsed, ref) + ' days, last opened ' + s.lastUsed + ')').join(', ') + ' — ' + money(cost) + ' a month sitting idle.', fix: 'Cancel or downgrade them in the audit', fixHref: '#/subscriptions' };
  }
  return { pass: false, actual: 0, detail: 'This rule has no kind the checker knows — edit or delete it and add it again.', fix: '', fixHref: '' };
}

// The whole board for the month on screen: kept, broken, and what
// the broken ones cost the household.
export function houseRulesScore(state) {
  const key = state.currentMonth;
  const rules = houseRulesStore(state);
  const verdicts = rules.map((r) => ({ rule: r, v: checkHouseRule(state, r, key) }));
  const kept = verdicts.filter((x) => x.v.pass).length;
  const broken = verdicts.filter((x) => !x.v.pass);
  // What the broken rules cost: takeaway excess over the line, plus
  // a month of the idle subscriptions — both read off the records.
  const takeawayExcess = broken.filter((b) => b.rule.kind === 'takeaway').reduce((a, b) => {
    const over = (state.transactions || []).filter((t) => t.date.slice(0, 7) === key && t.kind === 'expense' && t.category === 'dining' && Number(t.amount) > (Number(b.rule.limit) || 0));
    return a + over.reduce((x, t) => x + (Number(t.amount) - (Number(b.rule.limit) || 0)), 0);
  }, 0);
  const idleCost = broken.filter((b) => b.rule.kind === 'subunused').reduce((a, b) => {
    const ref = rulesRefDate(state);
    return a + (state.subscriptions || []).filter((s) => s.status === 'active' && s.lastUsed && daysBetween(s.lastUsed, ref) > (Number(b.rule.limit) || 0)).reduce((x, s) => x + (Number(s.monthly) || 0), 0);
  }, 0);
  const cost = Math.round((takeawayExcess + idleCost) * 100) / 100;
  return { rules, verdicts, kept, broken: broken.length, total: rules.length, cost, takeawayExcess: Math.round(takeawayExcess * 100) / 100, idleCost: Math.round(idleCost * 100) / 100 };
}

// Add a rule from the form. Returns the rule, or null when the form
// is missing what the kind needs (the page says so instead of
// saving a rule that can never be checked).
export function addHouseRule(state, text, kind, limitRaw, category, goalId) {
  const rules = houseRulesStore(state);
  const t = String(text || '').trim();
  const limit = Math.round(Number(limitRaw) * 100) / 100;
  if (!t) return null;
  if (!['payday', 'cap', 'nospend', 'takeaway', 'saverate', 'subunused'].includes(kind)) return null;
  if (!(limit > 0)) return null;
  if (kind === 'cap' && !CATEGORIES.some((c) => c.id === category && c.budget > 0)) return null;
  if (kind === 'saverate' && limit > 100) return null;
  const rule = { id: uid('rule-house'), text: t.slice(0, 80), kind, limit, category: kind === 'cap' ? category : '', goalId: kind === 'payday' ? (goalId || '') : '' };
  rules.push(rule);
  state.sample = false;
  return rule;
}

export function deleteHouseRule(state, id) {
  const rules = houseRulesStore(state);
  const before = rules.length;
  state.houseRules = rules.filter((r) => r.id !== id);
  return state.houseRules.length < before;
}

const KIND_LABEL = {
  payday: 'Payday saving',
  cap: 'Spending cap',
  nospend: 'No-spend days',
  takeaway: 'Takeaway limit',
  saverate: 'Save rate',
  subunused: 'Unused subscriptions',
};

export function renderRules(state, root) {
  const key = state.currentMonth;
  const s = houseRulesScore(state);
  const ref = rulesRefDate(state);
  const head = '<div class="page-head"><div><h1>House rules</h1><p class="muted">The rules this household agreed — and whether the month on screen actually kept them. Every verdict below is computed from ' + monthLabel(key) + '’s own records, checked ' + ref + '.</p></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi"><div class="kpi-label">Rules kept · ' + monthLabel(key) + '</div><div class="kpi-value num">' + s.kept + ' / ' + s.total + '</div><div class="kpi-sub">' + (s.broken ? s.broken + ' need' + (s.broken === 1 ? 's' : '') + ' a decision at the next meeting' : 'Nothing needs a decision') + '</div></div>'
    + '<div class="card kpi' + (s.broken ? ' warn' : ' good') + '"><div class="kpi-label">What the broken rules cost</div><div class="kpi-value num">' + money(s.cost) + '</div><div class="kpi-sub">a month' + (s.broken ? ' — ' + money(s.takeawayExcess) + ' takeaway over the line, ' + money(s.idleCost) + ' idle subscriptions' : ' — nothing broken') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Checked against</div><div class="kpi-value num">' + monthLabel(key) + '</div><div class="kpi-sub">records checked ' + ref + ' — add a transaction and the verdicts move</div></div>'
    + '</div>'
    + (s.broken
      ? '<div class="alert" role="status"><strong>' + s.broken + ' rule' + (s.broken === 1 ? ' is' : 's are') + ' broken in ' + monthLabel(key) + '.</strong> The cards below name exactly what broke and what it costs — bring them to the money meeting on ' + (state.meetings && state.meetings[key] && state.meetings[key].nextDate ? state.meetings[key].nextDate : 'the first Sunday of next month') + ' and decide: change the habit, or change the rule.</div>'
      : '<div class="alert ok" role="status"><strong>Every rule kept in ' + monthLabel(key) + '.</strong> Nothing needs a decision — keep the streak going.</div>');
  const cards = s.verdicts.map(({ rule, v }) => {
    const badge = v.pass ? '<span class="pill">✓ Kept</span>' : '<span class="pill over">✗ Broken</span>';
    const fix = v.pass ? '' : '<p class="rule-fix">What to do: <a href="' + v.fixHref + '">' + esc(v.fix) + '</a></p>';
    return '<div class="card rule-card' + (v.pass ? '' : ' rule-broken') + '"><div class="rule-top"><h3>' + esc(rule.text) + '</h3>' + badge + '</div>'
      + '<p class="muted small">' + esc(KIND_LABEL[rule.kind] || rule.kind) + (rule.kind === 'cap' ? ' · ' + esc(categoryById(rule.category).label) + ' · under ' + money(rule.limit) : '') + (rule.kind === 'payday' ? ' · ' + money(rule.limit) + ' on payday' : '') + (rule.kind === 'saverate' ? ' · at least ' + rule.limit + '% of income' : '') + (rule.kind === 'nospend' ? ' · at least ' + rule.limit + ' days a month' : '') + (rule.kind === 'takeaway' ? ' · no single meal over ' + money(rule.limit) : '') + (rule.kind === 'subunused' ? ' · none unused over ' + rule.limit + ' days' : '') + '</p>'
      + '<p class="rule-evidence">' + esc(v.detail) + '</p>'
      + fix
      + '<div class="goal-actions"><button type="button" class="btn small ghost" data-rule-del="' + rule.id + '">Delete rule</button></div></div>';
  }).join('');
  const goalOpts = (state.goals || []).map((g) => '<option value="' + g.id + '">' + esc(g.name) + '</option>').join('');
  const catOpts = CATEGORIES.filter((c) => c.budget > 0).map((c) => '<option value="' + c.id + '">' + esc(c.label) + '</option>').join('');
  const form = '<div class="card" style="margin-top:16px"><h2>Add a house rule</h2>'
    + '<p class="muted">Write the rule the way the household says it, pick what kind it is, and give it a number. The page starts checking it from the next render — a rule with no number, or a cap with no category, is not saved.</p>'
    + '<div class="form-row"><label>Rule <input id="hr-text" type="text" maxlength="80" placeholder="e.g. Fun under $150"></label>'
    + '<label>Kind <select id="hr-kind"><option value="cap">Spending cap — a category under $ a month</option><option value="saverate">Save rate — save at least % of income</option><option value="nospend">No-spend days — at least this many days a month</option><option value="takeaway">Takeaway limit — no single meal over $</option><option value="payday">Payday saving — auto-save at least $ on payday</option><option value="subunused">Unused subscriptions — none untouched over this many days</option></select></label></div>'
    + '<div class="form-row"><label>Category (for a spending cap) <select id="hr-cat">' + catOpts + '</select></label>'
    + '<label>Limit ($, % or days — depends on the kind) <input id="hr-limit" type="number" min="1" step="1" placeholder="150"></label>'
    + '<label>Goal (for payday saving) <select id="hr-goal">' + goalOpts + '</select></label></div>'
    + '<p class="form-error" id="hr-error" hidden></p>'
    + '<div class="goal-actions"><button type="button" class="btn primary" data-rule-add="1">Add rule</button></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>How the rules are checked</h2><p>Spending caps read the Transactions page; no-spend days read the Savings page; payday saving reads the auto-save ledger; the takeaway limit reads every dining spend one by one; the save rate divides what the month saved by what it earned; unused subscriptions count the days since each one was last opened. Add a transaction, mark a no-spend day or cancel a subscription and the verdicts move — nothing here is typed in by hand.</p><p class="muted small">Rules live in this browser with the rest of the household data. Reset sample data on the Dashboard brings back the seven rules the Hartono household started with.</p></div>';
  root.innerHTML = head + '<div class="goal-grid">' + cards + '</div>' + form;
}
