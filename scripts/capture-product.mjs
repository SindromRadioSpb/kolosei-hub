import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1360, height: 1040 }, locale: 'ru-RU', colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('https://linguistpro.kolosei.com/library.html?public_corpus=study-songs', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.public-corpus .group-work-card', { timeout: 60000 });
  await page.waitForSelector('.public-corpus [data-learning-index-status][data-state="ready"]', { timeout: 120000 });
  const filters = page.locator('summary').filter({ hasText: 'Фильтры' });
  if (await filters.count()) {
    const isOpen = await filters.first().evaluate(el => el.parentElement.hasAttribute('open'));
    if (isOpen) await filters.first().click();
  }
  await page.evaluate(() => document.fonts.ready);
  await mkdir('public/img', { recursive: true });
  await page.screenshot({ path: 'public/img/reading-room-current.png' });
  const source = await (await fetch('https://linguistpro.kolosei.com/')).text();
  await writeFile('docs/research/website-discovery/2026-09-08/product-capture.json', JSON.stringify({
    url: page.url(), capturedAt: new Date().toISOString(), viewport: { width: 1360, height: 1040 },
    profile: 'isolated, signed out', interaction: 'collapsed optional filters using the visible disclosure',
    cards: await page.locator('.public-corpus .group-work-card').count(),
    version: source.match(/window\.APP_VERSION\s*=\s*["']([^"']+)/)?.[1],
  }, null, 2) + '\n');
  await context.close();
} finally { await browser.close(); }
