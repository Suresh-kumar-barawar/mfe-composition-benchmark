/**
 * Validation probe: FCP of one URL measured by Lighthouse under custom DevTools throttling.
 * Compare with tests/browser-fcp.mjs (the browser's own PerformanceObserver value).
 *
 *   node bench/validate/lighthouse-fcp.mjs <url> <latencyMs> <downKbps> <upKbps> <cpuX>
 *   XFLAGS="--hide-scrollbars ..." node bench/validate/lighthouse-fcp.mjs ...   # extra Chrome flags
 *   CHROME_PATH=/path/to/chrome ...
 * Run from bench/ (uses bench/node_modules).
 */
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const [url, lat, down, up, cpu] = process.argv.slice(2);
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', ...(process.env.XFLAGS ? process.env.XFLAGS.split(' ') : [])],
});
const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error' }, {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance'],
    formFactor: 'mobile',
    throttlingMethod: 'devtools',
    throttling: { requestLatencyMs: +lat, downloadThroughputKbps: +down, uploadThroughputKbps: +up, cpuSlowdownMultiplier: +cpu },
  },
});
await chrome.kill();
const a = r.lhr.audits;
console.log(`${url.padEnd(34)} lat ${lat} down ${down} up ${up} cpu ${cpu} -> FCP ${Math.round(a['first-contentful-paint'].numericValue)} load ${a.metrics.details.items[0].observedLoad}`);
