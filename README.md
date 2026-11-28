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
  **Filter by who spent it** — Everyone, Household (shared), or one person
  (Maya, Daniel, Sofia, Liam) — and the page adds the filtered list up
  underneath: Sofia's November is 1 transaction, $24.50 spent; the shared
  household is 20 transactions, $2,969.74 spent; search "groceries" still
  narrows to the 4 weekly shops.
- **Budgets** — a monthly limit per category with live progress bars and
  over-budget / almost-there alerts; limits save as you type. Every
  category also carries a six-month spending sparkline against its
  six-month average, so a one-off spike reads differently from a habit.
- **Year in review** — the household's 2026 told back as a story from
  its own figures: saved $30,177.76 in 11 months (48.3% of income),
  best month February ($2,857.00 saved), tightest July ($2,660.00),
  biggest single purchase School uniforms ($210.00, 16 September),
  top categories Housing $15,950.00 / Groceries $6,861.85 / Transport
  $2,692.00, and **11 of 11 months inside the $3,800.00 plan** — with
  the slack named honestly ($861.61 a month of headroom on average).
  Then three **2027 targets** the household sets itself — save every
  month, groceries a month, dining out a month — each one measured
  live against the pace it actually kept (saving $2,743.43 a month,
  groceries $639.31, dining $142.66 over the last six months), with
  "on track" or "behind by $X a month" and what hitting the target
  frees in a year. "Tighten all three by 5% from this year's pace"
  sets a stretch that is still reachable because it is measured from
  what the household already does; "Back to this year's pace" clears
  the targets. Add a transaction anywhere — a $500 grocery shop makes
  it the biggest single purchase at once — and the whole story moves.
  The Dashboard shows the year at a glance with the saving target
  and the pace beside it.
- **What-if planner** — try a change before you make it, and see what it
  does to the whole household. Three levers, all from the household's own
  figures: **trim a category** (dining out, groceries, fun & family — the
  ones a habit can actually move), **save extra each month into a goal of
  your choice**, and **pay extra off the debts**. The page recomputes live,
  side by side against the current plan: next month ends at **$2,707.00**
  instead of $2,657.00, the net-worth pace rises to **$2,843.43 a month**
  ($34,121.16 a year), the debts clear in **September 2029** — 6 months
  sooner, **$207.25 less interest** — and the $25,000 net-worth target
  lands in January 2027, the same month as the current plan (the target
  is only 2 months out, so the page says so plainly instead of inventing
  a sooner date). The emergency fund still needs $1,650.00 — at $100
  extra a month it fills in **April 2028, 17 months**, counting only the
  extra. Pick a named plan in one press — **Debt-first** ($150 of cuts,
  $200 extra to the debts: month-end $2,607.00), **Save-first**, or
  **Tighten everything** — then change any box by hand. **Apply this
  plan** writes the levers into the real plan: budgets fall (dining
  $240.00 → $190.00, groceries $620.00 → $590.00, fun $200.00 →
  $180.00), the payoff planner's extra rises $50.00 → $100.00 and the
  forecast's extra saving rises to $100.00 — and **Undo** puts every
  figure back exactly. A final card explains the maths and what it
  leaves out, honestly: the trend is a straight line through six months,
  the debts are held at their current balance, and the goal date counts
  only the extra saving.
- **Weekly check-in (v13)** — five minutes, once a week, with the
  household's own figures. The month is split into weeks (1–7, 8–14,
  15–21, 22–28, 29–end) and each flexible category is measured against
  its weekly share of the monthly budget — the budget divided by 4.33,
  the average weeks in a month — so a $620 grocery budget is $143.19
  a week and a $240 dining budget is $55.43. Week 2 of November is the
  week that shows it best: flexible spending $768.54 against a $482.68
  weekly share — over by $285.86, with groceries $290.30 against
  $143.19, school costs $185.00 against $64.67, shopping $89.99 against
  $34.64 and dining $90.75 against $55.43. Rent and utilities are shown separately and never
  judged against a weekly share, because they land once a month — the
  page says so in plain words instead of calling week 1 "over" every
  month. Then **one job for next week**, picked from a short list the
  flagged categories suggest ("One big shop, no top-ups" when groceries
  go over, "Cook at home 5 nights" when dining does), plus an optional
  one-line note — saved in this browser, and the **check-in history**
  below keeps every week you have checked in, each row with its own
  figures recomputed live from Transactions. Week 1 is already there
  as the sample: checked in 8 November, "Cook at home 5 nights" —
  and it was kept, dining $46.80 against a $55.43 share. Re-saving a
  week updates it, never doubles it; Remove takes it out of the history.
- **Net worth** — what the household owns minus what it owes, worked out
  live from its own records and nothing else: the cash it kept, month by
  month (income minus spending, January to November: **$30,177.76**),
  minus the three debts at their current balance (**$10,100.00**), for a
  net worth of **$20,077.76**. The page shows where the kept cash sits —
  unassigned in the main account $21,225.35, savings goals $7,480.00,
  cash in envelopes $1,213.81, 52-week challenge $210.00, round-up pot
  $48.60 — and the debts one by one (the car loan is 83% of everything
  owed). A month-by-month chart across a zero line tells the story:
  net worth started January $7,438.00 under water and **turned positive
  in April 2026**, the fourth month. An **editable net-worth target**
  (default: the next $5,000 milestone, $25,000) is measured against the
  pace actually kept ($2,743.43 a month) with the month it lands on —
  January 2027, 2 months from now; type $30,000 and it moves to March
  2027. "Aim for $25,000" sets the target in one press, "Back to the
  next milestone" clears it. Add a $500 grocery shop anywhere and net
  worth falls $500 at once, to $19,577.76. The Dashboard carries the
  net worth at a glance, with the target date beside it. The page says
  plainly what it does not count — the car, the furniture, the house —
  because the app holds no values for them: this is the cash net worth,
  the number the budget can actually move.
- **Bills & recurring** — every regular bill with its due date and a paid
  toggle (paid / overdue / due-in-days), an upcoming-month total, and
  recurring rules that post one real transaction into the current month
  ("Post now" per rule, "Post all due" for the month) — never twice.
  Pocket-money allowances per person, with spending counted from their own
  tagged transactions. A bill calendar lays the whole month out as a grid,
  one pressable chip per bill on its due day — press a chip to mark that
  bill paid. **Year at a glance:** a twelve-month grid under the calendar —
  green is every bill paid, gold still has money to pay, grey is not
  tracked (bill records start in September 2026) or not yet due —
  and every cell is a button that jumps the month switcher straight to
  that month. Across the three tracked months so far: $6,748.77 due,
  $5,601.18 paid, with September the month to finish first ($799.59
  still to pay).
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
  November and $125.50 unspent across six months — can be banked into a
  goal **of their choice** (pick Emergency fund, the holiday or the car
  deposit in the picker) with one press; a month can only be banked
  once, and the Goals page shows the banked money at once. A new
  **savings-progress card** on each person's page shows every goal with
  their own banked share of it — Sofia banking her $0.50 into the holiday
  moves it from $980.00 to $980.50 and the card says so — so a kid can see
  their own money moving a goal, not just the household total.
  **Personal savings challenges (v12):** one target per person, filled
  only by banking unspent allowance — the banked record *is* the
  progress, so the bar can never disagree with the money. Sofia's
  **New bike, $100.00** (nothing banked yet, $100.00 to go — at her usual
  $20.92 a month left unspent, about 5 months); Maya's **Christmas
  presents, $300.00**; Daniel's **Fishing gear, $200.00**; Liam's
  **LEGO set, $60.00**. Bank Sofia's $0.50 unspent from November and the
  bar moves at once to $0.50 of $100.00, 1% — and the overview card shows
  it too. Edit any target on the person's page and it saves as you type.
- **Forecast** — next month, worked out from the household's own
  six-month history, not typed in: a projection for every budgeted
  category with a confidence note from how jumpy its last six months
  were (steady months are worth trusting, wild ones are a rough guide
  only), a projected month-end balance, a keep-this-pace yearly saving
  for 2027, and the date the emergency fund reaches its target at that
  pace. Switch the method — **Trend** (a line fitted through six
  months, read one month ahead), **6-month average**, or **Budget
  plan** (what the month costs if every limit is spent in full) — and
  every figure recomputes; type an extra monthly saving and the
  fund date and the yearly pace move at once. The biggest riser — the
  category whose projection sits furthest above its own average — is
  called out in plain words. Add a transaction anywhere and the
  forecast moves with it. The Dashboard shows next month at a glance.
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
  **Plan next week from the pantry:** one press writes seven dinners
  built from cupboard staples (bean chilli, lentil curry, pasta bake,
  pizza night, salmon, roast chicken…) into next week’s plan, shows
  the week total, and offers the missing ingredients on the list at
  their usual prices — nothing is bought twice.
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
  **Drill into a category (v13):** press any category button and the
  page opens it up close — six months of bars (groceries ran $598.00
  in June, $690.05 in October, $619.35 in November against a $620
  budget) and this month's five biggest spends in it, biggest first
  (the weekly shops: $186.30, $168.90, $142.75, $121.40), with this
  month against its six-month average and its budget in one line.
  Close puts the drill card away again.
- **Reports** — a printable monthly summary (income, spending vs budget,
  bills paid, goals) and a debt-payoff planner: edit any balance, APR or
  minimum, set an extra monthly payment, and see the debt-free date, total
  interest and what the extra payment saves. **Snowball vs avalanche:**
  the same three debts ($10,100.00 owed, $270.00 of minimums a month)
  are run through both payoff orders side by side — avalanche (highest
  APR first: credit card → store card → car loan) clears everything in
  40 months for $1,238.76 of interest, debt-free March 2030; snowball
  (smallest balance first: store card → credit card → car loan) takes 41
  months and $1,316.02, debt-free April 2030 — so the page recommends
  avalanche for this household, saving $77.26 of interest and finishing
  one month sooner, while saying plainly that snowball's quicker first
  win is the honest pick if motivation matters more than the $77.26.
  Pick the method for the plan itself (Avalanche / Snowball buttons),
  raise the extra payment to $100 and both totals fall at once
  (avalanche 34 months / $1,031.51, snowball 35 months / $1,078.23), edit
  a debt's APR and watch the orders — and the recommendation — change,
  or add a debt and see the comparison recompute from your own figures.
- **CSV export** — download every transaction as a spreadsheet file.
- **Your data stays yours** — everything is saved in `localStorage` on your
  own device. Sample data for the Hartono family (two incomes, two kids) is
  pre-loaded so every feature works on first open; reset it any time. Older
  v1/v2/v3/v4/v5/v6 saves are migrated automatically — bills, rules,
  allowances, debts, grocery list, pantry, challenges, cash envelopes and
  now subscriptions and banked allowances are added without losing your
  transactions. v8 adds the payoff method and a third sample debt (a
  store card) and records banked allowances with their destination goal,
  so older saves migrate in place too. v9 adds the forecast settings
  (method + extra saving) and the pantry auto-plan, both defaulted for
  older saves. v10 adds the 2027 targets (save / groceries / dining),
  defaulted to this year's own pace for older saves. v11 adds the
  net-worth target, defaulted to the next $5,000 milestone. v12 adds the
  what-if planner settings and one personal savings challenge per member,
  both defaulted for older saves. v13 adds the weekly check-in history
  (one sample check-in from week 1 of November), defaulted for older saves.

## Tech

- Static files under `app/` — `index.html`, `style.css`, and ES modules
  split by job: `data.js` (categories, sample data, month maths, storage,
  cash-envelope maths), `charts.js` (hand-drawn canvas donut / bars / trend),
  `views.js` (dashboard, transactions, budgets, goals, insights), `main.js`
  (routing, dialogs, CRUD, export). The thirteen newer sections are one-job
  files loaded only when opened, so they stay out of the first load:
  `bills.js` (bills, recurring rules, allowances, bill calendar, year-at-a-
  glance bill grid), `annual.js` (year overview), `reports.js` (printable
  summary, debt-payoff planner), `debt.js` (snowball vs avalanche simulation
  and comparison), `grocery.js` (meal plan, grocery list, pantry, staple price
  history), `members.js` (household members — one page per person, allowance
  history, tagged spending, banking unspent allowances into a chosen goal,
  per-member savings progress, personal savings challenges), `savings.js` (savings challenges — 52-week,
  no-spend days, round-up pot), `envelopes.js` (cash envelopes — fills,
  rollovers, transfers, per-envelope spending), `subscriptions.js`
  (subscription audit — keep / downgrade / cancel verdicts, totals and
  savings, add / cancel / restore / downgrade), `forecast.js` (spending
  forecast — per-category projections from the six-month trend, confidence
  notes, projected month-end, yearly pace, emergency-fund date),
  `review.js` (year in review — best/tightest months, biggest single
  purchase, top categories, months inside budget, editable 2027 targets
  measured against this year's pace), `networth.js` (net worth — what the
  household owns minus what it owes, where the kept cash sits, month-by-month
  trend across a zero line, editable net-worth target), `whatif.js`
  (what-if planner — trim a category, save extra into a chosen goal, pay
  extra off the debts; live side-by-side against the current plan with
  presets, Apply that writes into the budgets / payoff planner / forecast,
  and Undo), `checkin.js` (weekly check-in — this week's flexible
  spending against its weekly share of each monthly budget, fixed costs
  shown but not judged, one action for next week from the flagged
  categories, saved check-in history). `favicon.ico` is a hand-drawn
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

- `screenshots/1-dashboard.png` — Dashboard, incl. the envelopes and subscription-audit strips, the next-month forecast strip, the 2026-in-review strip and the new net-worth strip (desktop, 1280×800)
- `screenshots/2-checkin.png` — Weekly check-in, week 2 of November: flexible spending $768.54 vs a $482.68 weekly share, groceries / kids / shopping / dining over, and the one job for next week (desktop, 1280×800)
- `screenshots/3-whatif.png` — What-if planner: month-end $2,707.00, net-worth pace $2,843.43 a month, debt-free September 2029, and the trim table (desktop, 1280×800)
- `screenshots/4-savings-phone.png` — Savings challenges on a phone (390×844): 52-week challenge, no-spend days and the round-up pot

## License

MIT — see [LICENSE](LICENSE).
