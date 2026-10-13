/**
 * Functional check for every implementation: the 14 behaviours used in the mid-semester
 * report, run in headless Chromium against the running apps.
 *
 *   node tests/functional.mjs                 # A, B and C on localhost
 *   node tests/functional.mjs --impl C        # one implementation
 *   A_URL=https://… C_URL=https://… node tests/functional.mjs
 *
 * Exit code 0 only if every check passes on every implementation.
 */
import { chromium } from 'playwright';

const URLS = {
  A: process.env.A_URL || 'http://localhost:3000',
  B: process.env.B_URL || 'http://localhost:3100',
  C: process.env.C_URL || 'http://localhost:3200',
};
const i = process.argv.indexOf('--impl');
const IMPLS = (i > -1 ? process.argv[i + 1] : 'A,B,C').split(',');
const T = Number(process.env.FT_TIMEOUT || 60000); // per action / wait

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let failures = 0;

for (const impl of IMPLS) {
  const base = URLS[impl];
  const page = await browser.newPage();
  page.setDefaultTimeout(T);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const results = [];
  const check = async (name, fn) => {
    try {
      await fn();
      results.push([name, true]);
    } catch (e) {
      results.push([name, false, e.message.split('\n')[0]]);
    }
  };
  const expect = (cond, msg) => {
    if (!cond) throw new Error(msg);
  };
  const cards = () => page.locator('.grid .card:not(.card--skeleton)');
  // A marker on window survives client-side navigation but not a full page load.
  const mark = () => page.evaluate(() => (window.__spaMarker = 1));
  const marked = () => page.evaluate(() => window.__spaMarker === 1);

  await check('01 home page loads with featured products', async () => {
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.locator('.carousel .card:not(.card--skeleton)').first().waitFor();
    expect((await page.locator('.carousel .card:not(.card--skeleton)').count()) === 8, 'expected 8 featured products');
    expect((await page.locator('.categories .category').count()) === 4, 'expected 4 categories');
  });

  await check('02 client-side navigation without page reload', async () => {
    await mark();
    await page.locator('.nav a', { hasText: 'Shop' }).click();
    await page.waitForURL('**/products');
    await cards().first().waitFor();
    expect(await marked(), 'page was fully reloaded');
  });

  await check('03 pagination shows 8 per page and page 2 works', async () => {
    expect((await cards().count()) === 8, `page 1 has ${await cards().count()} items`);
    await page.locator('.pagination a', { hasText: '2' }).first().click();
    await page.waitForURL(/page=2/);
    await page.locator('.pagination__current', { hasText: '2' }).waitFor();
    expect((await cards().count()) === 8, 'page 2 does not have 8 items');
  });

  await check('04 category filter', async () => {
    await page.locator('.filters select').first().selectOption('electronics');
    await page.waitForURL(/category=electronics/);
    await page.locator('.page__title', { hasText: 'Electronics' }).waitFor();
    await cards().first().waitFor();
    const cats = await page.locator('.grid .card__category').allInnerTexts();
    expect(cats.length === 6 && cats.every((c) => c.toLowerCase() === 'electronics'), `got ${cats.join('|')}`);
  });

  await check('05 sort by price (low to high)', async () => {
    await page.locator('.filters select').nth(1).selectOption('price-asc');
    await page.waitForURL(/sort=price-asc/);
    await page.waitForFunction(() => {
      const p = [...document.querySelectorAll('.grid .card__price')].map((e) => +e.textContent.replace(/[^0-9.]/g, ''));
      return p.length > 1 && p.every((v, i) => i === 0 || p[i - 1] <= v);
    });
  });

  await check('06 search from the header', async () => {
    await page.locator('.header input[type=search]').fill('backpack');
    await page.locator('.header button[type=submit]').click();
    await page.waitForURL(/q=backpack/);
    await page.locator('.page__title', { hasText: 'backpack' }).waitFor();
    await cards().first().waitFor();
    const titles = await page.locator('.grid .card__title').allInnerTexts();
    expect(titles.length >= 1 && titles.some((t) => /backpack/i.test(t)), `got ${titles.join('|')}`);
  });

  await check('07 product detail page', async () => {
    await cards().first().locator('a').first().click();
    await page.waitForURL(/\/product\/\d+/);
    await page.locator('.pdp__title').waitFor();
    expect((await page.locator('.pdp__price').innerText()).includes('$'), 'no price');
  });

  await check('08 add to cart updates the header count', async () => {
    await page.goto(base + '/product/1', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.locator('.cart-link .badge', { hasText: '2' }).waitFor();
  });

  await check('09 change quantity in the cart', async () => {
    await page.locator('.cart-link').click();
    await page.waitForURL('**/cart');
    await page.locator('.cart__item').first().waitFor();
    await page.locator('.cart__item').getByRole('button', { name: 'Increase quantity' }).click();
    await page.locator('.cart-link .badge', { hasText: '3' }).waitFor();
    await page.locator('.cart__item .qty span', { hasText: '3' }).waitFor();
  });

  await check('10 checkout returns a FakeStore order id', async () => {
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.locator('.page__title', { hasText: 'Order placed' }).waitFor();
    expect(/#\d+/.test(await page.locator('body').innerText()), 'no order id');
    await page.locator('.cart-link .badge', { hasText: '0' }).waitFor();
  });

  await check('11 deep link opens directly', async () => {
    await page.goto(base + '/product/5', { waitUntil: 'networkidle' });
    await page.locator('.pdp__title').waitFor();
    await page.goto(base + '/products?category=jewelery&sort=price-desc', { waitUntil: 'networkidle' });
    await page.locator('.page__title', { hasText: 'Jewellery' }).waitFor();
  });

  await check('12 browser back button', async () => {
    await cards().first().waitFor();
    await cards().first().locator('a').first().click();
    await page.waitForURL(/\/product\/\d+/);
    await page.locator('.pdp__title').waitFor();
    await page.goBack();
    await page.waitForURL(/category=jewelery/);
    await page.locator('.page__title', { hasText: 'Jewellery' }).waitFor();
  });

  await check('13 not-found page', async () => {
    await page.goto(base + '/does-not-exist', { waitUntil: 'networkidle' });
    await page.locator('.page__title', { hasText: 'Page not found' }).waitFor();
  });

  await check('14 no JavaScript errors in the console', async () => {
    // The not-found route of C returns HTTP 404 by design; the browser logs that as a console error.
    const real = errors.filter((e) => !/status of 404/.test(e));
    expect(real.length === 0, real.slice(0, 3).join(' | '));
  });

  const passed = results.filter((r) => r[1]).length;
  console.log(`\n${impl} (${base}): ${passed}/${results.length} passed`);
  for (const [name, ok, msg] of results) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  -> ${msg}`}`);
  failures += results.length - passed;
  if (process.env.GITHUB_ACTIONS) {
    // Annotations are visible through the GitHub API even when the raw logs are not.
    const failed = results.filter((r) => !r[1]).map((r) => `${r[0]}: ${r[2]}`).join(' || ');
    console.log(`::${failed ? 'error' : 'notice'} title=Functional ${impl}::${passed}/${results.length} passed${failed ? ' – ' + failed.slice(0, 900) : ''}`);
  }
  await page.close();
}

await browser.close();
process.exit(failures ? 1 : 0);
