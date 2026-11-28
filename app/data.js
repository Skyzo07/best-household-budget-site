// Hearth & Home Budget — data layer: categories, sample household data,
// month helpers, and localStorage persistence. No network anywhere.
export const STORAGE_KEY = 'hearth-home-budget-v1';

export const CATEGORIES = [
  { id: 'housing',     label: 'Housing',     icon: '⌂', color: '#1d6b4f', budget: 1450 },
  { id: 'groceries',   label: 'Groceries',   icon: '🛒', color: '#2b5f8a', budget: 620 },
  { id: 'transport',   label: 'Transport',   icon: '🚗', color: '#7a5c1e', budget: 320 },
  { id: 'utilities',   label: 'Utilities',   icon: '💡', color: '#d9a441', budget: 260 },
  { id: 'dining',      label: 'Dining out',  icon: '🍽', color: '#b3382e', budget: 240 },
  { id: 'health',      label: 'Health',      icon: '✚', color: '#6a4a8a', budget: 180 },
  { id: 'fun',         label: 'Fun & family', icon: '🎬', color: '#c25e7a', budget: 200 },
  { id: 'kids',        label: 'Kids & school', icon: '🎒', color: '#3f7d6b', budget: 280 },
  { id: 'shopping',    label: 'Shopping',    icon: '🛍', color: '#8a6d2b', budget: 150 },
  { id: 'other',       label: 'Other',       icon: '•', color: '#5d6d64', budget: 100 },
  { id: 'salary',      label: 'Salary',      icon: '💼', color: '#1d6b4f', budget: 0 },
  { id: 'side',        label: 'Side income', icon: '★', color: '#2b5f8a', budget: 0 },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 3];
}

export function money(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function money0(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function monthKey(year, monthIndex) {
  return year + '-' + String(monthIndex + 1).padStart(2, '0');
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d.getFullYear(), d.getMonth());
}

export function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
}

// ---- Sample household: the Hartono family, two incomes, two kids. ----
// November 2026 is the current month; October and September carry history
// so month-over-month comparison and the 6-month trend have real figures.
function sampleTransactions() {
  const rows = [
    // November 2026 — income
    ['2026-11-01', 'income', 'salary', 4200, 'November salary — Maya', 'Payday'],
    ['2026-11-01', 'income', 'salary', 1450, 'November salary — Daniel', 'Part-time'],
    ['2026-11-14', 'income', 'side', 200, 'Weekend market stall', 'Craft sales'],
    // November 2026 — fixed
    ['2026-11-01', 'expense', 'housing', 1450, 'Rent — 3-bed house', 'Monthly rent'],
    ['2026-11-03', 'expense', 'utilities', 132.40, 'Electricity bill', 'Oct usage'],
    ['2026-11-03', 'expense', 'utilities', 58.20, 'Water bill', ''],
    ['2026-11-05', 'expense', 'transport', 96, 'Fuel — family car', ''],
    ['2026-11-10', 'expense', 'kids', 185, 'School fees — term 4', ''],
    ['2026-11-12', 'expense', 'health', 74.50, 'Pharmacy — vitamins', ''],
    // November 2026 — variable
    ['2026-11-02', 'expense', 'groceries', 186.30, 'Weekly groceries', 'Supermarket'],
    ['2026-11-06', 'expense', 'groceries', 142.75, 'Weekly groceries', 'Market + store'],
    ['2026-11-09', 'expense', 'groceries', 168.90, 'Weekly groceries', ''],
    ['2026-11-13', 'expense', 'groceries', 121.40, 'Top-up groceries', ''],
    ['2026-11-04', 'expense', 'dining', 46.80, 'Family dinner out', 'Friday treat'],
    ['2026-11-08', 'expense', 'dining', 38.50, 'Pizza night', ''],
    ['2026-11-11', 'expense', 'dining', 52.25, 'Lunch with friends', '', 'maya'],
    ['2026-11-07', 'expense', 'fun', 64, 'Cinema — family movie', ''],
    ['2026-11-15', 'expense', 'fun', 42, 'Board game + snacks', ''],
    ['2026-11-09', 'expense', 'transport', 38, 'Bus passes — kids', ''],
    ['2026-11-14', 'expense', 'shopping', 89.99, 'Winter jackets — kids', 'Sale'],
    ['2026-11-16', 'expense', 'kids', 24.50, 'School lunch top-up', '', 'sofia'],
    ['2026-11-20', 'expense', 'fun', 12, 'Comic book — Liam', '', 'liam'],
    ['2026-11-17', 'expense', 'other', 35, 'Haircuts — both kids', ''],
    // October 2026
    ['2026-10-01', 'income', 'salary', 4200, 'October salary — Maya', ''],
    ['2026-10-01', 'income', 'salary', 1450, 'October salary — Daniel', ''],
    ['2026-10-18', 'income', 'side', 150, 'Weekend market stall', ''],
    ['2026-10-01', 'expense', 'housing', 1450, 'Rent — 3-bed house', ''],
    ['2026-10-03', 'expense', 'utilities', 148.90, 'Electricity bill', ''],
    ['2026-10-03', 'expense', 'utilities', 61.40, 'Water bill', ''],
    ['2026-10-04', 'expense', 'groceries', 178.20, 'Weekly groceries', ''],
    ['2026-10-11', 'expense', 'groceries', 165.40, 'Weekly groceries', ''],
    ['2026-10-18', 'expense', 'groceries', 191.60, 'Weekly groceries', ''],
    ['2026-10-25', 'expense', 'groceries', 154.85, 'Weekly groceries', ''],
    ['2026-10-06', 'expense', 'transport', 112, 'Fuel — family car', ''],
    ['2026-10-12', 'expense', 'transport', 45, 'Car service — oil', ''],
    ['2026-10-05', 'expense', 'dining', 58.40, 'Family dinner out', ''],
    ['2026-10-19', 'expense', 'dining', 44.90, 'Takeaway night', ''],
    ['2026-10-10', 'expense', 'health', 96.20, 'Dentist check-up', ''],
    ['2026-10-15', 'expense', 'kids', 132, 'School trip — museum', ''],
    ['2026-10-20', 'expense', 'fun', 78, 'Zoo tickets', ''],
    ['2026-10-22', 'expense', 'shopping', 124.50, 'Shoes — Daniel', ''],
    ['2026-10-27', 'expense', 'other', 48, 'Household supplies', ''],
    // September 2026
    ['2026-09-01', 'income', 'salary', 4200, 'September salary — Maya', ''],
    ['2026-09-01', 'income', 'salary', 1450, 'September salary — Daniel', ''],
    ['2026-09-01', 'expense', 'housing', 1450, 'Rent — 3-bed house', ''],
    ['2026-09-03', 'expense', 'utilities', 171.30, 'Electricity bill', ''],
    ['2026-09-03', 'expense', 'utilities', 57.80, 'Water bill', ''],
    ['2026-09-05', 'expense', 'groceries', 182.10, 'Weekly groceries', ''],
    ['2026-09-12', 'expense', 'groceries', 169.75, 'Weekly groceries', ''],
    ['2026-09-19', 'expense', 'groceries', 176.40, 'Weekly groceries', ''],
    ['2026-09-26', 'expense', 'groceries', 148.20, 'Weekly groceries', ''],
    ['2026-09-07', 'expense', 'transport', 104, 'Fuel — family car', ''],
    ['2026-09-09', 'expense', 'dining', 62.10, 'Birthday dinner', ''],
    ['2026-09-14', 'expense', 'health', 58, 'Pharmacy', ''],
    ['2026-09-16', 'expense', 'kids', 210, 'School uniforms', ''],
    ['2026-09-21', 'expense', 'fun', 54, 'Streaming + games', ''],
    ['2026-09-24', 'expense', 'shopping', 98.75, 'Kitchenware', ''],
    // Earlier months (trend only, lighter detail)
    ['2026-05-01', 'income', 'salary', 5650, 'May salaries', ''],
    ['2026-05-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-05-10', 'expense', 'groceries', 588, 'Groceries — May', ''],
    ['2026-05-12', 'expense', 'utilities', 189, 'Utilities — May', ''],
    ['2026-05-15', 'expense', 'transport', 275, 'Transport — May', ''],
    ['2026-05-18', 'expense', 'dining', 192, 'Dining — May', ''],
    ['2026-05-20', 'expense', 'kids', 165, 'Kids — May', ''],
    ['2026-04-01', 'income', 'salary', 5650, 'April salaries', ''],
    ['2026-04-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-04-10', 'expense', 'groceries', 621, 'Groceries — April', ''],
    ['2026-04-12', 'expense', 'utilities', 204, 'Utilities — April', ''],
    ['2026-04-15', 'expense', 'transport', 301, 'Transport — April', ''],
    ['2026-04-18', 'expense', 'dining', 174, 'Dining — April', ''],
    ['2026-04-20', 'expense', 'fun', 148, 'Fun — April', ''],
    ['2026-03-01', 'income', 'salary', 5650, 'March salaries', ''],
    ['2026-03-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-03-10', 'expense', 'groceries', 605, 'Groceries — March', ''],
    ['2026-03-12', 'expense', 'utilities', 211, 'Utilities — March', ''],
    ['2026-03-15', 'expense', 'transport', 288, 'Transport — March', ''],
    ['2026-03-18', 'expense', 'dining', 186, 'Dining — March', ''],
    ['2026-03-20', 'expense', 'kids', 195, 'Kids — March', ''],
    ['2026-02-01', 'income', 'salary', 5650, 'February salaries', ''],
    ['2026-02-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-02-10', 'expense', 'groceries', 594, 'Groceries — February', ''],
    ['2026-02-12', 'expense', 'utilities', 198, 'Utilities — February', ''],
    ['2026-02-15', 'expense', 'transport', 272, 'Transport — February', ''],
    ['2026-02-18', 'expense', 'dining', 158, 'Dining — February', ''],
    ['2026-02-20', 'expense', 'fun', 121, 'Fun — February', ''],
    ['2026-01-01', 'income', 'salary', 5650, 'January salaries', ''],
    ['2026-01-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-01-10', 'expense', 'groceries', 618, 'Groceries — January', ''],
    ['2026-01-12', 'expense', 'utilities', 223, 'Utilities — January', ''],
    ['2026-01-15', 'expense', 'transport', 296, 'Transport — January', ''],
    ['2026-01-18', 'expense', 'dining', 171, 'Dining — January', ''],
    ['2026-01-20', 'expense', 'kids', 230, 'Kids — January', ''],
    ['2026-08-01', 'income', 'salary', 5650, 'August salaries', ''],
    ['2026-08-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-08-10', 'expense', 'groceries', 640, 'Groceries — August', ''],
    ['2026-08-12', 'expense', 'utilities', 205, 'Utilities — August', ''],
    ['2026-08-15', 'expense', 'transport', 290, 'Transport — August', ''],
    ['2026-08-18', 'expense', 'dining', 180, 'Dining — August', ''],
    ['2026-08-20', 'expense', 'fun', 150, 'Fun — August', ''],
    ['2026-07-01', 'income', 'salary', 5650, 'July salaries', ''],
    ['2026-07-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-07-10', 'expense', 'groceries', 612, 'Groceries — July', ''],
    ['2026-07-12', 'expense', 'utilities', 218, 'Utilities — July', ''],
    ['2026-07-15', 'expense', 'transport', 265, 'Transport — July', ''],
    ['2026-07-18', 'expense', 'dining', 205, 'Dining — July', ''],
    ['2026-07-20', 'expense', 'kids', 240, 'Kids — July', ''],
    ['2026-06-01', 'income', 'salary', 5650, 'June salaries', ''],
    ['2026-06-01', 'expense', 'housing', 1450, 'Rent', ''],
    ['2026-06-10', 'expense', 'groceries', 598, 'Groceries — June', ''],
    ['2026-06-12', 'expense', 'utilities', 196, 'Utilities — June', ''],
    ['2026-06-15', 'expense', 'transport', 310, 'Transport — June', ''],
    ['2026-06-18', 'expense', 'dining', 168, 'Dining — June', ''],
    ['2026-06-20', 'expense', 'fun', 132, 'Fun — June', ''],
  ];
  return rows.map(([date, kind, category, amount, description, note, who], i) => ({
    id: 'tx-sample-' + (i + 1), date, kind, category, amount, description, note, who: who || '',
  }));
}

export function sampleBills() {
  // paidMonths records which months each bill was paid in. November 2026
  // is the current month: the early-month bills are paid, later ones due.
  return [
    { id: 'bill-rent', name: 'Rent — 3-bed house', category: 'housing', amount: 1450, day: 1, paidMonths: ['2026-11', '2026-10', '2026-09'] },
    { id: 'bill-electric', name: 'Electricity bill', category: 'utilities', amount: 132.40, day: 3, paidMonths: ['2026-11', '2026-10'] },
    { id: 'bill-water', name: 'Water bill', category: 'utilities', amount: 58.20, day: 3, paidMonths: ['2026-11', '2026-10'] },
    { id: 'bill-streaming', name: 'Streaming + music', category: 'fun', amount: 16.99, day: 7, paidMonths: ['2026-11', '2026-10'] },
    { id: 'bill-school', name: 'School fees — term 4', category: 'kids', amount: 185, day: 10, paidMonths: ['2026-11'] },
    { id: 'bill-gym', name: 'Gym membership', category: 'health', amount: 45, day: 12, paidMonths: ['2026-11', '2026-10'] },
    { id: 'bill-internet', name: 'Internet — fibre', category: 'utilities', amount: 79, day: 15, paidMonths: ['2026-11', '2026-10'] },
    { id: 'bill-phones', name: 'Mobile phones — family plan', category: 'utilities', amount: 120, day: 18, paidMonths: ['2026-11', '2026-10'] },
    { id: 'bill-car-ins', name: 'Car insurance', category: 'transport', amount: 95, day: 22, paidMonths: ['2026-10'] },
    { id: 'bill-home-ins', name: 'Home insurance', category: 'housing', amount: 68, day: 25, paidMonths: ['2026-10'] },
  ];
}

export function sampleRecurring() {
  // lastPosted records the last month a rule posted a transaction in.
  return [
    { id: 'rule-salary-maya', name: 'Salary — Maya', kind: 'income', category: 'salary', amount: 4200, day: 1, active: true, lastPosted: '2026-11' },
    { id: 'rule-salary-daniel', name: 'Salary — Daniel', kind: 'income', category: 'salary', amount: 1450, day: 1, active: true, lastPosted: '2026-11' },
    { id: 'rule-rent', name: 'Rent — 3-bed house', kind: 'expense', category: 'housing', amount: 1450, day: 1, active: true, lastPosted: '2026-11' },
    { id: 'rule-streaming', name: 'Streaming + music', kind: 'expense', category: 'fun', amount: 16.99, day: 7, active: true, lastPosted: '2026-11' },
    { id: 'rule-gym', name: 'Gym membership', kind: 'expense', category: 'health', amount: 45, day: 12, active: true, lastPosted: '2026-10' },
    { id: 'rule-stall', name: 'Weekend market stall', kind: 'income', category: 'side', amount: 200, day: 14, active: true, lastPosted: '2026-11' },
    { id: 'rule-internet', name: 'Internet — fibre', kind: 'expense', category: 'utilities', amount: 79, day: 15, active: true, lastPosted: '2026-10' },
    { id: 'rule-phones', name: 'Mobile phones — family plan', kind: 'expense', category: 'utilities', amount: 120, day: 18, active: true, lastPosted: '2026-10' },
  ];
}

export function sampleAllowances() {
  return [
    { id: 'maya', who: 'Maya', role: 'Mum · full-time', monthly: 150 },
    { id: 'daniel', who: 'Daniel', role: 'Dad · part-time', monthly: 120 },
    { id: 'sofia', who: 'Sofia', role: 'Age 11 · school', monthly: 25 },
    { id: 'liam', who: 'Liam', role: 'Age 8 · school', monthly: 20 },
  ];
}

export function sampleDebts() {
  return [
    { id: 'debt-card', name: 'Credit card — everyday bank', balance: 1250, apr: 19.9, minPayment: 35 },
    { id: 'debt-car', name: 'Car loan — family car', balance: 8400, apr: 6.4, minPayment: 210 },
  ];
}

// The grocery list for the week of 16 Nov 2026 — the shop behind that
// week's dinners. Milk, eggs and bread are already bought (ticked); the
// rest totals $108.24 still to buy, against a $143.19 weekly budget.
export function sampleGroceryList() {
  const rows = [
    ['Whole chicken 1.6 kg', 1, 13.60, false],
    ['Beef mince 500 g', 1, 8.90, false],
    ['Salmon fillets 400 g', 1, 17.20, false],
    ['Spaghetti 500 g', 1, 1.85, false],
    ['Arborio rice 1 kg', 1, 3.40, false],
    ['Tinned tomatoes', 4, 1.30, false],
    ['Cheddar block 400 g', 1, 6.75, false],
    ['Mozzarella 250 g', 1, 4.10, false],
    ['Pizza bases', 2, 2.80, false],
    ['Mixed vegetables 1 kg', 1, 4.80, false],
    ['Potatoes 2 kg', 1, 3.90, false],
    ['Onions 1 kg', 1, 2.40, false],
    ['Capsicums', 3, 1.50, false],
    ['Red lentils 500 g', 1, 2.10, false],
    ['Naan bread', 4, 1.15, false],
    ['Tortilla wraps', 8, 0.48, false],
    ['Salad leaves', 1, 3.20, false],
    ['Fruit — apples & bananas', 1, 7.40, false],
    ['Milk 3 L', 1, 5.10, true],
    ['Eggs — dozen', 1, 6.50, true],
    ['Bread loaf', 2, 2.90, true],
    ['Butter 250 g', 1, 4.90, false],
  ];
  return rows.map(([name, qty, price, checked], i) => ({
    id: 'groc-' + (i + 1), name, qty, price, checked, pantryId: '',
  }));
}

export function samplePantry() {
  return [
    { id: 'pantry-oil', name: 'Olive oil 1 L', stock: 'Half a bottle left — running low', price: 9.80 },
    { id: 'pantry-flour', name: 'Plain flour 2 kg', stock: 'About 1 kg left', price: 3.60 },
    { id: 'pantry-soy', name: 'Soy sauce', stock: 'A splash left — running low', price: 4.20 },
    { id: 'pantry-beans', name: 'Tinned beans', stock: 'Two tins left — low', price: 2.60 },
    { id: 'pantry-coffee', name: 'Coffee 200 g', stock: 'Nearly out — running low', price: 8.40 },
    { id: 'pantry-tea', name: 'Tea bags ×100', stock: 'Half a box left', price: 3.90 },
    { id: 'pantry-sugar', name: 'Sugar 1 kg', stock: 'Plenty left', price: 2.80 },
    { id: 'pantry-spices', name: 'Cumin & paprika', stock: 'Plenty left', price: 3.10 },
  ];
}

// Fill v3 fields into an older saved state so v1/v2 saves keep working.
export function ensureV3(state) {
  if (!state) return sampleState();
  ensureV2(state);
  if (!state.grocery || !Array.isArray(state.grocery.list)) {
    state.grocery = { offset: 0, list: sampleGroceryList(), pantry: samplePantry(), overrides: {} };
  }
  if (!Array.isArray(state.grocery.pantry)) state.grocery.pantry = samplePantry();
  if (typeof state.grocery.offset !== 'number') state.grocery.offset = 0;
  if (!state.grocery.overrides) state.grocery.overrides = {};
  state.version = 3;
  return state;
}

// Fill v2 fields into a v1 saved state so older saves keep working.
export function ensureV2(state) {
  if (!state) return sampleState();
  if (!Array.isArray(state.bills)) state.bills = sampleBills();
  if (!Array.isArray(state.recurring)) state.recurring = sampleRecurring();
  if (!Array.isArray(state.allowances)) state.allowances = sampleAllowances();
  if (!Array.isArray(state.debts)) state.debts = sampleDebts();
  if (typeof state.payoffExtra !== 'number') state.payoffExtra = 50;
  state.version = 2;
  return state;
}

export function sampleState() {
  const budgets = {};
  for (const c of CATEGORIES) if (c.budget > 0) budgets[c.id] = c.budget;
  return {
    version: 3,
    sample: true,
    currentMonth: '2026-11',
    budgets,
    goals: [
      { id: 'goal-emergency', name: 'Emergency fund', target: 6000, saved: 4350, date: '2027-06-30' },
      { id: 'goal-holiday', name: 'Summer holiday — beach trip', target: 2400, saved: 980, date: '2027-07-01' },
      { id: 'goal-car', name: 'New family car deposit', target: 8000, saved: 2150, date: '2027-12-31' },
    ],
    transactions: sampleTransactions(),
    bills: sampleBills(),
    recurring: sampleRecurring(),
    allowances: sampleAllowances(),
    debts: sampleDebts(),
    payoffExtra: 50,
    grocery: { offset: 0, list: sampleGroceryList(), pantry: samplePantry(), overrides: {} },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return sampleState();
    return ensureV3(parsed);
  } catch {
    return sampleState();
  }
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

// ---- Month maths (pure, testable) ----
export function monthTransactions(state, key) {
  return state.transactions.filter((t) => t.date.slice(0, 7) === key);
}

export function monthTotals(state, key) {
  let income = 0, expense = 0;
  for (const t of monthTransactions(state, key)) {
    if (t.kind === 'income') income += t.amount; else expense += t.amount;
  }
  return { income, expense, saved: income - expense };
}

export function categorySpend(state, key) {
  const out = {};
  for (const t of monthTransactions(state, key)) {
    if (t.kind !== 'expense') continue;
    out[t.category] = (out[t.category] || 0) + t.amount;
  }
  return out;
}

export function lastMonths(key, count) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) out.push(shiftMonth(key, -i));
  return out;
}
