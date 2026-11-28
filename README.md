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
- **Household members** — one page per person (Maya, Daniel, Sofia, Liam):
  their monthly allowance, what they have spent from tagged transactions,
  what is left, their biggest spend this month and a six-month spending
  sparkline. Open a person's page for an allowance-vs-spending chart, a
  six-month allowance history table and their own transactions for the
  month — plus "Add spending", which opens the transaction form already
  tagged to them. Add a member (name, role, allowance) and they get a page
  of their own; remove one and their tagged transactions stay on record.
  Every transaction now has a "Spent by" picker — leave it on Household
  (shared) for rent, bills and the weekly shop.
- **Groceries & meals** — a weekly dinner plan for four (two rotating
  weeks; edit any dish or its cost and the week total updates), a priced
  grocery list with a running total checked against the weekly grocery
  budget, and pantry staples with one-press “Add to list” restocking.
  Tick items off in the store, then “Buy this list” posts the shop as one
  real groceries transaction into the current month — never twice.
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
  v1/v2/v3 saves are migrated automatically — bills, rules, allowances, debts,
  grocery list and pantry are added without losing your transactions.

## Tech

- Static files under `app/` — `index.html`, `style.css`, and ES modules
  split by job: `data.js` (categories, sample data, month maths, storage),
  `charts.js` (hand-drawn canvas donut / bars / trend), `views.js`
  (dashboard, transactions, budgets, goals, insights), `main.js` (routing,
  dialogs, CRUD, export). The five newer sections are one-job files loaded
  only when opened, so they stay out of the first load: `bills.js` (bills,
  recurring rules, allowances, bill calendar), `annual.js` (year overview), `reports.js`
  (printable summary, debt-payoff planner), `grocery.js` (meal plan,
  grocery list, pantry), `members.js` (household members — one page per
  person, allowance history, tagged spending), `savings.js` (savings
  challenges — 52-week, no-spend days, round-up pot). `favicon.ico` is a hand-drawn
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

- `screenshots/1-dashboard.png` — Dashboard (desktop, 1280×800)
- `screenshots/2-savings.png` — Savings challenges: 52-week grid, no-spend calendar, round-up pot (desktop, 1280×800)
- `screenshots/3-annual.png` — Annual overview, with a month drill-down open (desktop, 1280×800)
- `screenshots/4-savings-phone.png` — Savings challenges on a phone (390×844)

## License

MIT — see [LICENSE](LICENSE).
