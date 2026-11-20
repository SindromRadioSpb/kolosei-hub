import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

// Without a URL the test serves the already built site from dist.
const root = resolve('dist');
const contentTypes = {
  '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp',
};
const server = process.argv[2] ? null : createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(root + sep)) return response.writeHead(404).end();
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
if (server) await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = process.argv[2]?.replace(/\/$/, '') || `http://127.0.0.1:${server.address().port}`;
const player = '/play/solidworks-instructor/part-m16/';
const lesson = await fetch(base + player + 'lesson.json').then(response => {
  assert.ok(response.ok);
  return response.json();
});
const mountEnd = lesson.steps.findIndex(step => step.block === 'mount' && step.kind === 'result');
const start = process.env.SW_PLAYER_FOCUS ? mountEnd - 1 : 0;
const savePrefix = process.env.SW_PLAYER_SCREENSHOTS;
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });

async function waitForStep(page, index) {
  await page.waitForFunction(number => document.querySelector('#stepcount').textContent.startsWith(`шаг ${number} /`), index + 1);
}

async function playAction(page, step) {
  if (step.kind === 'input') {
    await page.locator('#popin').fill(String(step.value).replace('.', ','));
    await page.locator('#pop button').click();
    return;
  }
  const hotspot = page.locator('#hot');
  const visible = await hotspot.boundingBox();
  const frame = await page.locator('#frame').boundingBox();
  const x = visible.x + visible.width / 2;
  const y = visible.y + visible.height / 2;
  assert.ok(x > frame.x && x < frame.x + frame.width && y > frame.y && y < frame.y + frame.height, step.title);
  if (step.kind === 'hover') await page.mouse.move(x, y);
  else await page.mouse.click(x, y);
}

async function inspectResult(page, step) {
  assert.equal(await page.locator('#frame').evaluate(el => el.classList.contains('result')), true);
  assert.equal(await page.locator('#layer').evaluate(el => getComputedStyle(el).transform), 'none');
  assert.ok(await page.locator('#hot').isHidden());
  assert.ok(await page.locator('#cursor').isHidden());
  const image = page.locator('#shot');
  assert.equal(await image.getAttribute('src'), step.shot);
  await image.evaluate(el => el.decode());
  const frame = await page.locator('#frame').boundingBox();
  const picture = await image.boundingBox();
  assert.ok(Math.abs(picture.x - frame.x) < 1 && Math.abs(picture.y - frame.y) < 1);
  assert.ok(Math.abs(picture.width - frame.width) < 1 && Math.abs(picture.height - frame.height) < 1);
  if (step.model) await page.waitForFunction(url => document.querySelector('#viewer').dataset.model === url, step.model);
  for (const view of step.views || []) {
    await page.getByRole('button', {name: view.name, exact: true}).click();
    assert.equal(await image.getAttribute('src'), view.shot);
    await image.evaluate(el => el.decode());
  }
  if (step.views) await page.getByRole('button', {name: step.views[0].name, exact: true}).click();
}

try {
  const desktop = await browser.newPage({viewport: {width: 1440, height: 1000}});
  if (start) await desktop.addInitScript(index => localStorage.setItem('part-m16.idx', String(index)), start);
  const errors = [];
  desktop.on('pageerror', error => { errors.push(error.message); console.error(error); });
  await desktop.goto(base + '/ru/products/solidworks-instructor/part-m16/');
  await desktop.getByRole('link', {name: 'Пройти урок в браузере'}).click();
  await waitForStep(desktop, start);
  assert.ok(await desktop.locator('#route button').count() === lesson.blocks.length);
  const totals = {click: 0, hover: 0, input: 0, result: 0};
  for (let index = start; index < lesson.steps.length; index++) {
    const step = lesson.steps[index];
    await waitForStep(desktop, index);
    totals[step.kind]++;
    if (step.kind !== 'result') await playAction(desktop, step);
    else {
      await inspectResult(desktop, step);
      if (step.block === 'mount' || step.block === 'thread') {
        await desktop.waitForTimeout(1300);
        await waitForStep(desktop, index);
        if (savePrefix) await desktop.screenshot({path: `${savePrefix}-${step.block}.png`});
      }
      await desktop.locator('#skip').click();
      console.log('PASS stage', step.block);
    }
  }
  await desktop.getByRole('heading', {name:'Деталь M16 построена'}).waitFor();
  assert.equal(await desktop.locator('#s-err').textContent(), '0');
  assert.deepEqual(errors, []);
  console.log(start ? 'PASS desktop chamfer stages' : 'PASS complete desktop route', totals);
  await desktop.close();

  const phone = await browser.newPage({viewport: {width:390,height:844}, isMobile:true, hasTouch:true});
  await phone.addInitScript(index => localStorage.setItem('part-m16.idx', String(index)), mountEnd - 1);
  await phone.goto(base + player);
  await waitForStep(phone, mountEnd - 1);
  await phone.locator('#frame').scrollIntoViewIfNeeded();
  const hotspot = await phone.locator('#hot').boundingBox();
  await phone.touchscreen.tap(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);
  await waitForStep(phone, mountEnd);
  await inspectResult(phone, lesson.steps[mountEnd]);
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (savePrefix) await phone.screenshot({path: `${savePrefix}-phone.png`});
  await phone.getByRole('button', {name:'Покажи'}).click();
  await phone.waitForTimeout(1800);
  await waitForStep(phone, mountEnd);
  await phone.getByRole('button', {name:'Проверка'}).click();
  await phone.locator('#back').click();
  assert.ok(await phone.locator('#hot').isHidden());
  await phone.locator('#hint').click();
  assert.ok(await phone.locator('#hot').isVisible());
  console.log('PASS mobile mounting chamfers, result pause and test hints');
  await phone.close();

  const mobileInput = await browser.newPage({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
  const angle = lesson.steps.findIndex(step => step.native_hint === 67);
  assert.ok(angle >= 0);
  await mobileInput.addInitScript(index => localStorage.setItem('part-m16.idx', String(index)), angle);
  await mobileInput.goto(base + player);
  await waitForStep(mobileInput, angle);
  await mobileInput.locator('#popin').fill('60');
  const frame = await mobileInput.locator('#frame').boundingBox();
  const form = await mobileInput.locator('#pop').boundingBox();
  assert.ok(form.x >= frame.x && form.x + form.width <= frame.x + frame.width &&
    form.y >= frame.y && form.y + form.height <= frame.y + frame.height);
  await mobileInput.locator('#pop button').tap();
  await waitForStep(mobileInput, angle + 1);
  console.log('PASS mobile numerical input fits the zoomed frame');
  await mobileInput.close();

  for (const route of ['bracket', 'bolt-m8x40']) {
    const page = await browser.newPage();
    await page.goto(base + '/play/solidworks-instructor/' + route + '/');
    await page.locator('#hot').waitFor();
    assert.match(await page.locator('#stepcount').textContent(), /шаг 1/);
    await page.close();
  }
  console.log('PASS existing bracket and bolt routes');
} finally {
  await browser.close();
  server?.close();
}
