import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const base = arg('base', 'http://127.0.0.1:4322');
const output = resolve(arg('output', 'docs/research/website-discovery/2026-09-08/local'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { base, checkedAt: new Date().toISOString(), status: 'RUNNING', cases: [], errors: [] };
const paths = ['/', '/products/linguistpro/', '/products/reading-room/', '/agents/', '/guides/', '/guides/hebrew-reading/', '/guides/hebrew-through-songs/', '/guides/technical-hebrew/', '/about/', '/technology/', '/products/', '/privacy/'];
try {
  for (const width of [1440, 380]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    let failures = [];
    page.on('pageerror', e => failures.push(e.message));
    page.on('console', m => { if (m.type() === 'error') failures.push(m.text()); });
    for (const lang of ['en', 'ru']) {
      for (const path of paths) {
        failures = [];
        const route = (lang === 'ru' ? '/ru' : '') + path;
        const response = await page.goto(base + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('html').getAttribute('lang'), lang);
        const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
        assert.ok(overflow.content <= overflow.viewport + 1, `${route} at ${width}: overflow ${JSON.stringify(overflow)}`);
        assert.equal(await page.locator('h1').count(), 1);
        const brokenImages = await page.locator('img').evaluateAll(imgs => imgs.filter(i => i.getClientRects().length && i.loading !== 'lazy' && (!i.complete || i.naturalWidth === 0)).map(i => i.src));
        assert.deepEqual(brokenImages, []);
        if (path === '/') {
          const disclosure = page.locator('.sample-help');
          assert.equal(await disclosure.getAttribute('open'), null);
          await disclosure.locator('summary').focus();
          await page.keyboard.press('Enter');
          assert.notEqual(await disclosure.getAttribute('open'), null);
          assert.ok(await disclosure.locator('div').isVisible());
          await page.keyboard.press('Enter');
          assert.equal(await disclosure.getAttribute('open'), null);
        }
        if (await page.locator('.questions details').count()) {
          const faq = page.locator('.questions details').first();
          await faq.locator('summary').click();
          assert.ok(await faq.locator('p').isVisible());
          await faq.locator('summary').click();
        }
        if (path === '/products/linguistpro/') {
          assert.equal(await page.locator('video').getAttribute('autoplay'), null);
          assert.equal(await page.locator('video').getAttribute('preload'), 'none');
          await page.locator('.demo-disclosure summary').click();
          assert.ok(await page.locator('video').isVisible());
          await page.locator('.demo-disclosure summary').click();
        }
        if (path === '/products/reading-room/') {
          await page.locator('.interface-preview summary').click();
          const img = page.locator('.interface-preview img');
          await img.scrollIntoViewIfNeeded();
          await page.waitForFunction(() => { const img = document.querySelector('.interface-preview img'); return img?.complete && img.naturalWidth > 0; });
          await page.locator('.interface-preview summary').click();
        }
        if (['/', '/products/linguistpro/', '/products/reading-room/', '/agents/', '/guides/hebrew-reading/'].includes(path)) {
          await page.evaluate(() => window.scrollTo(0, 0));
          const name = `${lang}-${path === '/' ? 'home' : path.slice(1,-1).replaceAll('/', '-')}-${width}`;
          await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
          if (path === '/') await page.screenshot({ path: `${output}/${name}-viewport.png` });
        }
        assert.deepEqual(failures, [], `${route}: browser errors`);
        report.cases.push({ route, width, status: 'PASS', ...overflow });
      }
    }
    await context.close();
  }
  // Interaction navigation and user keyboard focus, not just DOM presence.
  const context = await browser.newContext({ viewport: { width: 380, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base + '/ru/');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'), '#main-content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main-content');
  await page.locator('header a[href="/ru/agents/"]').click();
  await page.waitForURL('**/ru/agents/');
  await page.locator('.lang-switch a[hreflang="en"]').click();
  await page.waitForURL('**/agents/');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await context.close();
  // Static public content remains useful when client scripts cannot run.
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 380, height: 844 } });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base + '/ru/');
  await staticPage.locator('.sample-help summary').click();
  assert.ok(await staticPage.locator('.sample-help div').isVisible());
  assert.equal(await staticPage.locator('.corpus-book').count(), 3);
  await noJs.close();
  // Dark mode and zoom/reflow of affected surfaces.
  const dark = await browser.newContext({ colorScheme: 'dark', viewport: { width: 380, height: 844 } });
  const darkPage = await dark.newPage();
  for (const path of ['/ru/', '/ru/products/reading-room/', '/ru/agents/']) {
    await darkPage.goto(base + path);
    await darkPage.screenshot({ path: `${output}/dark-${path.replaceAll('/', '-')}.png`, fullPage: true });
    assert.ok(await darkPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  }
  await darkPage.emulateMedia({ colorScheme: 'light' });
  await darkPage.setViewportSize({ width: 320, height: 844 });
  await darkPage.goto(base + '/ru/');
  assert.ok(await darkPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await dark.close();
  report.interactions = 'PASS: keyboard disclosure, FAQ, video disclosure, skip link, agent navigation, language switch, no-JS, dark mode, 320px reflow';
  report.status = 'PASS';
} catch (e) {
  report.status = 'FAIL'; report.errors.push(e.stack); process.exitCode = 1;
} finally {
  await writeFile(`${output}/browser-report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ status: report.status, cases: report.cases.length, errors: report.errors, output }, null, 2));
