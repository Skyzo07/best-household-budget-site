// Hearth & Home Budget — app shell: routing, dialogs, add/edit/delete,
// CSV export and reset. State lives in data.js and persists to localStorage.
import { loadState, saveState, sampleState, CATEGORIES, categoryById, money, monthLabel, todayISO, uid, monthTransactions } from './data.js';
import { renderDashboard, renderTransactions, renderBudgets, renderGoals, renderInsights } from './views.js';

let state = loadState();
let txFilter = { q: '', cat: 'all', kind: 'all' };
let editingTxId = null;
let editingGoalId = null;

const $ = (sel, root) => (root || document).querySelector(sel);
const app = $('#app');

function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  return ['transactions', 'budgets', 'bills', 'goals', 'annual', 'insights', 'reports'].includes(h) ? h : 'dashboard';
}

async function showView(route) {
  for (const name of ['dashboard', 'transactions', 'budgets', 'bills', 'goals', 'annual', 'insights', 'reports']) {
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
  if (route === 'annual') (await import('./annual.js')).renderAnnual(state, root);
  if (route === 'reports') (await import('./reports.js')).renderReports(state, root);
  window.scrollTo(0, 0);
}

function rerender() { showView(currentRoute()); }

// Re-render just the Reports view (used while typing in the payoff planner).
async function renderReportsLive() {
  if (currentRoute() !== 'reports') return;
  (await import('./reports.js')).renderReports(state, $('#view-reports'));
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
function openTxDialog(tx) {
  editingTxId = tx ? tx.id : null;
  $('#tx-dialog-title').textContent = tx ? 'Edit transaction' : 'Add transaction';
  $('#tx-error').hidden = true;
  fillCategorySelect($('#tx-category'), tx ? tx.category : 'groceries');
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
  const data = { description: desc, amount: Math.round(amount * 100) / 100, kind: $('#tx-kind').value, category: $('#tx-category').value, date, note: $('#tx-note').value.trim() };
  if (editingTxId) {
    const tx = state.transactions.find((t) => t.id === editingTxId);
    if (tx) Object.assign(tx, data);
  } else {
    state.transactions.push(Object.assign({ id: uid('tx') }, data));
    state.currentMonth = data.date.slice(0, 7);
  }
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
  if (t.id === 'f-q' || t.id === 'f-cat' || t.id === 'f-kind') {
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
});
app.addEventListener('change', (e) => {
  if (e.target.id === 'f-cat' || e.target.id === 'f-kind') rerender();
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
