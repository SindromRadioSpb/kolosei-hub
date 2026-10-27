import { chromium } from 'playwright';
import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const origin = process.env.BRACKET_TEST_ORIGIN || 'http://127.0.0.1:4325';
const lesson = JSON.parse(await readFile('public/play/solidworks-instructor/bracket/lesson.json', 'utf8'));
assert.equal(lesson.title, 'Урок 3. Кронштейн');
assert.equal(lesson.blocks.length, 4);
assert(lesson.steps.length > 100);
for (const step of lesson.steps) {
  assert(step.rect.length === 4 && step.rect[0] >= 0 && step.rect[1] >= 0 && step.rect[2] <= lesson.screen.w && step.rect[3] <= lesson.screen.h);
  await access(path.join('public/play/solidworks-instructor/bracket', step.shot));
}
for (const block of lesson.blocks) await access(path.join('public/play/solidworks-instructor/bracket', block.model));

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({executablePath: chrome, headless: true, args: ['--use-angle=swiftshader']});
const errors=[];
try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin+'/products/solidworks-instructor/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.getByRole('link',{name:'Try “Lesson 3. Bracket”'}).count(),1);
  await page.getByRole('link',{name:'Try “Lesson 3. Bracket”'}).click();
  await page.getByRole('link',{name:'Start the lesson'}).first().click();
  await page.waitForFunction(() => document.querySelector('#stepcount')?.textContent.includes('/'));
  assert.equal(await page.locator('h1').innerText(),'Урок 3. Кронштейн');
  await page.waitForFunction(() => document.querySelector('#vlabel')?.textContent === 'после блока 1',null,{timeout:30000});
  assert.equal(await page.locator('#viewer canvas').count(),1);
  await page.screenshot({path:'.tmp/bracket-desktop.png',fullPage:true});
  for (let i=0;i<lesson.steps.length;i++) {
    const step=lesson.steps[i];
    assert.equal(await page.locator('#title').innerText(),step.title,`step ${i+1}`);
    await page.waitForFunction(() => { const i=document.querySelector('#shot');return i.complete && i.naturalWidth > 0; });
    if(step.kind==='input') {
      if(i===lesson.steps.findIndex(s=>s.kind==='input')) {
        await page.locator('#popin').fill(String(step.value+1));
        await page.locator('#pop button').click();
        assert.match(await page.locator('#msg').innerText(),/не совпадает/);
      }
      await page.locator('#popin').fill(String(step.value));await page.locator('#pop button').click();
    } else {
      const image=await page.locator('#shot').boundingBox();
      const x=image.x+(step.rect[0]+step.rect[2])/2/lesson.screen.w*image.width;
      const y=image.y+(step.rect[1]+step.rect[3])/2/lesson.screen.h*image.height;
      await page.mouse.click(x,y);
    }
    await page.waitForFunction(({i,n}) => i===n-1 ? document.querySelector('#title')?.textContent==='Кронштейн построен' : document.querySelector('#stepcount')?.textContent===`шаг ${i+2} / ${n}`, {i,n:lesson.steps.length}, {timeout:10000});
    if(i===0) { await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(() => document.querySelector('#stepcount')?.textContent.startsWith('шаг 2 /')); }
  }
  assert.match(await page.locator('#text').innerText(),new RegExp(`Вы прошли ${lesson.steps.length} шаг`));
  await page.waitForFunction(() => document.querySelector('#vlabel')?.textContent === 'готовая деталь',null,{timeout:30000});
  await page.locator('#m-test').click();
  await page.locator('#skip').click();
  assert.equal(await page.locator('#hot').isHidden(),true);
  await page.locator('#hint').click();assert.equal(await page.locator('#hot').isVisible(),true);
  await page.locator('#m-watch').click();assert.equal(await page.locator('#play').isVisible(),true);
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto(origin+'/ru/products/solidworks-instructor/bracket/',{waitUntil:'domcontentloaded'});
  assert.equal(await mobile.locator('h1').innerText(),'Урок 3. Кронштейн');
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page overflow');
  await mobile.getByRole('link',{name:'Начать урок'}).first().click();
  await mobile.waitForFunction(() => document.querySelector('#shot')?.naturalWidth>0);
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile player overflow');
  await mobile.screenshot({path:'.tmp/bracket-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'pass',steps:lesson.steps.length,blocks:lesson.blocks.length,scope:'browser-only full guided replay, wrong value, test/watch, desktop/mobile, static assets',origin}));
} finally { await browser.close(); }
