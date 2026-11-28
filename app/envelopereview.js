// Hearth & Home Budget — envelope review: November's fills against
// what the envelopes actually spent, envelope by envelope, and a
// suggested December fill for each one worked out from the
// household's own last three months. Nothing here is typed in by
// hand: every figure is computed live from the budgets and the real
// transactions, so an edited transaction or budget moves the review
// at once. One press writes the suggested fills into December's
// envelopes (with an Undo), and a single envelope can be taken on
// its own. Lazy-loaded: it only loads when the Envelope review nav
// link is opened, so it never touches the first load.
import { ENVELOPE_DEFS, categoryById, envelopeBaseFill, envelopeFill, envelopeRollover, envelopeSpend, envelopeStore, envelopeTotals, lastMonths, money, monthLabel, shiftMonth } from './data.js';
import { setEnvFill } from './envelopes.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const round2 = (n) => Math.round(n * 100) / 100;
// Round a suggested fill up to the next $5 — envelopes are filled
// in round notes, and rounding up means the suggestion never comes
// in below what the household actually spent on average.
const roundUp5 = (n) => (n <= 0 ? 0 : Math.ceil(n / 5) * 5);

// The last thing Apply wrote, so Undo can put December back exactly
// as it was — including envelopes that had no stored fill at all
// (those go back to "no stored fill", i.e. budget plus rollover).
let lastApplied = null; // { key, prev: { envId: number|undefined }, applied: { envId: number } }
let applyNote = '';

// One envelope's review for `key`: what was filled, what was spent,
// what is left, what rolled in from the month before, what rolls out
// to next month, the average monthly spend over the last three months,
// and the suggested fill for next month from that average.
function reviewRow(state, key, env) {
  const nextKey = shiftMonth(key, 1);
  const months3 = lastMonths(key, 3);
  const fill = envelopeFill(state, key, env);
  const spent = envelopeSpend(state, key, env);
  const left = round2(fill - spent);
  const rolledIn = envelopeRollover(state, key, env);
  const rollsOut = envelopeRollover(state, nextKey, env);
  const avg3 = round2(months3.reduce((a, k) => a + envelopeSpend(state, k, env), 0) / months3.length);
  const suggested = roundUp5(avg3);
  const decNow = envelopeFill(state, nextKey, env);
  const over = spent > fill ? round2(spent - fill) : 0;
  return { env, fill, spent, left, rolledIn, rollsOut, avg3, suggested, decNow, over, months3 };
}

// Write suggested fills for `ids` into next month's envelopes,
// remembering what was there before so Undo is exact.
export function applySuggestedFills(state, key, ids) {
  const nextKey = shiftMonth(key, 1);
  const store = envelopeStore(state);
  if (!lastApplied || lastApplied.key !== nextKey) lastApplied = { key: nextKey, prev: {}, applied: {} };
  const rows = ENVELOPE_DEFS.filter((e) => ids.includes(e.id)).map((e) => reviewRow(state, key, e));
  for (const r of rows) {
    if (!(r.env.id in lastApplied.prev)) {
      const stored = store.fills[nextKey] && store.fills[nextKey][r.env.id];
      lastApplied.prev[r.env.id] = typeof stored === 'number' ? stored : undefined;
    }
    setEnvFill(state, nextKey, r.env.id, r.suggested);
    lastApplied.applied[r.env.id] = r.suggested;
  }
  const total = round2(rows.reduce((a, r) => a + r.suggested, 0));
  applyNote = 'Applied suggested fills to ' + monthLabel(nextKey) + ' for ' + rows.map((r) => r.env.label).join(', ') + ' — ' + money(total) + ' in total. The Envelopes page shows them now.';
  return rows.length;
}

export function undoAppliedFills(state) {
  if (!lastApplied) return 0;
  const store = envelopeStore(state);
  if (!store.fills[lastApplied.key]) store.fills[lastApplied.key] = {};
  let n = 0;
  for (const [id, prev] of Object.entries(lastApplied.prev)) {
    if (prev === undefined) delete store.fills[lastApplied.key][id];
    else store.fills[lastApplied.key][id] = prev;
    n++;
  }
  state.sample = false;
  applyNote = '';
  lastApplied = null;
  return n;
}

export function reviewCanUndo() { return lastApplied !== null; }

export function renderEnvelopeReview(state, root) {
  const key = state.currentMonth;
  const nextKey = shiftMonth(key, 1);
  const totals = envelopeTotals(state, key);
  const rows = ENVELOPE_DEFS.map((env) => reviewRow(state, key, env));
  const suggestedTotal = round2(rows.reduce((a, r) => a + r.suggested, 0));
  const decNowTotal = round2(rows.reduce((a, r) => a + r.decNow, 0));
  const overRows = rows.filter((r) => r.over > 0);
  const underRows = rows.filter((r) => r.over === 0).sort((a, b) => b.left - a.left);
  const biggestOver = overRows.length ? overRows.slice().sort((a, b) => b.over - a.over)[0] : null;
  const biggestUnder = underRows.length ? underRows[0] : null;
  const budgetTotal = round2(rows.reduce((a, r) => a + envelopeBaseFill(state, r.env), 0));

  const kpiCards =
    '<div class="card kpi"><div class="kpi-label">Filled for ' + monthLabel(key) + '</div><div class="kpi-value num">' + money(totals.filled) + '</div><div class="kpi-sub">' + money(totals.rolled) + ' of it rolled over unspent from ' + monthLabel(shiftMonth(key, -1)) + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Spent from envelopes</div><div class="kpi-value num">' + money(totals.spent) + '</div><div class="kpi-sub">' + overRows.length + ' envelope' + (overRows.length === 1 ? '' : 's') + ' spent past ' + (overRows.length === 1 ? 'its' : 'their') + ' fill</div></div>'
    + '<div class="card kpi ' + (totals.left < 0 ? 'warn' : 'good') + '"><div class="kpi-label">Still in the envelopes</div><div class="kpi-value num">' + money(totals.left) + '</div><div class="kpi-sub">' + money(totals.nextRolled) + ' of it rolls into ' + monthLabel(nextKey) + ' automatically</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Suggested ' + monthLabel(nextKey) + ' fills</div><div class="kpi-value num">' + money(suggestedTotal) + '</div><div class="kpi-sub">' + money(decNowTotal) + ' fills December today — the suggestion ' + (suggestedTotal > decNowTotal ? 'raises it by ' + money(round2(suggestedTotal - decNowTotal)) : suggestedTotal < decNowTotal ? 'trims it by ' + money(round2(decNowTotal - suggestedTotal)) : 'matches it exactly') + '</div></div>';

  const tableRows = rows.map((r) => {
    const verdict = r.over > 0
      ? '<span class="pill over">Over by ' + money(r.over) + '</span>'
      : '<span class="pill">' + money(r.left) + ' left</span>';
    const delta = round2(r.suggested - r.decNow);
    return '<tr><td><span class="cat-dot" style="background:' + r.env.color + '"></span><b>' + esc(r.env.label) + '</b><span class="muted small" style="display:block">' + r.env.cats.map((c) => esc(categoryById(c).label)).join(' + ') + '</span></td>'
      + '<td class="amount">' + money(r.fill) + '</td>'
      + '<td class="amount">' + money(r.spent) + '</td>'
      + '<td class="amount">' + verdict + '</td>'
      + '<td class="amount">' + (r.rolledIn > 0 ? '<span class="pos">+' + money(r.rolledIn) + '</span>' : '—') + '</td>'
      + '<td class="amount">' + (r.rollsOut > 0 ? '<span class="pos">+' + money(r.rollsOut) + '</span>' : '—') + '</td>'
      + '<td class="amount">' + money(r.avg3) + '</td>'
      + '<td class="amount"><b>' + money(r.suggested) + '</b>' + (delta !== 0 ? ' <span class="muted small">(' + (delta > 0 ? '+' : '') + money(delta) + ' vs Dec now)</span>' : '') + '</td>'
      + '<td><button type="button" class="btn small ghost" data-envrev-apply="' + r.env.id + '">Use ' + money(r.suggested) + '</button></td></tr>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Envelope review</h1><p class="muted">November, envelope by envelope: what was filled, what was actually spent, what is left, and what rolls over — then a suggested December fill for each envelope, worked out from what the household really spent over the last three months (' + rows[0].months3.map((k) => monthLabel(k)).join(', ') + '), rounded up to the next $5. The review follows the month switcher at the top, so any month can be reviewed the same way.</p></div>'
    + '<div><a class="btn ghost" href="#/envelopes">Cash envelopes →</a></div></div>'
    + '<div class="grid kpis">' + kpiCards + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>November fills vs November spends</h2>'
    + '<p class="muted small" style="margin-top:0">“Over” means the envelope spent past its fill — the household borrowed from somewhere else that month. “Left” is cash still in the envelope; unspent budget rolls into December on its own. The suggested fill is the three-month average spend, rounded up to the next $5, so it is sized by habit, not by hope.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Envelope</th><th class="amount">Filled</th><th class="amount">Spent</th><th class="amount">Left / over</th><th class="amount">Rolled in</th><th class="amount">Rolls out</th><th class="amount">Avg / month</th><th class="amount">Suggested Dec</th><th></th></tr></thead><tbody>' + tableRows + '</tbody>'
    + '<tfoot><tr><td><b>All envelopes</b></td><td class="amount"><b>' + money(totals.filled) + '</b></td><td class="amount"><b>' + money(totals.spent) + '</b></td><td class="amount"><b class="' + (totals.left < 0 ? 'neg' : 'pos') + '">' + money(totals.left) + '</b></td><td class="amount"><b>' + money(totals.rolled) + '</b></td><td class="amount"><b>' + money(totals.nextRolled) + '</b></td><td class="amount"><b>' + money(round2(rows.reduce((a, r) => a + r.avg3, 0))) + '</b></td><td class="amount"><b>' + money(suggestedTotal) + '</b></td><td></td></tr></tfoot></table></div>'
    + '<p class="chip-row" style="margin-top:12px"><button type="button" class="btn primary" data-envrev-apply-all="1">Apply suggested fills to December (' + money(suggestedTotal) + ')</button>'
    + (lastApplied ? ' <button type="button" class="btn ghost" data-envrev-undo="1">Undo — put December back</button>' : '')
    + '</p>'
    + (applyNote ? '<p class="form-ok">' + esc(applyNote) + '</p>' : '')
    + '<p class="muted small">Applying writes the suggestions into December’s envelopes on the Envelopes page — the November fills are untouched, and Undo puts December back exactly as it was, envelope by envelope. December’s budgets still total ' + money(budgetTotal) + '; the suggestion is a fill, not a new budget.</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>What this tells us</h2><ul class="when-list">'
    + '<li><b>' + (biggestOver ? esc(biggestOver.env.label) + ' overspent by ' + money(biggestOver.over) + '.' : 'No envelope overspent.') + '</b> ' + (biggestOver ? 'It was filled with ' + money(biggestOver.fill) + ' and spent ' + money(biggestOver.spent) + ' — its December suggestion (' + money(biggestOver.suggested) + ') is sized by its three-month average (' + money(biggestOver.avg3) + ' a month), so the same month does not repeat.' : 'Every envelope stayed inside its fill in ' + monthLabel(key) + ' — the suggestions only trim the envelopes that have been running light.') + '</li>'
    + '<li><b>' + (biggestUnder ? esc(biggestUnder.env.label) + ' left the most unspent: ' + money(biggestUnder.left) + '.' : 'Nothing was left unspent.') + '</b> ' + (biggestUnder ? 'Its budget was ' + money(envelopeBaseFill(state, biggestUnder.env)) + ' and it spent ' + money(biggestUnder.spent) + '; ' + money(biggestUnder.rollsOut) + ' of that rolls into December on its own, and its suggested fill (' + money(biggestUnder.suggested) + ') is smaller than its November fill (' + money(biggestUnder.fill) + ') because the habit says so.' : '') + '</li>'
    + '<li><b>December on the suggestion costs ' + money(suggestedTotal) + ' across the envelopes.</b> That is ' + (suggestedTotal > decNowTotal ? money(round2(suggestedTotal - decNowTotal)) + ' more than December fills today (' + money(decNowTotal) + ')' : suggestedTotal < decNowTotal ? money(round2(decNowTotal - suggestedTotal)) + ' less than December fills today (' + money(decNowTotal) + ')' : 'exactly what December fills today') + ' — and ' + money(totals.nextRolled) + ' of December’s opening cash is earned rollover from November, not new money.</li>'
    + '</ul></div>';
}
