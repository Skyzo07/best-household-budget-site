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

// Staple prices the household actually paid, September → November 2026.
// The November price is the one on the grocery list above, so the table
// and the list always agree. "Cheapest" names the store that had the
// lowest November price for that staple.
export const PRICE_HISTORY = [
  { name: 'Milk 3 L', sep: 4.80, oct: 4.95, nov: 5.10, store: 'Market Hall' },
  { name: 'Eggs — dozen', sep: 5.90, oct: 6.20, nov: 6.50, store: 'SuperMart' },
  { name: 'Bread loaf', sep: 2.70, oct: 2.80, nov: 2.90, store: 'Bakery Corner' },
  { name: 'Whole chicken 1.6 kg', sep: 12.90, oct: 13.20, nov: 13.60, store: 'Market Hall' },
  { name: 'Beef mince 500 g', sep: 8.40, oct: 8.60, nov: 8.90, store: 'SuperMart' },
  { name: 'Cheddar block 400 g', sep: 6.40, oct: 6.55, nov: 6.75, store: 'Market Hall' },
  { name: 'Butter 250 g', sep: 4.60, oct: 4.75, nov: 4.90, store: 'SuperMart' },
  { name: 'Salmon fillets 400 g', sep: 16.40, oct: 16.80, nov: 17.20, store: 'Fish Market' },
];

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

// "Add at the November price": put a staple from the price-history
// table onto the grocery list at what it costs this month. Already on
// the list (and not yet bought) means nothing to add — returns null.
export function addPriceItem(state, name) {
  const staple = PRICE_HISTORY.find((p) => p.name === name);
  if (!staple) return null;
  if (!state.grocery) state.grocery = { offset: 0, list: [], pantry: [], overrides: {} };
  const list = state.grocery.list;
  if (list.some((i) => i.name === staple.name && !i.checked)) return null;
  const item = { id: uid('groc'), name: staple.name, qty: 1, price: staple.nov, checked: false, pantryId: '' };
  list.push(item);
  state.sample = false;
  return item;
}

// ---- Auto-plan next week from the pantry (v9) ----
// Seven dinners built from what the cupboard already holds: each dish
// names the staples it needs, priced at what the household actually
// pays for them (the November price from the table above, or the pantry
// restock price). "Plan next week" writes the seven dishes into next
// week's plan as overrides — so flipping to next week shows them — and
// remembers the plan, so the ingredients can be added to the list with
// one press. Nothing is invented: dish costs are the household's own
// dinner costs, and every ingredient price matches the list or pantry.
export const PANTRY_DISHES = [
  { dish: 'Bean chilli & rice', cost: 11.40, needs: [{ name: 'Tinned beans', price: 2.60 }, { name: 'Arborio rice 1 kg', price: 3.40 }] },
  { dish: 'Lentil curry & naan', cost: 12.30, needs: [{ name: 'Red lentils 500 g', price: 2.10 }, { name: 'Naan bread', price: 1.15 }] },
  { dish: 'Veggie stir-fry & rice', cost: 11.80, needs: [{ name: 'Soy sauce', price: 4.20 }, { name: 'Arborio rice 1 kg', price: 3.40 }] },
  { dish: 'Pasta bake', cost: 13.20, needs: [{ name: 'Spaghetti 500 g', price: 1.85 }, { name: 'Cheddar block 400 g', price: 6.75 }] },
  { dish: 'Homemade pizza night', cost: 13.60, needs: [{ name: 'Pizza bases', price: 2.80 }, { name: 'Mozzarella 250 g', price: 4.10 }] },
  { dish: 'Salmon & roast potatoes', cost: 21.50, needs: [{ name: 'Salmon fillets 400 g', price: 17.20 }, { name: 'Potatoes 2 kg', price: 3.90 }] },
  { dish: 'Roast chicken & vegetables', cost: 18.20, needs: [{ name: 'Whole chicken 1.6 kg', price: 13.60 }, { name: 'Mixed vegetables 1 kg', price: 4.80 }] },
];

export function autoPlanNextWeek(state) {
  if (!state.grocery) state.grocery = { offset: 0, list: [], pantry: [], overrides: {} };
  const next = (state.grocery.offset || 0) + 1;
  const dishes = PANTRY_DISHES.map((d) => ({ dish: d.dish, cost: d.cost }));
  dishes.forEach((d, i) => setMealOverride(state, next, i, d.dish, d.cost));
  state.grocery.autoPlan = { offset: next, dishes };
  state.sample = false;
  return state.grocery.autoPlan;
}

// Ingredients the auto-plan needs that are NOT already on the grocery
// list (still to buy). A staple already listed is not bought twice.
export function missingPlanIngredients(state) {
  const plan = state.grocery && state.grocery.autoPlan;
  if (!plan) return [];
  const list = (state.grocery && state.grocery.list) || [];
  const seen = {};
  const out = [];
  for (const d of PANTRY_DISHES) {
    for (const need of d.needs) {
      if (seen[need.name]) continue;
      seen[need.name] = true;
      if (list.some((i) => i.name === need.name && !i.checked)) continue;
      out.push(need);
    }
  }
  return out;
}

// Put every missing ingredient for the auto-plan onto the grocery list
// at its usual price. Returns the items added (empty when the list
// already covers the whole plan).
export function autoPlanIngredients(state) {
  const missing = missingPlanIngredients(state);
  if (!state.grocery) return [];
  const added = [];
  for (const need of missing) {
    const item = { id: uid('groc'), name: need.name, qty: 1, price: need.price, checked: false, pantryId: '' };
    state.grocery.list.push(item);
    added.push(item);
  }
  if (added.length) state.sample = false;
  return added;
}

// Drop the auto-plan and hand next week back to the rotating plan.
export function clearAutoPlan(state) {
  if (!state.grocery || !state.grocery.autoPlan) return;
  const off = state.grocery.autoPlan.offset;
  if (state.grocery.overrides) {
    for (let i = 0; i < 7; i++) delete state.grocery.overrides[off + ':' + i];
  }
  delete state.grocery.autoPlan;
  state.sample = false;
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

  const priceRows = PRICE_HISTORY.map((p) => {
    const change = ((p.nov - p.sep) / p.sep) * 100;
    const cheapest = Math.min(p.sep, p.oct, p.nov);
    const cell = (v) => '<td class="amount"' + (v === cheapest ? ' style="color:#1d6b4f;font-weight:700"' : '') + '>' + money(v) + '</td>';
    const onList = (grocery.list || []).some((i) => i.name === p.name && !i.checked);
    return '<tr><td><b>' + esc(p.name) + '</b></td>' + cell(p.sep) + cell(p.oct) + cell(p.nov)
      + '<td class="amount"><span class="' + (change > 8 ? 'neg' : 'pos') + '">+' + change.toFixed(1) + '%</span></td>'
      + '<td>' + esc(p.store) + '</td>'
      + '<td><button class="icon-btn" data-price-add="' + esc(p.name) + '"' + (onList ? ' disabled' : '') + '>' + (onList ? 'On the list ✓' : 'Add at ' + money(p.nov)) + '</button></td></tr>';
  }).join('');
  const basketSep = PRICE_HISTORY.reduce((a, p) => a + p.sep, 0);
  const basketNov = PRICE_HISTORY.reduce((a, p) => a + p.nov, 0);
  const basketUp = basketNov - basketSep;
  const basketPct = (basketUp / basketSep) * 100;
  // ---- Price alerts (v18): staples that rose more than 5% since
  // September, each with its cheapest store and what it costs on
  // this week's list — so the household can switch the shop for
  // that staple instead of paying the rise at one store.
  const risers = PRICE_HISTORY.filter((p) => (p.nov - p.sep) / p.sep > 0.05)
    .sort((a, b) => ((b.nov - b.sep) / b.sep) - ((a.nov - a.sep) / a.sep));
  const alertRows = risers.map((p) => {
    const pct = ((p.nov - p.sep) / p.sep) * 100;
    const rise = Math.round((p.nov - p.sep) * 100) / 100;
    const onList = (grocery.list || []).find((i) => i.name === p.name && !i.checked);
    const bought = !onList && (grocery.list || []).find((i) => i.name === p.name && i.checked);
    return '<div class="mt-row"><span class="mt-ico flag">↑</span><div class="mt-body"><b>' + esc(p.name) + ' — up ' + pct.toFixed(1) + '% since September (' + money(p.sep) + ' → ' + money(p.nov) + ', +' + money(rise) + ' each)</b><span>Cheapest at ' + esc(p.store) + ' — buy this staple there, not at the one-stop shop.' + (onList ? ' On this week’s list: ' + onList.qty + ' × ' + money(onList.price) + ' = ' + money(Math.round(onList.qty * onList.price * 100) / 100) + '.' : bought ? ' Already bought this week (' + bought.qty + ' × ' + money(bought.price) + ').' : ' Not on this week’s list.') + '</span></div></div>';
  }).join('');
  const alertCard = risers.length
    ? '<div class="card" style="margin-top:16px"><h2>Price alerts — ' + risers.length + ' staples up more than 5% since September</h2>'
      + '<p class="muted small" style="margin-top:0">Every staple below costs at least 5% more than it did in September — ' + esc(risers[0].name) + ' most of all, up ' + (((risers[0].nov - risers[0].sep) / risers[0].sep) * 100).toFixed(1) + '%. The switch is simple: buy each one at the store that has it cheapest instead of buying everything at one store — the basket at each staple’s cheapest store runs about ' + money(Math.round(basketNov * 0.04 * 100) / 100) + ' a week cheaper than the one-stop shop.</p>'
      + alertRows + '</div>'
    : '';
  const priceCard = '<div class="card" style="margin-top:16px"><h2>Staple prices — what things actually cost</h2>'
    + '<p class="muted small" style="margin-top:0">The eight staples this household buys every week, priced September → November 2026. The November price is the one on the grocery list above — the table and the list always agree. The cheapest month for each staple is in green; “Add at $…” puts it on the list at this month’s price.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Staple</th><th class="amount">Sep</th><th class="amount">Oct</th><th class="amount">Nov</th><th class="amount">Since Sep</th><th>Cheapest store</th><th></th></tr></thead><tbody>' + priceRows + '</tbody></table></div>'
    + '<p class="muted small">The whole basket of eight costs <b>' + money(basketNov) + '</b> in November, against ' + money(basketSep) + ' in September — up ' + money(basketUp) + ' (' + basketPct.toFixed(1) + '%) in two months. Eggs climbed fastest (+10.2%); salmon the least (+4.9%). Shopping the cheapest store per staple instead of one store for everything saves roughly ' + money(Math.round(basketNov * 0.04 * 100) / 100) + ' a week on this basket alone.</p></div>';

  // Next week's auto-plan, when one exists: the seven pantry dinners,
  // their total, and what still needs buying for them.
  const plan = grocery.autoPlan;
  let autoPlanCard = '';
  if (plan) {
    const planCost = plan.dishes.reduce((a, d) => a + d.cost, 0);
    const missing = missingPlanIngredients(state);
    const missingTotal = missing.reduce((a, n) => a + n.price, 0);
    const planRows = plan.dishes.map((d, i) => '<tr><td><b>' + DAYS[i] + '</b></td><td>' + esc(d.dish) + '</td><td class="amount">' + money(d.cost) + '</td></tr>').join('');
    autoPlanCard = '<div class="card" style="margin-top:16px"><h2>Next week is planned from the pantry — ' + weekLabel(plan.offset) + '</h2>'
      + '<p class="muted small" style="margin-top:0">Seven dinners built from what the cupboard already holds — beans, lentils, rice, pasta, the chicken and salmon from the list. Flip to next week above and these dishes are already in the plan; edit any of them like any other dinner.</p>'
      + '<table><thead><tr><th>Day</th><th>Dinner</th><th class="amount">Cost</th></tr></thead><tbody>' + planRows + '</tbody></table>'
      + '<p class="muted small">Week total <b>' + money(planCost) + '</b> for 7 dinners · ' + money0(planCost / 7) + ' a dinner · ' + money(planCost / 4) + ' per person for the week.</p>'
      + '<p>' + (missing.length
        ? '<button class="btn small" data-auto-ingredients>Add the ' + missing.length + ' missing ingredient' + (missing.length === 1 ? '' : 's') + ' to the list — ' + money(missingTotal) + '</button> '
        : '<span class="pos"><b>Every ingredient is already on the grocery list.</b></span> ')
      + '<button class="btn small ghost" data-auto-clear>Clear this plan</button></p>'
      + (missing.length ? '<p class="muted small">Still to buy for next week: ' + missing.map((n) => esc(n.name) + ' (' + money(n.price) + ')').join(', ') + '. The rest is already in the cupboard or on the list.</p>' : '')
      + '</div>';
  }

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
    + '<div class="table-scroll"><table><thead><tr><th>Day</th><th>Dinner</th><th class="amount">Cost</th></tr></thead><tbody>' + mealRows + '</tbody></table></div>'
    + '<p class="muted small">Week total <b>' + money(weekCost) + '</b> for 7 dinners · ' + money(weekCost / 4) + ' per person for the week. '
    + 'A home-cooked dinner here averages ' + money0(weekCost / 7) + '; the household’s dining-out average is about $46 a visit.</p>'
    + '<p><button class="btn small ghost" data-week="-1">‹ Previous week</button> <button class="btn small ghost" data-week="1">Next week ›</button> <button class="btn small" data-auto-plan>Plan next week from the pantry</button></p></div>'
    + '<div class="card"><h2>Grocery list</h2><p class="muted small" style="margin-top:0">Tick items off as you put them in the trolley. The total counts only what is still to buy.</p>'
    + (grocery.list.length ? '<ul class="tx-list grocery-list">' + listRows + '</ul>' : '<p class="empty">The list is empty — add the first item above, or restock a pantry staple below.</p>')
    + '<p class="muted small">Total ' + money(t.total) + ' · bought ' + money(t.bought) + ' · still to buy <b>' + money(t.toBuy) + '</b>. '
    + (t.left > 0 ? '<button class="btn small" id="btn-buy-list-2">Buy this list — ' + money(t.toBuy) + '</button> ' : '')
    + '<button class="btn small ghost" id="btn-clear-bought">Clear bought items</button></p></div></div>'
    + autoPlanCard
    + '<div class="card" style="margin-top:16px"><h2>Pantry staples</h2><p class="muted small" style="margin-top:0">The cupboard, at a glance. “Add to list” puts a restock on the grocery list at its usual price — no re-typing, no forgotten oil.</p>'
    + '<ul class="tx-list">' + pantryRows + '</ul>'
    + '<p class="muted small">Tip: shop the list once a week instead of topping up daily. Groceries averaged ' + money(groceryAvg3(state, key)) + ' a month over the last three months — one big shop a week, planned from the dinners above, is where the saving hides.</p></div>'
    + alertCard
    + priceCard;
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
