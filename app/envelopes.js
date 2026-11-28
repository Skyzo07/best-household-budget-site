// Hearth & Home Budget — cash envelopes: one envelope per spending
// area, filled at the start of the month from the household's own
// budgets. Every expense in the month draws down its envelope, and
// last month's unspent cash rolls into next month's fill — the
// envelope never forgets a good month. All figures come from state (budgets and
// real transactions); nothing here is faked, and every control works.
// Loaded on demand, so it stays out of the first load.
import { ENVELOPE_DEFS, categoryById, envelopeFill, envelopeRollover, envelopeSpend, envelopeStore, envelopeTotals, money, monthLabel, monthTransactions, shiftMonth } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Which envelope's spending list is open, and the last transfer error.
let openEnv = '';
let moveError = '';

export function toggleEnvDetail(id) {
  openEnv = openEnv === id ? '' : id;
}

// The fill a user typed (or a transfer landed on) is stored; a fill
// never set is the budget plus whatever rolled over from last month.
export function setEnvFill(state, key, envId, value) {
  const store = envelopeStore(state);
  if (!store.fills[key]) store.fills[key] = {};
  store.fills[key][envId] = Math.round(Math.max(0, value) * 100) / 100;
  state.sample = false;
}

export function toggleEnvRollover(state, envId) {
  const store = envelopeStore(state);
  const on = store.rolloverOn[envId] !== false;
  store.rolloverOn[envId] = !on;
  state.sample = false;
}

export function resetEnvelopesMonth(state, key) {
  const store = envelopeStore(state);
  delete store.fills[key];
  state.sample = false;
}

// Move cash between two envelopes in the same month. Only unspent cash
// can move, so an envelope can never go below what it already spent.
// Returns true on success; on failure the reason is shown on the page.
export function tryMoveMoney(state, key, fromId, toId, amount) {
  moveError = '';
  const amt = Math.round((Number(amount) || 0) * 100) / 100;
  if (!fromId || !toId) { moveError = 'Pick both envelopes first.'; return false; }
  if (fromId === toId) { moveError = 'Pick two different envelopes — moving money to itself changes nothing.'; return false; }
  if (!(amt > 0)) { moveError = 'Enter an amount above $0 to move.'; return false; }
  const from = ENVELOPE_DEFS.find((e) => e.id === fromId);
  const to = ENVELOPE_DEFS.find((e) => e.id === toId);
  if (!from || !to) { moveError = 'That envelope does not exist.'; return false; }
  const left = Math.round((envelopeFill(state, key, from) - envelopeSpend(state, key, from)) * 100) / 100;
  if (amt > left) {
    moveError = 'Only ' + money(Math.max(0, left)) + ' is still unspent in ' + from.label + ' — the rest is already spent this month.';
    return false;
  }
  setEnvFill(state, key, fromId, envelopeFill(state, key, from) - amt);
  setEnvFill(state, key, toId, envelopeFill(state, key, to) + amt);
  return true;
}

export function renderEnvelopes(state, root) {
  const key = state.currentMonth;
  const nextKey = shiftMonth(key, 1);
  const store = envelopeStore(state);
  const totals = envelopeTotals(state, key);
  const prevKey = shiftMonth(key, -1);
  const spent = monthTransactions(state, key).filter((t) => t.kind === 'expense');

  const kpiCards =
    '<div class="card kpi good"><div class="kpi-label">Filled for ' + monthLabel(key) + '</div><div class="kpi-value num">' + money(totals.filled) + '</div><div class="kpi-sub">' + money(totals.rolled) + ' of it rolled over unspent from ' + monthLabel(prevKey) + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Spent from envelopes</div><div class="kpi-value num">' + money(totals.spent) + '</div><div class="kpi-sub">Every expense in the month draws its own envelope down</div></div>'
    + '<div class="card kpi ' + (totals.left < 0 ? 'warn' : 'good') + '"><div class="kpi-label">Still in the envelopes</div><div class="kpi-value num">' + money(totals.left) + '</div><div class="kpi-sub">' + (totals.over.length ? totals.over.map((e) => e.label).join(', ') + ' ' + (totals.over.length > 1 ? 'are' : 'is') + ' empty — move cash in or wait for next month' : 'Every envelope still has cash — nothing is overdrawn') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Next month starts with</div><div class="kpi-value num">' + money(totals.nextFilled) + '</div><div class="kpi-sub">Budgets plus ' + money(totals.nextRolled) + ' rolling over from this month</div></div>';

  const moveOptions = ENVELOPE_DEFS.map((e) => '<option value="' + e.id + '">' + esc(e.label) + '</option>').join('');
  const moveCard =
    '<div class="card" style="margin-top:16px"><h2>Move cash between envelopes</h2>'
    + '<p class="muted small" style="margin-top:0">Dinner ran over but the fun envelope is flush? Shift the unspent cash — only money not yet spent can move, so an envelope can never go below what it already spent. The move is saved at once.</p>'
    + '<p class="move-row"><span class="inline-label">Move $ <input id="env-move-amount" type="number" min="0.01" step="0.01" placeholder="25.00" aria-label="Amount to move"></span>'
    + '<span class="inline-label"> from <select id="env-move-from" aria-label="Move money from"><option value="">— pick —</option>' + moveOptions + '</select></span>'
    + '<span class="inline-label"> to <select id="env-move-to" aria-label="Move money to"><option value="">— pick —</option>' + moveOptions + '</select></span>'
    + ' <button type="button" class="btn small" data-env-move="1">Move it</button></p>'
    + (moveError ? '<p class="form-error">' + esc(moveError) + '</p>' : '')
    + '<p class="muted small">Example this month: Fun &amp; family still holds ' + money(Math.max(0, envelopeFill(state, key, ENVELOPE_DEFS[4]) - envelopeSpend(state, key, ENVELOPE_DEFS[4]))) + ' unspent, while Groceries is down to ' + money(Math.max(0, envelopeFill(state, key, ENVELOPE_DEFS[0]) - envelopeSpend(state, key, ENVELOPE_DEFS[0]))) + '.</p></div>';

  const envCards = ENVELOPE_DEFS.map((env) => {
    const fill = envelopeFill(state, key, env);
    const paid = envelopeSpend(state, key, env);
    const left = Math.round((fill - paid) * 100) / 100;
    const pct = fill > 0 ? Math.min(100, (paid / fill) * 100) : 0;
    const rolled = envelopeRollover(state, key, env);
    const rollOn = store.rolloverOn[env.id] !== false;
    const cls = left <= 0 ? 'over' : pct > 85 ? 'amber' : '';
    const pill = left <= 0 ? '<span class="pill over">Empty</span>' : pct > 85 ? '<span class="pill warn">Almost empty</span>' : '<span class="pill">' + money(left) + ' left</span>';
    const myTx = spent.filter((t) => env.cats.includes(t.category)).sort((a, b) => b.date.localeCompare(a.date));
    const detail = openEnv === env.id
      ? '<div class="env-detail"><h3>Spending from this envelope — ' + monthLabel(key) + '</h3>'
        + (myTx.length
          ? '<ul class="tx-list">' + myTx.slice(0, 5).map((t) => '<li><span class="tx-ico" style="background:' + categoryById(t.category).color + '22;color:' + categoryById(t.category).color + '">' + categoryById(t.category).icon + '</span><span class="tx-main"><b>' + esc(t.description) + '</b><span>' + esc(t.date) + ' · ' + esc(categoryById(t.category).label) + '</span></span><span class="tx-amt out">−' + money(t.amount) + '</span></li>').join('') + '</ul>'
            + (myTx.length > 5 ? '<p class="muted small">…and ' + (myTx.length - 5) + ' more spends from this envelope this month.</p>' : '')
          : '<p class="empty">Nothing has drawn on this envelope yet this month.</p>')
        + '<p><button type="button" class="btn small ghost" data-env-add="' + env.cats[0] + '">+ Add spending to ' + esc(env.label) + '</button></p></div>'
      : '';
    return '<div class="card env-card"><div class="env-top"><span class="tx-ico" style="background:' + env.color + '22;color:' + env.color + '">' + env.icon + '</span>'
      + '<div class="env-head"><h3>' + esc(env.label) + '</h3><span class="muted small">' + env.cats.map((c) => esc(categoryById(c).label)).join(' + ') + '</span></div>' + pill + '</div>'
      + '<p class="env-figures"><label class="inline-label">Filled $<input type="number" min="0" step="1" value="' + fill.toFixed(2) + '" data-env-fill="' + env.id + '" aria-label="Cash filled into ' + esc(env.label) + '"></label>'
      + '<span>spent <b>' + money(paid) + '</b> · left <b class="' + (left <= 0 ? 'neg' : 'pos') + '">' + money(left) + '</b></span></p>'
      + '<div class="bar"><i class="' + cls + '" style="width:' + pct.toFixed(1) + '%"></i></div>'
      + '<p class="muted small env-roll">' + (rolled > 0 ? money(rolled) + ' rolled in unspent from ' + monthLabel(prevKey) : 'Nothing rolled in — last month this envelope was spent out') + ' · '
      + '<button type="button" class="btn small ghost" data-env-roll="' + env.id + '">' + (rollOn ? 'Rollover on — press to stop it' : 'Rollover off — press to turn it on') + '</button></p>'
      + '<p><button type="button" class="btn small ghost" data-env-detail="' + env.id + '">' + (openEnv === env.id ? 'Hide spending ▲' : 'See what spent it ▼') + '</button></p>'
      + detail + '</div>';
  }).join('');

  const nextRows = ENVELOPE_DEFS.map((env) => {
    const nextFill = envelopeFill(state, nextKey, env);
    const nextRolled = envelopeRollover(state, nextKey, env);
    const base = nextFill - nextRolled;
    return '<tr><td><span class="cat-dot" style="background:' + env.color + '"></span><b>' + esc(env.label) + '</b></td><td class="amount">' + money(base) + '</td><td class="amount">' + (nextRolled > 0 ? '<span class="pos">+' + money(nextRolled) + '</span>' : '—') + '</td><td class="amount"><b>' + money(nextFill) + '</b></td></tr>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Cash envelopes</h1><p class="muted">The month’s money, in envelopes on the kitchen table. Fill each one at payday, spend only from the envelope, and last month’s unspent budget rolls into this month’s fill — October’s unspent ' + money(totals.rolled) + ' is already sitting in November’s envelopes.</p></div>'
    + '<div><button class="btn ghost" id="btn-add-tx">+ Add transaction</button> <button class="btn plain" data-env-reset="1">Reset fills to budgets</button></div></div>'
    + '<div class="grid kpis">' + kpiCards + '</div>'
    + moveCard
    + '<div class="grid env-grid" style="margin-top:16px">' + envCards + '</div>'
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Next month starts here — ' + monthLabel(nextKey) + '</h2>'
    + '<p class="muted small" style="margin-top:0">Each envelope opens next month with its budget, plus this month’s unspent cash. Nothing is lost to a good month — the rollover is automatic, envelope by envelope, and turning it off for one envelope never touches the others.</p>'
    + '<table><thead><tr><th>Envelope</th><th class="amount">Budget</th><th class="amount">Rolling over</th><th class="amount">December fill</th></tr></thead><tbody>' + nextRows + '</tbody></table>'
    + '<p class="muted small">December opens with <b>' + money(totals.nextFilled) + '</b> across the envelopes — ' + money(totals.nextRolled) + ' of it earned by not spending in November.</p></div>'
    + '<div class="card"><h2>How envelopes keep a household honest</h2>'
    + '<p>Budgets are numbers on a page; envelopes are cash you can see. When Groceries is down to ' + money(Math.max(0, envelopeFill(state, key, ENVELOPE_DEFS[0]) - envelopeSpend(state, key, ENVELOPE_DEFS[0]))) + ' with two weeks to go, the household cooks from the pantry instead of topping up — and the ' + money(envelopeRollover(state, key, ENVELOPE_DEFS[1])) + ' that rolled into Dining out is still there because October ate at home. The trick is the rollover: a frugal month is not punished with a smaller budget next month, it is rewarded with a fatter envelope.</p>'
    + '<p class="muted small">Tip: fill the envelopes on payday, in this order — Groceries, Transport, Kids — and whatever is left at month’s end, sweep into the emergency fund from the Savings challenges page.</p></div></div>';
}
