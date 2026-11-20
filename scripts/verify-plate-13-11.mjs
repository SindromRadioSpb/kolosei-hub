import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
  '.json':'application/json','.webp':'image/webp'};
const server = process.argv[2] ? null : createServer(async (req,res) => {
  const {pathname} = new URL(req.url,'http://localhost');
  const path = resolve(root,'.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!path.startsWith(root + sep)) return res.writeHead(404).end();
  try {
    const data = await readFile(path);
    res.writeHead(200,{'content-type':types[extname(path)] || 'application/octet-stream'}).end(data);
  } catch { res.writeHead(404).end(); }
});
if (server) await new Promise(done => server.listen(0,'127.0.0.1',done));
const origin = process.argv[2]?.replace(/\/$/,'') || `http://127.0.0.1:${server.address().port}`;
const route = '/play/solidworks-instructor/plate-13-11/';
const url = origin + route;
const lesson = await fetch(url+'lesson.json').then(response => {
  assert.ok(response.ok);
  return response.json();
});
const browser = await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});
const firstInput = lesson.steps.findIndex(step => step.kind === 'input');
const callout = lesson.steps.findIndex(step => step.exact);
const frameReady = page => page.locator('#frame[data-ready="true"]').waitFor();
const expectedStep = async (page,index) => {
  await page.waitForFunction(number =>
    document.querySelector('#stepcount').textContent.startsWith(`шаг ${number} /`), index+1);
  await frameReady(page);
};

async function run() {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin+'/ru/products/solidworks-instructor/plate-13-11/');
  await page.getByRole('link',{name:'Пройти урок в браузере'}).click();
  await expectedStep(page,0);
  assert.ok(await page.locator('#route button').last().isDisabled());
  const kinds = {};
  for (const [index,step] of lesson.steps.entries()) {
    await expectedStep(page,index);
    kinds[step.kind]=(kinds[step.kind] || 0) + 1;
    if (step.kind === 'input') {
      const answer = typeof step.value === 'number' ? String(step.value).replace('.',',') : step.value;
      await page.locator('#popin').fill(answer);
      await page.locator('#pop button').click();
      assert.equal(await page.locator('#s-err').textContent(),'0',step.title);
    } else if (step.kind === 'click') {
      const hot = await page.locator('#hot').boundingBox();
      const frame = await page.locator('#frame').boundingBox();
      const x = hot.x + hot.width/2, y = hot.y + hot.height/2;
      assert.ok(x > frame.x && y > frame.y && x < frame.x+frame.width && y < frame.y+frame.height, step.title);
      if (step.modifier) await page.keyboard.down(step.modifier);
      await page.mouse.click(x,y);
      if (step.modifier) await page.keyboard.up(step.modifier);
    } else {
      const title = page.locator('#title');
      assert.equal(await title.textContent(),step.title);
      if (step.model) await page.waitForFunction(model=>document.querySelector('#viewer').dataset.model===model,step.model);
      else assert.ok(await page.locator('#model-card').isHidden());
      for (const view of step.views || []) {
        await page.getByRole('button',{name:view.name,exact:true}).click();
        await frameReady(page);
        assert.equal(await page.locator('#shot').getAttribute('src'),view.shot);
      }
      if (process.env.SW_PLATE_SCREENSHOTS) {
        await page.screenshot({path:`${process.env.SW_PLATE_SCREENSHOTS}-${step.block}.png`});
      }
      await page.locator('#skip').click();
      console.log('PASS result',step.block);
    }
  }
  await page.getByRole('heading',{name:'Плита построена'}).waitFor();
  assert.equal(await page.locator('#s-time').textContent(),String(lesson.steps.length));
  assert.equal(await page.locator('#s-err').textContent(),'0');
  assert.deepEqual(errors,[]);
  await page.reload();
  await page.getByRole('heading',{name:'Плита построена'}).waitFor();
  await page.locator('#skip').click();
  await expectedStep(page,0);
  assert.equal(await page.locator('#s-time').textContent(),'0');
  await page.close();
  console.log('PASS clean desktop route, saved completion and restart',kinds);
}

async function focused() {
  const results = lesson.steps.findIndex(step => step.block==='chamfers' && step.kind==='result');
  for (const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]) {
    const page = await browser.newPage({viewport});
    await page.addInitScript(({index,revision}) => {
      localStorage.setItem('plate-13-11.progress.'+revision+'.guide',
        JSON.stringify({confirmed:index,cursor:index,errors:0,hints:0}));
    },{index:results,revision:lesson.revision});
    await page.goto(url);
    await expectedStep(page,results);
    for (const selector of ['#frame','.stagebar','#skip']) {
      const bounds = await page.locator(selector).boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y+bounds.height <= viewport.height + 1,selector);
    }
    await page.close();
  }
  const test = await browser.newPage({viewport:{width:1366,height:768}});
  await test.addInitScript(({index,revision}) => {
    localStorage.setItem('plate-13-11.mode',JSON.stringify('test'));
    localStorage.setItem('plate-13-11.progress.'+revision+'.test',
      JSON.stringify({confirmed:index,cursor:index,errors:0,hints:0}));
  },{index:callout,revision:lesson.revision});
  await test.goto(url);
  await expectedStep(test,callout);
  assert.doesNotMatch(await test.locator('#text').textContent(), /M7x1/);
  await test.locator('#popin').fill('M7x1-extra');
  await test.locator('#popin').press('Enter');
  assert.equal(await test.locator('#s-err').textContent(),'1');
  await test.locator('#popin').fill('M7x1');
  await test.locator('#popin').press('Enter');
  await expectedStep(test,callout+1);
  await test.getByRole('button',{name:'Покажи',exact:true}).click();
  await test.locator('#route button').first().click();
  await expectedStep(test,0);
  assert.equal(await test.locator('#route .done').count(),0);
  await test.getByRole('button',{name:'Проверка',exact:true}).click();
  await expectedStep(test,callout+1);
  assert.ok(firstInput >= 0);
  await test.close();
  console.log('PASS desktop layout, exact answer, watch and saved practice');
}

try { await Promise.all([run(),focused()]); }
finally { await browser.close(); server?.close(); }
