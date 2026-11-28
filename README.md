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
- **Big purchases (v14)** — the things the household knows are coming,
  planned before they arrive instead of paid for on a credit card
  afterwards: school fees $540.00 due 31 January 2027 ($300.00 already
  set aside), a car service + new tyres $620.00 due 15 February
  ($180.00 set aside), a new washing machine $850.00 due 31 March
  ($240.00 set aside) and a new sofa $1,400.00 due 31 August ($150.00
  set aside). The page works the plan out live from the household's own
  saving pace — income minus spending, averaged over the last three
  months: **$2,736.59 a month** (November saved $2,791.51, October
  $2,710.65, September $2,707.60). Each purchase's monthly set-aside is
  what is still to save divided by the months until its target date —
  $80.00, $110.00, $122.00 and $125.00 a month, **$437.00 between them**
  — and the pace is handed out by earliest target first, so the urgent
  things are funded before the ones that can wait. All four are ready
  by their target dates, with **$2,299.59 a month of pace still free**
  for the savings goals and the debts. **+ $25 / + $50** moves money
  into any pot and the ready date moves at once; the **add form** plans
  a new purchase (name, cost, target date, already set aside) and can
  link it to a savings goal, so its pot follows the goal's balance live
  — add $25 here and the goal moves too. Remove takes a purchase out of
  the plan. A purchase whose monthly need is bigger than the pace left
  for it slips, and the ready month says by how far.
- **Streaks & wins (v15)** — the household's money habits told back as
  streaks, every figure computed live from its own records. **Months
  inside the budget: 11 in a row** — every month of 2026 came in under
  the $3,800.00 plan, tightest October ($3,089.35, $710.65 of headroom),
  cheapest February ($2,793.00) — with a month-by-month chart and a dot
  per month. **No-spend streak: 8 days** with nothing spent at all,
  counted from Transactions (last spending 20 November), 10 quiet days
  in November so far, shown on a day-by-day calendar that also marks the
  6 days the household logged on the no-spend calendar — and **Mark today
  a no-spend day** marks it for real. **52-week challenge: 20 weeks in a
  row** paid, $210.00 of $1,378.00, with **Pay week 21 ($21.00)** paying
  the next deposit for real. **Everyone's challenges: $210.00 banked of
  $660.00** in targets — Maya $145.00 of $300.00 for Christmas presents
  (48%), Daniel $40.00 of $200.00 for fishing gear, Sofia $15.00 of
  $100.00 for a new bike, Liam $10.00 of $60.00 for a LEGO set — each
  with a link to that person's page, where the banking happens. Every
  streak shows its current count, its best, **what keeps it alive** and
  **what breaks it** (one month over $3,800 resets the budget run to
  zero; any spending at all ends the no-spend run; a missed week breaks
  the 52-week run). Then **milestones already reached** — net worth
  turned positive in April 2026, the emergency fund past halfway at
  $4,350.00 of $6,000.00, 11 months inside the budget, 20 weeks paid,
  a full week without spending — and the next ones in line, with what
  is still to go (emergency fund to 75% needs $150.00; net worth to
  $25,000.00 needs $4,922.24, landing January 2027 at the pace kept).
  The subscription audit's $491.34 a year is named as one more win on
  the table, with a link to the audit.
- **Next month (v18)** — a plan for December 2026 written from November's
  own figures, and nothing else. **Suggested budgets:** eight categories
  trimmed to what the month actually used (transport $320.00 → $140.00,
  dining $240.00 → $140.00, utilities $260.00 → $200.00, health, fun,
  kids, shopping, other), two kept (housing $1,450.00, groceries $620.00
  — 65 cents of slack, so it stays), none raised — planned spending
  $3,090.00 against $3,800.00 now, **$710.00 of budget freed**, projected
  saving **$2,760.00 (47.2% of the $5,850.00 coming in)**. **Envelope
  fills for December:** each envelope's suggested budgets plus whatever
  rolled over unspent — transport $326.00 ($186.00 rolled over, the
  biggest), dining $242.45, groceries $620.65 — **$1,926.61 of cash in
  envelopes** on the 1st. **Bills due:** all ten, $2,249.59, with
  $1,934.60 on auto-pay and $314.99 to pay by hand. **Coming up:** the
  school fees are nearest (31 January 2027, $240.00 to go, $80.00 a
  month) and the four big purchases need $437.00 a month between them;
  the 52-week challenge's week 21 ($21.00) and the money meeting on
  Dec 6, 2026 are on the calendar too. **Auto-save runs scheduled:**
  $230.00 moves on payday, Dec 1 ($100.00 emergency fund, $80.00
  washing machine, $50.00 car deposit) and the round-ups sweep on
  Dec 31 (November's round-ups so far: $5.51). **Adopt this plan**
  writes the suggested budgets into Budgets and the suggested fills into
  Envelopes for December — the pages already show it — and **Undo**
  puts the old budgets and fills back exactly; adopting twice does
  nothing the second time. The year line is honest about what the plan
  is worth: twelve months of it puts away $33,120.00, against the
  $30,177.76 actually saved in the first eleven months of 2026, and
  the emergency fund ($4,350.00 of $6,000.00) reaches its target in
  about 17 months at the payday pace alone.
- **House rules (v19)** — the seven rules the Hartono household agreed,
  and whether November actually kept them — each one checked live
  against the month's own records, never typed in by hand. **5 of 7
  kept:** "Save $100 on payday" ($100.00 moved by auto-save on Nov 1),
  "Groceries under $620" ($619.35 — $0.65 of slack), "Dining under
  $240" ($137.55), "One no-spend day a week" (6 days marked), "Save at
  least 40% of income" ($2,791.51 of $5,850.00 — 47.7%). **2 broken,
  and the page says what they cost:** "No takeaway over $40 without
  talking" — two dinners broke it (Family dinner out $46.80, Lunch
  with friends $52.25, $19.05 over the line) — and "No subscription
  unused for 60 days" — Duolingo Plus (61 days untouched) and National
  Geographic (77 days), $19.98 a month sitting idle — **$39.03 a month
  between them**. Every broken rule names what to do and links to the
  page that fixes it (the takeaway rule to the money meeting, the
  subscriptions to the audit). **Add a rule** that works: pick the kind
  (spending cap, save rate, no-spend days, takeaway limit, payday
  saving, unused subscriptions), give it a number, and the page starts
  checking it from the next render — "Fun under $150" lands as kept
  ($118.00 in November); a rule with no name, no number, or a save
  rate over 100% is refused with the reason on screen. Delete takes a
  rule off the board.
- **Where we shop (v20)** — every dollar of the month grouped by the
  shop or payee it went to, read off the transactions themselves, so
  the figures always agree with the Transactions page. November's
  $3,058.49 of spending lands at **17 shops and payees**: the landlord
  Maple Court Lettings is biggest ($1,450.00 of rent, one payment),
  then the shops — **SuperMart $476.60 across 3 trips** (the weekly
  shops of $186.30, $168.90 and $121.40), Market Hall $142.75 (the one
  market trip), The Family Table $46.80, Corner Café $52.25, Pizza
  Corner $38.50, Riverside Cinema $64.00, Toybox $54.00, Petro Stop
  $96.00, City Transit $38.00, High Street Outfitters $89.99,
  Riverside School $185.00, School Canteen $24.50, HealthPoint
  Pharmacy $74.50, Snip & Clip Barbers $35.00, City Power $132.40 and
  City Water $58.20. Every shop card shows its trips, its average
  trip, its share of the month, its biggest single spend, what it cost
  last month (SuperMart is down $213.45 on October's $690.05) and its
  category split — and **Show the purchases** opens the month's
  receipts there, one by one. Sort by most spent, most trips or A–Z.
  Then the grocery switch: the eight staples with the shop that has
  each one cheapest (milk, chicken and cheddar at Market Hall, salmon
  at the Fish Market, bread at Bakery Corner, eggs, beef mince and
  butter at SuperMart) and what moving the staples away from the
  household's usual shop is roughly worth — **$7.89 a month** against
  SuperMart, the same rough 4% rate the Groceries page measures, with
  the page saying plainly that it is an estimate. Pick another usual
  shop (Market Hall, Bakery Corner or the Fish Market) and the
  estimate re-measures at once — against Market Hall it is $7.00 a
  month. "Add at $…" puts any staple on the grocery list at this
  month's price, the same button the Groceries page uses. The shop
  for a transaction comes from its own words — the note on the weekly
  shop, the description otherwise — so edit a description on the
  Transactions page and the shop moves.
- **Money calendar (v22)** — the whole month on one page, every money
  event plotted on the day it lands, every figure computed live from
  the household's own records. **December 2026: $5,850.00 planned in**
  (payday Dec 1: Maya $4,200.00 + Daniel $1,450.00, market stall Dec 14
  $200.00) against **$3,621.37 planned out** — the ten bills
  ($2,249.59, rent Dec 1 to home insurance Dec 25), the month's debt
  payment ($390.37 on Dec 1, from the Debt-free calendar's own
  schedule), the auto-save runs ($230.00 on Dec 1, round-ups Dec 31),
  the big purchases' monthly set-asides ($558.06) and the subscription
  renewals ($193.35) — **$2,228.63 left over on the plan**, and **Dec 1
  is the busiest day** ($2,628.43 going out on the one day). Press any
  day to open it: the meeting on Dec 6, the no-spend days, every
  subscription renewing on the day of the month it was last used —
  and the open day's detail does the work, with **Mark paid** on a
  bill (pay the rent from Dec 1 and the bills still to pay fall from
  $2,249.59 to $799.59) and **Run now** on an auto-save rule, plus
  that day's real transactions and an **Add transaction** button
  already dated to the day. Filter the grid by kind (money in, bills,
  saving, debt, subscriptions, meeting), step between months, and
  read the weekly totals underneath — the week starting Nov 29 takes
  in $5,850.00 and sends out $2,847.97. Two honest conventions are
  stated on the page: debts have no single due day in the records, so
  the month's payment is shown on the 1st (the total is exact), and a
  subscription's renewal day is the day of the month it was last used.
- **Monthly report per member (v22)** — every member's own page now
  opens with a report card for the month: what they spent of their
  allowance, on what, and what is left. **Maya: $52.25 of $150.00
  across 1 tagged transaction — all of it Dining out** (lunch with
  friends, $52.25 on Nov 11), **$97.75 left**, nothing banked yet
  this month. Sofia: $24.50 of $25.00 (school lunch top-up). Liam:
  $12.00 of $20.00, $8.00 left. The overview cards carry the same
  headline — each person's top category for the month and its share
  of what they spent. The member detail's allowance-history and
  transactions tables now scroll inside their cards on a phone, so
  the page no longer stretches past 390px.
- **Debt-free calendar (v21)** — the household's own debts laid out
  month by month, from the next payment to the last, every figure
  computed live — nothing typed in. **$10,100.00 owed** across three
  debts (credit card $1,250.00 at 19.9%, store card $450.00 at 12.9%,
  car loan $8,400.00 at 6.4%), minimums $270.00 a month plus the
  $50.00 extra. **Avalanche** (highest APR first: credit card →
  store card → car loan) clears everything in **40 months for
  $1,238.76 of interest, debt-free March 2030**; **snowball**
  (smallest balance first) takes 41 months and $1,316.02, debt-free
  April 2030 — and with no extra at all it is 55 months and
  $1,785.27, June 2031, so the $50.00 a month **saves $546.51 and
  finishes 15 months sooner**. The calendar runs December 2026 to
  March 2030, one row a month — paid, interest, principal, balance
  left — and **press any month to see that payment split per debt**
  (December 2026: $390.37 paid, $70.37 interest, $320.00 principal —
  $85.00 off the credit card, $25.00 off the store card, $210.00 off
  the car loan). Each debt gets its own card with the month it
  clears (credit card April 2028, store card June 2028, car loan
  March 2030) and the interest it costs under the plan. **Pay extra
  this month** books one extra payment in December 2026 only — $500
  there pulls the plan to **39 months and $1,078.38 of interest,
  saving $160.38** — and the whole calendar, the debt-free date and
  the saving move at once; Clear takes it back off. Raise the monthly
  extra to $100 and the plan falls to **34 months, $1,031.51,
  September 2029**. Switch the order to snowball and the calendar
  rebuilds around the store card clearing first, in 7 months. The
  extra payment and the method are the **same figures the Reports
  payoff planner edits**, so the two pages can never disagree — and
  the Reports page still shows the same 40 months and $1,238.76.
- **Monthly money meeting (v17)** — once a month, around the table. The
  page builds the agenda itself from the household's own records: six
  wins (11 of 11 months inside the $3,800.00 plan, net worth positive
  since April 2026, the 52-week challenge at 20 weeks and $210.00, the
  auto-save rules' $1,894.60, an 8-day no-spend streak, February the
  best month at $2,857.00 saved) and five flags with a number on each
  (groceries used $619.35 of $620.00 — 65 cents of slack; week 2 ran
  $285.86 over its flexible share; car insurance $95.00 and home
  insurance $68.00 past their due days; Duolingo Plus and National
  Geographic flagged to cancel, $239.76 a year; the credit card still
  owes $1,250.00 at 19.9% APR). Eight decisions sit on the table, and
  saying **Yes — do it** does the thing at once: cancelling Duolingo
  Plus stops $155.88 a year, downgrading Google One halves it, raising
  the debt extra to $100 a month moves the debt-free date from March
  2030 to September 2029 ($207.25 less interest), moving $100 from the
  holiday fund puts the washing machine at $340.00, paying week 21
  takes the challenge to 21 weeks — and the page each one lands on
  already shows it. Notes save as you type, the meeting marks done,
  and the next meeting is the first Sunday of next month (Dec 6, 2026).
- **Monthly statement (v17, on Reports)** — every transaction of the
  month in the order it happened, with a running balance that starts at
  $0.00 on the 1st and ends at the month's saved figure ($2,791.51 in
  November, the same number the summary shows), plus spending by
  category and a sign-off line ("Checked by ____ on ____"). **Print the
  statement** prints just the statement, alone on the paper.
- **Auto-save rules (v16)** — money that moves itself. Four standing
  rules, every figure worked out from the household's own records.
  **Payday: $100.00 to the emergency fund** on the 1st — 11 runs,
  $1,100.00 of the fund's $4,350.00 came this way; **Payday: $80.00 to
  the washing machine** — 3 runs, $240.00, the whole of that pot so far;
  **Payday: $50.00 to the car deposit** — 11 runs, $550.00 of the
  $2,150.00; **Round-ups to the holiday fund** on the last day of the
  month — 1 run, September 30, $4.60. Between them the rules have
  auto-saved **$1,894.60 in 2026**, $230.00 of it in November, and the
  next run is the round-up sweep on **Nov 30, 2026 ($5.51 of round-ups
  so far)**. Every rule shows its destination, its amount, its next-run
  date and its last run, and every control works: **Run now** moves the
  money for real (emergency fund $4,350.00 → $4,450.00, washing machine
  $240.00 → $320.00, holiday $980.00 → $985.51 — and the Goals and Big
  purchases pages agree at once), **Run all active rules now** runs all
  four in one press ($235.51) and a second press moves nothing, **Pause**
  stops the future runs, and the **add form** writes a new rule (fixed
  amount on payday, or round-ups on the last day, into any goal or big
  purchase — a $25.00 rule into the holiday runs and deletes cleanly).
  A rule runs once a day, and a round-up rule finds nothing to move in
  a month the round-up pot already swept — October's $4.65 went to the
  pot instead, so the same cents are never saved twice. A per-rule
  monthly ledger counts every run, so a month with two runs counts both.
- **Subscription audit — usage log (v14)** — every subscription now
  shows the dates it was actually opened, not just the last one: a
  visible log ("Used 4× logged: Nov 22 · Oct 23 · Sep 23") under the
  last-used date, seeded from the household's own records for older
  saves. Pressing **"I used it — keep"** adds today to the log and
  flips the verdict to Keep at once — the audit's judgement is backed
  by a history instead of one lonely date.
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
  **Auto-pay switches (v16):** every bill carries its own on/off switch,
  and a bill on auto-pay shows its next auto-pay date underneath —
  rent, electricity, water, internet, the phones and the car insurance
  are on it, so **$1,934.60 of the $2,249.59 due this month pays itself**,
  next the rent $1,450.00 on Dec 1, 2026 (car insurance follows on Dec
  22). Switch the gym on and the covered total rises to $1,979.60;
  switch the rent off and it falls to $529.60 with the next auto-pay
  moving to Dec 3. The switch only records the setup with the bank —
  the paid toggle still marks the payment when it lands, so the records
  stay honest.
  Pocket-money allowances per person, with spending counted from their own
  tagged transactions. **Pay all due (v20):** one press, one confirm, and
  every bill still unpaid for the month is marked paid — in November
  that is the car insurance $95.00 and the home insurance $68.00,
  $163.00 between them, taking the month to 10 of 10 bills paid; a
  second press finds nothing left and says so, and the button disables
  itself once everything is paid. A bill calendar lays the whole month out as a grid,
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
  **Personal savings challenges (v12, banked records added v15):** one target per person, filled
  only by banking unspent allowance — the banked record *is* the
  progress, so the bar can never disagree with the money. Sofia's
  **New bike, $100.00** ($15.00 banked, 15% — at her usual pace about
  4 months to go); Maya's **Christmas presents, $300.00** ($145.00
  banked, 48%); Daniel's **Fishing gear, $200.00** ($40.00 banked);
  Liam's **LEGO set, $60.00** ($10.00 banked). Bank Sofia's $0.50 unspent from November and the
  bar moves at once to $15.50 of $100.00 — and the overview card shows
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
  **Price alerts (v18):** the seven staples that rose more than 5%
  since September get their own card — eggs most of all, up 10.2%
  ($5.90 → $6.50 a dozen, +$0.60), then bread (+7.4%), butter (+6.5%),
  milk (+6.3%), beef mince (+6.0%), cheddar (+5.5%) and chicken
  (+5.4%); salmon (+4.9%) is not flagged. Each alert names its
  cheapest store and what it costs on this week's list (eggs were
  already bought, 1 × $6.50; the chicken is still to buy, 1 × $13.60),
  and the switch is spelled out: buy each staple at its cheapest
  store instead of everything at one store and the basket runs about
  $2.63 a week cheaper.
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
  $100 a month stand between you and it. **Milestone markers (v15):**
  each card now carries its four milestone chips — reached ones marked
  green with a ✓ (the emergency fund has 25% and 50% done, $1,500.00
  and $3,000.00; the holiday has 25% done; the car deposit has 25%
  done), the next one in line in amber (75% for the emergency fund —
  $150.00 to go), the rest quiet. A goal that reaches 100% gets a
  **fully-funded celebration** — a banner across the page and a cheer on
  its own card — with a **Start a new goal** button that opens the new-goal
  form right there. **Top up from unassigned cash (v19):** the page
  opens with the $21,225.35 of cash the household kept that has no job
  yet — not in a goal, not in the 52-week challenge, not in the
  round-up pot, not in a cash envelope — and every goal card carries a
  **Top up $100 from unassigned** button. One press moves $100.00 of
  that cash into the goal (emergency fund $4,350.00 → $4,450.00, and
  the unassigned figure falls to $21,125.35 at the same moment); the
  Net worth page agrees, because both figures are read off the same
  arithmetic. With less than $100 unassigned left the button says so
  instead of moving money that is not there.
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
  for that month. **2027 projection (v21):** the Forecast page's
  December 2026 projection held flat for twelve months — income
  **$69,200.04**, spending **$37,316.04**, saving **$31,884.00**
  (46.1% savings rate), $86.43 a month less than the $2,743.43 actually
  saved a month in 2026 — with the biggest riser called out (Kids &
  school, December projected at $225.27 against a $131.92 six-month
  average). Change the forecast method or the extra saving on the
  Forecast page and the projection moves with it. The month table
  scrolls inside its card on a phone instead of stretching the page.
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
  v14 adds the big-purchases plan (four sample purchases) and the
  subscription usage logs (seeded from each subscription's last-used
  date), both defaulted for older saves. v15 adds the banked-allowance
  records behind the per-member challenges (Maya $145.00, Daniel $40.00,
  Sofia $15.00, Liam $10.00 into the emergency fund), defaulted for
  older saves. v16 adds the auto-save rules (four sample rules) and the
  auto-pay switch on every bill (off for older saves — a bill only pays
  itself when the household switches it on), both defaulted for older saves.
  v17 adds the monthly money meeting records (one per month: decisions,
  notes, done date, next date), defaulted for older saves. v18 adds the
  adopted next-month plan record (the budgets and fills it wrote, and what
  they were before, so Undo can put them back), defaulted for older saves.
  v19 adds the house rules (seven sample rules: payday saving, two
  spending caps, no-spend days, takeaway limit, save rate, unused
  subscriptions), defaulted for older saves. v20 adds the household's
  usual grocery shop (SuperMart until the household picks another one
  on the Where we shop page), defaulted for older saves. v21 adds the
  debt-free calendar's one-off extra payment ($0 until the household
  books one on the Debt-free calendar page), defaulted for older saves.

## Tech

- Static files under `app/` — `index.html`, `style.css`, and ES modules
  split by job: `data.js` (categories, sample data, month maths, storage,
  cash-envelope maths), `charts.js` (hand-drawn canvas donut / bars / trend),
  `views.js` (dashboard, transactions, budgets, goals, insights), `main.js`
  (routing, dialogs, CRUD, export). The twenty-two newer sections are one-job
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
  savings, add / cancel / restore / downgrade, usage log), `forecast.js` (spending
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
  categories, saved check-in history), `bigbuys.js` (big-purchases
  planner — cost, target date and set-aside per purchase, monthly
  set-aside and ready month worked out live from the household's own
  saving pace, pace handed out by earliest target first, add form with
  optional link to a savings goal, + $25 / + $50 into any pot, remove),
  `streaks.js` (streaks & wins — months inside the budget, the no-spend
  streak counted from Transactions, the 52-week run, one personal
  challenge per member from the banked records, milestones already
  reached and the next in line; mark-today and pay-next-week controls),
  `autosave.js` (auto-save rules — payday moves into a goal or a big
  purchase's pot, month-end round-up sweeps into a goal, next-run dates
  worked out from today, a per-rule monthly ledger, run-now / run-all /
  pause / add / delete, all moving real money), `meeting.js` (monthly
  money meeting — wins and flags computed live from the household's own
  figures, decisions that do real work when the household says yes,
  notes that save as you type, mark-done and the next meeting on the
  first Sunday of next month), `nextmonth.js` (next month's plan —
  suggested budgets from this month's spend, envelope fills from those
  budgets plus rollovers, bills due, big purchases coming up, auto-save
  runs scheduled, with Adopt that writes the plan into the budgets and
  envelopes and Undo that puts it back), `rules.js` (house rules — the
  seven rules the household agreed, each checked live against the
  month's own records: payday auto-save runs, category caps, no-spend
  days, a per-meal takeaway limit, the save rate, subscriptions
  untouched for 60 days; add-rule form and delete), `stores.js` (where
  we shop — the month's spending grouped by shop or payee from the
  transactions' own words, per-shop trips, averages, biggest spend,
  last-month comparison and category split, show-the-purchases detail,
  sort by spend / trips / A–Z, the usual-grocery-shop picker, and the
  grocery switch estimate measured against it from the staple price
  history), `debtfree.js` (debt-free calendar — the household's own
  debts as a month-by-month payoff schedule from the next payment to
  the last, avalanche or snowball, with a monthly extra payment, a
  one-off extra payment in the first month, per-debt clear months and
  an expandable per-debt split of every payment, all recomputed live
  from the same extra payment and method the Reports payoff planner
  keeps), `calendar.js` (money calendar — the whole month on one page,
  every payday, bill, auto-save run, debt payment, set-aside,
  subscription renewal, meeting and no-spend day plotted on the day it
  lands, with a day detail that marks bills paid and runs auto-save
  rules, kind filters, a month switcher and weekly planned totals).
  The members' monthly report cards live in `members.js` (top category
  and biggest spend per person, counted from their own tagged
  transactions).
  `favicon.ico` is a hand-drawn
  16×16 house icon, served locally like everything else.
- Zero network requests at runtime: no CDN, no web fonts, no tracking.
  Charts are drawn with plain Canvas 2D; icons are text glyphs.
- Responsive: desktop layout and a phone layout (390 px). Wide tables
  scroll sideways inside their cards instead of stretching the page,
  and grid items shrink below their content width so two-column cards
  stack cleanly on a phone (v18).

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
- `screenshots/2-calendar.png` — Money calendar, December 2026: payday Dec 1 ($5,650.00 in), the meeting on Dec 6 open, subscription renewals and bills plotted across the month, kind filters, $5,850.00 planned in against $3,621.37 out (desktop, 1280×800)
- `screenshots/3-debtfree.png` — Debt-free calendar: $10,100.00 owed, debt-free March 2030 in 40 months for $1,238.76 of interest, the $546.51 the extra buys, avalanche/snowball switch, extra-a-month box and Pay extra this month (desktop, 1280×800)
- `screenshots/4-members-phone.png` — Maya's page on a phone (390×844), scrolled to her November report card — $52.25 of $150.00, all Dining out, $97.75 left — no horizontal overflow

## License

MIT — see [LICENSE](LICENSE).
