// Hearth & Home Budget — entrypoint (Node 22, standard library only).
// v6: dashboard, transactions, budgets, bills & recurring (with a bill
// calendar), groceries & meals (with staple price history), household
// members (one page per person), savings goals, savings challenges
// (52-week, no-spend days, round-up pot), cash envelopes (fill, spend,
// rollover, move cash between envelopes), annual overview (with month
// drill-down), insights and reports — the seven newer sections load on
// demand in the browser, so the first load stays small.
// Hands the site in: copies app/ and screenshots/ beside this file into
// /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library. The dossier's
// Totals line measures the first load: index.html + style.css + the four
// core scripts (data, charts, views, main). bills.js, annual.js,
// reports.js, grocery.js, members.js, savings.js and envelopes.js are
// fetched only when their nav link is opened, so they do not count in
// the first load. Deterministic:
// the same input files always produce the same output bytes.
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
