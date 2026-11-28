# Hearth & Home Budget

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![live](https://img.shields.io/badge/live-on_make.fun-green)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![license](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)

A household budget site that runs entirely offline from static files — no
account, no server, nothing leaves your browser. Built for the make.fun
**"Make the best household budget site"** bounty ($50, top 10 share).

## What it does

- **Dashboard** — income, spending, savings rate and "safe to spend" for the
  month at a glance, with a spending-by-category donut chart, budget-vs-actual
  bars, recent transactions and savings-goal progress — plus a bills-due-soon
  strip, a year-so-far strip and per-person pocket-money allowances.
- **Transactions** — add, edit and delete income and expenses; search and
  filter by category and type; switch months to see any month's figures.
- **Budgets** — a monthly limit per category with live progress bars and
  over-budget / almost-there alerts; limits save as you type. Every
  category also carries a six-month spending sparkline against its
  six-month average, so a one-off spike reads differently from a habit.
- **Bills & recurring** — every regular bill with its due date and a paid
  toggle (paid / overdue / due-in-days), an upcoming-month total, and
  recurring rules that post one real transaction into the current month
  ("Post now" per rule, "Post all due" for the month) — never twice.
  Pocket-money allowances per person, with spending counted from their own
  tagged transactions. A bill calendar lays the whole month out as a grid,
  one pressable chip per bill on its due day — press a chip to mark that
  bill paid.
- **Subscription audit** — thirteen subscriptions, $204.93 a month
  ($2,459.20 a year), each judged on one question: when did anyone
  last use it? Used in the last 30 days is **Keep**; 31–60 days is
  **Downgrade** to a cheaper tier (half price); over 60 days is
  **Cancel**. Duolingo Plus (63 days) and National Geographic (79
  days) are flagged to cancel — $239.76 a year; Google One, Xbox Game
  Pass and Audible are flagged to downgrade — another $251.58 a year,
  **$491.34 a year in total**. Every verdict is a working control:
  cancel moves a subscription to the Cancelled list and drops the
  monthly total at once (Restore brings it straight back), downgrade
  halves its price, “I used it — keep” flips a wrong verdict, “Cancel
  the flagged now” cancels all of them in one press, and the add form
  judges a new subscription on its last-used date the moment it lands.
  A category split shows where the money goes (Streaming is the
  biggest slice), and the Dashboard shows the audit at a glance. Bills
  tells you when a payment is due; this page tells you whether the
  payment should exist at all.
- **Household members** — one page per person (Maya, Daniel, Sofia, Liam):
  their monthly allowance, what they have spent from tagged transactions,
  what is left, their biggest spend this month and a six-month spending
  sparkline. Open a person's page for an allowance-vs-spending chart, a
  six-month allowance history table and their own transactions for the
  month — plus "Add spending", which opens the transaction form already
  tagged to them. Add a member (name, role, allowance) and they get a page
  of their own; remove one and their tagged transactions stay on record.
  Every transaction now has a "Spent by" picker — leave it on Household
  (shared) for rent, bills and the weekly shop. **Bank the unspent
  allowance:** what a person did not spend — Sofia has $0.50 left in
  November and $125.50 unspent across six months — can be banked into
  the Emergency fund goal with one press; a month can only be banked
  once, and the Goals page shows the banked money at once.
- **Groceries & meals** — a weekly dinner plan for four (two rotating
  weeks; edit any dish or its cost and the week total updates), a priced
  grocery list with a running total checked against the weekly grocery
  budget, and pantry staples with one-press “Add to list” restocking.
  Tick items off in the store, then “Buy this list” posts the shop as one
  real groceries transaction into the current month — never twice. A
  **staple price history** tracks eight weekly staples (milk, eggs, bread,
  chicken, beef mince, cheddar, butter, salmon) across September →
  November 2026 with the cheapest store for each — the November price is
  the one on the grocery list, so table and list always agree; “Add at $…”
  puts any staple on the list at this month’s price. The eight-staple
  basket costs $65.85 in November, up $3.75 (+6.0%) since September.
- **Cash envelopes** — the month’s money in six envelopes (Groceries,
  Dining out, Transport, Kids & school, Fun & family, Household), each
  filled at payday from the household’s own budgets. Every expense draws
  its envelope down; last month’s unspent budget **rolls into next month’s
  fill automatically** — October’s unspent $647.20 is already sitting in
  November’s envelopes, and December opens with $2,476.61. Fill any
  envelope by typing a new amount, **move cash between envelopes** (only
  unspent cash can move, so an envelope can never go below what it spent),
  switch rollover on or off per envelope, reset a month’s fills to budgets
  plus rollovers, and press any envelope to see exactly which purchases
  spent it this month — with “Add spending” opening the transaction form
  already tagged to that envelope. The Dashboard shows the envelopes at a
  glance: filled, spent, left, and next month’s opening total.
- **Savings goals** — goals with progress rings, target dates and one-click
  $100 contributions; add, edit and delete goals. Every goal shows its
  next milestone (25 / 50 / 75 / 100%) and roughly how many months at
  $100 a month stand between you and it.
- **Savings challenges** — three challenges that turn small change into real
  savings, all tied to the household's own figures: the **52-week
  challenge** (growing $1→$52, reverse $52→$1, or flat $10 a week — $1,378
  or $520 by week 52; press any week to mark it paid, with a progress ring
  and a "Pay week N" button), **no-spend days** (mark the days you spent
  nothing on a month calendar — streak, days kept and roughly what they were
  worth, from the household's own daily variable spending), and the
  **round-up pot** (every expense rounded up to the next whole dollar,
  listed purchase by purchase; sweep once a month into the pot, then move
  the pot into the emergency-fund goal with one press — never twice in a
  month). The Dashboard shows all three at a glance.
- **Annual overview** — the whole year in one place: 12-month income vs
  spending bars, year-to-date totals and savings rate, best and worst months,
  biggest categories of the year, and a plan for next year (including the
  three-months-of-spending emergency-fund target). Press any month in the
  table to open its drill-down — top categories and biggest single spends
  for that month.
- **Insights** — six-month income-vs-spending trend chart, biggest spending
  categories, a six-month savings-rate chart against the 20% rule of
  thumb, month-over-month comparison and plain-language tips written
  from your own figures (savings rate, biggest jump, grocery average).
- **Reports** — a printable monthly summary (income, spending vs budget,
  bills paid, goals) and a debt-payoff planner using the avalanche method:
  edit any balance, APR or minimum, set an extra monthly payment, and see
  the debt-free date, total interest and what the extra payment saves.
- **CSV export** — download every transaction as a spreadsheet file.
- **Your data stays yours** — everything is saved in `localStorage` on your
  own device. Sample data for the Hartono family (two incomes, two kids) is
  pre-loaded so every feature works on first open; reset it any time. Older
  v1/v2/v3/v4/v5/v6 saves are migrated automatically — bills, rules,
  allowances, debts, grocery list, pantry, challenges, cash envelopes and
  now subscriptions and banked allowances are added without losing your
  transactions.

## Tech

- Static files under `app/` — `index.html`, `style.css`, and ES modules
  split by job: `data.js` (categories, sample data, month maths, storage,
  cash-envelope maths), `charts.js` (hand-drawn canvas donut / bars / trend),
  `views.js` (dashboard, transactions, budgets, goals, insights), `main.js`
  (routing, dialogs, CRUD, export). The eight newer sections are one-job
  files loaded only when opened, so they stay out of the first load:
  `bills.js` (bills, recurring rules, allowances, bill calendar),
  `annual.js` (year overview), `reports.js` (printable summary, debt-payoff
  planner), `grocery.js` (meal plan, grocery list, pantry, staple price
  history), `members.js` (household members — one page per person, allowance
  history, tagged spending, banking unspent allowances), `savings.js` (savings challenges — 52-week,
  no-spend days, round-up pot), `envelopes.js` (cash envelopes — fills,
  rollovers, transfers, per-envelope spending), `subscriptions.js`
  (subscription audit — keep / downgrade / cancel verdicts, totals and
  savings, add / cancel / restore / downgrade). `favicon.ico` is a hand-drawn
  16×16 house icon, served locally like everything else.
- Zero network requests at runtime: no CDN, no web fonts, no tracking.
  Charts are drawn with plain Canvas 2D; icons are text glyphs.
- Responsive: desktop layout and a phone layout (390 px).

## Run it locally

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Then open `http://localhost:8080` in a desktop browser, and resize (or use
a phone viewport) to see the mobile layout.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts` library.

## Screenshots

- `screenshots/1-dashboard.png` — Dashboard, incl. the envelopes and subscription-audit strips (desktop, 1280×800)
- `screenshots/2-subscriptions.png` — Subscription audit: verdicts, yearly savings, cancel-the-flagged control (desktop, 1280×800)
- `screenshots/3-envelopes.png` — Cash envelopes: six envelopes, move-cash control, December preview (desktop, 1280×800)
- `screenshots/4-members-phone.png` — Sofia's member page, with the bank-the-unspent-allowance card, on a phone (390×844)

## License

MIT — see [LICENSE](LICENSE).
