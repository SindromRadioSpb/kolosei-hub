import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const directory = new URL('./', import.meta.url);
const guide = new URL('../SEO_START_AND_GROWTH_GUIDE_2026_09_08.html', import.meta.url);
const markdown = await readFile(new URL('../SEO_START_AND_GROWTH_GUIDE_2026_09_08.md', import.meta.url), 'utf8');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { checkedAt: new Date().toISOString(), status: 'RUNNING', viewportCases: [], errors: [], externalRequests: [] };
try {
  for (const width of [1440, 380]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) report.externalRequests.push(request.url()); });
    await page.goto(guide.href);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h2').count(), 20);
    assert.equal(await page.locator('input[data-task]').count(), 7);
    const headings = await page.locator('h2').allTextContents();
    const expectedHeadings = [...markdown.matchAll(/^## (.+)$/gm)].map(match => match[1]);
    assert.deepEqual(headings, expectedHeadings);
    assert.equal(await page.locator('table').count(), 19);
    const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.getElementById(decodeURIComponent(link.hash.slice(1)))).map(link => link.hash));
    assert.deepEqual(brokenAnchors, []);
    for (const href of await page.locator('a').evaluateAll(links => [...new Set(links.filter(link => link.protocol === 'file:').map(link => link.href.split('#')[0]))])) await access(fileURLToPath(href));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: fileURLToPath(new URL(`guide-${width}-top.png`, directory)) });
    if (width === 380) {
      await page.locator('.mobile-toc summary').click();
      await page.locator('.mobile-toc .toc a').filter({ hasText: '4. Подключаем Google' }).click();
    } else await page.locator('.sidebar .toc a').filter({ hasText: '4. Подключаем Google' }).click();
    await page.screenshot({ path: fileURLToPath(new URL(`guide-${width}-google.png`, directory)) });
    await page.locator('h2').filter({ hasText: '10. Как увидеть переходы' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: fileURLToPath(new URL(`guide-${width}-analytics.png`, directory)) });
    const checkbox = page.locator('input[data-task]').first();
    await checkbox.check();
    await page.reload();
    assert.ok(await checkbox.isChecked(), 'Local progress must survive reload');
    await checkbox.uncheck();
    await page.locator('#font').click();
    assert.equal(await page.locator('#font').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('#font').click();
    await page.locator('#copy').click();
    await page.waitForFunction(() => /скопирован|вручную/.test(document.getElementById('status').textContent));
    assert.match(await page.locator('#status').textContent(), /скопирован|вручную/);
    await page.goto(guide.href);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('href'), '#guide');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'guide');
    report.viewportCases.push({ width, status: 'PASS', checks: 'Headings, local links, anchors, tables, reflow, TOC, persistent checklist, font size, clipboard or fallback, skip link' });
    await context.close();
  }
  const print = await browser.newContext({ viewport: { width: 794, height: 1123 } });
  const page = await print.newPage();
  await page.goto(guide.href);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.sidebar').isVisible(), false);
  const overflows = await page.locator('table').evaluateAll(tables => tables.filter(table => table.scrollWidth > table.clientWidth + 1).length);
  assert.equal(overflows, 0, 'Print tables must fit');
  await page.screenshot({ path: fileURLToPath(new URL('guide-print-preview.png', directory)) });
  report.print = 'PASS: print styles, hidden navigation, 19 tables fit';
  await print.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 380, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(guide.href);
  assert.equal(await noJsPage.locator('h2').count(), 20);
  await noJsPage.locator('.mobile-toc summary').click();
  assert.ok(await noJsPage.locator('.mobile-toc nav').isVisible());
  report.noJavaScript = 'PASS: all content and native TOC remain available';
  await noJs.close();
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.errors.push(error.stack); process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(new URL('verification.json', directory), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
