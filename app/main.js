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
  return ['transactions', 'budgets', 'goals', 'insights'].includes(h) ? h : 'dashboard';
}

function showView(route) {
  for (const name of ['dashboard', 'transactions', 'budgets', 'goals', 'insights']) {
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
  window.scrollTo(0, 0);
}

function rerender() { showView(currentRoute()); }

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

// ---- Delegated clicks ----
app.addEventListener('click', (e) => {
  const t = e.target;
  if (t.id === 'btn-add-tx') { openTxDialog(null); return; }
  if (t.id === 'btn-add-goal') { openGoalDialog(null); return; }
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
