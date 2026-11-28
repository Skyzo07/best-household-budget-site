// Hearth & Home Budget — app shell: routing, dialogs, add/edit/delete,
// CSV export and reset. State lives in data.js and persists to localStorage.
import { loadState, saveState, sampleState, CATEGORIES, categoryById, money, monthLabel, todayISO, uid, monthTransactions } from './data.js';
import { renderDashboard, renderTransactions, renderBudgets, renderGoals, renderInsights } from './views.js';

let state = loadState();
let txFilter = { q: '', cat: 'all', kind: 'all', who: 'all' };
let editingTxId = null;
let editingGoalId = null;

const $ = (sel, root) => (root || document).querySelector(sel);
const app = $('#app');

function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const base = h.split('/')[0];
  return ['transactions', 'budgets', 'bills', 'grocery', 'members', 'goals', 'savings', 'envelopes', 'subscriptions', 'annual', 'insights', 'forecast', 'review', 'networth', 'reports'].includes(base) ? base : 'dashboard';
}

// Person id from a #/members/<id> hash, or '' on the members overview.
function currentMemberId() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/');
  return parts[0] === 'members' && parts[1] ? parts[1] : '';
}

async function showView(route) {
  for (const name of ['dashboard', 'transactions', 'budgets', 'bills', 'grocery', 'members', 'goals', 'savings', 'envelopes', 'subscriptions', 'annual', 'insights', 'forecast', 'review', 'networth', 'reports']) {
    $('#view-' + name).hidden = name !== route;
  }
  for (const a of document.querySelectorAll('[data-nav]')) {
    a.classList.toggle('active', a.dataset.nav === route);
  }
  $('#month-label').textContent = monthLabel(state.currentMonth);
  const root = $('#view-' + route);
  if (route === 'dashboard') renderDashboard(state, root);
  if (route === 'transactions') renderTransactions(state, root, txFilter);
  if (route === 'budgets') renderBudgets(state, root);
  if (route === 'goals') renderGoals(state, root);
  if (route === 'insights') renderInsights(state, root);
  // New sections load on demand so the first load stays small.
  if (route === 'bills') (await import('./bills.js')).renderBills(state, root);
  if (route === 'grocery') (await import('./grocery.js')).renderGrocery(state, root);
  if (route === 'members') (await import('./members.js')).renderMembers(state, root, currentMemberId());
  if (route === 'annual') (await import('./annual.js')).renderAnnual(state, root);
  if (route === 'savings') (await import('./savings.js')).renderSavings(state, root);
  if (route === 'envelopes') (await import('./envelopes.js')).renderEnvelopes(state, root);
  if (route === 'subscriptions') (await import('./subscriptions.js')).renderSubscriptions(state, root);
  if (route === 'reports') (await import('./reports.js')).renderReports(state, root);
  if (route === 'forecast') (await import('./forecast.js')).renderForecast(state, root);
  if (route === 'review') (await import('./review.js')).renderReview(state, root);
  if (route === 'networth') (await import('./networth.js')).renderNetworth(state, root);
  window.scrollTo(0, 0);
}

function rerender() { showView(currentRoute()); }

// Re-render just the Reports view (used while typing in the payoff planner).
async function renderReportsLive() {
  if (currentRoute() !== 'reports') return;
  (await import('./reports.js')).renderReports(state, $('#view-reports'));
}

// Re-render just the Forecast view (used while typing the extra saving).
async function renderForecastLive() {
  if (currentRoute() !== 'forecast') return;
  (await import('./forecast.js')).renderForecast(state, $('#view-forecast'));
}

// Re-render just the Year in review view (used while typing a target).
async function renderReviewLive() {
  if (currentRoute() !== 'review') return;
  (await import('./review.js')).renderReview(state, $('#view-review'));
}

// Re-render just the Net worth view (used while typing a target).
async function renderNetworthLive() {
  if (currentRoute() !== 'networth') return;
  (await import('./networth.js')).renderNetworth(state, $('#view-networth'));
}

function persist() { saveState(state); }

// ---- CSV export ----
function exportCSV() {
  const rows = [['Date', 'Description', 'Category', 'Type', 'Amount', 'Note']];
  const list = state.transactions.slice().sort((a, b) => a.date.localeCompare(b.date));
  for (const t of list) {
    rows.push([t.date, t.description, categoryById(t.category).label, t.kind, t.amount.toFixed(2), t.note || '']);
  }
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hearth-home-budget-' + state.currentMonth + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Transaction dialog ----
const txDialog = $('#tx-dialog');
const txForm = $('#tx-form');
function fillCategorySelect(select, selected) {
  select.innerHTML = CATEGORIES.map((c) => '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + c.label + '</option>').join('');
}
// Set by an "Add spending" button on a member's page so the dialog opens
// already tagged to that person; cleared on save.
let pendingWho = '';
function fillWhoSelect(select, selected) {
  const opts = ['<option value="">Household (shared)</option>'].concat((state.allowances || []).map((a) => '<option value="' + a.id + '"' + (a.id === selected ? ' selected' : '') + '>' + a.who + '</option>'));
  select.innerHTML = opts.join('');
}
// Set by an "Add spending" button on an envelope card so the dialog
// opens already tagged to that envelope's first category; cleared on save.
let pendingCategory = '';
function openTxDialog(tx) {
  editingTxId = tx ? tx.id : null;
  $('#tx-dialog-title').textContent = tx ? 'Edit transaction' : 'Add transaction';
  $('#tx-error').hidden = true;
  fillCategorySelect($('#tx-category'), tx ? tx.category : (pendingCategory || 'groceries'));
  fillWhoSelect($('#tx-who'), tx ? (tx.who || '') : (pendingWho || ''));
  $('#tx-desc').value = tx ? tx.description : '';
  $('#tx-amount').value = tx ? tx.amount : '';
  $('#tx-kind').value = tx ? tx.kind : 'expense';
  $('#tx-date').value = tx ? tx.date : (state.currentMonth + '-01' <= todayISO() ? todayISO().slice(0, 7) === state.currentMonth ? todayISO() : state.currentMonth + '-01' : state.currentMonth + '-01');
  $('#tx-note').value = tx ? (tx.note || '') : '';
  txDialog.showModal();
}
txForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = $('#tx-desc').value.trim();
  const amount = Number($('#tx-amount').value);
  const date = $('#tx-date').value;
  const err = $('#tx-error');
  if (!desc) { err.textContent = 'Please give the transaction a description.'; err.hidden = false; return; }
  if (!amount || amount <= 0) { err.textContent = 'Amount must be more than $0.'; err.hidden = false; return; }
  if (!date) { err.textContent = 'Please pick a date.'; err.hidden = false; return; }
  const data = { description: desc, amount: Math.round(amount * 100) / 100, kind: $('#tx-kind').value, category: $('#tx-category').value, date, note: $('#tx-note').value.trim(), who: $('#tx-who').value || '' };
  if (editingTxId) {
    const tx = state.transactions.find((t) => t.id === editingTxId);
    if (tx) Object.assign(tx, data);
  } else {
    state.transactions.push(Object.assign({ id: uid('tx') }, data));
    state.currentMonth = data.date.slice(0, 7);
  }
  pendingWho = '';
  pendingCategory = '';
  state.sample = false;
  persist();
  txDialog.close();
  rerender();
});
$('#tx-cancel').addEventListener('click', () => txDialog.close());

// ---- Goal dialog ----
const goalDialog = $('#goal-dialog');
const goalForm = $('#goal-form');
function openGoalDialog(goal) {
  editingGoalId = goal ? goal.id : null;
  $('#goal-dialog-title').textContent = goal ? 'Edit savings goal' : 'New savings goal';
  $('#goal-error').hidden = true;
  $('#goal-name').value = goal ? goal.name : '';
  $('#goal-target').value = goal ? goal.target : '';
  $('#goal-saved').value = goal ? goal.saved : 0;
  $('#goal-date').value = goal ? (goal.date || '') : '';
  goalDialog.showModal();
}
goalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#goal-name').value.trim();
  const target = Number($('#goal-target').value);
  const saved = Number($('#goal-saved').value) || 0;
  const err = $('#goal-error');
  if (!name) { err.textContent = 'Please name the goal.'; err.hidden = false; return; }
  if (!target || target <= 0) { err.textContent = 'Target must be more than $0.'; err.hidden = false; return; }
  if (saved < 0 || saved > target * 5) { err.textContent = 'Saved amount looks wrong — check it.'; err.hidden = false; return; }
  const data = { name, target, saved, date: $('#goal-date').value || '' };
  if (editingGoalId) {
    const g = state.goals.find((x) => x.id === editingGoalId);
    if (g) Object.assign(g, data);
  } else {
    state.goals.push(Object.assign({ id: uid('goal') }, data));
  }
  state.sample = false;
  persist();
  goalDialog.close();
  rerender();
});
$('#goal-cancel').addEventListener('click', () => goalDialog.close());

// ---- Bill dialog ----
const billDialog = $('#bill-dialog');
const billForm = $('#bill-form');
let editingBillId = null;
function openBillDialog(bill) {
  editingBillId = bill ? bill.id : null;
  $('#bill-dialog-title').textContent = bill ? 'Edit bill' : 'Add bill';
  $('#bill-error').hidden = true;
  fillCategorySelect($('#bill-category'), bill ? bill.category : 'utilities');
  $('#bill-name').value = bill ? bill.name : '';
  $('#bill-amount').value = bill ? bill.amount : '';
  $('#bill-day').value = bill ? bill.day : '';
  billDialog.showModal();
}
billForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#bill-name').value.trim();
  const amount = Number($('#bill-amount').value);
  const day = Number($('#bill-day').value);
  const err = $('#bill-error');
  if (!name) { err.textContent = 'Please name the bill.'; err.hidden = false; return; }
  if (!amount || amount <= 0) { err.textContent = 'Amount must be more than $0.'; err.hidden = false; return; }
  if (!day || day < 1 || day > 31) { err.textContent = 'Due day must be 1–31.'; err.hidden = false; return; }
  const data = { name, amount: Math.round(amount * 100) / 100, day, category: $('#bill-category').value };
  if (editingBillId) {
    const b = state.bills.find((x) => x.id === editingBillId);
    if (b) Object.assign(b, data);
  } else {
    state.bills.push(Object.assign({ id: uid('bill'), paidMonths: [] }, data));
  }
  state.sample = false;
  persist();
  billDialog.close();
  rerender();
});
$('#bill-cancel').addEventListener('click', () => billDialog.close());

// ---- Recurring-rule dialog ----
const ruleDialog = $('#rule-dialog');
const ruleForm = $('#rule-form');
let editingRuleId = null;
function openRuleDialog(rule) {
  editingRuleId = rule ? rule.id : null;
  $('#rule-dialog-title').textContent = rule ? 'Edit recurring rule' : 'Add recurring rule';
  $('#rule-error').hidden = true;
  fillCategorySelect($('#rule-category'), rule ? rule.category : 'utilities');
  $('#rule-name').value = rule ? rule.name : '';
  $('#rule-amount').value = rule ? rule.amount : '';
  $('#rule-kind').value = rule ? rule.kind : 'expense';
  $('#rule-day').value = rule ? rule.day : '';
  ruleDialog.showModal();
}
ruleForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#rule-name').value.trim();
  const amount = Number($('#rule-amount').value);
  const day = Number($('#rule-day').value);
  const err = $('#rule-error');
  if (!name) { err.textContent = 'Please name the rule.'; err.hidden = false; return; }
  if (!amount || amount <= 0) { err.textContent = 'Amount must be more than $0.'; err.hidden = false; return; }
  if (!day || day < 1 || day > 31) { err.textContent = 'Day must be 1–31.'; err.hidden = false; return; }
  const data = { name, amount: Math.round(amount * 100) / 100, kind: $('#rule-kind').value, category: $('#rule-category').value, day };
  if (editingRuleId) {
    const r = state.recurring.find((x) => x.id === editingRuleId);
    if (r) Object.assign(r, data);
  } else {
    state.recurring.push(Object.assign({ id: uid('rule'), active: true, lastPosted: '' }, data));
  }
  state.sample = false;
  persist();
  ruleDialog.close();
  rerender();
});
$('#rule-cancel').addEventListener('click', () => ruleDialog.close());

// ---- Debt dialog ----
const debtDialog = $('#debt-dialog');
const debtForm = $('#debt-form');
debtForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#debt-name').value.trim();
  const balance = Number($('#debt-balance').value);
  const apr = Number($('#debt-apr').value);
  const min = Number($('#debt-min').value);
  const err = $('#debt-error');
  if (!name) { err.textContent = 'Please name the debt.'; err.hidden = false; return; }
  if (!balance || balance <= 0) { err.textContent = 'Balance must be more than $0.'; err.hidden = false; return; }
  if (apr < 0) { err.textContent = 'APR cannot be negative.'; err.hidden = false; return; }
  if (!min || min <= 0) { err.textContent = 'Minimum payment must be more than $0.'; err.hidden = false; return; }
  state.debts.push({ id: uid('debt'), name, balance, apr, minPayment: min });
  state.sample = false;
  persist();
  debtDialog.close();
  rerender();
});
$('#debt-cancel').addEventListener('click', () => debtDialog.close());

// ---- Grocery-item dialog ----
const grocDialog = $('#groc-dialog');
const grocForm = $('#groc-form');
grocForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#groc-name').value.trim();
  const qty = Number($('#groc-qty').value);
  const price = Number($('#groc-price').value);
  const err = $('#groc-error');
  if (!name) { err.textContent = 'Please name the item.'; err.hidden = false; return; }
  if (!qty || qty < 1) { err.textContent = 'Quantity must be at least 1.'; err.hidden = false; return; }
  if (!price || price <= 0) { err.textContent = 'Price must be more than $0.'; err.hidden = false; return; }
  if (!state.grocery) state.grocery = { offset: 0, list: [], pantry: [], overrides: {} };
  state.grocery.list.push({ id: uid('groc'), name, qty, price: Math.round(price * 100) / 100, checked: false, pantryId: '' });
  state.sample = false;
  persist();
  grocDialog.close();
  rerender();
});
$('#groc-cancel').addEventListener('click', () => grocDialog.close());

// ---- Member dialog ----
const memberDialog = $('#member-dialog');
const memberForm = $('#member-form');
memberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#member-name').value.trim();
  const role = $('#member-role').value.trim();
  const monthly = Number($('#member-monthly').value);
  const err = $('#member-error');
  if (!name) { err.textContent = 'Please give the member a name.'; err.hidden = false; return; }
  if (!monthly || monthly <= 0) { err.textContent = 'Monthly allowance must be more than $0.'; err.hidden = false; return; }
  const members = await import('./members.js');
  const m = members.addMember(state, name, role, Math.round(monthly * 100) / 100);
  persist();
  memberDialog.close();
  location.hash = '#/members/' + m.id;
  rerender();
});
$('#member-cancel').addEventListener('click', () => memberDialog.close());

// ---- Delegated clicks ----
app.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.id === 'btn-add-tx') { openTxDialog(null); return; }
  if (t.id === 'btn-add-goal') { openGoalDialog(null); return; }
  if (t.id === 'btn-add-bill') { openBillDialog(null); return; }
  if (t.id === 'btn-add-rule') { openRuleDialog(null); return; }
  if (t.id === 'btn-add-debt') {
    $('#debt-dialog-title').textContent = 'Add a debt';
    $('#debt-error').hidden = true;
    $('#debt-name').value = ''; $('#debt-balance').value = ''; $('#debt-apr').value = ''; $('#debt-min').value = '';
    debtDialog.showModal();
    return;
  }
  const methodBtn = t.closest('[data-payoff-method]');
  if (methodBtn) {
    const m = methodBtn.dataset.payoffMethod;
    if (m === 'avalanche' || m === 'snowball') {
      state.payoffMethod = m;
      state.sample = false;
      persist();
      rerender();
    }
    return;
  }
  // ---- Forecast method switch (trend / 6-month average / budget plan) ----
  const fcMethodBtn = t.closest('[data-fc-method]');
  if (fcMethodBtn) {
    const m = fcMethodBtn.dataset.fcMethod;
    if (m === 'trend' || m === 'average' || m === 'budget') {
      if (!state.forecast || typeof state.forecast !== 'object') state.forecast = { method: 'trend', extra: 0 };
      state.forecast.method = m;
      state.sample = false;
      persist();
      rerender();
    }
    return;
  }
  // ---- Year in review targets (v10) ----
  const autoTightenBtn = t.closest('[data-review-autotargets]');
  if (autoTightenBtn) {
    const review = await import('./review.js');
    const s = review.reviewSummary(state);
    if (!state.review2027 || typeof state.review2027 !== 'object') state.review2027 = { save: 0, groceries: 0, dining: 0 };
    state.review2027.save = Math.round(s.paceSave * 1.05);
    state.review2027.groceries = Math.round(s.paceGroceries * 0.95);
    state.review2027.dining = Math.round(s.paceDining * 0.9);
    state.sample = false;
    persist();
    rerender();
    window.alert('Targets tightened: save ' + money(state.review2027.save) + ' a month, groceries ' + money(state.review2027.groceries) + ', dining out ' + money(state.review2027.dining) + ' — measured from this year’s own pace.');
    return;
  }
  if (t.closest('[data-review-reset]')) {
    if (!state.review2027 || typeof state.review2027 !== 'object') state.review2027 = { save: 0, groceries: 0, dining: 0 };
    state.review2027.save = 0;
    state.review2027.groceries = 0;
    state.review2027.dining = 0;
    state.sample = false;
    persist();
    rerender();
    return;
  }
  // ---- Net worth target (v11) ----
  const nwAimBtn = t.closest('[data-nw-aim]');
  if (nwAimBtn) {
    const data = await import('./data.js');
    const s = data.networthSummary(state);
    if (!state.networth || typeof state.networth !== 'object') state.networth = { target: 0 };
    state.networth.target = s.net < 25000 ? 25000 : s.milestone;
    state.sample = false;
    persist();
    rerender();
    window.alert('Net-worth target set to ' + money(state.networth.target) + ' — at the current pace it lands in ' + monthLabel(data.networthSummary(state).targetKey) + '.');
    return;
  }
  if (t.closest('[data-nw-reset]')) {
    if (!state.networth || typeof state.networth !== 'object') state.networth = { target: 0 };
    state.networth.target = 0;
    state.sample = false;
    persist();
    rerender();
    return;
  }
  // ---- Bills year grid: jump the month switcher to that month (v10) ----
  const gotoMonthBtn = t.closest('[data-bill-goto-month]');
  if (gotoMonthBtn) {
    const k = gotoMonthBtn.dataset.billGotoMonth;
    if (/^\d{4}-\d{2}$/.test(k)) {
      state.currentMonth = k;
      persist();
      rerender();
    }
    return;
  }
  if (t.id === 'btn-print') { window.print(); return; }
  if (t.id === 'btn-post-due') {
    const bills = await import('./bills.js');
    const posted = bills.postAllDue(state, state.currentMonth);
    persist();
    rerender();
    if (posted.length) window.alert(posted.length + ' recurring item' + (posted.length === 1 ? '' : 's') + ' posted into Transactions for ' + monthLabel(state.currentMonth) + '.');
    else window.alert('Nothing due to post — every active rule is already posted for this month.');
    return;
  }
  if (t.id === 'btn-add-groc') {
    $('#groc-dialog-title').textContent = 'Add grocery item';
    $('#groc-error').hidden = true;
    $('#groc-name').value = ''; $('#groc-qty').value = 1; $('#groc-price').value = '';
    grocDialog.showModal();
    return;
  }
  if (t.id === 'btn-add-member') {
    $('#member-error').hidden = true;
    $('#member-name').value = ''; $('#member-role').value = ''; $('#member-monthly').value = '';
    memberDialog.showModal();
    return;
  }
  const memberSpend = t.closest('[data-member-spend]');
  if (memberSpend) {
    const a = (state.allowances || []).find((x) => x.id === memberSpend.dataset.memberSpend);
    if (a) { pendingWho = a.id; openTxDialog(null); }
    return;
  }
  const memberDel = t.closest('[data-member-del]');
  if (memberDel) {
    const a = (state.allowances || []).find((x) => x.id === memberDel.dataset.memberDel);
    if (a && window.confirm('Remove ' + a.who + ' from the household? Their tagged transactions stay in the records, but the allowance and page go away.')) {
      state.allowances = (state.allowances || []).filter((x) => x.id !== a.id);
      state.sample = false;
      persist();
      if (currentRoute() === 'members' && currentMemberId() === a.id) location.hash = '#/members';
      rerender();
    }
    return;
  }
  if (t.id === 'btn-buy-list' || t.id === 'btn-buy-list-2') {
    const grocery = await import('./grocery.js');
    const tx = grocery.buyGroceryList(state);
    persist();
    rerender();
    if (tx) window.alert('Posted: weekly grocery shop — ' + money(tx.amount) + ' into Transactions for ' + monthLabel(state.currentMonth) + '.');
    else window.alert('Nothing left to buy — every item on the list is already ticked off.');
    return;
  }
  if (t.id === 'btn-clear-bought') {
    if (state.grocery) {
      const n = state.grocery.list.filter((i) => i.checked).length;
      state.grocery.list = state.grocery.list.filter((i) => !i.checked);
      state.sample = false;
      persist();
      rerender();
      if (n === 0) window.alert('No bought items to clear yet — tick items off as you shop.');
    }
    return;
  }
  const weekBtn = t.closest('[data-week]');
  if (weekBtn) {
    if (!state.grocery) state.grocery = { offset: 0, list: [], pantry: [], overrides: {} };
    state.grocery.offset = (state.grocery.offset || 0) + Number(weekBtn.dataset.week);
    state.sample = false;
    persist();
    rerender();
    return;
  }
  // ---- Auto-plan next week from the pantry (v9) ----
  const autoPlanBtn = t.closest('[data-auto-plan]');
  if (autoPlanBtn) {
    const grocery = await import('./grocery.js');
    const plan = grocery.autoPlanNextWeek(state);
    const planCost = plan.dishes.reduce((a, d) => a + d.cost, 0);
    persist();
    rerender();
    window.alert('Next week is planned from the pantry — 7 dinners, ' + money(planCost) + ' for the week. Flip to next week to see them, or add the missing ingredients below.');
    return;
  }
  const autoIngBtn = t.closest('[data-auto-ingredients]');
  if (autoIngBtn) {
    const grocery = await import('./grocery.js');
    const added = grocery.autoPlanIngredients(state);
    persist();
    rerender();
    if (added.length) window.alert('Added to the list: ' + added.map((i) => i.name).join(', ') + '.');
    else window.alert('Every ingredient is already on the list — nothing to add.');
    return;
  }
  if (t.closest('[data-auto-clear]')) {
    const grocery = await import('./grocery.js');
    grocery.clearAutoPlan(state);
    persist();
    rerender();
    return;
  }
  const pantryBtn = t.closest('[data-pantry-add]');
  if (pantryBtn) {
    const grocery = await import('./grocery.js');
    const added = grocery.pantryAdd(state, pantryBtn.dataset.pantryAdd);
    persist();
    rerender();
    if (added) window.alert('Added to the list: ' + added.name + ' — ' + money(added.price) + '.');
    return;
  }
  const grocDel = t.closest('[data-groc-del]');
  if (grocDel) {
    if (state.grocery) {
      const item = state.grocery.list.find((x) => x.id === grocDel.dataset.grocDel);
      if (item && window.confirm('Remove "' + item.name + '" from the grocery list?')) {
        state.grocery.list = state.grocery.list.filter((x) => x.id !== item.id);
        state.sample = false;
        persist();
        rerender();
      }
    }
    return;
  }
  if (t.id === 'btn-export') { exportCSV(); return; }
  if (t.id === 'btn-reset') {
    if (window.confirm('Reset to the sample household data? Your changes will be replaced.')) {
      state = sampleState();
      persist();
      rerender();
    }
    return;
  }
  const editBtn = t.closest('[data-edit]');
  if (editBtn) {
    const tx = state.transactions.find((x) => x.id === editBtn.dataset.edit);
    if (tx) openTxDialog(tx);
    return;
  }
  const delBtn = t.closest('[data-del]');
  if (delBtn) {
    const tx = state.transactions.find((x) => x.id === delBtn.dataset.del);
    if (tx && window.confirm('Delete "' + tx.description + '" (' + money(tx.amount) + ')?')) {
      state.transactions = state.transactions.filter((x) => x.id !== tx.id);
      state.sample = false;
      persist();
      rerender();
    }
    return;
  }
  const addGoal = t.closest('[data-add-goal]');
  if (addGoal) {
    const g = state.goals.find((x) => x.id === addGoal.dataset.addGoal);
    if (g) { g.saved = Math.round((g.saved + 100) * 100) / 100; state.sample = false; persist(); rerender(); }
    return;
  }
  const editGoal = t.closest('[data-edit-goal]');
  if (editGoal) {
    const g = state.goals.find((x) => x.id === editGoal.dataset.editGoal);
    if (g) openGoalDialog(g);
    return;
  }
  const delGoal = t.closest('[data-del-goal]');
  if (delGoal) {
    const g = state.goals.find((x) => x.id === delGoal.dataset.delGoal);
    if (g && window.confirm('Delete the goal "' + g.name + '"?')) {
      state.goals = state.goals.filter((x) => x.id !== g.id);
      state.sample = false;
      persist();
      rerender();
    }
    return;
  }
  // ---- Savings challenges (loaded on demand) ----
  const savings = await import('./savings.js');
  const chWeekBtn = t.closest('[data-ch-week]');
  if (chWeekBtn) {
    savings.toggleWeek(state, Number(chWeekBtn.dataset.chWeek));
    persist();
    rerender();
    return;
  }
  if (t.closest('[data-ch-pay-next]')) {
    const next = savings.nextUnpaidWeek(state);
    if (next) { savings.toggleWeek(state, next); persist(); rerender(); }
    return;
  }
  const modeBtn = t.closest('[data-ch-mode]');
  if (modeBtn) {
    savings.setChallengeMode(state, modeBtn.dataset.chMode);
    persist();
    rerender();
    return;
  }
  const noSpendBtn = t.closest('[data-nospend-day]');
  if (noSpendBtn) {
    savings.toggleNoSpend(state, state.currentMonth, Number(noSpendBtn.dataset.nospendDay));
    persist();
    rerender();
    return;
  }
  if (t.closest('[data-roundup-sweep]')) {
    const swept = savings.sweepRoundUp(state, state.currentMonth);
    persist();
    rerender();
    if (swept > 0) window.alert('Swept ' + money(swept) + ' of round-ups into the pot.');
    else window.alert('Nothing to sweep — this month is already swept, or has no round-ups.');
    return;
  }
  if (t.closest('[data-pot-to-goal]')) {
    const moved = savings.movePotToGoal(state);
    persist();
    rerender();
    if (moved > 0) window.alert('Moved ' + money(moved) + ' from the pot into the emergency fund goal.');
    else window.alert('The pot is empty — sweep this month’s round-ups first.');
    return;
  }
  // ---- Subscription audit (loaded on demand) ----
  const subBtn = t.closest('[data-sub-cancel],[data-sub-restore],[data-sub-downgrade],[data-sub-undowngrade],[data-sub-used],[data-sub-cancel-flagged],[data-sub-reset],[data-sub-add]');
  if (subBtn) {
    const subs = await import('./subscriptions.js');
    if (subBtn.dataset.subCancel !== undefined) { subs.cancelSub(state, subBtn.dataset.subCancel); persist(); rerender(); return; }
    if (subBtn.dataset.subRestore !== undefined) { subs.restoreSub(state, subBtn.dataset.subRestore); persist(); rerender(); return; }
    if (subBtn.dataset.subDowngrade !== undefined) { subs.downgradeSub(state, subBtn.dataset.subDowngrade); persist(); rerender(); return; }
    if (subBtn.dataset.subUndowngrade !== undefined) { subs.undoDowngrade(state, subBtn.dataset.subUndowngrade); persist(); rerender(); return; }
    if (subBtn.dataset.subUsed !== undefined) { subs.markUsed(state, subBtn.dataset.subUsed); persist(); rerender(); return; }
    if (subBtn.dataset.subCancelFlagged !== undefined) {
      const n = subs.cancelFlagged(state);
      persist();
      rerender();
      if (n) window.alert('Cancelled ' + n + ' unused subscription' + (n === 1 ? '' : 's') + ' — see the Cancelled list below for what you now save.');
      else window.alert('Nothing flagged to cancel — the audit is clean.');
      return;
    }
    if (subBtn.dataset.subReset !== undefined) {
      if (window.confirm('Reset the subscriptions back to the sample household’s list? Your cancels, downgrades and added subscriptions go away.')) {
        subs.resetSubs(state);
        persist();
        rerender();
      }
      return;
    }
    if (subBtn.dataset.subAdd !== undefined) {
      const added = subs.addSub(state, $('#sub-add-name').value, $('#sub-add-cost').value, $('#sub-add-cat').value, $('#sub-add-used').value, $('#sub-add-billed').value);
      persist();
      rerender();
      if (added) window.alert('Added: ' + added.name + ' — ' + money(added.monthly) + ' a month. The audit has already judged it.');
      return;
    }
  }
  // ---- Bank unspent allowance into the emergency fund (members) ----
  const bankBtn = t.closest('[data-bank-unspent]');
  if (bankBtn) {
    const members = await import('./members.js');
    const goalSel = document.querySelector('[data-bank-goal]');
    const goalId = goalSel ? goalSel.value : '';
    const banked = members.bankUnspent(state, bankBtn.dataset.bankUnspent, state.currentMonth, goalId);
    persist();
    rerender();
    if (banked > 0) {
      const g = (state.goals || []).find((x) => x.id === (goalId || 'goal-emergency')) || (state.goals || [])[0];
      window.alert('Banked ' + money(banked) + ' of unspent allowance into the ' + (g ? g.name : 'savings') + ' goal.');
    }
    else window.alert('Nothing to bank — this month’s allowance is already spent, or already banked.');
    return;
  }
  // ---- Cash envelopes (loaded on demand) ----
  const envelopes = await import('./envelopes.js');
  const envDetail = t.closest('[data-env-detail]');
  if (envDetail) {
    envelopes.toggleEnvDetail(envDetail.dataset.envDetail);
    rerender();
    return;
  }
  if (t.closest('[data-env-move]')) {
    const amount = Number($('#env-move-amount').value);
    const from = $('#env-move-from').value;
    const to = $('#env-move-to').value;
    envelopes.tryMoveMoney(state, state.currentMonth, from, to, amount);
    persist();
    rerender();
    return;
  }
  if (t.closest('[data-env-reset]')) {
    if (window.confirm('Reset this month’s envelope fills back to budgets plus rollovers? Your typed fills and transfers for this month go away.')) {
      envelopes.resetEnvelopesMonth(state, state.currentMonth);
      persist();
      rerender();
    }
    return;
  }
  const envRoll = t.closest('[data-env-roll]');
  if (envRoll) {
    envelopes.toggleEnvRollover(state, envRoll.dataset.envRoll);
    persist();
    rerender();
    return;
  }
  const envAdd = t.closest('[data-env-add]');
  if (envAdd) {
    pendingCategory = envAdd.dataset.envAdd;
    openTxDialog(null);
    return;
  }
  const priceAdd = t.closest('[data-price-add]');
  if (priceAdd) {
    const grocery = await import('./grocery.js');
    const added = grocery.addPriceItem(state, priceAdd.dataset.priceAdd);
    persist();
    rerender();
    if (added) window.alert('Added to the grocery list: ' + added.name + ' — ' + money(added.price) + ' (November price).');
    else window.alert('That staple is already on the grocery list — tick it off in the store first.');
    return;
  }
  // ---- Bills & recurring (loaded on demand) ----
  const bills = await import('./bills.js');
  const billPaid = t.closest('[data-bill-paid]');
  if (billPaid) {
    bills.toggleBillPaid(state, billPaid.dataset.billPaid, state.currentMonth);
    persist();
    rerender();
    return;
  }
  const billEdit = t.closest('[data-bill-edit]');
  if (billEdit) {
    const b = state.bills.find((x) => x.id === billEdit.dataset.billEdit);
    if (b) openBillDialog(b);
    return;
  }
  const billDel = t.closest('[data-bill-del]');
  if (billDel) {
    const b = state.bills.find((x) => x.id === billDel.dataset.billDel);
    if (b && window.confirm('Delete the bill "' + b.name + '" (' + money(b.amount) + ')?')) {
      state.bills = state.bills.filter((x) => x.id !== b.id);
      state.sample = false;
      persist();
      rerender();
    }
    return;
  }
  const rulePost = t.closest('[data-rule-post]');
  if (rulePost) {
    const r = state.recurring.find((x) => x.id === rulePost.dataset.rulePost);
    if (r) {
      const tx = bills.postRule(state, r, state.currentMonth);
      persist();
      rerender();
      if (tx) window.alert('Posted: ' + r.name + ' — ' + money(tx.amount) + ' into Transactions.');
    }
    return;
  }
  const ruleToggle = t.closest('[data-rule-toggle]');
  if (ruleToggle) {
    const r = state.recurring.find((x) => x.id === ruleToggle.dataset.ruleToggle);
    if (r) { r.active = !r.active; state.sample = false; persist(); rerender(); }
    return;
  }
  const ruleEdit = t.closest('[data-rule-edit]');
  if (ruleEdit) {
    const r = state.recurring.find((x) => x.id === ruleEdit.dataset.ruleEdit);
    if (r) openRuleDialog(r);
    return;
  }
  const ruleDel = t.closest('[data-rule-del]');
  if (ruleDel) {
    const r = state.recurring.find((x) => x.id === ruleDel.dataset.ruleDel);
    if (r && window.confirm('Delete the recurring rule "' + r.name + '"?')) {
      state.recurring = state.recurring.filter((x) => x.id !== r.id);
      state.sample = false;
      persist();
      rerender();
    }
  }
});

// ---- Delegated inputs (filters + budget edits) ----
app.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'f-q') { txFilter.q = t.value; }
  if (t.id === 'f-cat') { txFilter.cat = t.value; }
  if (t.id === 'f-kind') { txFilter.kind = t.value; }
  if (t.id === 'f-who') { txFilter.who = t.value; }
  if (t.id === 'f-q' || t.id === 'f-cat' || t.id === 'f-kind' || t.id === 'f-who') {
    const keepFocus = t.id;
    renderTransactions(state, $('#view-transactions'), txFilter);
    const el = document.getElementById(keepFocus);
    if (el && keepFocus === 'f-q') { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    return;
  }
  if (t.dataset && t.dataset.budget) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      state.budgets[t.dataset.budget] = v;
      state.sample = false;
      persist();
    }
  }
  if (t.dataset && t.dataset.envFill) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      import('./envelopes.js').then((env) => {
        env.setEnvFill(state, state.currentMonth, t.dataset.envFill, v);
        persist();
      });
    }
  }
  if (t.dataset && t.dataset.allowance) {
    const v = Number(t.value);
    const a = state.allowances.find((x) => x.id === t.dataset.allowance);
    if (a && Number.isFinite(v) && v >= 0) {
      a.monthly = v;
      state.sample = false;
      persist();
    }
  }
  if (t.dataset && t.dataset.debt) {
    const [id, field] = t.dataset.debt.split(':');
    const v = Number(t.value);
    const d = state.debts.find((x) => x.id === id);
    if (d && Number.isFinite(v) && v >= 0) {
      d[field] = v;
      state.sample = false;
      persist();
      // Recompute the payoff plan without losing the input's focus.
      const pos = t.selectionStart;
      renderReportsLive();
      const el = document.querySelector('[data-debt="' + t.dataset.debt + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* number inputs have no selection */ } }
    }
  }
  if (t.dataset && (t.dataset.mealDish !== undefined || t.dataset.mealCost !== undefined)) {
    const isDish = t.dataset.mealDish !== undefined;
    const idx = Number(isDish ? t.dataset.mealDish : t.dataset.mealCost);
    const field = isDish ? 'mealDish' : 'mealCost';
    const pos = t.selectionStart;
    const typed = isDish ? t.value : Number(t.value);
    import('./grocery.js').then((g) => {
      const m = g.weekMeals(state)[idx];
      if (!m) return;
      const dish = isDish ? (String(typed).trim() || m.dish) : m.dish;
      const cost = isDish ? m.cost : (Number.isFinite(typed) && typed >= 0 ? typed : m.cost);
      g.setMealOverride(state, (state.grocery && state.grocery.offset) || 0, idx, dish, cost);
      persist();
      rerender();
      const el = document.querySelector('[data-' + field + '="' + idx + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* number inputs have no selection */ } }
    });
    return;
  }
  if (t.dataset && t.dataset.extra) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      state.payoffExtra = v;
      state.sample = false;
      persist();
      const pos = t.selectionStart;
      renderReportsLive();
      const el = document.querySelector('[data-extra]');
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* number inputs have no selection */ } }
    }
  }
  if (t.dataset && t.dataset.fcExtra !== undefined) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      if (!state.forecast || typeof state.forecast !== 'object') state.forecast = { method: 'trend', extra: 0 };
      state.forecast.extra = v;
      state.sample = false;
      persist();
      const pos = t.selectionStart;
      renderForecastLive();
      const el = document.querySelector('[data-fc-extra]');
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* number inputs have no selection */ } }
    }
  }
  if (t.dataset && t.dataset.nwTarget !== undefined) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      if (!state.networth || typeof state.networth !== 'object') state.networth = { target: 0 };
      state.networth.target = v;
      state.sample = false;
      persist();
      const pos = t.selectionStart;
      renderNetworthLive();
      const el = document.querySelector('[data-nw-target]');
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* number inputs have no selection */ } }
    }
  }
  if (t.dataset && t.dataset.reviewTarget !== undefined) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      if (!state.review2027 || typeof state.review2027 !== 'object') state.review2027 = { save: 0, groceries: 0, dining: 0 };
      const which = t.dataset.reviewTarget;
      if (which === 'save' || which === 'groceries' || which === 'dining') {
        state.review2027[which] = v;
        state.sample = false;
        persist();
        const pos = t.selectionStart;
        renderReviewLive();
        const el = document.querySelector('[data-review-target="' + which + '"]');
        if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* number inputs have no selection */ } }
      }
    }
  }
});
app.addEventListener('change', (e) => {
  if (e.target.id === 'f-cat' || e.target.id === 'f-kind' || e.target.id === 'f-who') rerender();
  if (e.target.dataset && e.target.dataset.envFill) { rerender(); return; }
  if (e.target.dataset && e.target.dataset.grocCheck) {
    const item = state.grocery && state.grocery.list.find((x) => x.id === e.target.dataset.grocCheck);
    if (item) {
      item.checked = e.target.checked;
      state.sample = false;
      persist();
      rerender();
    }
  }
});

// ---- Month switcher ----
$('#month-prev').addEventListener('click', () => {
  const [y, m] = state.currentMonth.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  state.currentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  persist();
  rerender();
});
$('#month-next').addEventListener('click', () => {
  const [y, m] = state.currentMonth.split('-').map(Number);
  const d = new Date(y, m, 1);
  state.currentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  persist();
  rerender();
});

window.addEventListener('hashchange', () => showView(currentRoute()));
showView(currentRoute());
