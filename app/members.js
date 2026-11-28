// Hearth & Home Budget — household members: one page per person with
// their own monthly allowance, spending counted from transactions tagged
// with their name, and a six-month allowance-vs-spending history. A
// transaction with no person tagged is household-shared and counts toward
// nobody — only tagged spending eats into an allowance. All figures come
// from state; nothing is faked.
import { categoryById, money, money0, monthLabel, monthTransactions, lastMonths, shiftMonth, uid } from './data.js';
import { drawBars } from './charts.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Spending tagged with one person in one month.
export function memberSpent(state, key, whoId) {
  let spent = 0;
  for (const t of monthTransactions(state, key)) {
    if (t.kind === 'expense' && t.who === whoId) spent += t.amount;
  }
  return spent;
}

// Six months of allowance vs tagged spending for one person.
export function memberHistory(state, whoId) {
  const person = (state.allowances || []).find((a) => a.id === whoId);
  const monthly = person ? person.monthly : 0;
  return lastMonths(state.currentMonth, 6).map((key) => {
    const spent = memberSpent(state, key, whoId);
    return { key, allowance: monthly, spent, left: monthly - spent };
  });
}

// Add a new household member with a monthly allowance.
export function addMember(state, name, role, monthly) {
  const member = { id: uid('member'), who: name, role: role || 'Household member', monthly };
  if (!Array.isArray(state.allowances)) state.allowances = [];
  state.allowances.push(member);
  state.sample = false;
  return member;
}

// Small inline sparkline of six monthly values, drawn as SVG.
function sparkSVG(values, color) {
  const max = Math.max.apply(null, values.concat([1]));
  const pts = values.map((v, i) => ((i / Math.max(values.length - 1, 1)) * 136 + 2).toFixed(1) + ',' + (28 - (v / max) * 24).toFixed(1)).join(' ');
  const last = values[values.length - 1] || 0;
  const lx = ((values.length - 1) / Math.max(values.length - 1, 1)) * 136 + 2;
  const ly = 28 - (last / max) * 24;
  return '<svg class="spark" width="140" height="30" viewBox="0 0 140 30" role="img" aria-label="Six-month spending trend"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3" fill="' + color + '"/></svg>';
}

function memberCard(state, key, a) {
  const spent = memberSpent(state, key, a.id);
  const left = a.monthly - spent;
  const pct = a.monthly ? Math.min(100, (spent / a.monthly) * 100) : 0;
  const over = spent > a.monthly;
  const hist = memberHistory(state, a.id).map((h) => h.spent);
  const avg = hist.reduce((x, y) => x + y, 0) / 6;
  // Their biggest single spend this month, if any.
  const mine = monthTransactions(state, key).filter((t) => t.kind === 'expense' && t.who === a.id)
    .sort((x, y) => y.amount - x.amount)[0];
  const color = a.id === 'maya' ? '#1d6b4f' : a.id === 'daniel' ? '#2b5f8a' : a.id === 'sofia' ? '#c25e7a' : '#7a5c1e';
  return '<div class="card member-card"><div class="member-top"><span class="member-ava" style="background:' + color + '22;color:' + color + '">' + esc(a.who.charAt(0)) + '</span>'
    + '<div><h3>' + esc(a.who) + '</h3><p class="muted small" style="margin:0">' + esc(a.role) + '</p></div>'
    + '<span class="pill ' + (over ? 'over' : left <= a.monthly * 0.15 ? 'warn' : '') + '">' + (over ? 'Over by ' + money(spent - a.monthly) : money(left) + ' left') + '</span></div>'
    + '<p style="margin:12px 0 4px"><b>' + money(spent) + '</b> spent of <b>' + money(a.monthly) + '</b> allowance · 6-mo avg ' + money(avg) + '</p>'
    + '<div class="bar"><i class="' + (over ? 'over' : pct > 85 ? 'amber' : '') + '" style="width:' + pct.toFixed(1) + '%"></i></div>'
    + '<p class="muted small" style="margin:10px 0 4px">' + (mine ? 'Biggest this month: ' + esc(mine.description) + ' — ' + money(mine.amount) + ' (' + esc(categoryById(mine.category).label) + ')' : 'Nothing tagged to ' + esc(a.who) + ' yet this month.') + '</p>'
    + '<div class="member-spark">' + sparkSVG(hist, color) + '<span class="muted small">spending, last 6 months</span></div>'
    + '<p style="margin:10px 0 0"><a class="btn small ghost" href="#/members/' + a.id + '">Open ' + esc(a.who) + '’s page →</a> <button class="btn small" data-member-spend="' + a.id + '">+ Add spending</button></p>'
    + '</div>';
}

function renderOverview(state, root) {
  const key = state.currentMonth;
  const people = state.allowances || [];
  const totalAllow = people.reduce((a, p) => a + p.monthly, 0);
  const totalSpent = people.reduce((a, p) => a + memberSpent(state, key, p.id), 0);
  const totalLeft = Math.max(0, totalAllow - totalSpent);
  const biggest = people.map((p) => ({ p, spent: memberSpent(state, key, p.id) })).sort((x, y) => y.spent - x.spent)[0];
  root.innerHTML =
    '<div class="page-head"><div><h1>Household members</h1><p class="muted">Four people, one household budget — and a little money each that is entirely theirs. An allowance is free spending: no category to justify, no questions asked. What is spent is counted from transactions tagged with that person.</p></div>'
    + '<div><button class="btn primary" id="btn-add-member">+ Add member</button></div></div>'
    + '<div class="grid kpis" style="margin-bottom:16px">'
    + '<div class="card kpi"><div class="kpi-label">Allowances this month</div><div class="kpi-value num">' + money(totalAllow) + '</div><div class="kpi-sub">' + people.length + ' people · ' + money0(totalAllow / Math.max(people.length, 1)) + ' each on average</div></div>'
    + '<div class="card kpi ' + (totalSpent > totalAllow ? 'warn' : '') + '"><div class="kpi-label">Spent from allowances</div><div class="kpi-value num">' + money(totalSpent) + '</div><div class="kpi-sub">' + (totalAllow ? Math.round(totalSpent / totalAllow * 100) + '% of the month’s allowances used' : 'No allowances set yet') + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Still free to spend</div><div class="kpi-value num">' + money(totalLeft) + '</div><div class="kpi-sub">Across everyone’s allowances</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Biggest spender</div><div class="kpi-value num">' + (biggest && biggest.spent > 0 ? esc(biggest.p.who) : '—') + '</div><div class="kpi-sub">' + (biggest && biggest.spent > 0 ? money(biggest.spent) + ' tagged this month' : 'Nobody has tagged spending yet') + '</div></div>'
    + '</div>'
    + '<div class="member-grid">' + people.map((a) => memberCard(state, key, a)).join('') + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>How allowances work here</h2>'
    + '<p>When you add a transaction, pick who spent it — the amount counts against that person’s allowance for the month and nowhere else. Leave it on “Household (shared)” and it is a household cost: rent, bills, the weekly shop. Kids see exactly what is left of their own money, which is the whole lesson: a limit you can see is a limit you can keep.</p>'
    + '<p class="muted small">Edit an allowance on a person’s own page — it saves as you type and applies from this month on. Adding a member gives them an allowance of their own and a page of their own.</p></div>';
}

function renderDetail(state, root, memberId) {
  const key = state.currentMonth;
  const a = (state.allowances || []).find((x) => x.id === memberId);
  if (!a) {
    root.innerHTML = '<div class="page-head"><div><h1>Member not found</h1><p class="muted">That person is not in this household any more — or the link is stale.</p></div></div><p><a class="btn ghost" href="#/members">← Back to all members</a></p>';
    return;
  }
  const spent = memberSpent(state, key, a.id);
  const left = a.monthly - spent;
  const over = spent > a.monthly;
  const hist = memberHistory(state, a.id);
  const avgSpent = hist.reduce((x, h) => x + h.spent, 0) / 6;
  const avgLeft = hist.reduce((x, h) => x + Math.max(0, h.left), 0) / 6;
  const bestMonth = hist.slice().sort((x, y) => x.spent - y.spent)[0];
  const mine = monthTransactions(state, key).filter((t) => t.who === a.id)
    .sort((x, y) => y.date.localeCompare(x.date) || y.id.localeCompare(x.id));
  const color = a.id === 'maya' ? '#1d6b4f' : a.id === 'daniel' ? '#2b5f8a' : a.id === 'sofia' ? '#c25e7a' : '#7a5c1e';
  const histRows = hist.map((h) => {
    const status = h.spent > h.allowance ? '<span class="pill over">Over by ' + money(h.spent - h.allowance) + '</span>'
      : h.spent > h.allowance * 0.85 ? '<span class="pill warn">Almost all used</span>' : '<span class="pill">Kept ' + money(Math.max(0, h.left)) + '</span>';
    return '<tr><td>' + monthLabel(h.key) + '</td><td class="amount">' + money(h.allowance) + '</td><td class="amount">' + money(h.spent) + '</td><td class="amount"><b class="' + (h.left < 0 ? 'neg' : 'pos') + '">' + money(h.left) + '</b></td><td>' + status + '</td></tr>';
  }).join('');
  const txRows = mine.length ? '<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="amount">Amount</th><th></th></tr></thead><tbody>'
    + mine.map((t) => {
        const cat = categoryById(t.category);
        return '<tr><td class="num">' + fmtDate(t.date) + '</td><td><b>' + esc(t.description) + '</b>' + (t.note ? '<span class="muted small" style="display:block">' + esc(t.note) + '</span>' : '') + '</td>'
          + '<td><span class="cat-dot" style="background:' + cat.color + '"></span>' + esc(cat.label) + '</td>'
          + '<td class="amount"><span class="' + (t.kind === 'income' ? 'pos' : 'neg') + '">' + (t.kind === 'income' ? '+' : '−') + money(t.amount) + '</span></td>'
          + '<td><button class="icon-btn" data-edit="' + t.id + '">Edit</button> <button class="icon-btn" data-del="' + t.id + '">Delete</button></td></tr>';
      }).join('') + '</tbody></table>'
    : '<p class="empty">No transactions tagged to ' + esc(a.who) + ' in ' + monthLabel(key) + ' yet — press “Add spending” and tag the first one.</p>';

  root.innerHTML =
    '<div class="page-head"><div><p style="margin:0"><a href="#/members">← All members</a></p><h1>' + esc(a.who) + '’s page</h1><p class="muted">' + esc(a.role) + ' · ' + monthLabel(key) + ' · every figure below is ' + esc(a.who) + '’s own money, counted from their tagged transactions.</p></div>'
    + '<div><button class="btn primary" data-member-spend="' + a.id + '">+ Add spending</button> <button class="btn danger small" data-member-del="' + a.id + '">Remove member</button></div></div>'
    + '<div class="grid kpis" style="margin-bottom:16px">'
    + '<div class="card kpi"><div class="kpi-label">Monthly allowance</div><div class="kpi-value num"><span class="budget-edit">$<input type="number" min="0" step="5" value="' + a.monthly + '" data-allowance="' + a.id + '" aria-label="Monthly allowance for ' + esc(a.who) + '"> / mo</span></div><div class="kpi-sub">Edit it here — it saves as you type</div></div>'
    + '<div class="card kpi ' + (over ? 'warn' : '') + '"><div class="kpi-label">Spent in ' + monthLabel(key).split(' ')[0] + '</div><div class="kpi-value num">' + money(spent) + '</div><div class="kpi-sub">' + (a.monthly ? Math.round(spent / a.monthly * 100) + '% of the allowance used' : 'No allowance set') + '</div></div>'
    + '<div class="card kpi ' + (over ? 'warn' : 'good') + '"><div class="kpi-label">' + (over ? 'Over the allowance' : 'Left to spend') + '</div><div class="kpi-value num">' + money(Math.abs(left)) + '</div><div class="kpi-sub">' + (over ? 'Spent past the monthly amount' : 'Free money, no questions asked') + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">6-month average left</div><div class="kpi-value num">' + money(avgLeft) + '</div><div class="kpi-sub">Average spent ' + money(avgSpent) + ' a month · lightest month ' + monthLabel(bestMonth.key) + ' (' + money(bestMonth.spent) + ')</div></div>'
    + '</div>'
    + '<div class="grid two"><div class="card"><h2>Allowance vs spending — last 6 months</h2><div class="chart-wrap"><canvas id="chart-member" class="chart" height="200"></canvas></div>'
    + '<p class="muted small">Green bars are inside the allowance; red bars went over it. ' + esc(a.who) + '’s allowance is ' + money(a.monthly) + ' a month.</p></div>'
    + '<div class="card"><h2>Allowance history</h2><table><thead><tr><th>Month</th><th class="amount">Allowance</th><th class="amount">Spent</th><th class="amount">Left</th><th>Result</th></tr></thead><tbody>' + histRows + '</tbody></table></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>' + esc(a.who) + '’s transactions — ' + monthLabel(key) + '</h2>' + txRows
    + '<p class="muted small">Switch months at the top of the page to see ' + esc(a.who) + '’s spending in any other month. Shared household costs (rent, bills, the weekly shop) are not tagged to anyone and never appear here.</p></div>';
  const canvas = root.querySelector('#chart-member');
  if (canvas) {
    drawBars(canvas, hist.map((h) => ({
      label: monthLabel(h.key).split(' ')[0].slice(0, 3),
      value: h.spent,
      color: h.spent > h.allowance ? '#b3382e' : color,
    })), { valueLabel: (v) => money0(v), max: Math.max.apply(null, hist.map((h) => Math.max(h.spent, h.allowance)).concat([1])) });
  }
}

export function renderMembers(state, root, memberId) {
  if (memberId) renderDetail(state, root, memberId);
  else renderOverview(state, root);
}
