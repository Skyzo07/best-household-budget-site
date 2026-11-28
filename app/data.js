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
    { id: 'debt-store', name: 'Store card — furniture shop', balance: 450, apr: 12.9, minPayment: 25 },
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

export function sampleChallenges() {
  // 52-week challenge: weeks 1–20 already paid on the growing plan
  // ($1 + $2 + … + $20 = $210 saved). November has 6 no-spend days
  // marked, and the round-up pot holds $48.60 swept from October.
  // Member challenges (v12): one personal savings target per person,
  // filled by banking unspent allowance — the banked records are the
  // progress, so the challenge and the banked money can never disagree.
  return {
    fiftyTwo: { mode: 'grow', paid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
    noSpend: { '2026-11': [3, 5, 9, 12, 15, 19] },
    roundUp: { pot: 48.60, swept: ['2026-10'] },
    members: memberChallengeDefaults(),
  };
}

// One personal savings target per member (v12). The target is what
// they are saving toward; the banked unspent allowance is the
// progress. Maya's Christmas presents are the biggest — $300 — and
// Liam's LEGO set the smallest, $60, because the targets fit the
// person, not the household.
export function memberChallengeDefaults() {
  return {
    maya: { target: 300, name: 'Christmas presents' },
    daniel: { target: 200, name: 'Fishing gear' },
    sofia: { target: 100, name: 'New bike' },
    liam: { target: 60, name: 'LEGO set' },
  };
}

// The per-member challenges, filled in for any member who lacks one
// (a member added later starts at $100 toward a challenge of their
// own). Targets and names are the member's own — edit the target on
// their page and it saves as you type.
export function memberChallengeStore(state) {
  if (!state.challenges || typeof state.challenges !== 'object') state.challenges = sampleChallenges();
  if (!state.challenges.members || typeof state.challenges.members !== 'object') state.challenges.members = memberChallengeDefaults();
  for (const a of (state.allowances || [])) {
    const c = state.challenges.members[a.id];
    if (!c || typeof c !== 'object') state.challenges.members[a.id] = { target: 100, name: a.who + '’s challenge' };
    else {
      if (typeof c.target !== 'number' || c.target < 0) c.target = 100;
      if (typeof c.name !== 'string' || !c.name) c.name = a.who + '’s challenge';
    }
  }
  return state.challenges.members;
}

// Fill v5 fields into an older saved state so v1–v4 saves keep working.
// v5 adds the savings challenges; the version bump records that the save
// has been seen by v5 code.
export function ensureV5(state) {
  if (!state) return sampleState();
  ensureV4(state);
  if (!state.challenges || !state.challenges.fiftyTwo) state.challenges = sampleChallenges();
  if (!Array.isArray(state.challenges.fiftyTwo.paid)) state.challenges.fiftyTwo.paid = [];
  if (!state.challenges.noSpend) state.challenges.noSpend = {};
  if (!state.challenges.roundUp) state.challenges.roundUp = { pot: 0, swept: [] };
  state.version = 5;
  return state;
}

// Fill v4 fields into an older saved state so v1–v3 saves keep working.
// v4 adds nothing to the stored shape — members are the allowances v2
// already saved, and transactions gained an optional "who" tag — but the
// version bump records that the save has been seen by v4 code.
export function ensureV4(state) {
  if (!state) return sampleState();
  ensureV3(state);
  if (!Array.isArray(state.allowances)) state.allowances = sampleAllowances();
  state.version = 4;
  return state;
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

export function sampleSubscriptions() {
  // Every subscription the Hartono household pays for, with the date it
  // was last actually used. The audit's verdicts come from that date:
  // used in the last 30 days -> keep; 31-60 days -> downgrade to a
  // cheaper tier; over 60 days -> cancel. Amazon Prime is billed once a
  // year ($139), the rest monthly; the monthly figure shown for Prime is
  // its yearly price split across 12 months ($11.58).
  return [
    { id: 'sub-netflix', name: 'Netflix — Standard', category: 'Streaming', monthly: 15.49, billed: 'monthly', yearly: 0, lastUsed: '2026-11-27', status: 'active', downgraded: false },
    { id: 'sub-spotify', name: 'Spotify — Family', category: 'Music', monthly: 16.99, billed: 'monthly', yearly: 0, lastUsed: '2026-11-28', status: 'active', downgraded: false },
    { id: 'sub-disney', name: 'Disney+', category: 'Streaming', monthly: 13.99, billed: 'monthly', yearly: 0, lastUsed: '2026-11-02', status: 'active', downgraded: false },
    { id: 'sub-youtube', name: 'YouTube Premium', category: 'Streaming', monthly: 13.99, billed: 'monthly', yearly: 0, lastUsed: '2026-11-25', status: 'active', downgraded: false },
    { id: 'sub-icloud', name: 'iCloud+ — 200 GB', category: 'Cloud storage', monthly: 2.99, billed: 'monthly', yearly: 0, lastUsed: '2026-11-29', status: 'active', downgraded: false },
    { id: 'sub-googleone', name: 'Google One — 100 GB', category: 'Cloud storage', monthly: 9.99, billed: 'monthly', yearly: 0, lastUsed: '2026-10-20', status: 'active', downgraded: false },
    { id: 'sub-prime', name: 'Amazon Prime', category: 'Shopping', monthly: 11.58, billed: 'yearly', yearly: 139, lastUsed: '2026-11-24', status: 'active', downgraded: false },
    { id: 'sub-gym', name: 'Riverside Fitness — gym', category: 'Health', monthly: 45, billed: 'monthly', yearly: 0, lastUsed: '2026-11-20', status: 'active', downgraded: false },
    { id: 'sub-xbox', name: 'Xbox Game Pass', category: 'Gaming', monthly: 16.99, billed: 'monthly', yearly: 0, lastUsed: '2026-10-26', status: 'active', downgraded: false },
    { id: 'sub-audible', name: 'Audible', category: 'Books & audio', monthly: 14.95, billed: 'monthly', yearly: 0, lastUsed: '2026-10-05', status: 'active', downgraded: false },
    { id: 'sub-duolingo', name: 'Duolingo Plus', category: 'Learning', monthly: 12.99, billed: 'monthly', yearly: 0, lastUsed: '2026-09-28', status: 'active', downgraded: false },
    { id: 'sub-natgeo', name: 'National Geographic — magazine', category: 'Magazines', monthly: 6.99, billed: 'monthly', yearly: 0, lastUsed: '2026-09-12', status: 'active', downgraded: false },
    { id: 'sub-adobe', name: 'Adobe Creative Cloud', category: 'Apps', monthly: 22.99, billed: 'monthly', yearly: 0, lastUsed: '2026-11-22', status: 'active', downgraded: false },
  ];
}

// One sample check-in (v13): week 1 of November, checked in on
// 8 November with the action "Cook at home 5 nights". The figures
// behind it are live — dining that week was $46.80 against a $55.43
// weekly share, so the note's "$8.63 under" is the household's own
// arithmetic, not a made-up line.
export function sampleCheckins() {
  return [{ weekKey: '2026-11-w1', action: 'cook-home', note: 'Kept it — dining came in $8.63 under its weekly share all week.', savedOn: '2026-11-08' }];
}

// The saved check-ins, filled in for an older save. Each record is a
// week key, the action picked for the next week, and an optional
// one-line note — the figures themselves are recomputed live from
// Transactions, so a check-in can never disagree with the records.
export function checkinStore(state) {
  if (!Array.isArray(state.checkins)) state.checkins = sampleCheckins();
  state.checkins = state.checkins.filter((c) => c && typeof c.weekKey === 'string' && typeof c.action === 'string');
  return state.checkins;
}

// Four planned big purchases (v14): the things the household knows are
// coming, with a cost, a date they are needed by, and what is already
// set aside in each purchase's own pot. `goalId` is empty for all four
// — the pot is the purchase's own — but a purchase added on the page
// can be linked to a savings goal instead, and then its set-aside
// follows the goal's balance live. The monthly set-aside and the
// reachable date are worked out on the page from the household's own
// saving pace, never stored, so an edited transaction moves them.
export function sampleBigBuys() {
  return [
    { id: 'bb-school', name: 'School fees — term 1', cost: 540, target: '2027-01-31', saved: 300, goalId: '' },
    { id: 'bb-car', name: 'Car service + new tyres', cost: 620, target: '2027-02-15', saved: 180, goalId: '' },
    { id: 'bb-washer', name: 'New washing machine', cost: 850, target: '2027-03-31', saved: 240, goalId: '' },
    { id: 'bb-sofa', name: 'New sofa for the living room', cost: 1400, target: '2027-08-31', saved: 150, goalId: '' },
  ];
}

// The planned big purchases, filled in for an older save. Each record
// is a name, a cost, a target date and what is already set aside —
// the plan itself is computed live on the page.
export function bigbuyStore(state) {
  if (!Array.isArray(state.bigbuys)) state.bigbuys = sampleBigBuys();
  state.bigbuys = state.bigbuys.filter((b) => b && typeof b.name === 'string' && Number(b.cost) > 0 && typeof b.target === 'string');
  for (const b of state.bigbuys) {
    if (typeof b.saved !== 'number' || b.saved < 0) b.saved = 0;
    if (typeof b.goalId !== 'string') b.goalId = '';
  }
  return state.bigbuys;
}

// Fill v15 fields into an older saved state so v1–v14 saves keep working.
// v15 adds the banked-allowance records behind the per-member challenges
// on the Streaks page (empty = nothing banked yet, the page falls back
// to the sample records). The version bump records that the save has
// been seen by v15 code.
export function ensureV15(state) {
  if (!state) return sampleState();
  ensureV14(state);
  if (!state.banked || typeof state.banked !== 'object') state.banked = {};
  state.version = 15;
  return state;
}

// Fill v14 fields into an older saved state so v1–v13 saves keep working.
// v14 adds the big-purchases plan (empty = no plan yet, the page falls
// back to the four sample purchases). The version bump records that
// the save has been seen by v14 code.
export function ensureV14(state) {
  if (!state) return sampleState();
  ensureV13(state);
  bigbuyStore(state);
  state.version = 14;
  return state;
}

// Fill v13 fields into an older saved state so v1–v12 saves keep working.
// v13 adds the weekly check-in history (0 = not checked in yet, the
// page falls back to the one sample check-in). The version bump records
// that the save has been seen by v13 code.
export function ensureV13(state) {
  if (!state) return sampleState();
  ensureV12(state);
  checkinStore(state);
  state.version = 13;
  return state;
}

export function sampleState() {
  const budgets = {};
  for (const c of CATEGORIES) if (c.budget > 0) budgets[c.id] = c.budget;
  return {
    version: 15,
    sample: true,
    currentMonth: '2026-11',
    forecast: { method: 'trend', extra: 0 },
    review2027: { save: 0, groceries: 0, dining: 0 },
    networth: { target: 0 },
    whatif: { extraSave: 100, cuts: { dining: 50, groceries: 30, fun: 20 }, extraDebt: 50, goalId: 'goal-emergency', applied: null },
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
    payoffMethod: 'avalanche',
    grocery: { offset: 0, list: sampleGroceryList(), pantry: samplePantry(), overrides: {} },
    challenges: sampleChallenges(),
    subscriptions: sampleSubscriptions(),
    checkins: sampleCheckins(),
    bigbuys: sampleBigBuys(),
    // Banked unspent allowance (v15): what each person already moved
    // into savings — Maya $145, Daniel $40, Sofia $15, Liam $10, $210
    // between them, all into the emergency fund. The emergency fund's
    // $4,350 already includes this banked money — banking moves money
    // into a goal, it never creates money on top of it — so the Goals
    // page and the banked records can never disagree. A month already
    // banked cannot be banked twice.
    banked: {
      'maya|2026-09': { amount: 60, goalId: 'goal-emergency' },
      'maya|2026-10': { amount: 85, goalId: 'goal-emergency' },
      'daniel|2026-10': { amount: 40, goalId: 'goal-emergency' },
      'sofia|2026-10': { amount: 15, goalId: 'goal-emergency' },
      'liam|2026-10': { amount: 10, goalId: 'goal-emergency' },
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return sampleState();
    return ensureV15(parsed);
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

// ---- Cash envelopes (v6) ----
// Six envelopes, each fed by one or two spending categories. Household
// covers the small stuff: shopping + other. The fill of an envelope is
// its categories' budgets plus whatever rolled over unspent from the
// month before — computed, never stored, so an edited budget or a new
// transaction moves the envelopes at once.
export const ENVELOPE_DEFS = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: '#2b5f8a', cats: ['groceries'] },
  { id: 'dining', label: 'Dining out', icon: '🍽', color: '#b3382e', cats: ['dining'] },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#7a5c1e', cats: ['transport'] },
  { id: 'kids', label: 'Kids & school', icon: '🎒', color: '#3f7d6b', cats: ['kids'] },
  { id: 'fun', label: 'Fun & family', icon: '🎬', color: '#c25e7a', cats: ['fun'] },
  { id: 'household', label: 'Household', icon: '🏠', color: '#5d6d64', cats: ['shopping', 'other'] },
];

export function envelopeStore(state) {
  if (!state.envelopes) state.envelopes = { fills: {}, rolloverOn: {} };
  if (!state.envelopes.fills) state.envelopes.fills = {};
  if (!state.envelopes.rolloverOn) state.envelopes.rolloverOn = {};
  return state.envelopes;
}

export function envelopeBaseFill(state, env) {
  let base = 0;
  for (const c of env.cats) base += state.budgets[c] || 0;
  return base;
}

export function envelopeSpend(state, key, env) {
  const spend = categorySpend(state, key);
  let total = 0;
  for (const c of env.cats) total += spend[c] || 0;
  return Math.round(total * 100) / 100;
}

// Unspent cash rolling INTO `key` from the month before: last month's
// budget for this envelope, minus what last month actually spent (0
// when the envelope's rollover is switched off, or when last month
// spent its budget out). Measured against the budget — not the fill —
// so a good month is rewarded once, and the reward never compounds
// into an envelope no household would recognise. A hand-raised fill
// does not inflate the next month: the rollover is the budget's
// unspent share.
export function envelopeRollover(state, key, env) {
  const store = envelopeStore(state);
  if (store.rolloverOn[env.id] === false) return 0;
  if (key <= '2025-01') return 0;
  const prev = shiftMonth(key, -1);
  const left = envelopeBaseFill(state, env) - envelopeSpend(state, prev, env);
  return Math.max(0, Math.round(left * 100) / 100);
}

// The fill for a month: a fill the household set by hand (typed in, or
// landed on by a transfer) wins; otherwise budget plus rollover.
export function envelopeFill(state, key, env) {
  const store = envelopeStore(state);
  const stored = store.fills[key] && store.fills[key][env.id];
  if (typeof stored === 'number') return stored;
  return Math.round((envelopeBaseFill(state, env) + envelopeRollover(state, key, env)) * 100) / 100;
}

// Everything the envelopes page and the dashboard strip need for a
// month, plus the preview of next month's opening fills.
export function envelopeTotals(state, key) {
  let filled = 0, spent = 0, rolled = 0, nextFilled = 0, nextRolled = 0;
  const over = [];
  const nextKey = shiftMonth(key, 1);
  for (const env of ENVELOPE_DEFS) {
    const fill = envelopeFill(state, key, env);
    const paid = envelopeSpend(state, key, env);
    filled += fill; spent += paid;
    rolled += envelopeRollover(state, key, env);
    nextFilled += envelopeFill(state, nextKey, env);
    nextRolled += envelopeRollover(state, nextKey, env);
    if (fill - paid <= 0) over.push(env);
  }
  const round = (n) => Math.round(n * 100) / 100;
  return { filled: round(filled), spent: round(spent), left: round(filled - spent), rolled: round(rolled), nextFilled: round(nextFilled), nextRolled: round(nextRolled), over };
}

// Fill v6 fields into an older saved state so v1–v5 saves keep working.
// v6 adds the cash envelopes; the version bump records that the save
// has been seen by v6 code.
export function ensureV6(state) {
  if (!state) return sampleState();
  ensureV5(state);
  envelopeStore(state);
  state.version = 6;
  return state;
}

// ---- Subscription audit (v7) ----
// The last day of a month, as ISO — the audit measures "last used"
// against the end of the month being viewed, so the verdicts are stable
// no matter which day the page is opened.
export function monthEndISO(key) {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return key + '-' + String(last).padStart(2, '0');
}

export function subscriptionStore(state) {
  if (!Array.isArray(state.subscriptions)) state.subscriptions = sampleSubscriptions();
  if (!state.banked || typeof state.banked !== 'object') state.banked = {};
  // Usage log (v14): every subscription keeps the dates it was last
  // used, newest first. Older saves only stored the single last-used
  // date, so the log is seeded from it — the last use, then one a
  // month further back, up to four entries — and every "I used it"
  // press from now on appends a real date to the log.
  for (const s of state.subscriptions) {
    if (Array.isArray(s.uses)) continue;
    const log = [];
    let d = Date.parse(s.lastUsed + 'T00:00:00Z');
    const floor = Date.parse('2026-06-01T00:00:00Z');
    while (!Number.isNaN(d) && d >= floor && log.length < 4) {
      log.push(new Date(d).toISOString().slice(0, 10));
      d -= 30 * 86400000;
    }
    s.uses = log.length ? log : [s.lastUsed];
  }
  return state.subscriptions;
}

// Days between two ISO dates (date2 minus date1), whole days.
export function daysBetween(a, b) {
  const ms = Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z');
  return Math.floor(ms / 86400000);
}

// The audit's verdict, from how long ago the household last used it:
// used in the last 30 days -> keep it; 31-60 days -> a cheaper tier
// keeps the bits that are used; over 60 days -> cancel it.
export function subVerdict(sub, refISO) {
  const days = daysBetween(sub.lastUsed, refISO);
  if (days > 60) return { kind: 'cancel', days, label: 'Cancel', note: 'Not used in ' + days + ' days — the money is going out and nothing is coming back' };
  if (days > 30) return { kind: 'downgrade', days, label: 'Downgrade', note: 'Last used ' + days + ' days ago — a cheaper tier keeps the bits you actually use' };
  return { kind: 'keep', days, label: 'Keep', note: 'Used ' + days + ' day' + (days === 1 ? '' : 's') + ' ago — earning its place' };
}

// What a subscription costs right now: a downgraded one costs half.
// Yearly-billed ones (Prime) keep their yearly price, halved the same way.
export function subMonthly(sub) {
  const base = Number(sub.monthly) || 0;
  return Math.round((sub.downgraded ? base / 2 : base) * 100) / 100;
}

export function subYearly(sub) {
  if (sub.billed === 'yearly' && Number(sub.yearly) > 0) {
    return Math.round((sub.downgraded ? sub.yearly / 2 : sub.yearly) * 100) / 100;
  }
  return Math.round(subMonthly(sub) * 12 * 100) / 100;
}

// Everything the audit page and the dashboard strip need: what the
// household still pays, and what cancelling the flagged subscriptions
// and downgrading the barely-used ones would save in a year. A
// subscription already cancelled or already downgraded no longer counts
// toward the saving — the saving is what is still on the table.
export function subTotals(state, key) {
  const ref = monthEndISO(key);
  const subs = subscriptionStore(state);
  const active = subs.filter((s) => s.status !== 'cancelled');
  const cancelled = subs.filter((s) => s.status === 'cancelled');
  const round = (n) => Math.round(n * 100) / 100;
  let monthly = 0, yearly = 0, cancelSaving = 0, downgradeSaving = 0;
  let cancelCount = 0, downgradeCount = 0, keepCount = 0;
  for (const s of active) {
    monthly += subMonthly(s);
    yearly += subYearly(s);
    const v = subVerdict(s, ref);
    if (v.kind === 'cancel') { cancelCount++; cancelSaving += subYearly(s); }
    else if (v.kind === 'downgrade') {
      downgradeCount++;
      if (!s.downgraded) downgradeSaving += subYearly(s) / 2;
    } else keepCount++;
  }
  return {
    activeCount: active.length, cancelledCount: cancelled.length,
    monthly: round(monthly), yearly: round(yearly),
    cancelCount, downgradeCount, keepCount,
    cancelSaving: round(cancelSaving), downgradeSaving: round(downgradeSaving),
    totalSaving: round(cancelSaving + downgradeSaving),
    cancelledYearly: round(cancelled.reduce((a, s) => a + subYearly(s), 0)),
  };
}

export function reviewStore(state) {
  if (!state.review2027 || typeof state.review2027 !== 'object') state.review2027 = { save: 0, groceries: 0, dining: 0 };
  for (const k of ['save', 'groceries', 'dining']) {
    if (typeof state.review2027[k] !== 'number' || state.review2027[k] < 0) state.review2027[k] = 0;
  }
  return state.review2027;
}

// Fill v12 fields into an older saved state so v1–v11 saves keep working.
// v12 adds the what-if planner settings (0 = not set yet, the page falls
// back to its starting plan) and one personal savings challenge per
// member. The version bump records that the save has been seen by v12 code.
export function ensureV12(state) {
  if (!state) return sampleState();
  ensureV11(state);
  if (!state.whatif || typeof state.whatif !== 'object') {
    state.whatif = { extraSave: 100, cuts: { dining: 50, groceries: 30, fun: 20 }, extraDebt: 50, goalId: 'goal-emergency', applied: null };
  }
  memberChallengeStore(state);
  state.version = 12;
  return state;
}

// Fill v11 fields into an older saved state so v1–v10 saves keep working.
// v11 adds the net-worth goal (0 = not set yet, the page falls back to
// the next $5,000 milestone above the household's current net worth).
// The version bump records that the save has been seen by v11 code.
export function ensureV11(state) {
  if (!state) return sampleState();
  ensureV10(state);
  networthStore(state);
  state.version = 11;
  return state;
}

export function networthStore(state) {
  if (!state.networth || typeof state.networth !== 'object') state.networth = { target: 0 };
  if (typeof state.networth.target !== 'number' || state.networth.target < 0) state.networth.target = 0;
  return state.networth;
}

// The 52-week challenge's saved total, worked out from its own paid
// weeks — the same maths as savings.js, kept here so the net-worth
// page can use it without a circular import.
function challengeSavedAmount(state) {
  const c = state.challenges && state.challenges.fiftyTwo;
  if (!c || !Array.isArray(c.paid)) return 0;
  const mode = c.mode || 'grow';
  let s = 0;
  for (const w of c.paid) s += mode === 'reverse' ? 53 - w : mode === 'flat' ? 10 : w;
  return s;
}

// ---- Net worth (v11) ----
// What the household owns, minus what it owes — all from its own
// records, nothing typed in by hand. "Cash kept" is the money that
// stayed in the household month by month (income minus spending,
// January through the month being viewed): that is the asset, and the
// page shows where it sits — in savings goals, in the 52-week
// challenge, in the round-up pot, in the cash envelopes, and the rest
// unassigned in the main account. Liabilities are the debts at their
// current balance; the trend holds them flat because no debt payment
// is recorded in Transactions yet — record one and they fall.
export function networthSummary(state) {
  const year = state.currentMonth.slice(0, 4);
  const curMonth = Number(state.currentMonth.slice(5, 7));
  const keys = [];
  for (let m = 1; m <= curMonth; m++) keys.push(year + '-' + String(m).padStart(2, '0'));
  const debts = (state.debts || []).map((d) => ({
    id: d.id, name: d.name, balance: Math.max(0, Number(d.balance) || 0),
    apr: Number(d.apr) || 0, min: Number(d.minPayment) || 0,
  }));
  const liabilities = Math.round(debts.reduce((a, d) => a + d.balance, 0) * 100) / 100;
  let cum = 0;
  const months = keys.map((k) => {
    const t = monthTotals(state, k);
    cum = Math.round((cum + t.saved) * 100) / 100;
    return {
      key: k, label: monthLabel(k), short: monthLabel(k).split(' ')[0].slice(0, 3),
      saved: Math.round(t.saved * 100) / 100, assets: cum,
      net: Math.round((cum - liabilities) * 100) / 100,
    };
  });
  const n = months.length || 1;
  const assets = months.length ? months[months.length - 1].assets : 0;
  const net = Math.round((assets - liabilities) * 100) / 100;
  const pace = Math.round((assets / n) * 100) / 100;
  const goalTotal = Math.round((state.goals || []).reduce((a, g) => a + (Number(g.saved) || 0), 0) * 100) / 100;
  const chSaved = challengeSavedAmount(state);
  const pot = Math.round(((state.challenges && state.challenges.roundUp && Number(state.challenges.roundUp.pot)) || 0) * 100) / 100;
  const envLeft = Math.round(envelopeTotals(state, state.currentMonth).left * 100) / 100;
  const unassigned = Math.round((assets - goalTotal - chSaved - pot - envLeft) * 100) / 100;
  const firstPositive = months.find((r) => r.net > 0) || null;
  const store = networthStore(state);
  const milestone = (Math.floor(net / 5000) + 1) * 5000;
  const target = store.target > 0 ? store.target : milestone;
  const gap = Math.round((target - net) * 100) / 100;
  const monthsTo = gap <= 0 ? 0 : (pace > 0 ? Math.ceil(gap / pace) : -1);
  const targetKey = monthsTo > 0 ? shiftMonth(state.currentMonth, monthsTo) : (gap <= 0 ? state.currentMonth : null);
  const debtShare = liabilities ? debts.map((d) => ({ ...d, share: Math.round(d.balance / liabilities * 1000) / 10 })) : debts.map((d) => ({ ...d, share: 0 }));
  return {
    year, keys, months, n, assets, liabilities, net, pace, debts: debtShare,
    goalTotal, chSaved, pot, envLeft, unassigned, firstPositive,
    target, milestone, gap, monthsTo, targetKey, targetSet: store.target > 0,
  };
}

// Fill v10 fields into an older saved state so v1–v9 saves keep working.
// v10 adds the 2027 targets for the year-in-review page (0 = not set yet,
// the page falls back to this year's own pace). The version bump records
// that the save has been seen by v10 code.
export function ensureV10(state) {
  if (!state) return sampleState();
  ensureV9(state);
  reviewStore(state);
  state.version = 10;
  return state;
}

export function ensureV9(state) {
  if (!state) return sampleState();
  ensureV8(state);
  if (!state.forecast || typeof state.forecast !== 'object') state.forecast = { method: 'trend', extra: 0 };
  if (state.forecast.method !== 'average' && state.forecast.method !== 'budget') state.forecast.method = 'trend';
  if (typeof state.forecast.extra !== 'number' || state.forecast.extra < 0) state.forecast.extra = 0;
  state.version = 9;
  return state;
}

// Fill v8 fields into an older saved state so v1–v7 saves keep working.
// v8 adds the payoff method (avalanche by default) and the third sample
// debt — a store card — which is what makes the snowball-vs-avalanche
// comparison a real choice instead of two identical orders. Older saves
// keep their own debts; only the method is added. The version bump
// records that the save has been seen by v8 code.
export function ensureV8(state) {
  if (!state) return sampleState();
  ensureV7(state);
  if (state.payoffMethod !== 'snowball' && state.payoffMethod !== 'avalanche') state.payoffMethod = 'avalanche';
  state.version = 8;
  return state;
}

// Fill v7 fields into an older saved state so v1–v6 saves keep working.
// v7 adds the subscription audit and the banked-allowance record; the
// version bump records that the save has been seen by v7 code.
export function ensureV7(state) {
  if (!state) return sampleState();
  ensureV6(state);
  subscriptionStore(state);
  state.version = 7;
  return state;
}
