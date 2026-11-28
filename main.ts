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
// v10 lazy files: bills.js, annual.js, reports.js, debt.js, grocery.js,
// members.js, savings.js, envelopes.js, subscriptions.js, forecast.js
// and review.js.
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
