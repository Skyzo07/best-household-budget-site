// Hearth & Home Budget — debt payoff maths: simulate paying a list of
// debts month by month, either by the avalanche method (highest APR
// first — the cheapest order) or the snowball method (smallest balance
// first — the quickest first win). Pure functions, no state, no network:
// the caller passes the household's own debts and the extra payment.
import { monthLabel, shiftMonth } from './data.js';

// Simulate one payoff order. Every month: interest accrues on each open
// debt, the minimum goes to every open debt, then the extra payment
// goes to one target debt — the highest-APR open debt for avalanche,
// the smallest open balance for snowball — until that debt clears and
// the extra rolls on to the next. Returns the months to debt-free, the
// total interest paid, the month the last debt clears, each debt's own
// figures, and the order the debts cleared in. Caps at 600 months
// (50 years); months -1 means the minimums never clear the debt.
export function simulatePayoff(debts, extra, method, startKey) {
  const target = method === 'snowball' ? 'snowball' : 'avalanche';
  const work = debts
    .map((d) => ({
      id: d.id,
      name: d.name,
      balance: Math.max(0, Number(d.balance) || 0),
      apr: Math.max(0, Number(d.apr) || 0),
      min: Math.max(0, Number(d.minPayment) || 0),
    }))
    .filter((d) => d.balance > 0);
  if (!work.length) return { method: target, months: 0, interest: 0, payoffKey: null, perDebt: [], order: [] };
  let totalInterest = 0;
  let months = 0;
  const perDebt = work.map((d) => ({ id: d.id, name: d.name, months: 0, interest: 0 }));
  const byId = {};
  for (const p of perDebt) byId[p.id] = p;
  const order = [];
  const clearedAt = {};
  let guard = 0;
  while (work.some((d) => d.balance > 0.01) && guard < 600) {
    guard++;
    months++;
    for (const d of work) {
      if (d.balance <= 0.01) continue;
      const interest = d.balance * (d.apr / 100 / 12);
      d.balance += interest;
      totalInterest += interest;
      byId[d.id].interest += interest;
    }
    for (const d of work) {
      if (d.balance <= 0.01) continue;
      const pay = Math.min(d.balance, d.min);
      d.balance -= pay;
      if (d.balance <= 0.01 && !clearedAt[d.id]) { clearedAt[d.id] = months; byId[d.id].months = months; order.push(d.name); }
    }
    let remaining = Math.max(0, Number(extra) || 0);
    const open = work.filter((d) => d.balance > 0.01);
    open.sort((a, b) => (target === 'snowball' ? a.balance - b.balance : b.apr - a.apr));
    for (const d of open) {
      if (remaining <= 0) break;
      const pay = Math.min(d.balance, remaining);
      d.balance -= pay;
      remaining -= pay;
      if (d.balance <= 0.01 && !clearedAt[d.id]) { clearedAt[d.id] = months; byId[d.id].months = months; order.push(d.name); }
    }
  }
  const stuck = work.some((d) => d.balance > 0.01);
  const round = (n) => Math.round(n * 100) / 100;
  return {
    method: target,
    months: stuck ? -1 : months,
    interest: round(totalInterest),
    payoffKey: stuck ? null : shiftMonth(startKey || '2026-11', months),
    perDebt: perDebt.map((p) => ({ id: p.id, name: p.name, months: p.months, interest: round(p.interest) })),
    order,
  };
}

// Run both methods on the same debts and the same extra payment, and
// name the winner: the method with the lower total interest, with the
// months and dollars it wins by. When the two orders agree — the
// smallest debt also carries the highest APR — both methods are the
// same plan and the verdict says so plainly.
export function comparePayoff(debts, extra, startKey) {
  const avalanche = simulatePayoff(debts, extra, 'avalanche', startKey);
  const snowball = simulatePayoff(debts, extra, 'snowball', startKey);
  const round = (n) => Math.round(n * 100) / 100;
  const interestGap = round(Math.abs(avalanche.interest - snowball.interest));
  const monthsGap = avalanche.months > 0 && snowball.months > 0 ? Math.abs(avalanche.months - snowball.months) : 0;
  let winner = 'tie';
  if (avalanche.interest < snowball.interest - 0.005) winner = 'avalanche';
  else if (snowball.interest < avalanche.interest - 0.005) winner = 'snowball';
  return { avalanche, snowball, winner, interestGap, monthsGap };
}

// A one-line plain-language verdict for the comparison card.
export function compareVerdict(cmp) {
  const a = cmp.avalanche;
  const s = cmp.snowball;
  if (cmp.winner === 'tie') {
    return 'Both methods are the same plan for this household — the smallest debt also carries the highest APR, so the payoff order, the debt-free date and the interest are identical either way. Pick the name you like better and stick with it.';
  }
  if (cmp.winner === 'avalanche') {
    return 'Avalanche wins for this household: it clears everything in ' + a.months + ' months for ' + '$' + a.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' of interest, against ' + s.months + ' months and ' + '$' + s.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' for snowball — saving ' + '$' + cmp.interestGap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' of interest' + (cmp.monthsGap ? ' and finishing ' + cmp.monthsGap + ' month' + (cmp.monthsGap === 1 ? '' : 's') + ' sooner' : '') + '. Snowball still has one thing going for it: its first debt clears sooner, which keeps some households going — if motivation matters more than the ' + '$' + cmp.interestGap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ', snowball is the honest pick.';
  }
  return 'Snowball wins for this household: it clears everything in ' + s.months + ' months for ' + '$' + s.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' of interest, against ' + a.months + ' months and ' + '$' + a.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' for avalanche — saving ' + '$' + cmp.interestGap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' of interest' + (cmp.monthsGap ? ' and finishing ' + cmp.monthsGap + ' month' + (cmp.monthsGap === 1 ? '' : 's') + ' sooner' : '') + '. That is unusual — avalanche is normally the cheapest — and it happens here because the smallest balance carries a low APR, so snowball frees its minimum payment sooner.';
}

export function payoffMonthLabel(key) {
  return key ? monthLabel(key) : '—';
}
