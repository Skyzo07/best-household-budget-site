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
    ['2026-11-11', 'expense', 'dining', 52.25, 'Lunch with friends', ''],
    ['2026-11-07', 'expense', 'fun', 64, 'Cinema — family movie', ''],
    ['2026-11-15', 'expense', 'fun', 42, 'Board game + snacks', ''],
    ['2026-11-09', 'expense', 'transport', 38, 'Bus passes — kids', ''],
    ['2026-11-14', 'expense', 'shopping', 89.99, 'Winter jackets — kids', 'Sale'],
    ['2026-11-16', 'expense', 'kids', 24.50, 'School lunch top-up', ''],
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
  return rows.map(([date, kind, category, amount, description, note], i) => ({
    id: 'tx-sample-' + (i + 1), date, kind, category, amount, description, note,
  }));
}

export function sampleState() {
  const budgets = {};
  for (const c of CATEGORIES) if (c.budget > 0) budgets[c.id] = c.budget;
  return {
    version: 1,
    sample: true,
    currentMonth: '2026-11',
    budgets,
    goals: [
      { id: 'goal-emergency', name: 'Emergency fund', target: 6000, saved: 4350, date: '2027-06-30' },
      { id: 'goal-holiday', name: 'Summer holiday — beach trip', target: 2400, saved: 980, date: '2027-07-01' },
      { id: 'goal-car', name: 'New family car deposit', target: 8000, saved: 2150, date: '2027-12-31' },
    ],
    transactions: sampleTransactions(),
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return sampleState();
    return parsed;
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
