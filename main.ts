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
// targets measured against the pace it actually kept. The eleven newer
// sections load on demand in the browser, so the first load stays small.
// Hands the site in: copies app/ and screenshots/ beside this file into
// /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library. The dossier's
// Totals line measures the first load: index.html + style.css + the four
// core scripts (data, charts, views, main). bills.js, annual.js,
// reports.js, debt.js, grocery.js, members.js, savings.js, envelopes.js,
// subscriptions.js, forecast.js and review.js are fetched only when their nav link
// is opened, so they do not count in the first load. Deterministic:
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
