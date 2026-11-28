// Hearth & Home Budget — net worth: what the household owns minus
// what it owes, worked out live from its own records. The asset is the
// cash the household kept, month by month (income minus spending,
// January through the month being viewed) — and the page shows where
// that cash sits: in savings goals, in the 52-week challenge, in the
// round-up pot, in the cash envelopes, and the rest unassigned in the
// main account. Liabilities are the three debts at their current
// balance. The trend holds the debts flat because no debt payment is
// recorded in Transactions yet — record one and the line moves. An
// editable net-worth target is measured against the pace the household
// actually kept, with the month it lands on. Lazy-loaded: it only
// loads when the Net worth nav link is opened, so it never touches
// the first load.
import { money, money0, monthLabel, networthSummary } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderNetworth(state, root) {
  const s = networthSummary(state);
  const maxAbs = Math.max.apply(null, s.months.map((r) => Math.abs(r.net)).concat([1]));
  const assetRows = [
    { label: 'Unassigned cash — in the main account', value: s.unassigned, color: '#1d6b4f', note: 'Kept, not yet given a job. Assign it to a goal and it moves down there.' },
    { label: 'Savings goals', value: s.goalTotal, color: '#2b5f8a', note: 'Emergency fund, summer holiday and the car deposit, added together.' },
    { label: 'Cash in envelopes', value: s.envLeft, color: '#7a5c1e', note: 'What is left in the six envelopes for ' + esc(monthLabel(state.currentMonth)) + ' after this month’s spending.' },
    { label: '52-week challenge', value: s.chSaved, color: '#3f7d6b', note: 'Paid weeks so far, added up under whichever plan is running.' },
    { label: 'Round-up pot', value: s.pot, color: '#c25e7a', note: 'Spare cents swept from card payments, waiting to move into a goal.' },
  ].map((a) => {
    const share = s.assets ? (a.value / s.assets * 100) : 0;
    return '<div class="bar-row"><div class="bar-top"><span><span class="cat-dot" style="background:' + a.color + '"></span><b>' + esc(a.label) + '</b></span><span>' + money(a.value) + ' · ' + share.toFixed(1) + '% of what the household owns</span></div>'
      + '<div class="bar"><i style="width:' + Math.min(100, share).toFixed(1) + '%;background:' + a.color + '"></i></div>'
      + '<p class="muted small" style="margin:4px 0 0">' + esc(a.note) + '</p></div>';
  }).join('');
  const debtRows = s.debts.map((d) => '<tr><td><b>' + esc(d.name) + '</b></td><td class="amount">' + money(d.balance) + '</td><td class="amount">' + d.apr.toFixed(1) + '%</td><td class="amount">' + money(d.min) + ' / mo</td><td>' + d.share.toFixed(1) + '% of what is owed</td></tr>').join('');
  const trendRows = s.months.map((r) => {
    const w = Math.max(1.5, (Math.abs(r.net) / maxAbs) * 50);
    const bar = r.net >= 0
      ? '<span class="nw-bar pos" style="left:50%;width:' + w.toFixed(1) + '%"></span>'
      : '<span class="nw-bar neg" style="right:50%;width:' + w.toFixed(1) + '%"></span>';
    return '<div class="nw-row"><span class="nw-month"><b>' + esc(r.short) + '</b></span><span class="nw-track">' + bar + '<span class="nw-zero"></span></span><span class="nw-val ' + (r.net >= 0 ? 'pos' : 'neg') + '">' + (r.net >= 0 ? '+' : '−') + money(Math.abs(r.net)) + '</span></div>';
  }).join('');
  const monthRows = s.months.map((r) => '<tr><td><b>' + esc(r.label) + '</b>' + (r.key === (s.firstPositive && s.firstPositive.key) ? ' <span class="pill">turned positive</span>' : '') + '</td>'
    + '<td class="amount">' + money(r.saved) + '</td>'
    + '<td class="amount">' + money(r.assets) + '</td>'
    + '<td class="amount">' + money(s.liabilities) + '</td>'
    + '<td class="amount"><b class="' + (r.net >= 0 ? 'pos' : 'neg') + '">' + (r.net >= 0 ? '' : '−') + money(Math.abs(r.net)) + '</b></td></tr>').join('');
  const targetLine = s.gap <= 0
    ? 'Already there — net worth ' + money(s.net) + ' clears the ' + money(s.target) + ' target. Raise the target and the date below moves with it.'
    : s.monthsTo > 0
      ? 'At the ' + money(s.pace) + '-a-month pace the household kept this year, net worth reaches ' + money(s.target) + ' in <b>' + esc(monthLabel(s.targetKey)) + '</b> — ' + s.monthsTo + ' month' + (s.monthsTo === 1 ? '' : 's') + ' from now, ' + money(s.gap) + ' to go. That is ' + s.monthsTo + ' months of keeping the current pace and nothing else.'
      : 'At the current pace the ' + money(s.target) + ' target has no date yet — the household saved nothing on average this year, so the first step is a month back in the black.';
  const turnedLine = s.firstPositive
    ? 'Net worth turned positive in <b>' + esc(s.firstPositive.label) + '</b> — the fourth month of the year. January started ' + money(Math.abs(s.months[0].net)) + ' under water, because the car loan alone was bigger than everything the household had kept.'
    : 'Net worth is still under water — the debts are bigger than everything the household has kept so far. Every dollar saved and every dollar of debt paid down moves the same line the same way.';

  root.innerHTML =
    '<div class="page-head"><div><h1>Net worth</h1><p class="muted">What this household owns, minus what it owes — ' + monthLabel(state.currentMonth) + ', ' + s.n + ' months of its own figures. No guesses: every number below is worked out from the transactions, goals, challenges, envelopes and debts already in this app.</p></div>'
    + '<div><a class="btn ghost" href="#/reports">Debt payoff plan →</a> <a class="btn plain" href="#/goals">Savings goals →</a></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi ' + (s.net >= 0 ? 'good' : 'warn') + '"><div class="kpi-label">Net worth</div><div class="kpi-value num">' + (s.net >= 0 ? '' : '−') + money(Math.abs(s.net)) + '</div><div class="kpi-sub">' + (s.net >= 0 ? 'Owns more than it owes' : 'Still owes more than it owns') + ' · ' + money(s.pace) + ' a month kept, on average</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Owns — cash kept</div><div class="kpi-value num">' + money(s.assets) + '</div><div class="kpi-sub">Income minus spending, January to ' + esc(monthLabel(state.currentMonth)) + '</div></div>'
    + '<div class="card kpi ' + (s.liabilities > 0 ? 'warn' : '') + '"><div class="kpi-label">Owes — debts</div><div class="kpi-value num">' + money(s.liabilities) + '</div><div class="kpi-sub">' + s.debts.length + ' debt' + (s.debts.length === 1 ? '' : 's') + ' · biggest is the car loan, ' + money(s.debts.length ? Math.max.apply(null, s.debts.map((d) => d.balance)) : 0) + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Turned positive</div><div class="kpi-value num">' + (s.firstPositive ? esc(s.firstPositive.short) + ' ' + s.year : 'Not yet') + '</div><div class="kpi-sub">' + (s.firstPositive ? esc(s.firstPositive.label) + ' — the month the kept cash passed the debts' : 'The debts still outweigh the kept cash') + '</div></div>'
    + '</div>'
    + '<div class="grid two" style="margin-top:16px">'
    + '<div class="card"><h2>What the household owns — ' + money(s.assets) + '</h2><p class="muted small" style="margin-top:0">The same ' + money(s.assets) + ' the year in review counts as saved, split by where it sits right now. Move money into a goal and the split moves — the total only moves when the household saves or spends.</p>' + assetRows + '</div>'
    + '<div class="card"><h2>What the household owes — ' + money(s.liabilities) + '</h2><p class="muted small" style="margin-top:0">The three debts at their current balance. The car loan is ' + (s.liabilities ? Math.round(Math.max.apply(null, s.debts.map((d) => d.balance)) / s.liabilities * 100) : 0) + '% of everything owed — that is why net worth stayed negative until April.</p>'
    + '<table><thead><tr><th>Debt</th><th class="amount">Owed</th><th class="amount">APR</th><th class="amount">Minimum</th><th>Share</th></tr></thead><tbody>' + debtRows
    + '<tr><td><b>Total owed</b></td><td class="amount"><b>' + money(s.liabilities) + '</b></td><td></td><td class="amount"><b>' + money(s.debts.reduce((a, d) => a + d.min, 0)) + ' / mo</b></td><td><b>100%</b></td></tr>'
    + '</tbody></table>'
    + '<p class="muted small">Minimum payments alone are ' + money(s.debts.reduce((a, d) => a + d.min, 0)) + ' a month. The payoff planner on the Reports page compares the snowball and avalanche orders and names the cheaper one for this household — and every dollar of principal paid down adds a dollar to net worth.</p>'
    + '<p><a class="btn small ghost" href="#/reports">Open the payoff planner</a></p></div>'
    + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Net worth, month by month — ' + s.year + '</h2><p class="muted small" style="margin-top:0">' + turnedLine + ' The debts are held flat in this chart because no debt payment is recorded in Transactions yet — record a payment as a transaction and the owed line falls, and the green starts sooner.</p>'
    + '<div class="nw-chart">' + trendRows + '</div>'
    + '<table style="margin-top:12px"><thead><tr><th>Month</th><th class="amount">Saved that month</th><th class="amount">Cash kept so far</th><th class="amount">Owed</th><th class="amount">Net worth</th></tr></thead><tbody>' + monthRows
    + '<tr><td><b>Now — ' + esc(monthLabel(state.currentMonth)) + '</b></td><td class="amount"><b>' + money(s.months[s.months.length - 1].saved) + '</b></td><td class="amount"><b>' + money(s.assets) + '</b></td><td class="amount"><b>' + money(s.liabilities) + '</b></td><td class="amount"><b class="' + (s.net >= 0 ? 'pos' : 'neg') + '">' + (s.net >= 0 ? '' : '−') + money(Math.abs(s.net)) + '</b></td></tr>'
    + '</tbody></table></div>'
    + '<div class="card" style="margin-top:16px"><h2>Your net-worth target</h2>'
    + '<p class="muted small" style="margin-top:0">Pick a number and the page works out when the household gets there at the pace it actually kept — ' + money(s.pace) + ' a month. Leave it blank and the page measures against the next $5,000 milestone above today’s net worth (' + money(s.milestone) + '). The target saves as you type.</p>'
    + '<div class="grid three"><div><label>Net-worth target ($)<input type="number" min="0" step="1000" value="' + s.target + '" data-nw-target aria-label="Net-worth target"></label><p class="muted small">Next milestone: ' + money(s.milestone) + '</p></div>'
    + '<div><p class="muted small" style="margin-top:0">To go</p><p style="font-size:1.15rem;margin:0"><b>' + (s.gap > 0 ? money(s.gap) : 'Already there ✓') + '</b></p><p class="muted small">' + (s.gap > 0 ? s.monthsTo + ' month' + (s.monthsTo === 1 ? '' : 's') + ' at the current pace' : 'No gap left — raise the target') + '</p></div>'
    + '<div><p class="muted small" style="margin-top:0">Date it lands</p><p style="font-size:1.15rem;margin:0"><b>' + (s.targetKey ? esc(monthLabel(s.targetKey)) : 'No date yet') + '</b></p><p class="muted small">At ' + money(s.pace) + ' a month, every month</p></div></div>'
    + '<div class="tip ' + (s.gap <= 0 ? 'good' : '') + '">' + targetLine + '</div>'
    + '<p style="margin-top:12px"><button class="btn" data-nw-aim>Aim for $25,000</button> <button class="btn ghost" data-nw-reset>Back to the next milestone</button></p>'
    + '<p class="muted small">Two ways to get there sooner, and they stack: save $100 more a month and the date moves a month closer; pay $100 of extra principal off the car loan and net worth jumps $100 the day it is paid. The payoff planner shows which order costs least in interest. Try both at once, before committing, in the <a href="#/whatif">What-if planner</a> — trim a category, save extra and pay extra, and watch the date move.</p></div>'
    + '<div class="card" style="margin-top:16px"><h2>What moves net worth</h2>'
    + '<p>Three things, and only three: <b>save a dollar</b> — income minus spending — and net worth rises a dollar. <b>Pay down a dollar of debt principal</b> and net worth rises a dollar too, because the owed side falls while the cash side already counted the payment as spending. <b>Pay a dollar of interest</b> and net worth falls a dollar, with nothing to show for it — which is why the cheapest payoff order matters. This year the household saved ' + money(s.assets) + ' and owes ' + money(s.liabilities) + ': the saving did the work, and the car loan is the reason the first three months still read red.</p>'
    + '<p class="muted small">A note on honesty: this page counts only what the app records. The family car itself, the furniture, the house — real things the household owns — are not in here, because the app has no values for them. Add them as a goal-style record one day and the picture gets fuller; until then, this is the cash net worth, and it is the number the budget can actually move.</p></div>';
}
