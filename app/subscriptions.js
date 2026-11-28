// Hearth & Home Budget — subscription audit: every recurring
// subscription the household pays for, judged on one question — when
// did anyone last use it? A subscription used in the last 30 days
// earns its place; 31-60 days means a cheaper tier would do; over 60
// days means cancel it. Cancelling or downgrading really changes the
// totals, and everything persists in localStorage. This is the audit
// view — Bills is the due-date view, this one is the do-we-still-need-
// it view. Loaded on demand, so it stays out of the first load.
import { money, money0, monthEndISO, monthLabel, sampleSubscriptions, subMonthly, subTotals, subVerdict, subYearly, subscriptionStore, todayISO, uid } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// The last add-form error, shown on the page until the next render.
let subError = '';

// The household's own category colours, so a subscription reads at a
// glance the same way a transaction does. Anything without a match
// gets the neutral grey.
const SUB_COLORS = {
  Streaming: '#b3382e', Music: '#c25e7a', 'Cloud storage': '#2b5f8a',
  Shopping: '#8a6d2b', Health: '#6a4a8a', Gaming: '#7a5c1e',
  'Books & audio': '#3f7d6b', Learning: '#1d6b4f', Magazines: '#5d6d64',
  Apps: '#d9a441',
};
function subColor(cat) { return SUB_COLORS[cat] || '#5d6d64'; }

// ---- Actions (called from main.js) ----

// Cancel one subscription. It stays on the page in the Cancelled list
// with its saving, and Restore brings it straight back.
export function cancelSub(state, id) {
  const s = (state.subscriptions || []).find((x) => x.id === id);
  if (!s || s.status === 'cancelled') return false;
  s.status = 'cancelled';
  s.cancelledOn = monthEndISO(state.currentMonth);
  state.sample = false;
  return true;
}

export function restoreSub(state, id) {
  const s = (state.subscriptions || []).find((x) => x.id === id);
  if (!s || s.status !== 'cancelled') return false;
  s.status = 'active';
  delete s.cancelledOn;
  state.sample = false;
  return true;
}

// Cancel every subscription the audit flags as unused, in one press.
// Returns how many were cancelled, so the page can say so.
export function cancelFlagged(state) {
  const ref = monthEndISO(state.currentMonth);
  let n = 0;
  for (const s of subscriptionStore(state)) {
    if (s.status === 'cancelled') continue;
    if (subVerdict(s, ref).kind === 'cancel') {
      s.status = 'cancelled';
      s.cancelledOn = ref;
      n++;
    }
  }
  if (n) state.sample = false;
  return n;
}

// Downgrade one subscription to a cheaper tier: it costs half from
// now on, and the audit stops counting its saving as still available.
export function downgradeSub(state, id) {
  const s = (state.subscriptions || []).find((x) => x.id === id);
  if (!s || s.status === 'cancelled' || s.downgraded) return false;
  s.downgraded = true;
  state.sample = false;
  return true;
}

export function undoDowngrade(state, id) {
  const s = (state.subscriptions || []).find((x) => x.id === id);
  if (!s || !s.downgraded) return false;
  s.downgraded = false;
  state.sample = false;
  return true;
}

// Add a subscription from the form on the page. Returns the new
// subscription, or false when the form is not filled in properly —
// the reason is shown on the page, not swallowed.
export function addSub(state, name, cost, category, lastUsed, billed) {
  subError = '';
  const cleanName = String(name || '').trim();
  const amount = Number(cost);
  if (!cleanName) { subError = 'Please name the subscription.'; return false; }
  if (!Number.isFinite(amount) || amount <= 0) { subError = 'The cost must be more than $0.'; return false; }
  if (!lastUsed) { subError = 'Please pick the date it was last used — the audit judges it on that date.'; return false; }
  if (lastUsed > monthEndISO(state.currentMonth)) { subError = 'Last used cannot be after the end of ' + monthLabel(state.currentMonth) + '.'; return false; }
  const monthly = billed === 'yearly' ? Math.round((amount / 12) * 100) / 100 : Math.round(amount * 100) / 100;
  const sub = {
    id: uid('sub'), name: cleanName, category: category || 'Apps',
    monthly, billed: billed === 'yearly' ? 'yearly' : 'monthly',
    yearly: billed === 'yearly' ? Math.round(amount * 100) / 100 : 0,
    lastUsed, status: 'active', downgraded: false,
  };
  subscriptionStore(state).push(sub);
  state.sample = false;
  return sub;
}

export function resetSubs(state) {
  state.subscriptions = sampleSubscriptions();
  state.sample = false;
}

// Mark a subscription as used today: its verdict flips to Keep at once,
// which is how the household records that a "cancel" was wrong — the app
// was opened after all. The date is also appended to the usage log, so
// the "last used" judgement is backed by a visible history instead of
// one lonely date. Pressing it twice on the same day logs it once.
export function markUsed(state, id) {
  const s = (state.subscriptions || []).find((x) => x.id === id);
  if (!s || s.status === 'cancelled') return false;
  const today = todayISO();
  s.lastUsed = today;
  if (!Array.isArray(s.uses)) s.uses = [];
  if (s.uses[0] !== today) s.uses.unshift(today);
  s.uses = s.uses.slice(0, 6);
  state.sample = false;
  return true;
}

function fmtShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function verdictPill(v) {
  if (v.kind === 'cancel') return '<span class="pill over">Cancel</span>';
  if (v.kind === 'downgrade') return '<span class="pill warn">Downgrade</span>';
  return '<span class="pill">Keep</span>';
}

function subRow(state, ref, s, totals) {
  const v = subVerdict(s, ref);
  const mo = subMonthly(s);
  const yr = subYearly(s);
  const color = subColor(s.category);
  const billedNote = s.billed === 'yearly' ? 'billed yearly · ' + money(s.yearly) + '/yr' : 'billed monthly';
  const actions = s.status === 'cancelled'
    ? '<button type="button" class="btn small ghost" data-sub-restore="' + s.id + '">Restore</button>'
    : (v.kind === 'cancel'
        ? '<button type="button" class="btn small" data-sub-cancel="' + s.id + '">Cancel it</button> <button type="button" class="btn small ghost" data-sub-used="' + s.id + '">I used it — keep</button>'
        : v.kind === 'downgrade'
          ? (s.downgraded
            ? '<span class="pill">Downgraded — now ' + money(mo) + '/mo</span> <button type="button" class="btn small ghost" data-sub-undowngrade="' + s.id + '">Undo downgrade</button>'
            : '<button type="button" class="btn small" data-sub-downgrade="' + s.id + '">Downgrade — save ' + money(yr / 2) + '/yr</button> <button type="button" class="btn small ghost" data-sub-cancel="' + s.id + '">Cancel instead</button> <button type="button" class="btn small ghost" data-sub-used="' + s.id + '">I used it — keep</button>')
          : '<button type="button" class="btn small ghost" data-sub-cancel="' + s.id + '">Cancel</button>');
  return '<tr><td><span class="cat-dot" style="background:' + color + '"></span><b>' + esc(s.name) + '</b><span class="muted small" style="display:block">' + esc(s.category) + ' · ' + billedNote + (s.downgraded ? ' · on the cheaper tier' : '') + '</span></td>'
    + '<td class="amount">' + money(mo) + '<span class="muted small" style="display:block">/ month</span></td>'
    + '<td class="amount">' + money(yr) + '<span class="muted small" style="display:block">/ year</span></td>'
    + '<td>' + fmtDate(s.lastUsed) + '<span class="muted small" style="display:block">' + v.days + ' days ago</span><span class="muted small" style="display:block">Used ' + (s.uses || []).length + '× logged: ' + (s.uses || []).slice(0, 3).map(fmtShort).join(' · ') + '</span></td>'
    + '<td>' + verdictPill(v) + '<span class="muted small" style="display:block">' + esc(v.note) + '</span></td>'
    + '<td>' + actions + '</td></tr>';
}

export function renderSubscriptions(state, root) {
  const key = state.currentMonth;
  const ref = monthEndISO(key);
  const subs = subscriptionStore(state);
  const t = subTotals(state, key);
  const active = subs.filter((s) => s.status !== 'cancelled');
  const cancelled = subs.filter((s) => s.status === 'cancelled');
  const cats = ['Streaming', 'Music', 'Cloud storage', 'Shopping', 'Health', 'Gaming', 'Books & audio', 'Learning', 'Magazines', 'Apps'];
  const byCat = {};
  for (const s of active) byCat[s.category] = (byCat[s.category] || 0) + subMonthly(s);
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const gym = subs.find((s) => s.category === 'Health');
  const gymMonthly = gym ? subMonthly(gym) : 0;
  const gymUsed = gym ? gym.lastUsed : ref;

  const kpiCards =
    '<div class="card kpi"><div class="kpi-label">Paying every month</div><div class="kpi-value num">' + money(t.monthly) + '</div><div class="kpi-sub">' + t.activeCount + ' active subscriptions · ' + money(t.yearly) + ' a year</div></div>'
    + '<div class="card kpi ' + (t.cancelCount ? 'warn' : 'good') + '"><div class="kpi-label">Unused — cancel these</div><div class="kpi-value num">' + money(t.cancelSaving) + ' / yr</div><div class="kpi-sub">' + (t.cancelCount ? t.cancelCount + ' subscription' + (t.cancelCount === 1 ? '' : 's') + ' not used in 60 days' : 'Nothing unused — every subscription earned its place') + '</div></div>'
    + '<div class="card kpi ' + (t.downgradeCount ? 'warn' : 'good') + '"><div class="kpi-label">Barely used — downgrade</div><div class="kpi-value num">' + money(t.downgradeSaving) + ' / yr</div><div class="kpi-sub">' + (t.downgradeCount ? t.downgradeCount + ' subscription' + (t.downgradeCount === 1 ? '' : 's') + ' used once in the last month or two' : 'Nothing to downgrade') + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Total you could save</div><div class="kpi-value num">' + money(t.totalSaving) + ' / yr</div><div class="kpi-sub">' + (t.totalSaving > 0 ? 'That is ' + money0(t.totalSaving / 12) + ' a month back in the household budget' : 'The audit is clean — nothing left to save here') + '</div></div>';

  const summary = t.totalSaving > 0
    ? '<div class="alert" role="alert"><strong>Cancel the ' + t.cancelCount + ' unused subscription' + (t.cancelCount === 1 ? '' : 's') + ' and save ' + money(t.cancelSaving) + ' a year.</strong> Downgrade the ' + t.downgradeCount + ' barely-used ' + (t.downgradeCount === 1 ? 'one' : 'ones') + ' and save another ' + money(t.downgradeSaving) + ' a year — <strong>' + money(t.totalSaving) + ' a year in total</strong>, without giving up anything the household actually uses. '
      + (t.cancelCount ? '<button type="button" class="btn small" data-sub-cancel-flagged="1" style="margin-left:8px">Cancel the ' + t.cancelCount + ' flagged now</button>' : '')
      + '</div>'
    : '<div class="alert ok"><strong>The audit is clean.</strong> Every subscription was used in the last month — nothing to cancel, nothing to downgrade.</div>';

  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => {
    const pct = t.monthly ? (v / t.monthly) * 100 : 0;
    return '<div class="bar-row"><div class="bar-top"><span><span class="cat-dot" style="background:' + subColor(c) + '"></span><b>' + esc(c) + '</b></span><span>' + money(v) + ' / mo · ' + pct.toFixed(0) + '%</span></div><div class="bar"><i style="width:' + Math.min(100, pct).toFixed(1) + '%;background:' + subColor(c) + '"></i></div></div>';
  }).join('');

  const activeRows = active
    .slice().sort((a, b) => subVerdict(b, ref).days - subVerdict(a, ref).days)
    .map((s) => subRow(state, ref, s, t)).join('');
  const cancelledRows = cancelled.length
    ? cancelled.map((s) => subRow(state, ref, s, t)).join('')
    : '';

  root.innerHTML =
    '<div class="page-head"><div><h1>Subscription audit</h1><p class="muted">Thirteen subscriptions, ' + money(t.monthly) + ' a month, ' + money(t.yearly) + ' a year — and some of them nobody has opened in months. This page judges each one on a single question: when did anyone last use it? Bills tells you when a payment is due; this page tells you whether the payment should exist at all. Audited as of ' + fmtDate(ref) + '.</p></div>'
    + '<div><button class="btn ghost" id="btn-add-tx">+ Add transaction</button> <button class="btn plain" data-sub-reset="1">Reset to sample subscriptions</button></div></div>'
    + summary
    + '<div class="grid kpis" style="margin-top:16px">' + kpiCards + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Every subscription, judged</h2>'
    + '<p class="muted small" style="margin-top:0">Sorted by longest unused first. Cancel removes it from the monthly total at once and moves it to the Cancelled list below — Restore brings it straight back, so nothing here is final. Every row also shows its usage log — the last dates anyone actually opened it — and “I used it — keep” adds today to the log and flips the verdict to Keep at once.</p>'
    + (active.length
      ? '<table><thead><tr><th>Subscription</th><th class="amount">Monthly</th><th class="amount">Yearly</th><th>Last used</th><th>Verdict</th><th>Do it</th></tr></thead><tbody>' + activeRows + '</tbody></table>'
      : '<p class="empty">No active subscriptions — everything is cancelled. Add one below, or reset the sample list.</p>')
    + '</div>'
    + (cancelled.length
      ? '<div class="card" style="margin-top:16px"><h2>Cancelled — ' + money(t.cancelledYearly) + ' a year no longer going out</h2>'
        + '<p class="muted small" style="margin-top:0">These stay listed so the saving is visible, and so a cancelled subscription is one press away from coming back.</p>'
        + '<table><thead><tr><th>Subscription</th><th class="amount">Monthly</th><th class="amount">Yearly</th><th>Last used</th><th>Verdict</th><th>Do it</th></tr></thead><tbody>' + cancelledRows + '</tbody></table></div>'
      : '')
    + '<div class="grid two" style="margin-top:16px"><div class="card"><h2>Where the subscription money goes</h2>' + catRows
    + '<p class="muted small">' + (topCat ? esc(topCat[0]) + ' is the biggest slice at ' + money(topCat[1]) + ' a month — ' + (topCat[0] === 'Streaming' ? 'three video services is where most households quietly double-pay.' : 'worth one look a year, even when the audit is clean.') : 'Add a subscription to see the split.') + '</p></div>'
    + '<div class="card"><h2>Add a subscription</h2>'
    + '<p class="muted small" style="margin-top:0">Found another one on the bank statement? Add it here — the audit judges it on its last-used date the moment it lands.</p>'
    + '<p class="move-row"><span class="inline-label">Name <input id="sub-add-name" type="text" maxlength="60" placeholder="e.g. Newspaper app" aria-label="Subscription name"></span></p>'
    + '<p class="move-row"><span class="inline-label">Cost $ <input id="sub-add-cost" type="number" min="0.01" step="0.01" placeholder="9.99" aria-label="Subscription cost"></span>'
    + '<span class="inline-label"> <select id="sub-add-billed" aria-label="Billed monthly or yearly"><option value="monthly">per month</option><option value="yearly">per year</option></select></span></p>'
    + '<p class="move-row"><span class="inline-label">Category <select id="sub-add-cat" aria-label="Subscription category">' + cats.map((c) => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('') + '</select></span>'
    + '<span class="inline-label">Last used <input id="sub-add-used" type="date" value="2026-11-20" aria-label="Date last used"></span></p>'
    + '<p><button type="button" class="btn small" data-sub-add="1">Add subscription</button></p>'
    + (subError ? '<p class="form-error">' + esc(subError) + '</p>' : '')
    + '</div></div>'
    + '<div class="card" style="margin-top:16px"><h2>How to run this audit every month</h2>'
    + '<p>Pick one evening a month — payday is a good one — and open this page. Anything over 60 days unused gets cancelled on the spot; anything 31–60 days gets downgraded to the cheaper tier for a month and re-judged next month. The household’s rule of thumb: a subscription that is not opened in two months is not a subscription, it is a donation to a company. The gym is the usual exception — ' + money(gymMonthly) + ' a month is worth it only if someone goes twice a week; last used ' + fmtDate(gymUsed) + ', so it stays for now.</p>'
    + '<p class="muted small">The two subscriptions flagged here — Duolingo Plus and National Geographic — together cost ' + money(t.cancelSaving) + ' a year and have not been opened since September. Cancelling them alone pays for a month of groceries.</p></div>';
}
