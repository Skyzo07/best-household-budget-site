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
  over-budget / almost-there alerts; limits save as you type.
- **Bills & recurring** — every regular bill with its due date and a paid
  toggle (paid / overdue / due-in-days), an upcoming-month total, and
  recurring rules that post one real transaction into the current month
  ("Post now" per rule, "Post all due" for the month) — never twice.
  Pocket-money allowances per person, with spending counted from their own
  tagged transactions.
- **Savings goals** — goals with progress rings, target dates and one-click
  $100 contributions; add, edit and delete goals.
- **Annual overview** — the whole year in one place: 12-month income vs
  spending bars, year-to-date totals and savings rate, best and worst months,
  biggest categories of the year, and a plan for next year (including the
  three-months-of-spending emergency-fund target).
- **Insights** — six-month income-vs-spending trend chart, biggest spending
  categories, month-over-month comparison and plain-language tips written
  from your own figures (savings rate, biggest jump, grocery average).
- **Reports** — a printable monthly summary (income, spending vs budget,
  bills paid, goals) and a debt-payoff planner using the avalanche method:
  edit any balance, APR or minimum, set an extra monthly payment, and see
  the debt-free date, total interest and what the extra payment saves.
- **CSV export** — download every transaction as a spreadsheet file.
- **Your data stays yours** — everything is saved in `localStorage` on your
  own device. Sample data for the Hartono family (two incomes, two kids) is
  pre-loaded so every feature works on first open; reset it any time. Older
  v1 saves are migrated automatically — bills, rules, allowances and debts
  are added without losing your transactions.

## Tech

- Static files under `app/` — `index.html`, `style.css`, and ES modules
  split by job: `data.js` (categories, sample data, month maths, storage),
  `charts.js` (hand-drawn canvas donut / bars / trend), `views.js`
  (dashboard, transactions, budgets, goals, insights), `main.js` (routing,
  dialogs, CRUD, export). The three new sections are one-job files loaded
  only when opened, so they stay out of the first load: `bills.js` (bills,
  recurring rules, allowances), `annual.js` (year overview), `reports.js`
  (printable summary, debt-payoff planner). `favicon.ico` is a hand-drawn
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
- `screenshots/2-budgets.png` — Budgets (desktop, 1280×800)
- `screenshots/3-bills.png` — Bills & recurring (desktop, 1280×800)
- `screenshots/4-insights-phone.png` — Insights (phone, 390×844)

## License

MIT — see [LICENSE](LICENSE).
