/**
 * Interaction benchmark (INP) for the MFE composition strategies.
 *
 * Lighthouse page-load runs cannot measure Interaction to Next Paint (INP): it needs real user
 * input. This script drives the SAME 10-step shopping session in A, B and C with in-app
 * (client-side) navigation, like a real visitor, under the benchmark's throttling
 * (Fast 4G network, 4x CPU slowdown, mobile screen), and records for every step:
 *
 *   inp_ms     the longest Event Timing duration of the interaction(s) in that step: time from
 *              the user's input until the browser paints the next frame (what INP is built from)
 *   result_ms  time from the input until the expected result is visible on screen
 *              (e.g. the filtered product grid) – includes any data fetching / server rendering
 *
 * Per run it also reports the session INP (worst interaction of the whole session).
 *
 *   node inp.mjs --runs 5 --impl A,B,C [--network fast-4g] [--out results/<name>]
 *   A_URL=… B_URL=… C_URL=… node inp.mjs …        # deployed sites
 * Output: <out>/inp.csv and <out>/inp-summary.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : d);
const RUNS = Number(arg('runs', 5));
const IMPLS = arg('impl', 'A,B,C').split(',');
const NET = arg('network', 'fast-4g');
const OUT = arg('out', path.join(__dirname, 'results', `inp-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`));

const URLS = {
  A: process.env.A_URL || 'http://localhost:3000',
  B: process.env.B_URL || 'http://localhost:3100',
  C: process.env.C_URL || 'http://localhost:3200',
};
// Same profiles as run.mjs (Kbps -> bytes/s for CDP).
const NETWORKS = {
  'slow-3g': { latency: 400, down: 400, up: 400 },
  'fast-4g': { latency: 170, down: 9000, up: 1500 },
  broadband: { latency: 20, down: 40000, up: 10000 },
};
const CPU = 4;
const T = Number(process.env.INP_TIMEOUT || 60000);
const DEBUG = !!process.env.INP_DEBUG;

// Collect Event Timing entries from the very start of the page (survives soft navigations).
const OBSERVER = () => {
  window.__events = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.interactionId) window.__events.push({ id: e.interactionId, name: e.name, start: e.startTime, duration: e.duration, processing: e.processingEnd - e.processingStart, delay: e.processingStart - e.startTime });
    }
  }).observe({ type: 'event', durationThreshold: 16, buffered: true });
};

const now = (page) => page.evaluate(() => performance.now());
const cards = (page) => page.locator('.grid .card:not(.card--skeleton)');

/** The shopping session. Each step: perform the input, then wait for its visible result. */
const STEPS = [
  ['home-carousel-next', async (p) => p.getByRole('button', { name: 'Next' }).click(),
    async (p) => p.waitForTimeout(400)],
  // The top menu is hidden below 800 px, so a phone user taps the hero's "Shop all products".
  ['nav-to-shop', async (p) => p.locator('.hero a', { hasText: 'Shop all products' }).click(),
    async (p) => { await p.waitForURL('**/products'); await cards(p).first().waitFor(); }],
  ['filter-category', async (p) => { await p.locator('.filters select').first().focus(); await p.keyboard.press('ArrowDown'); },
    async (p) => { await p.waitForURL(/category=electronics/); await p.locator('.page__title', { hasText: 'Electronics' }).waitFor(); await cards(p).first().waitFor(); }],
  ['sort-price', async (p) => { await p.locator('.filters select').nth(1).focus(); await p.keyboard.press('ArrowDown'); },
    async (p) => { await p.waitForURL(/sort=price-asc/); await p.waitForFunction(() => {
      const v = [...document.querySelectorAll('.grid .card__price')].map((e) => +e.textContent.replace(/[^0-9.]/g, ''));
      return v.length > 1 && v.every((x, i) => i === 0 || v[i - 1] <= x);
    }); }],
  ['open-product', async (p) => cards(p).first().locator('a').first().click(),
    async (p) => { await p.waitForURL(/\/product\/\d+/); await p.locator('.pdp__title').waitFor(); }],
  ['qty-plus', async (p) => p.locator('.add-to-cart').getByRole('button', { name: 'Increase quantity' }).click(),
    async (p) => p.locator('.add-to-cart .qty span', { hasText: '2' }).waitFor()],
  ['add-to-cart', async (p) => p.getByRole('button', { name: /add to cart/i }).click(),
    async (p) => p.locator('.cart-link .badge', { hasText: '2' }).waitFor()],
  ['nav-to-cart', async (p) => p.locator('.cart-link').click(),
    async (p) => { await p.waitForURL('**/cart'); await p.locator('.cart__item').first().waitFor(); }],
  ['cart-qty-plus', async (p) => p.locator('.cart__item').getByRole('button', { name: 'Increase quantity' }).click(),
    async (p) => p.locator('.cart-link .badge', { hasText: '3' }).waitFor()],
  ['search', async (p) => { await p.locator('.header input[type=search]').click(); await p.keyboard.type('backpack', { delay: 30 }); await p.keyboard.press('Enter'); },
    async (p) => { await p.waitForURL(/q=backpack/); await p.locator('.page__title', { hasText: 'backpack' }).waitFor(); await cards(p).first().waitFor(); }],
];

async function session(browser, impl, run) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: false });
  await ctx.addInitScript(OBSERVER);
  const page = await ctx.newPage();
  page.setDefaultTimeout(T);
  const cdp = await ctx.newCDPSession(page);
  const n = NETWORKS[NET];
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: n.latency, downloadThroughput: (n.down * 1024) / 8, uploadThroughput: (n.up * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });

  await page.goto(URLS[impl] + '/', { waitUntil: 'load', timeout: 120000 });
  await page.locator('.carousel .card:not(.card--skeleton)').first().waitFor();
  await page.waitForTimeout(1500); // let hydration / late scripts settle before the first input

  const rows = [];
  const marks = [];
  for (const [name, act, done] of STEPS) {
    const t0 = await now(page);
    marks.push([name, t0]);
    let error = '';
    try {
      await act(page);
      await done(page);
    } catch (e) {
      error = e.message.split('\n')[0].slice(0, 100).replace(/,/g, ';');
    }
    const t1 = await now(page);
    if (DEBUG) console.log(`  ${impl} ${name} ${Math.round(t1 - t0)} ms ${error}`);
    rows.push({ impl, run, step: name, result_ms: Math.round(t1 - t0), error });
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);
  const events = await page.evaluate(() => window.__events);
  // Group entries into interactions (worst entry per interactionId), then assign to steps by start time.
  const byId = new Map();
  for (const e of events) if (!byId.has(e.id) || byId.get(e.id).duration < e.duration) byId.set(e.id, e);
  const interactions = [...byId.values()];
  rows.forEach((r, i) => {
    const from = marks[i][1];
    const to = i + 1 < marks.length ? marks[i + 1][1] : Infinity;
    const mine = interactions.filter((x) => x.start >= from - 1 && x.start < to);
    const worst = mine.reduce((a, b) => (b.duration > (a?.duration ?? -1) ? b : a), null);
    r.inp_ms = worst ? Math.round(worst.duration) : '';
    r.input_delay_ms = worst ? Math.round(worst.delay) : '';
    r.processing_ms = worst ? Math.round(worst.processing) : '';
    r.event = worst ? worst.name : '';
    r.interactions = mine.length;
  });
  const sessionInp = Math.max(0, ...interactions.map((x) => x.duration));
  await ctx.close();
  return { rows, sessionInp: Math.round(sessionInp), interactions: interactions.length };
}

const median = (v) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling', '--hide-scrollbars'],
});
fs.mkdirSync(OUT, { recursive: true });
const cols = ['impl', 'run', 'step', 'inp_ms', 'input_delay_ms', 'processing_ms', 'event', 'interactions', 'result_ms', 'error'];
const csv = [cols.join(',')];
const sessions = [];
for (let run = 1; run <= RUNS; run++) {
  for (const impl of IMPLS) { // interleaved A, B, C as in run.mjs
    const s = await session(browser, impl, run);
    s.rows.forEach((r) => csv.push(cols.map((c) => r[c] ?? '').join(',')));
    sessions.push({ impl, run, sessionInp: s.sessionInp, interactions: s.interactions, errors: s.rows.filter((r) => r.error).length });
    console.log(`[run ${run}] ${impl} session INP ${s.sessionInp} ms, ${s.interactions} interactions, ` +
      s.rows.map((r) => `${r.step}:${r.inp_ms}/${r.result_ms}${r.error ? '!' : ''}`).join(' '));
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'inp.csv'), csv.join('\n') + '\n');

const rows = csv.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
const summary = { network: NET, cpuSlowdown: CPU, runs: RUNS, urls: Object.fromEntries(IMPLS.map((i) => [i, URLS[i]])), sessionInp: {}, steps: {} };
for (const impl of IMPLS) {
  summary.sessionInp[impl] = median(sessions.filter((s) => s.impl === impl).map((s) => s.sessionInp));
  for (const [step] of STEPS) {
    const r = rows.filter((x) => x.impl === impl && x.step === step && !x.error);
    summary.steps[step] ??= {};
    summary.steps[step][impl] = {
      inp_ms: median(r.filter((x) => x.inp_ms !== '').map((x) => +x.inp_ms)),
      result_ms: median(r.map((x) => +x.result_ms)),
      ok: r.length,
    };
  }
}
summary.errors = sessions.reduce((n, s) => n + s.errors, 0);
fs.writeFileSync(path.join(OUT, 'inp-summary.json'), JSON.stringify(summary, null, 2));
console.log(`\nSession INP (median of ${RUNS}):`, summary.sessionInp, `errors: ${summary.errors}\n-> ${OUT}`);
