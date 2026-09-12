// Runs against the local app with an externally installed Playwright module.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.HOME_TEST_URL || 'http://localhost:3000';
const out = new URL('../artifacts/home-responsive/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('mangaale-location', JSON.stringify({ state: {
      latitude: 28.6139, longitude: 77.2090, permissionStatus: 'granted', label: 'Current location',
    }, version: 0 }));
    localStorage.setItem('mangaale-auth', JSON.stringify({ state: {
      token: null, user: { name: 'Gursevak' }, isAuthenticated: false,
    }, version: 0 }));
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  // Reproduce the screenshot's no-categories state without changing service rules.
  await page.route('**/customer-web/categories?*', (route) => route.fulfill({ json: { success: true, data: { categories: [] } } }));
  await page.route('**/api/restaurants?*', (route) => route.fulfill({ json: { data: { restaurants: [], pagination: { has_more: false } } } }));
  await page.goto(base);
  await page.getByRole('heading', { name: 'No categories available near you' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const sizes = [
    [320, 568], [360, 640], [390, 844], [480, 800], [640, 900], [768, 1024],
    [820, 1180], [844, 390], [1024, 768], [1280, 800], [1440, 900], [1920, 1080],
    [2560, 1440], [2880, 1542],
  ];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(120);
    const metrics = await page.evaluate(() => {
      const header = document.querySelector('[data-app-header]');
      const title = header.querySelector('h1');
      const search = [...header.querySelectorAll('form')].find((el) => el.getBoundingClientRect().width > 0);
      const empty = document.querySelector('#explore-categories h3').parentElement;
      const button = empty.querySelector('button');
      const rect = (el) => el.getBoundingClientRect().toJSON();
      return { viewport: innerWidth, bodyWidth: document.body.scrollWidth, header: rect(header),
        title: rect(title), titleOverflow: title.scrollWidth > title.clientWidth + 1,
        search: rect(search), empty: rect(empty), action: rect(button),
        imageRight: getComputedStyle(header, '::before').right,
      };
    });
    assert.ok(metrics.bodyWidth <= width + 1, `No document overflow at ${width}`);
    assert.equal(metrics.titleOverflow, false, `Greeting wraps at ${width}`);
    for (const key of ['title', 'search', 'empty', 'action']) {
      assert.ok(metrics[key].left >= 0 && metrics[key].right <= width + 1, `${key} fits at ${width}`);
    }
    assert.ok(metrics.search.top >= metrics.title.bottom, `Search clears greeting at ${width}`);
    assert.ok(metrics.search.bottom <= metrics.header.bottom, `Header fits its content at ${width}`);
    assert.ok(metrics.action.top >= metrics.empty.top && metrics.action.bottom <= metrics.empty.bottom, `Empty-state action fits at ${width}`);
    if (width >= 800) assert.ok(metrics.empty.height < 200, `Desktop empty state is compact at ${width}`);
    results.push({ width, height, ...metrics });
    console.log(`PASS ${width} x ${height}`);
    if ([390, 768, 1440, 2560].includes(width)) {
      await page.locator('nextjs-portal').evaluateAll((nodes) => nodes.forEach((node) => { node.style.display = 'none'; }));
      await page.screenshot({ path: fileURLToPath(new URL(`home-${width}.png`, out)) });
    }
  }
  // Stress personalised content and text zoom without editing application data.
  for (const width of [320, 640, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('[data-app-header] h1').evaluate((el) => {
      el.textContent = 'Good evening, AReallyLongCustomerNameWithoutSpaces 👋';
    });
    await page.locator('[aria-label="Choose delivery location"]').first().evaluate((el) => {
      const text = el.querySelector('.truncate');
      if (text) text.textContent = 'A very long delivery address with building and neighbourhood details';
    });
    assert.equal(await page.locator('[data-app-header] h1').evaluate((el) => el.scrollWidth > el.clientWidth + 1), false);
    assert.ok(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth + 1));
    const input = page.locator('input#site-search:visible');
    await input.fill('Pizza');
    const inputRect = await input.boundingBox();
    const clearRect = await page.getByRole('button', { name: 'Clear search' }).boundingBox();
    const filterRect = await page.getByRole('button', { name: 'Search with filters' }).boundingBox();
    assert.ok(clearRect.x + clearRect.width <= filterRect.x + 1);
    assert.ok(filterRect.x + filterRect.width <= inputRect.x + inputRect.width);
    console.log(`PASS long content and search controls at ${width}`);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.ok(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth + 1));
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.locator('#explore-categories').getByRole('button', { name: 'Change location', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  console.log('PASS text zoom and Change location action');
  const live = await browser.newPage({ viewport: { width: 390, height: 844 } });
  live.on('pageerror', (error) => errors.push(error.message));
  await live.goto(base);
  const category = live.getByRole('radio', { name: 'Pizza', exact: true });
  await category.waitFor();
  await live.evaluate(() => document.fonts.ready);
  await live.locator('nextjs-portal').evaluateAll((nodes) => nodes.forEach((node) => { node.style.display = 'none'; }));
  await live.screenshot({ path: fileURLToPath(new URL('home-populated-mobile.png', out)) });
  await live.evaluate(() => window.scrollTo({ top: 140, behavior: 'instant' }));
  const scroll = await live.evaluate(() => window.scrollY);
  await category.click();
  await live.locator('[data-category-screen]').waitFor();
  await live.getByRole('button', { name: 'Back', exact: true }).click();
  await live.waitForURL(base + '/');
  await live.waitForTimeout(250);
  assert.ok(Math.abs(await live.evaluate(() => window.scrollY) - scroll) < 3);
  console.log('PASS live populated home, category navigation, and scroll restoration');
  assert.deepEqual(errors, []);
  await writeFile(new URL('checks.json', out), JSON.stringify({ results, errors, longContent: 'passed', textZoom: 'passed', locationAction: 'passed' }, null, 2));
} finally {
  await browser.close();
}
