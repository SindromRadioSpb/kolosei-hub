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
const angle = lesson.steps.findIndex(step => step.native_hint === 67);
const diameter = lesson.steps.findIndex(step => step.native_hint === 55);
const modifier = lesson.steps.findIndex(step => step.modifier);
const savePrefix = process.env.SW_PLAYER_SCREENSHOTS;
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });

async function waitForStep(page, index) {
  await page.waitForFunction(number => document.querySelector('#stepcount').textContent.startsWith(`шаг ${number} /`), index + 1);
  await page.locator('#frame[data-ready="true"]').waitFor();
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
  else {
    if (step.modifier) await page.keyboard.down(step.modifier);
    await page.mouse.click(x, y);
    if (step.modifier) await page.keyboard.up(step.modifier);
  }
}

async function inspectResult(page, step) {
  assert.equal(await page.locator('#frame').evaluate(el => el.classList.contains('result')), true);
  assert.equal(await page.locator('#layer').evaluate(el => getComputedStyle(el).transform), 'none');
  assert.ok(await page.locator('#hot').isHidden());
  assert.ok(await page.locator('#cursor').isHidden());
  const image = page.locator('#shot');
  assert.equal(await image.getAttribute('src'), step.shot);
  await image.evaluate(el => el.decode());
  await page.locator('#frame[data-ready="true"]').waitFor();
  const frame = await page.locator('#frame').boundingBox();
  const picture = await image.boundingBox();
  assert.ok(Math.abs(picture.x - frame.x) < 1 && Math.abs(picture.y - frame.y) < 1);
  assert.ok(Math.abs(picture.width - frame.width) < 1 && Math.abs(picture.height - frame.height) < 1);
  if (step.model) await page.waitForFunction(url => document.querySelector('#viewer').dataset.model === url, step.model);
  for (const view of step.views || []) {
    await page.getByRole('button', {name: view.name, exact: true}).click();
    assert.equal(await image.getAttribute('src'), view.shot);
    await image.evaluate(el => el.decode());
    await page.locator('#frame[data-ready="true"]').waitFor();
  }
  if (step.views) {
    await page.getByRole('button', {name: step.views[0].name, exact: true}).click();
    await page.locator('#frame[data-ready="true"]').waitFor();
  }
}

async function fullRoute() {
  const desktop = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [];
  desktop.on('pageerror', error => { errors.push(error.message); console.error(error); });
  await desktop.goto(base + '/ru/products/solidworks-instructor/part-m16/');
  await desktop.getByRole('link', {name: 'Пройти урок в браузере'}).click();
  await waitForStep(desktop, 0);
  assert.ok(await desktop.locator('#route button').count() === lesson.blocks.length);
  assert.ok(await desktop.locator('#model-card').isHidden());
  assert.ok(await desktop.locator('#route button').last().isDisabled());
  await desktop.keyboard.press('ArrowRight');
  await waitForStep(desktop, 0);
  const totals = {click: 0, hover: 0, input: 0, result: 0};
  for (let index = 0; index < lesson.steps.length; index++) {
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
  assert.equal(await desktop.locator('#route .done').count(), lesson.blocks.length);
  assert.equal(await desktop.locator('#s-hint').textContent(), '0');
  assert.equal(await desktop.locator('#s-time').textContent(), String(lesson.steps.length));
  await desktop.reload();
  await desktop.getByRole('heading', {name:'Деталь M16 построена'}).waitFor();
  await desktop.locator('#skip').click();
  await waitForStep(desktop, 0);
  assert.equal(await desktop.locator('#s-time').textContent(), '0');
  assert.equal(await desktop.locator('#route .done').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS complete desktop route, saved completion and restart', totals);
  await desktop.close();
}

async function focusedChecks() {
  async function openAt(index, viewport = {width: 1366, height: 768}, mode = 'guide') {
    const page = await browser.newPage({viewport});
    await page.addInitScript(({index, revision, mode}) => {
      const key = `part-m16.progress.${revision}.${mode}`;
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify({confirmed:index, cursor:index, errors:0, hints:0}));
        localStorage.setItem('part-m16.mode', JSON.stringify(mode));
      }
    }, {index, revision:lesson.revision, mode});
    return page;
  }

  const layouts = [{width:1280, height:720}, {width:1366, height:768},
    {width:1440, height:900}, {width:1920, height:1080}];
  for (const viewport of layouts) {
    for (const index of [0, angle, mountEnd, lesson.steps.length]) {
      const page = await openAt(index, viewport);
      await page.goto(base + player);
      if (index === lesson.steps.length) {
        await page.getByRole('heading', {name:'Деталь M16 построена'}).waitFor();
        await page.locator('#frame[data-ready="true"]').waitFor();
      } else await waitForStep(page, index);
      const model = index === lesson.steps.length ? lesson.final.model : lesson.steps[index].model;
      if (model) await page.waitForFunction(url => document.querySelector('#viewer').dataset.model === url, model);
      for (const selector of ['#frame', '.stagebar', '.modes', '#title',
        index >= mountEnd ? '#skip' : '#zoom']) {
        const bounds = await page.locator(selector).boundingBox();
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1,
          `${viewport.width}×${viewport.height}: ${selector} at step ${index + 1} exceeds viewport ${JSON.stringify(bounds)}`);
      }
      if (savePrefix) await page.screenshot({path:`${savePrefix}-${viewport.width}x${viewport.height}-${index}.png`});
      if (index === angle) {
        const frame = await page.locator('#frame').boundingBox();
        const form = await page.locator('#pop').boundingBox();
        assert.ok(form.x >= frame.x && form.x + form.width <= frame.x + frame.width &&
          form.y >= frame.y && form.y + form.height <= frame.y + frame.height);
      }
      await page.close();
    }
    console.log('PASS desktop layout', viewport.width, viewport.height);
  }

  const test = await openAt(angle, undefined, 'test');
  await test.goto(base + player);
  await waitForStep(test, angle);
  assert.doesNotMatch(await test.locator('#text').textContent(), /\b60\b/);
  assert.equal(await test.locator('#ov rect').count() > 0, true);
  assert.ok(await test.locator('#hot').isHidden());
  await test.locator('#popin').fill('999');
  await test.locator('#popin').press('Enter');
  assert.equal(await test.locator('#s-err').textContent(), '1');
  await test.locator('#hint').click();
  assert.match(await test.locator('#msg').textContent(), /60/);
  await test.reload();
  await waitForStep(test, angle);
  assert.equal(await test.locator('#s-err').textContent(), '1');
  assert.equal(await test.locator('#s-hint').textContent(), '1');
  await test.locator('#popin').fill('60°');
  await test.locator('#popin').press('Enter');
  await waitForStep(test, angle + 1);
  await test.getByRole('button', {name:'Покажи', exact:true}).click();
  await test.locator('#route button').last().click();
  assert.equal(await test.locator('#route .done').count(), 0);
  assert.ok(await test.locator('.stats').isHidden());
  await test.getByRole('button', {name:'Проверка', exact:true}).click();
  await waitForStep(test, angle + 1);
  assert.equal(await test.locator('#s-time').textContent(), String(angle + 1));
  await test.close();
  console.log('PASS hidden answer, input with unit, saved statistics and separate demonstration');

  const round = await openAt(diameter, undefined, 'test');
  await round.goto(base + player);
  await waitForStep(round, diameter);
  assert.doesNotMatch(await round.locator('#stepcard').innerText(), /\b18\b/);
  assert.equal(await round.locator('#ov .answer-mask').count(), 1);
  if (savePrefix) await round.screenshot({path:`${savePrefix}-test-diameter.png`});
  await round.close();

  const watch = await openAt(mountEnd - 1);
  await watch.goto(base + player);
  await waitForStep(watch, mountEnd - 1);
  await watch.getByRole('button', {name:'Покажи', exact:true}).click();
  await waitForStep(watch, mountEnd);
  assert.ok(await watch.locator('#play').isHidden());
  await watch.waitForTimeout(1300);
  await waitForStep(watch, mountEnd);
  await watch.getByRole('button', {name:'Повторяй', exact:true}).click();
  await waitForStep(watch, mountEnd - 1);
  await watch.close();
  console.log('PASS demonstration pauses at the stage result and preserves practice');

  const paired = await openAt(modifier);
  await paired.goto(base + player);
  await waitForStep(paired, modifier);
  await playAction(paired, {...lesson.steps[modifier], modifier:undefined});
  assert.equal(await paired.locator('#s-err').textContent(), '1');
  await playAction(paired, lesson.steps[modifier]);
  await waitForStep(paired, modifier + 1);
  await paired.close();
  console.log('PASS required keyboard modifier');

  const failure = await openAt(1);
  const nextShot = lesson.steps[1].shot;
  let releaseFailure;
  const delayed = new Promise(done => { releaseFailure = done; });
  await failure.route(`**/${nextShot.split('/').at(-1)}`, async route => {
    await delayed;
    await route.fulfill({status:404, body:'Image unavailable'});
  });
  await failure.goto(base + player, {waitUntil:'domcontentloaded'});
  await failure.locator('#frame[data-ready="false"]').waitFor();
  await failure.locator('#frame').click();
  await failure.keyboard.press('ArrowRight');
  assert.equal(await failure.locator('#s-time').textContent(), '1');
  assert.ok(await failure.locator('#hot').isHidden());
  releaseFailure();
  await failure.locator('#frame-retry').click();
  await waitForStep(failure, 1);
  await playAction(failure, lesson.steps[1]);
  await waitForStep(failure, 2);
  await failure.close();
  console.log('PASS click gating on slow frame and retry on image error');

  const stale = await openAt(1);
  let sendStale;
  let received;
  const requestSeen = new Promise(done => { received = done; });
  const staleGate = new Promise(done => { sendStale = done; });
  await stale.route(`**/${nextShot.split('/').at(-1)}`, async route => {
    received();
    await staleGate;
    await route.fulfill({status:404, body:'Old image request'});
  });
  await stale.goto(base + player, {waitUntil:'domcontentloaded'});
  await requestSeen;
  await stale.locator('#back').click();
  await waitForStep(stale, 0);
  const oldResponse = stale.waitForResponse(response => response.url().endsWith(nextShot));
  sendStale();
  await oldResponse;
  await waitForStep(stale, 0);
  assert.ok(await stale.locator('#frame-status').isHidden());
  assert.equal(await stale.locator('#shot').getAttribute('src'), lesson.steps[0].shot);
  await stale.close();
  console.log('PASS stale frame response cannot affect the current step');

  for (const route of ['bracket', 'bolt-m8x40']) {
    const page = await browser.newPage();
    await page.goto(base + '/play/solidworks-instructor/' + route + '/');
    await page.locator('#hot').waitFor();
    assert.match(await page.locator('#stepcount').textContent(), /шаг 1/);
    await page.close();
  }
  console.log('PASS existing bracket and bolt routes');
}

try {
  const suite = process.env.SW_PLAYER_SUITE;
  await Promise.all([
    ...(suite === 'focused' ? [] : [fullRoute()]),
    ...(suite === 'full' ? [] : [focusedChecks()]),
  ]);
} finally {
  await browser.close();
  server?.close();
}
