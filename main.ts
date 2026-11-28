// Hearth & Home Budget — entrypoint (Node 22, standard library only).
// v10: dashboard, transactions, budgets, bills & recurring (with a bill
// calendar and a twelve-month year-at-a-glance grid whose cells jump
// the month switcher), groceries & meals (with staple price history and a
// pantry-first auto-plan for next week), household members (one page
// per person, with banking of unspent allowances into a goal of their
// choice and a per-member savings-progress card), savings goals,
// savings challenges (52-week, no-spend days, round-up pot), cash
// envelopes (fill, spend, rollover, move cash between envelopes), a
// subscription audit (keep / downgrade / cancel verdicts from last-used
// dates, with real yearly savings), annual overview (with month
// drill-down), insights and reports — the printable monthly summary
// plus a debt-payoff planner that compares the snowball and avalanche
// methods side by side and recommends the cheaper one for this
// household — a spending forecast: next month projected per
// category from the six-month trend, with a confidence note per
// category, a projected month-end, a keep-this-pace yearly figure and
// the date the emergency fund reaches its target — and a year in
// review: the household's 2026 told back as a story from its own
// figures (best and tightest months, biggest single purchase, top
// categories, months inside the budget) with three editable 2027
// targets measured against the pace it actually kept. The twenty newer
// sections load on demand in the browser, so the first load stays small.
// Hands the site in: copies app/ and screenshots/ beside this file into
// /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library. The dossier's
// Totals line measures the first load: index.html + style.css + the four
// core scripts (data, charts, views, main). bills.js, annual.js,
// reports.js, debt.js, grocery.js, members.js, savings.js, envelopes.js,
// subscriptions.js, forecast.js and review.js are fetched only when their nav link
// is opened, so they do not count in the first load. v23 adds when.js
// to that lazy list: when we spend, the spending rhythms page. v24 adds
// envelopereview.js to that lazy list: the envelope review page. Deterministic:
// the same input files always produce the same output bytes.
// v13 lazy files: bills.js, annual.js, reports.js, debt.js, grocery.js,
// members.js, savings.js, envelopes.js, subscriptions.js, forecast.js,
// review.js, networth.js, whatif.js and checkin.js.
// v10 lazy files: bills.js, annual.js, reports.js, debt.js, grocery.js,
// members.js, savings.js, envelopes.js, subscriptions.js, forecast.js
// and review.js. v11 adds networth.js (lazy too): what the household
// owns minus what it owes, from its own records, with an editable
// net-worth target measured against the pace it actually kept — plus
// a Transactions member filter (who spent it) in the first-load views,
// and a net-worth strip on the Dashboard. v11 first load: 6 files,
// 38,569 bytes gzip-9. v12 adds whatif.js (lazy too): a what-if
// planner — trim dining / groceries / fun, save extra into a goal of
// your choice, pay extra off the debts — recomputed live against the
// current plan (month-end, net-worth pace, debt-free date, net-worth
// target date), with presets and an Apply that writes the plan into
// the budgets, the payoff planner and the forecast, plus Undo; and
// one personal savings challenge per member on the Members page,
// filled by banking unspent allowance, with an editable target.
// v12 first load: 6 files, 39,886 bytes gzip-9 (target ≤ ~46 KB);
// later by import() 13 files, 60,033 bytes gzip-9; whole app 20 files,
// 351,034 bytes. Verified: /tmp/bhb-v12-verify.mjs, 66/66 checks PASS,
// 0 JS errors, 0 external requests. v13 adds checkin.js (lazy too):
// a weekly check-in — this week's flexible spending against its weekly
// share of each monthly budget, fixed costs shown but not judged,
// one action for next week picked from the flagged categories, and a
// saved history of past check-ins; plus an Insights category
// drill-down (six months of bars + this month's five biggest spends,
// opened from a button per category, in the first-load views.js).
// v13 first load: 6 files, 41,467 bytes gzip-9 (target ≤ ~48 KB);
// later by import() 14 files, 66,169 bytes gzip-9 (checkin.js 6,136
// lazy); whole app 21 files, 375,708 bytes. Verified:
// /tmp/bhb-v13-verify.mjs, 85/85 checks PASS, 0 JS errors,
// 0 external requests. v14 adds bigbuys.js (lazy too): a big-purchases
// planner — school fees, a car service, a washing machine, a new sofa,
// each with a cost, a target date and what is already set aside, the
// monthly set-aside and the ready month worked out live from the
// household's own saving pace (about $2,700 a month over Sep–Nov),
// the pace handed out by earliest target first, with an add form that
// can link a purchase to a savings goal so its pot follows the goal's
// balance live — plus a usage log on every subscription in the audit:
// the last dates it was actually opened, with "I used it" appending
// today to the log. v14 first load: 6 files, 42,786 bytes gzip-9
// (target ≤ ~50 KB); later by import() 15 files, 72,105 bytes gzip-9
// (bigbuys.js 5,665 lazy); whole app 22 files, 399,290 bytes.
// Verified: /tmp/bhb-v14-verify.mjs, 80/80 checks PASS, 0 JS errors,
// 0 external requests. v15 adds streaks.js (lazy too): streaks &
// wins — months inside the budget (11 in a row), the no-spend streak
// counted from Transactions, the 52-week run, one personal challenge
// per member from the banked records, and the milestones already
// reached with the next in line; plus goal milestone chips (25/50/75/
// 100% markers on every goal card, a fully-funded celebration with a
// Start-a-new-goal button) and seeded banked-allowance records in
// data.js ($210 across the household, all into the emergency fund).
// v15 first load: 6 files, 44,144 bytes gzip-9 (target ≤ ~52 KB);
// later by import() 16 files, 78,089 bytes gzip-9 (streaks.js 5,984
// lazy); whole app 23 files, 424,592 bytes. Verified:
// /tmp/bhb-v15-verify.mjs, 90/90 checks PASS, 0 JS errors,
// 0 external requests. v16 adds autosave.js (lazy too): auto-save
// rules — payday moves into a savings goal or a big purchase's pot,
// and the last day of the month sweeps the round-ups into a goal —
// each rule with its destination, amount, next-run date and last run,
// a working toggle, a "run now" that moves the money for real, a
// "run all" button and an add-rule form; plus auto-pay switches on
// the Bills page, one per bill, with the next auto-pay date shown.
// v16 first load: 6 files, 46,275 bytes gzip-9 (target ≤ ~54 KB);
// later by import() 17 files, 84,830 bytes gzip-9 (autosave.js 5,888
// lazy); whole app 24 files, 455,462 bytes. Verified:
// /tmp/bhb-v16-verify.mjs, 110/110 checks PASS, 0 JS errors,
// 0 external requests.
// v17 adds meeting.js (lazy too): a monthly money meeting — an
// auto-generated agenda from the month's own figures (six wins, the
// flags with a number on each, eight decisions that do real work
// when the household says yes: cancel or downgrade a subscription,
// raise the debt extra, move $100 toward the washing machine, pay
// the next 52-week week), notes that save as you type, a mark-done
// button and the next meeting on the first Sunday of next month —
// plus a printable monthly statement on the Reports page (every
// transaction in order with a running balance, category totals and
// a sign-off line, printed alone). v17 first load: 6 files,
// 48,079 bytes gzip-9 (target ≤ ~56 KB); later by import() 18 files,
// 93,484 bytes gzip-9 (meeting.js 7,988 lazy); whole app 25 files,
// 493,907 bytes. Verified: /tmp/bhb-v17-verify.mjs, 123/123 checks
// PASS, 0 JS errors, 0 external requests.
// v18 adds nextmonth.js (lazy too): a plan for next month built from
// this month's own figures — suggested budgets per category (trimmed
// to what the month actually spent, kept when they already fit,
// raised to cover an overrun), envelope fills for next month (those
// suggested budgets plus whatever rolled over unspent), the bills
// due, the big purchases coming up, the auto-save runs already
// scheduled, and the 52-week challenge's next week — with an "Adopt
// this plan" that writes the suggested budgets and fills into the
// real data (Budgets and Envelopes already show them) and an Undo
// that puts the old figures back exactly; plus price alerts on the
// Groceries page (the staples up more than 5% since September, each
// with its cheapest store and what it costs on this week's list) and
// a phone-layout fix (grid items may shrink below their content, so
// two-column cards stack instead of stretching the page past 390px,
// and wide tables scroll inside their cards). v18 first load: 6 files,
// 48,794 bytes gzip-9 (target ≤ ~58 KB); later by import() 19 files,
// 101,007 bytes gzip-9 (nextmonth.js 6,953 lazy); whole app 26 files,
// 523,787 bytes. Verified: /tmp/bhb-v18-verify.mjs, 104/104 checks
// PASS, 0 JS errors, 0 external requests.
// v19 adds rules.js (lazy too): house rules — the seven rules the
// household agreed, each checked live against the month on screen's
// own records (payday auto-save runs, category caps, no-spend days,
// a per-meal takeaway limit that names the dinners that broke it,
// the save rate, subscriptions untouched for 60 days), with a
// working add-rule form and delete; plus a Goals top-up from
// unassigned cash — one press moves $100 of the $21,225.35 sitting
// unassigned in the main account into a goal, and the goal balance
// and the unassigned figure move together, both read off the Net
// worth page's own arithmetic. Verified: /tmp/bhb-v19-verify.mjs,
// 70/70 checks PASS, 0 JS errors, 0 external requests.
// v20 adds stores.js (lazy too): where we shop — November's
// spending grouped by shop or payee from the transactions' own
// words (the note on the weekly shop, the description otherwise,
// the category as fallback), per-shop trips, average trip, biggest
// single spend, last-month comparison and category split, with a
// show-the-purchases detail, sort by spend / trips / A–Z, a
// usual-grocery-shop picker, and a grocery switch estimate measured
// against it from the staple price history ($7.89 a month against
// SuperMart, $7.00 against Market Hall); plus a Bills "Pay all
// due" button that marks every bill still unpaid for the month paid
// in one press after a confirm ($163.00 in November: car + home
// insurance). First load 6 files, 51,875 bytes gzip-9 (v19: 50,767).
// Verified: /tmp/bhb-v20-verify.mjs, 78/78 checks PASS, 0 JS errors,
// 0 external requests; phone scrollWidth 390 on Stores, Bills and
// Transactions after the table-scroll and calendar shrink fixes.
// v21 adds debtfree.js (lazy too): a debt-free calendar — the
// household's own debts as a month-by-month payoff schedule from
// December 2026 to the last payment, avalanche by default (credit
// card → store card → car loan: 40 months, $1,238.76 of interest,
// debt-free March 2030) with snowball on request (41 months,
// $1,316.02, April 2030), every row expandable to the per-debt
// split of that month's payment, per-debt clear months, a monthly
// extra box and a "pay extra this month" one-off that recomputes
// the whole calendar live ($500 in December 2026: 39 months,
// $1,078.38, $160.38 saved) — the extra payment and the method are
// the same figures the Reports payoff planner keeps, so the two
// pages agree; plus a 2027 projection card on the Annual page built
// from the Forecast page's December projection held flat for twelve
// months ($69,200.04 income, $37,316.04 spending, $31,884.00 saving,
// 46.1%), and a table-scroll wrap for the Annual month table after
// the v21 phone check found it stretching 11px past 390px.
// First load 6 files, 52,544 bytes gzip-9 (v20: 51,875, +669, target
// ≤ ~64 KB); later by import() 22 files, 118,516 bytes gzip-9
// (debtfree.js 5,063 lazy); whole app 29 files, 595,818 bytes.
// Verified: /tmp/bhb-v21-verify.mjs, 76/76 checks PASS, 0 JS errors,
// 0 external requests; phone scrollWidth 390 on Debt-free, Annual,
// Stores, Bills and Transactions.
// v22 adds calendar.js (lazy too): a money calendar — the whole month
// on one page, every payday, bill, auto-save run, debt payment (from
// the Debt-free calendar's own schedule), big-purchase set-aside,
// subscription renewal (on the day of the month it was last used),
// money meeting and no-spend day plotted on the day it lands, with
// planned money in/out KPIs, a busiest day, kind filters, a month
// switcher, a day detail that marks bills paid and runs auto-save
// rules and adds a transaction already dated to the day, that day's
// real transactions, and weekly planned totals — December 2026:
// $5,850.00 in, $3,621.37 out, $2,228.63 left on the plan, busiest
// day Dec 1 at $2,628.43 out; plus a monthly report card on every
// member's page (Maya: $52.25 of $150.00, all Dining out, $97.75
// left) and a top-category line on every overview card, and a
// table-scroll wrap for the member detail's history and transactions
// tables after the v22 phone check found them stretching 35px past
// 390px. First load 6 files, 53,292 bytes gzip-9 (v21: 52,544, +748,
// target ≤ ~66 KB); later by import() 23 files, 126,075 bytes gzip-9
// (calendar.js 6,838 lazy; members.js +721); whole app 30 files,
// 623,692 bytes. Verified: /tmp/bhb-v22-verify.mjs, 65/65 checks
// PASS, 0 JS errors, 0 external requests; phone scrollWidth 390 on
// Calendar (December), Members (Maya) and Debt-free. One fix during
// the run: calendar.js first imported autosaveStore from autosave.js,
// which does not export it — it lives in data.js.
// v23 adds when.js (lazy too): when we spend — spending rhythms read
// straight off the household's own transactions: spending by weekday
// (Monday first, with trips, average per that weekday and share),
// weekend against weekday, which week of the month carries the money,
// the single priciest day opened transaction by transaction, and three
// "what this tells us" lines derived live from the same figures —
// November 2026 everyday: Monday priciest at $417.70 (Groceries
// $355.20 of it), Sunday cheapest at $80.50, weekends 16.5% of the
// money, week 2 heaviest at $768.54, priciest day Mon 9 Nov $206.90 —
// with a scope switch (this month / last 3 months / all time) and an
// everyday-vs-include-rent-and-bills switch that re-measure the whole
// page; plus a date-range filter on Transactions (from/to date inputs
// that filter the list and its income/spent totals, with a Clear dates
// button). First load 6 files, target ≤ ~68 KB; later by import() 24
// files (when.js lazy); whole app 31 files. Verified:
// /tmp/bhb-v23-verify.mjs, 0 JS errors, 0 external requests; phone
// scrollWidth 390 on When we spend and Forecast.
// v24 adds envelopereview.js (lazy too): envelope review — November's
// fills against what each envelope actually spent, over/under flags,
// what rolled in and what rolls out, the three-month average spend per
// envelope, and a suggested December fill per envelope (three-month
// average rounded up to the next $5), with a one-click Apply that writes
// the suggestions into December's real envelope fills plus Undo, and a
// per-envelope Use button; plus a 52-week-challenge catch-up on the
// Savings page — the missed weeks up to the current ISO week, their
// cost, one press to pay them all, and an Undo. Screenshots re-shot
// fresh for v24: dashboard, envelope review, when we spend, and
// Where we shop at phone size. First load 6 files, target ≤ ~70 KB;
// later by import() 25 files (envelopereview.js lazy); whole app 32
// files. Verified: /tmp/bhb-v24-verify.mjs, 98/98 checks PASS, 0 JS errors, 0 external
// requests; phone scrollWidth 390 on Envelope review and Stores.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
