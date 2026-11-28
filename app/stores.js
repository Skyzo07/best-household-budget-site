// Hearth & Home Budget — where we shop: every dollar of the month
// grouped by the shop or payee it went to. The store for a
// transaction is read off the transaction's own words — the note on
// the weekly shop ("Market + store" means the market, "Supermarket"
// means SuperMart), the description otherwise ("Pizza night" is
// Pizza Corner, "Fuel — family car" is Petro Stop) — with a
// category fallback when a description names no shop at all. Edit
// a transaction's description on the Transactions page and the
// store moves, because the grouping is computed live, never typed
// in. The second half of the page is the grocery switch: the eight
// staples the household buys every week, which shop has each one
// cheapest (from the price history on the Groceries page), and what
// moving the staples away from the household's usual shop is roughly
// worth a month. Lazy-loaded: it only loads when the Where we shop
// nav link is opened, so it never touches the first load.
import { categoryById, money, money0, monthLabel, monthTransactions, shiftMonth } from './data.js';
import { PRICE_HISTORY } from './grocery.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// The shops and payees this household actually uses, in the order
// they first appear in the records. A "kind" is what the shop is
// for, so the page can group the corner café with the restaurants
// instead of with the supermarket.
export const STORES = [
  { id: 'supermart', name: 'SuperMart', kind: 'Groceries', blurb: 'The weekly one-stop supermarket — the default shop for the weekly groceries.' },
  { id: 'market-hall', name: 'Market Hall', kind: 'Groceries', blurb: 'The Saturday market stalls — fruit, veg, meat and cheese, bought by the kilo.' },
  { id: 'bakery', name: 'Bakery Corner', kind: 'Groceries', blurb: 'Bread and pastries from the bakery on the corner.' },
  { id: 'fish-market', name: 'Fish Market', kind: 'Groceries', blurb: 'Fresh fish on Fridays — salmon and the catch of the day.' },
  { id: 'family-table', name: 'The Family Table', kind: 'Eating out', blurb: 'The family restaurant for birthdays and Friday treats.' },
  { id: 'pizza-corner', name: 'Pizza Corner', kind: 'Eating out', blurb: 'Friday pizza night, collected on the way home.' },
  { id: 'corner-cafe', name: 'Corner Café', kind: 'Eating out', blurb: 'Coffee and lunch with friends.' },
  { id: 'petro', name: 'Petro Stop', kind: 'Transport', blurb: 'Fuel for the family car.' },
  { id: 'city-transit', name: 'City Transit', kind: 'Transport', blurb: 'Bus passes for the kids.' },
  { id: 'autocare', name: 'AutoCare Garage', kind: 'Transport', blurb: 'Oil, tyres and the yearly service.' },
  { id: 'city-power', name: 'City Power', kind: 'Bills & services', blurb: 'Electricity, billed monthly.' },
  { id: 'city-water', name: 'City Water', kind: 'Bills & services', blurb: 'Water, billed monthly.' },
  { id: 'lettings', name: 'Maple Court Lettings', kind: 'Bills & services', blurb: 'The landlord — rent for the 3-bed house.' },
  { id: 'school', name: 'Riverside School', kind: 'Kids & school', blurb: 'Fees, trips, uniforms and lunch top-ups.' },
  { id: 'canteen', name: 'School Canteen', kind: 'Kids & school', blurb: 'Lunch money, topped up when the balance runs low.' },
  { id: 'pharmacy', name: 'HealthPoint Pharmacy', kind: 'Health', blurb: 'Vitamins and prescriptions.' },
  { id: 'dental', name: 'Bright Smile Dental', kind: 'Health', blurb: 'Check-ups for the whole family.' },
  { id: 'cinema', name: 'Riverside Cinema', kind: 'Fun & family', blurb: 'Family movie nights.' },
  { id: 'toybox', name: 'Toybox', kind: 'Fun & family', blurb: 'Board games, books and comics for the kids.' },
  { id: 'zoo', name: 'City Zoo', kind: 'Fun & family', blurb: 'Day trips — tickets for four.' },
  { id: 'streambox', name: 'StreamBox', kind: 'Fun & family', blurb: 'Streaming and games, monthly.' },
  { id: 'outfitters', name: 'High Street Outfitters', kind: 'Shopping', blurb: 'Jackets, shoes and clothes for the kids.' },
  { id: 'home-kitchen', name: 'Home & Kitchen', kind: 'Shopping', blurb: 'Kitchenware and household supplies.' },
  { id: 'barbers', name: 'Snip & Clip Barbers', kind: 'Household', blurb: 'Haircuts for both kids.' },
];

const GROCERY_STORE_IDS = ['supermart', 'market-hall', 'bakery', 'fish-market'];

export function storeById(id) {
  return STORES.find((s) => s.id === id) || null;
}

// When a description names no shop, the category decides: the
// weekly shop defaults to SuperMart, a meal out to The Family
// Table, a health spend to the pharmacy, and so on.
const CATEGORY_STORE = {
  groceries: 'supermart', dining: 'family-table', shopping: 'outfitters',
  fun: 'cinema', health: 'pharmacy', kids: 'school', transport: 'petro',
  utilities: 'city-power', housing: 'lettings', other: 'supermart',
};

// Which shop a transaction went to, from its own words. The order
// matters: "School lunch top-up" is the canteen, not the school,
// and a grocery note saying "Market" beats the supermarket default.
export function storeForTx(tx) {
  const d = String(tx.description || '').toLowerCase();
  const n = String(tx.note || '').toLowerCase();
  if (d.includes('pizza')) return 'pizza-corner';
  if (d.includes('lunch with friends')) return 'corner-cafe';
  if (d.includes('family dinner') || d.includes('birthday dinner') || d.includes('takeaway')) return 'family-table';
  if (d.includes('cinema')) return 'cinema';
  if (d.includes('zoo')) return 'zoo';
  if (d.includes('board game') || d.includes('comic')) return 'toybox';
  if (d.includes('streaming')) return 'streambox';
  if (d.includes('school lunch')) return 'canteen';
  if (d.includes('school')) return 'school';
  if (d.includes('haircut')) return 'barbers';
  if (d.includes('household supplies')) return 'home-kitchen';
  if (d.includes('kitchenware')) return 'home-kitchen';
  if (d.includes('jacket') || d.includes('shoes')) return 'outfitters';
  if (d.includes('fuel')) return 'petro';
  if (d.includes('bus pass')) return 'city-transit';
  if (d.includes('car service')) return 'autocare';
  if (d.includes('electricity')) return 'city-power';
  if (d.includes('water bill')) return 'city-water';
  if (d.includes('rent')) return 'lettings';
  if (d.includes('pharmacy')) return 'pharmacy';
  if (d.includes('dentist')) return 'dental';
  if (tx.category === 'groceries') return (n.includes('market +') || n.includes('market hall')) ? 'market-hall' : 'supermart';
  return CATEGORY_STORE[tx.category] || 'supermart';
}

// The household's usual grocery shop — where the weekly shop goes
// unless a transaction's note says otherwise. SuperMart until the
// household picks another one; the switch estimate below is measured
// against whatever is picked here.
export function storesPrefStore(state) {
  if (!state.storesPref || typeof state.storesPref !== 'object') state.storesPref = { preferred: 'supermart' };
  if (!GROCERY_STORE_IDS.includes(state.storesPref.preferred)) state.storesPref.preferred = 'supermart';
  return state.storesPref;
}

export function setPreferredStore(state, id) {
  if (!GROCERY_STORE_IDS.includes(id)) return false;
  storesPrefStore(state).preferred = id;
  state.sample = false;
  return true;
}

// One store's month: what went there, how often, the biggest single
// spend, the category split, and the same store last month so a
// jump or a drop has a number on it. Income never lands at a shop.
export function storeSpend(state, key) {
  const prevKey = shiftMonth(key, -1);
  const rows = {};
  for (const tx of monthTransactions(state, key)) {
    if (tx.kind !== 'expense') continue;
    const id = storeForTx(tx);
    if (!rows[id]) rows[id] = { id, total: 0, trips: 0, biggest: null, cats: {}, txs: [] };
    const r = rows[id];
    r.total = Math.round((r.total + Number(tx.amount)) * 100) / 100;
    r.trips += 1;
    if (!r.biggest || Number(tx.amount) > Number(r.biggest.amount)) r.biggest = tx;
    r.cats[tx.category] = Math.round(((r.cats[tx.category] || 0) + Number(tx.amount)) * 100) / 100;
    r.txs.push(tx);
  }
  const prev = {};
  for (const tx of monthTransactions(state, prevKey)) {
    if (tx.kind !== 'expense') continue;
    const id = storeForTx(tx);
    prev[id] = Math.round(((prev[id] || 0) + Number(tx.amount)) * 100) / 100;
  }
  return Object.values(rows).map((r) => {
    r.txs.sort((a, b) => b.date.localeCompare(a.date));
    r.prevTotal = prev[r.id] || 0;
    r.change = Math.round((r.total - r.prevTotal) * 100) / 100;
    r.avg = r.trips ? Math.round((r.total / r.trips) * 100) / 100 : 0;
    return r;
  });
}

// The grocery switch, measured against the household's usual shop.
// For every staple whose cheapest shop is NOT the usual one, the
// household pays roughly 4% over the cheapest price at the one-stop
// shop — the same rough rate the Groceries page measures on the
// basket. A month is 4.33 weeks of baskets. It is an estimate, and
// the page says so: the exact saving depends on what the week
// actually buys.
export function storeSwitchSaving(state) {
  const pref = storesPrefStore(state).preferred;
  const away = PRICE_HISTORY.filter((p) => p.store !== storeById(pref).name);
  const atHome = PRICE_HISTORY.filter((p) => p.store === storeById(pref).name);
  const awayTotal = away.reduce((a, p) => a + p.nov, 0);
  const weeklyRaw = awayTotal * 0.04;
  const weekly = Math.round(weeklyRaw * 100) / 100;
  const monthly = Math.round(weeklyRaw * 4.33 * 100) / 100;
  return { pref, away, atHome, awayTotal: Math.round(awayTotal * 100) / 100, weekly, monthly };
}

let storeSortMode = 'spend';
let storeExpandedId = '';

export function setStoreSort(mode) {
  if (['spend', 'trips', 'name'].includes(mode)) storeSortMode = mode;
}

export function toggleStoreDetail(id) {
  storeExpandedId = storeExpandedId === id ? '' : id;
}

function sortedStores(rows) {
  const list = rows.slice();
  if (storeSortMode === 'trips') list.sort((a, b) => b.trips - a.trips || b.total - a.total);
  else if (storeSortMode === 'name') list.sort((a, b) => storeById(a.id).name.localeCompare(storeById(b.id).name));
  else list.sort((a, b) => b.total - a.total);
  return list;
}

export function renderStores(state, root) {
  const key = state.currentMonth;
  const rows = sortedStores(storeSpend(state, key));
  const monthTotal = Math.round(rows.reduce((a, r) => a + r.total, 0) * 100) / 100;
  const biggest = rows[0] || null;
  const sw = storeSwitchSaving(state);
  const basketNov = PRICE_HISTORY.reduce((a, p) => a + p.nov, 0);
  const basketSep = PRICE_HISTORY.reduce((a, p) => a + p.sep, 0);
  const prefMeta = storeById(sw.pref);

  const sortBtn = (mode, label) => '<button type="button" class="btn small' + (storeSortMode === mode ? ' primary' : ' ghost') + '" data-store-sort="' + mode + '"' + (storeSortMode === mode ? ' aria-pressed="true"' : '') + '>' + label + '</button>';

  const cards = rows.map((r) => {
    const meta = storeById(r.id);
    const share = monthTotal > 0 ? (r.total / monthTotal) * 100 : 0;
    const changeLine = r.prevTotal > 0
      ? (r.change >= 0 ? 'Up ' + money(r.change) : 'Down ' + money(-r.change)) + ' on ' + monthLabel(shiftMonth(key, -1)) + ' (' + money(r.prevTotal) + ')'
      : 'First month at this shop in the records';
    const catBars = Object.entries(r.cats).sort((a, b) => b[1] - a[1]).map(([catId, amt]) => {
      const pct = r.total > 0 ? (amt / r.total) * 100 : 0;
      return '<div class="bar-row"><div class="bar-top"><span>' + esc(categoryById(catId).label) + '</span><span>' + money(amt) + ' · ' + pct.toFixed(0) + '%</span></div><div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div></div>';
    }).join('');
    const open = storeExpandedId === r.id;
    const detail = open ? '<ul class="tx-list store-txs">' + r.txs.map((tx) => '<li><span class="tx-ico" style="background:' + categoryById(tx.category).color + '22;color:' + categoryById(tx.category).color + '">' + categoryById(tx.category).icon + '</span><span class="tx-main"><b>' + esc(tx.description) + '</b><span>' + tx.date + ' · ' + esc(categoryById(tx.category).label) + (tx.note ? ' · ' + esc(tx.note) : '') + '</span></span><span class="tx-amt out">−' + money(tx.amount) + '</span></li>').join('') + '</ul>' : '';
    const groceryLink = GROCERY_STORE_IDS.includes(r.id) ? ' <a href="#/grocery">Grocery list →</a>' : '';
    return '<div class="card rule-card"><div class="rule-top"><h3>' + esc(meta.name) + '</h3><span class="pill">' + esc(meta.kind) + '</span></div>'
      + '<p class="muted small">' + esc(meta.blurb) + '</p>'
      + '<p><span class="kpi-value num" style="font-size:1.35rem">' + money(r.total) + '</span> <span class="muted">in ' + monthLabel(key) + ' · ' + r.trips + ' trip' + (r.trips === 1 ? '' : 's') + ' · ' + money(r.avg) + ' a trip · ' + share.toFixed(1) + '% of the month’s spending</span></p>'
      + '<p class="muted small">Biggest single spend: “' + esc(r.biggest.description) + '” — ' + money(r.biggest.amount) + ' on ' + r.biggest.date + '. ' + esc(changeLine) + '.</p>'
      + catBars
      + '<div class="goal-actions"><button type="button" class="btn small' + (open ? ' primary' : '') + '" data-store-detail="' + r.id + '">' + (open ? 'Hide purchases' : 'Show the ' + r.trips + ' purchase' + (r.trips === 1 ? '' : 's')) + '</button> <a href="#/transactions">See them in Transactions →</a>' + groceryLink + '</div>'
      + detail + '</div>';
  }).join('');

  const stapleRows = PRICE_HISTORY.map((p) => {
    const rise = ((p.nov - p.sep) / p.sep) * 100;
    const isPref = p.store === prefMeta.name;
    const onList = ((state.grocery && state.grocery.list) || []).some((i) => i.name === p.name && !i.checked);
    return '<tr><td><b>' + esc(p.name) + '</b></td><td class="amount">' + money(p.nov) + '</td><td>' + esc(p.store) + (isPref ? ' <span class="pill">your usual shop</span>' : '') + '</td><td class="amount"><span class="' + (rise > 8 ? 'neg' : 'pos') + '">+' + rise.toFixed(1) + '%</span></td><td><button class="icon-btn" data-price-add="' + esc(p.name) + '"' + (onList ? ' disabled' : '') + '>' + (onList ? 'On the list ✓' : 'Add at ' + money(p.nov)) + '</button></td></tr>';
  }).join('');

  root.innerHTML = '<div class="page-head"><div><h1>Where we shop</h1><p class="muted">Every dollar of ' + monthLabel(key) + ' grouped by the shop or payee it went to — read off the transactions themselves, so the figures always agree with the Transactions page.</p></div></div>'
    + '<div class="grid kpis">'
    + '<div class="card kpi"><div class="kpi-label">Shops &amp; payees used · ' + monthLabel(key) + '</div><div class="kpi-value num">' + rows.length + '</div><div class="kpi-sub">from ' + monthTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) + ' of spending in the month</div></div>'
    + '<div class="card kpi"><div class="kpi-label">Biggest shop this month</div><div class="kpi-value num">' + (biggest ? esc(storeById(biggest.id).name) : '—') + '</div><div class="kpi-sub">' + (biggest ? money(biggest.total) + ' across ' + biggest.trips + ' trip' + (biggest.trips === 1 ? '' : 's') : 'No spending yet this month') + '</div></div>'
    + '<div class="card kpi' + (sw.monthly > 0 ? ' warn' : ' good') + '"><div class="kpi-label">Switch &amp; save — rough, a month</div><div class="kpi-value num">' + money(sw.monthly) + '</div><div class="kpi-sub">buying the ' + sw.away.length + ' staples cheapest elsewhere instead of at ' + esc(prefMeta.name) + '</div></div>'
    + '<div class="card kpi"><div class="kpi-label">The 8-staple basket</div><div class="kpi-value num">' + money(basketNov) + '</div><div class="kpi-sub">against ' + money(basketSep) + ' in September — up ' + money(Math.round((basketNov - basketSep) * 100) / 100) + ' in two months</div></div>'
    + '</div>'
    + '<div class="card" style="margin-bottom:16px"><h2>Your usual grocery shop</h2>'
    + '<p class="muted">The weekly shop goes to one shop unless a transaction’s note says otherwise. Pick the shop below and the switch estimate re-measures against it — the staples already cheapest there stop counting, and the ones that are not start counting.</p>'
    + '<div class="form-row"><label>Usual grocery shop <select id="store-pref">' + GROCERY_STORE_IDS.map((id) => '<option value="' + id + '"' + (id === sw.pref ? ' selected' : '') + '>' + esc(storeById(id).name) + '</option>').join('') + '</select></label></div>'
    + '<p>' + (sw.away.length
      ? '<b>' + sw.atHome.length + ' of the 8 staples are already cheapest at ' + esc(prefMeta.name) + '</b> (' + sw.atHome.map((p) => esc(p.name)).join(', ') + '). The other ' + sw.away.length + ' — ' + sw.away.map((p) => esc(p.name) + ' at ' + esc(p.store)).join(', ') + ' — cost ' + money(sw.awayTotal) + ' a week at their cheapest shops, and roughly ' + money(sw.weekly) + ' a week more (' + money(sw.monthly) + ' a month) bought at the one-stop shop instead. Rough, because the exact saving depends on what the week actually buys — the rate is about 4% over the cheapest price, the same rate the Groceries page measures on the basket.'
      : '<b>Every staple is already cheapest at ' + esc(prefMeta.name) + '.</b> Nothing left to save by switching shops — the saving now hides in the list itself, not the shop.') + '</p>'
    + '<p class="muted small"><a href="#/grocery">See the price alerts on the Groceries page →</a></p></div>'
    + '<div class="card" style="margin-bottom:16px"><h2>Shops ranked by ' + monthLabel(key) + ' spending</h2>'
    + '<p class="muted small" style="margin-top:0">Sort: ' + sortBtn('spend', 'Most spent') + ' ' + sortBtn('trips', 'Most trips') + ' ' + sortBtn('name', 'A–Z') + '</p>'
    + '<p class="muted small">Press “Show the purchases” on any shop to see the month’s receipts there, one by one. The rent is the landlord, the bills are the utilities — every payee the household pays counts, not just the shops with a till.</p></div>'
    + '<div class="goal-grid">' + cards + '</div>'
    + '<div class="card" style="margin-top:16px"><h2>Staple prices — which shop has each one cheapest</h2>'
    + '<p class="muted small" style="margin-top:0">The eight staples this household buys every week, priced September → November 2026. “Add at $…” puts the staple on the grocery list at this month’s price — the same button the Groceries page uses, so the list never disagrees between pages.</p>'
    + '<div class="table-scroll"><table><thead><tr><th>Staple</th><th class="amount">Nov price</th><th>Cheapest shop</th><th class="amount">Since Sep</th><th></th></tr></thead><tbody>' + stapleRows + '</tbody></table></div>'
    + '<p class="muted small">How a shop is decided: the transaction’s own words — the note on the weekly shop, the description otherwise (“Pizza night”, “Fuel — family car”, “School fees — term 4”) — with the category as the fallback when a description names no shop. Edit a description on the Transactions page and the shop moves.</p></div>';
}
