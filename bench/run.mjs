/**
 * Automated performance benchmark for the MFE composition strategies.
 *
 * For every run × network profile × page × implementation it launches a fresh,
 * cold-cache headless Chrome, runs a Lighthouse performance audit with REAL
 * (DevTools) network + CPU throttling and records Core Web Vitals, JS weight and
 * request counts.
 *
 * The loop order interleaves implementations (A, B, A, B …) so that slow drift in
 * external conditions (e.g. FakeStore API latency) affects every implementation
 * equally instead of biasing whichever ran last.
 *
 * Usage (apps must already be running, e.g. `npm run a:start` and `npm run b:start`):
 *   npm run bench -- --runs 5 --impl A,B --network slow-3g,fast-4g,broadband
 *   CHROME_PATH=/path/to/chrome npm run bench
 *
 * Output: bench/results/<timestamp>/results.csv, meta.json, raw/*.json.gz
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- configuration
export const IMPLEMENTATIONS = {
  A: { name: 'Module Federation', baseUrl: process.env.A_URL || 'http://localhost:3000' },
  B: { name: 'Single-SPA', baseUrl: process.env.B_URL || 'http://localhost:3100' },
  C: { name: 'Next.js RSC', baseUrl: process.env.C_URL || 'http://localhost:3200' },
};

export const PAGES = {
  home: '/',
  plp: '/products',
  pdp: '/product/1',
  cart: '/cart',
};

// Network profiles from the dissertation outline. Values are applied directly by
// Chrome DevTools (packet-level emulation of latency and bandwidth).
// CPU slowdown is held constant (4x) so that only the network varies between profiles.
export const NETWORKS = {
  'slow-3g': { requestLatencyMs: 400, downloadThroughputKbps: 400, uploadThroughputKbps: 400, cpuSlowdownMultiplier: 4 },
  'fast-4g': { requestLatencyMs: 170, downloadThroughputKbps: 9000, uploadThroughputKbps: 1500, cpuSlowdownMultiplier: 4 },
  broadband: { requestLatencyMs: 20, downloadThroughputKbps: 40000, uploadThroughputKbps: 10000, cpuSlowdownMultiplier: 4 },
};

const METRIC_AUDITS = {
  fcp_ms: 'first-contentful-paint',
  lcp_ms: 'largest-contentful-paint',
  tbt_ms: 'total-blocking-time',
  cls: 'cumulative-layout-shift',
  tti_ms: 'interactive',
  si_ms: 'speed-index',
  max_fid_ms: 'max-potential-fid',
};

// ---------------------------------------------------------------- CLI args
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}
const RUNS = Number(arg('runs', 3));
const IMPLS = arg('impl', 'A,B').split(',');
const NETS = arg('network', Object.keys(NETWORKS).join(',')).split(',');
const PAGE_KEYS = arg('pages', Object.keys(PAGES).join(',')).split(',');
const OUT = arg('out', path.join(__dirname, 'results', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)));

// ---------------------------------------------------------------- helpers
function lighthouseConfig(net) {
  return {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance'],
      formFactor: 'mobile', // Lighthouse default mobile screen emulation (412 x 823)
      throttlingMethod: 'devtools',
      throttling: NETWORKS[net],
      maxWaitForLoad: 120000, // Slow 3G with large product images needs time
      maxWaitForFcp: 60000,
      disableStorageReset: false, // clean storage and cache for every run
    },
  };
}

function extract(lhr) {
  const row = {};
  for (const [key, id] of Object.entries(METRIC_AUDITS)) {
    const v = lhr.audits[id]?.numericValue;
    row[key] = v == null ? '' : key === 'cls' ? Number(v.toFixed(4)) : Math.round(v);
  }
  row.perf_score = Math.round((lhr.categories.performance?.score ?? 0) * 100);

  const requests = lhr.audits['network-requests']?.details?.items || [];
  const sum = (items, f) => items.reduce((s, r) => s + (f(r) || 0), 0);
  const scripts = requests.filter((r) => r.resourceType === 'Script');
  row.requests = requests.length;
  row.js_requests = scripts.length;
  row.js_transfer_kb = +(sum(scripts, (r) => r.transferSize) / 1024).toFixed(1);
  row.js_resource_kb = +(sum(scripts, (r) => r.resourceSize) / 1024).toFixed(1);
  row.total_transfer_kb = +(sum(requests, (r) => r.transferSize) / 1024).toFixed(1);
  row.lcp_element = (lhr.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel || '')
    .replace(/[\r\n,]+/g, ' ')
    .slice(0, 60);
  row.runtime_error = lhr.runtimeError?.code || '';
  row.warnings = (lhr.runWarnings || []).length;
  return row;
}

const CSV_COLUMNS = [
  'timestamp', 'impl', 'strategy', 'page', 'network', 'run', 'url',
  'perf_score', 'fcp_ms', 'lcp_ms', 'tbt_ms', 'cls', 'tti_ms', 'si_ms', 'max_fid_ms',
  'requests', 'js_requests', 'js_transfer_kb', 'js_resource_kb', 'total_transfer_kb',
  'lcp_element', 'runtime_error', 'warnings', 'duration_s',
];
const toCsv = (row) => CSV_COLUMNS.map((c) => (row[c] === undefined ? '' : String(row[c]).includes(',') ? `"${row[c]}"` : row[c])).join(',');

async function audit(url, net) {
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH || undefined,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-extensions'],
  });
  try {
    const result = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error' }, lighthouseConfig(net));
    return result.lhr;
  } finally {
    await chrome.kill();
  }
}

// ---------------------------------------------------------------- main
async function main() {
  fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
  const csvPath = path.join(OUT, 'results.csv');
  fs.writeFileSync(csvPath, CSV_COLUMNS.join(',') + '\n');

  const total = RUNS * NETS.length * PAGE_KEYS.length * IMPLS.length;
  let done = 0;
  let meta = null;
  const started = Date.now();

  for (let run = 1; run <= RUNS; run++) {
    for (const net of NETS) {
      for (const page of PAGE_KEYS) {
        for (const impl of IMPLS) {
          const url = IMPLEMENTATIONS[impl].baseUrl + PAGES[page];
          const t0 = Date.now();
          let row;
          try {
            const lhr = await audit(url, net);
            row = extract(lhr);
            meta ??= {
              lighthouseVersion: lhr.lighthouseVersion,
              userAgent: lhr.environment?.hostUserAgent,
              benchmarkIndex: lhr.environment?.benchmarkIndex,
              settings: lhr.configSettings,
            };
            fs.writeFileSync(
              path.join(OUT, 'raw', `${impl}_${page}_${net}_run${run}.json.gz`),
              zlib.gzipSync(JSON.stringify(lhr))
            );
          } catch (e) {
            row = { runtime_error: `EXCEPTION ${e.message}`.slice(0, 120).replace(/,/g, ';') };
          }
          Object.assign(row, {
            timestamp: new Date().toISOString(),
            impl,
            strategy: IMPLEMENTATIONS[impl].name,
            page,
            network: net,
            run,
            url,
            duration_s: ((Date.now() - t0) / 1000).toFixed(1),
          });
          fs.appendFileSync(csvPath, toCsv(row) + '\n');
          done++;
          const eta = (((Date.now() - started) / done) * (total - done)) / 60000;
          console.log(
            `[${done}/${total}] ${impl} ${page.padEnd(4)} ${net.padEnd(9)} run${run}  LCP ${row.lcp_ms}ms  TBT ${row.tbt_ms}ms  score ${row.perf_score}  ${row.runtime_error || ''}  (ETA ${eta.toFixed(0)} min)`
          );
        }
      }
    }
  }

  fs.writeFileSync(
    path.join(OUT, 'meta.json'),
    JSON.stringify({ ...meta, runs: RUNS, implementations: IMPLS, networks: NETS, pages: PAGE_KEYS, networkProfiles: NETWORKS, finishedAt: new Date().toISOString(), durationMin: ((Date.now() - started) / 60000).toFixed(1) }, null, 2)
  );
  console.log(`\nDone: ${csvPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
