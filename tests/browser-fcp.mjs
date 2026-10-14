/**
 * Validation probe: the browser's own First Contentful Paint (PerformanceObserver) under the
 * same DevTools network + CPU throttling that Lighthouse uses, but without Lighthouse.
 *
 *   node tests/browser-fcp.mjs <url> <latencyMs> <downKbps> <upKbps> <cpuX> [new|shell]
 *   MOBILE=1.75 …   mobile screen emulation      TRACE=devtools.timeline,… …   record a trace
 */
import { chromium } from 'playwright';
const [url, lat, down, up, cpu, headless] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, executablePath: headless === 'shell' ? undefined : process.env.CHROME_PATH, args: headless === 'shell' ? [] : ['--headless=new'] });
const ctx = await b.newContext({ viewport: { width: 412, height: 823 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: +lat, downloadThroughput: (+down * 1024) / 8, uploadThroughput: (+up * 1024) / 8 });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu });
if (process.env.MOBILE) await cdp.send('Emulation.setDeviceMetricsOverride', { width: 412, height: 823, deviceScaleFactor: +process.env.MOBILE, mobile: true });
if (process.env.TRACE) await cdp.send('Tracing.start', { traceConfig: { includedCategories: process.env.TRACE.split(',') }, transferMode: 'ReturnAsStream' });
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(3500);
const r = await p.evaluate(() => ({
  fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || -1),
  load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),
  dcl: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),
}));
console.log(`${headless || 'new'} ${url} lat ${lat}`, JSON.stringify(r));
await b.close();
