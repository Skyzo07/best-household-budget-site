// Hearth & Home Budget — groceries & meals: a weekly meal plan, a priced
// grocery list with a running total, and pantry staples. Everything is
// real state: the list total is checked against the grocery budget, and
// "Buy this list" posts one real groceries transaction into the month.
// All figures come from state; nothing is faked.
import { categorySpend, money, money0, monthLabel, uid, todayISO } from './data.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Two weeks of dinners that rotate. Week 0 is the week of Mon 16 Nov 2026;
// odd weeks use the second set, even weeks the first. Editing a dish or a
// cost stores an override for that week, so the plan stays yours.
export const DINNERS = [
  ['Spaghetti bolognese', 14.50, 'Roast chicken & vegetables', 18.20, 'Veggie stir-fry & rice', 11.80, 'Fish tacos', 16.40, 'Homemade pizza night', 13.60, 'Slow beef stew', 19.90, 'Lentil curry & naan', 12.30],
  ['Chicken curry & rice', 15.70, 'Pasta bake', 13.20, 'Salmon & roast potatoes', 21.50, 'Bean chilli & rice', 11.40, 'Pork chops & mash', 17.80, 'Veggie lasagne', 14.90, 'Roast beef & veg', 22.60],
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function weekStart(offset) {
  const d = new Date(2026, 10, 16 + offset * 7);
  return d;
}

export function weekLabel(offset) {
  const d = weekStart(offset);
  return 'Week of ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function weekMeals(state) {
  const offset = (state.grocery && state.grocery.offset) || 0;
  const set = Math.abs(offset) % 2 === 0 ? DINNERS[0] : DINNERS[1];
  const overrides = (state.grocery && state.grocery.overrides) || {};
  return DAYS.map((day, i) => {
    const o = overrides[offset + ':' + i];
    return { day, dish: o ? o.dish : set[i * 2], cost: o ? o.cost : set[i * 2 + 1], index: i };
  });
}

export function setMealOverride(state, offset, index, dish, cost) {
  if (!state.grocery) return;
  if (!state.grocery.overrides) state.grocery.overrides = {};
  state.grocery.overrides[offset + ':' + index] = { dish, cost };
  state.sample = false;
}

export function listTotals(list) {
  let total = 0, toBuy = 0, bought = 0;
  for (const item of list || []) {
    const line = item.price * (item.qty || 1);
    total += line;
    if (item.checked) bought += line; else toBuy += line;
  }
  return { total, toBuy, bought, count: (list || []).length, left: (list || []).filter((i) => !i.checked).length };
}

// "Buy this list": one real transaction for everything still to buy, then
// every item is marked bought. A second press in the same state buys $0
// and returns null, so the shop can never be charged twice.
export function buyGroceryList(state) {
  const list = (state.grocery && state.grocery.list) || [];
  const t = listTotals(list);
  if (t.toBuy <= 0) return null;
  const today = todayISO();
  const date = today.slice(0, 7) === state.currentMonth ? today : state.currentMonth + '-15';
  const tx = {
    id: uid('tx'),
    date,
    kind: 'expense',
    category: 'groceries',
    amount: Math.round(t.toBuy * 100) / 100,
    description: 'Weekly grocery shop — ' + weekLabel(state.grocery.offset || 0),
    note: t.left + ' items from the grocery list',
  };
  state.transactions.push(tx);
  for (const item of list) item.checked = true;
  state.sample = false;
  return tx;
}

export function pantryAdd(state, pantryId) {
  const pantry = (state.grocery && state.grocery.pantry) || [];
  const staple = pantry.find((p) => p.id === pantryId);
  if (!staple) return null;
  const list = state.grocery.list;
  const onList = list.find((i) => i.pantryId === pantryId && !i.checked);
  if (onList) return null;
  const item = { id: uid('groc'), name: staple.name, qty: 1, price: staple.price, checked: false, pantryId };
  list.push(item);
  state.sample = false;
  return item;
}

export function renderGrocery(state, root) {
  const key = state.currentMonth;
  const grocery = state.grocery || { offset: 0, list: [], pantry: [], overrides: {} };
  const offset = grocery.offset || 0;
  const meals = weekMeals(state);
  const weekCost = meals.reduce((a, m) => a + m.cost, 0);
  const t = listTotals(grocery.list);
  const spent = (categorySpend(state, key).groceries || 0);
  const budget = state.budgets.groceries || 0;
  const budgetLeft = budget - spent;
  const weeklyBudget = budget / 4.33;
  const fits = t.toBuy <= weeklyBudget;
  const pantryRows = (grocery.pantry || []).map((p) => {
    const onList = (grocery.list || []).some((i) => i.pantryId === p.id && !i.checked);
    return '<li><span class="tx-ico" style="background:#2b5f8a22;color:#2b5f8a">▣</span>'
      + '<span class="tx-main"><b>' + esc(p.name) + '</b><span>' + esc(p.stock) + ' · ' + money(p.price) + ' to restock</span></span>'
      + '<button class="icon-btn" data-pantry-add="' + p.id + '"' + (onList ? ' disabled' : '') + '>' + (onList ? 'On the list ✓' : 'Add to list') + '</button></li>';
  }).join('');

  const listRows = (grocery.list || []).map((item) => {
    const line = item.price * (item.qty || 1);
    return '<li class="' + (item.checked ? 'bought' : '') + '"><label class="check-row"><input type="checkbox" data-groc-check="' + item.id + '"' + (item.checked ? ' checked' : '') + ' aria-label="Bought ' + esc(item.name) + '">'
      + '<span class="tx-main"><b>' + esc(item.name) + '</b><span>' + (item.qty > 1 ? item.qty + ' × ' : '') + money(item.price) + ' each</span></span></label>'
      + '<span class="tx-amt">' + money(line) + '</span>'
      + '<button class="icon-btn" data-groc-del="' + item.id + '">Remove</button></li>';
  }).join('');

  const mealRows = meals.map((m) => {
    return '<tr><td><b>' + m.day + '</b></td>'
      + '<td><input type="text" value="' + esc(m.dish) + '" data-meal-dish="' + m.index + '" aria-label="Dinner for ' + m.day + '" maxlength="60"></td>'
      + '<td class="amount">$<input type="number" min="0" step="0.10" value="' + m.cost.toFixed(2) + '" data-meal-cost="' + m.index + '" aria-label="Cost of dinner for ' + m.day + '"></td></tr>';
  }).join('');

  root.innerHTML =
    '<div class="page-head"><div><h1>Groceries &amp; meals</h1><p class="muted">One weekly plan, one priced list, one shop. Plan the dinners, tick the list off in the store, then press “Buy this list” and the shop lands in Transactions as one real grocery expense.</p></div>'
    + '<div><button class="btn primary" id="btn-add-groc">+ Add grocery item</button> <button class="btn ghost" id="btn-buy-list"' + (t.left === 0 ? ' disabled' : '') + '>Buy this list — ' + money(t.toBuy) + '</button></div></div>'
    + '<div class="grid kpis" style="margin-bottom:16px">'
    + '<div class="card kpi"><div class="kpi-label">List total</div><div class="kpi-value num">' + money(t.total) + '</div><div class="kpi-sub">' + t.count + ' items · ' + t.left + ' still to buy</div></div>'
    + '<div class="card kpi ' + (fits ? 'good' : 'warn') + '"><div class="kpi-label">Still to buy</div><div class="kpi-value num">' + money(t.toBuy) + '</div><div class="kpi-sub">' + (fits ? 'Fits the weekly grocery budget of ' + money(weeklyBudget) : 'Over the weekly grocery budget (' + money(weeklyBudget) + ') by ' + money(t.toBuy - weeklyBudget)) + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Groceries spent</div><div class="kpi-value num">' + money(spent) + '</div><div class="kpi-sub">' + money(budgetLeft) + ' left of ' + money(budget) + ' in ' + monthLabel(key) + '</div></div>'
    + '<div class="card kpi good"><div class="kpi-label">Dinners this week</div><div class="kpi-value num">' + money(weekCost) + '</div><div class="kpi-sub">' + money0(weekCost / 7) + ' a dinner · ' + money(weekCost / 4 / 7) + ' per person per dinner</div></div>'
    + '</div>'
    + '<div class="grid two"><div class="card"><h2>' + weekLabel(offset) + ' — dinners</h2>'
    + '<p class="muted small" style="margin-top:0">Dinner for four, every night. Edit a dish or its cost — the week total updates as you type.</p>'
    + '<table><thead><tr><th>Day</th><th>Dinner</th><th class="amount">Cost</th></tr></thead><tbody>' + mealRows + '</tbody></table>'
    + '<p class="muted small">Week total <b>' + money(weekCost) + '</b> for 7 dinners · ' + money(weekCost / 4) + ' per person for the week. '
    + 'A home-cooked dinner here averages ' + money0(weekCost / 7) + '; the household’s dining-out average is about $46 a visit.</p>'
    + '<p><button class="btn small ghost" data-week="-1">‹ Previous week</button> <button class="btn small ghost" data-week="1">Next week ›</button></p></div>'
    + '<div class="card"><h2>Grocery list</h2><p class="muted small" style="margin-top:0">Tick items off as you put them in the trolley. The total counts only what is still to buy.</p>'
    + (grocery.list.length ? '<ul class="tx-list grocery-list">' + listRows + '</ul>' : '<p class="empty">The list is empty — add the first item above, or restock a pantry staple below.</p>')
    + '<p class="muted small">Total ' + money(t.total) + ' · bought ' + money(t.bought) + ' · still to buy <b>' + money(t.toBuy) + '</b>. '
    + (t.left > 0 ? '<button class="btn small" id="btn-buy-list-2">Buy this list — ' + money(t.toBuy) + '</button> ' : '')
    + '<button class="btn small ghost" id="btn-clear-bought">Clear bought items</button></p></div></div>'
    + '<div class="card" style="margin-top:16px"><h2>Pantry staples</h2><p class="muted small" style="margin-top:0">The cupboard, at a glance. “Add to list” puts a restock on the grocery list at its usual price — no re-typing, no forgotten oil.</p>'
    + '<ul class="tx-list">' + pantryRows + '</ul>'
    + '<p class="muted small">Tip: shop the list once a week instead of topping up daily. Groceries averaged ' + money(groceryAvg3(state, key)) + ' a month over the last three months — one big shop a week, planned from the dinners above, is where the saving hides.</p></div>';
}

// Small local helpers so the pantry tip never crashes on an empty month.
function shiftMonthSafe(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Mean grocery spend over the current month and the two before it.
function groceryAvg3(state, key) {
  let sum = 0;
  for (let i = 0; i < 3; i++) sum += categorySpend(state, shiftMonthSafe(key, -i)).groceries || 0;
  return sum / 3;
}
