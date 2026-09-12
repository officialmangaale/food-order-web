// Focused history and edge-state checks; all fixtures stay in this browser context.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.RESTAURANT_TEST_URL || 'http://localhost:3000';
const checks = [];
const check = (name) => { checks.push(name); console.log(`PASS ${name}`); };
const settle = (page) => page.waitForTimeout(550);
const heading = (page) => page.locator('[aria-label="Current dish"] h2');
const cart = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('mangaale-cart')).state);
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const entry of ['/', '/search?q=pizza']) {
    await page.goto(base + entry);
    const link = page.locator('a[href^="/restaurants/"]').first();
    await link.waitFor(); await link.scrollIntoViewIfNeeded(); await settle(page);
    const scroll = await page.evaluate(() => window.scrollY);
    const url = page.url();
    await link.click(); await page.locator('[data-restaurant-screen] h1').waitFor(); await settle(page);
    await page.getByRole('button', { name: 'Back', exact: true }).click(); await page.waitForURL(url); await settle(page);
    assert.ok(Math.abs((await page.evaluate(() => window.scrollY)) - scroll) < 4, `${entry} restores scroll`);
    assert.equal(await page.locator('body').evaluate((body) => body.style.overflow), '');
    assert.equal(await page.locator('a[href^="/restaurants/"]').first().evaluate((element) => Boolean(element.closest('[inert]'))), false);
    check(`Actual ${entry} link restores entry URL, scroll and usable chrome`);
  }
  const response = page.waitForResponse((result) => result.url().endsWith('/api/restaurants/17/menu/online'));
  await page.goto(`${base}/restaurants/17`);
  const payload = await (await response).json(); await heading(page).waitFor();
  const categories = payload.data.categories;
  const product = categories.flatMap((entry) => entry.items).find((entry) => entry.has_variants && entry.variants.length > 1);
  await page.getByRole('button', { name: 'Full menu', exact: true }).click();
  await page.getByRole('searchbox').fill(product.name);
  await page.locator(`[data-menu-item="${product.id}"]`).getByRole('button', { name: `View ${product.name}`, exact: true }).click(); await settle(page);
  for (const variant of product.variants.slice(0, 2)) {
    await page.getByRole('button', { name: new RegExp(`^(Add |Increase quantity of )${product.name}$`) }).click();
    await page.getByRole('radio', { name: new RegExp(variant.variant_name || variant.name) }).check();
    await page.getByRole('button', { name: /Add to cart/ }).click(); await settle(page);
  }
  assert.equal((await cart(page)).items.length, 2);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  assert.equal(await page.getByRole('heading', { name: 'Your selections' }).count(), 1);
  await page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByRole('button', { name: 'Increase item quantity' }).click();
  await page.getByRole('button', { name: /Save changes/ }).click(); await settle(page);
  assert.equal((await cart(page)).items.reduce((sum, line) => sum + line.quantity, 0), 3);
  check('Distinct variants remain separate and the selection manager edits the chosen line');
  const expectedNext = await page.getByRole('button', { name: /^Next:/ }).getAttribute('aria-label');
  await page.locator('[aria-label="Current dish"]').evaluate((element) => {
    element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [new Touch({ identifier: 1, target: element, clientX: 300, clientY: 350 })] }));
    element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: element, clientX: 100, clientY: 360 })] }));
  });
  await settle(page); assert.equal(await heading(page).innerText(), expectedNext.slice(6));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedNext = await page.getByRole('button', { name: /^Next:/ }).getAttribute('aria-label');
  await page.locator('main').focus(); await page.keyboard.press('ArrowRight'); await settle(page);
  assert.equal(await heading(page).innerText(), reducedNext.slice(6));
  check('Mobile swipe and reduced-motion keyboard navigation preserve exact destinations');
  // Reuse the current browser-local cart as a foreign-merchant conflict fixture.
  await page.evaluate(() => { const data = JSON.parse(localStorage.getItem('mangaale-cart')); data.state.restaurantId = 999999; data.state.restaurantName = 'Existing cart fixture'; data.state.items.forEach((item) => { item.restaurant_id = 999999; }); localStorage.setItem('mangaale-cart', JSON.stringify(data)); });
  await page.reload(); await heading(page).waitFor();
  await page.getByRole('button', { name: /^Add / }).last().click();
  await page.getByRole('heading', { name: 'Start a new cart?' }).waitFor();
  await page.getByRole('button', { name: 'Keep current cart' }).click(); await settle(page);
  assert.equal((await cart(page)).restaurantId, 999999);
  await page.getByRole('button', { name: /^Add / }).last().click();
  await page.getByRole('button', { name: 'Clear and add' }).click(); await settle(page);
  assert.equal((await cart(page)).items.length, 0);
  assert.ok(await page.getByRole('dialog').count(), 'Customisation remains open after explicit cart clear');
  await page.getByRole('button', { name: 'Close', exact: true }).click(); await settle(page);
  check('Merchant conflict keeps the cart on cancel and opens options only after explicit Clear and add');
  const errorContext = await browser.newContext(); const errorPage = await errorContext.newPage();
  let failing = true;
  await errorPage.route('**/api/restaurants/17/menu{,/online}', async (route) => {
    if (failing) await route.fulfill({ status: 503, json: { message: 'Local retry fixture' } });
    else await route.fulfill({ json: payload });
  });
  await errorPage.goto(`${base}/restaurants/17`);
  await errorPage.getByRole('button', { name: 'Retry menu' }).waitFor();
  failing = false; await errorPage.getByRole('button', { name: 'Retry menu' }).click();
  await heading(errorPage).waitFor();
  check('Failed menu requests display Retry and recover through the existing service');
  await errorContext.close();
  await mkdir(new URL('../artifacts/restaurant/', import.meta.url), { recursive: true });
  await writeFile(new URL('../artifacts/restaurant/navigation-checks.json', import.meta.url), JSON.stringify({ checks }, null, 2));
} finally { await browser.close(); }
