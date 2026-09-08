import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = 'https://kolosei.com';
const evidence = 'docs/research/website-discovery/2026-09-08';
const staticReport = JSON.parse(await readFile(`${evidence}/static-report.json`, 'utf8'));
const pages = staticReport.routes.map(route => [route, `dist${route}index.html`]);
const extra = ['facts/linguistpro.json', 'llms.txt', 'llms-full.txt', 'robots.txt', 'sitemap-index.xml', 'sitemap-0.xml', 'og/linguistpro-en.png', 'og/linguistpro-ru.png', 'img/reading-room-current.png', '9bb44c39ae4ff85e023296be35664ef4.txt'];
const home = await readFile('dist/index.html', 'utf8');
const assets = [...new Set([...home.matchAll(/(?:href|src)="(\/_astro\/[^"?#]+)"/g)].map(m => m[1]))];
const targets = [...pages, ...extra.map(path => ['/' + path, 'dist/' + path]), ...assets.map(path => [path, 'dist' + path])];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { checkedAt: new Date().toISOString(), origin: root, status: 'RUNNING', resources: [], repeatProbes: [] };
async function check(route, file) {
  const response = await fetch(root + route, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, route);
  assert.equal(response.url, root + route, `Unexpected redirect: ${route}`);
  const localHash = hash(await readFile(file));
  const deployedHash = hash(Buffer.from(await response.arrayBuffer()));
  assert.equal(deployedHash, localHash, `Deployed bytes differ: ${route}`);
  return { route, status: response.status, sha256: deployedHash, contentType: response.headers.get('content-type') };
}
try {
  // Bounded batches avoid an unnecessary burst against the public site.
  for (let i = 0; i < targets.length; i += 4) report.resources.push(...await Promise.all(targets.slice(i, i + 4).map(([route, file]) => check(route, file))));
  for (let probe = 1; probe <= 5; probe++) {
    const results = await Promise.all([check('/ru/', 'dist/ru/index.html'), check('/facts/linguistpro.json', 'dist/facts/linguistpro.json')]);
    report.repeatProbes.push({ probe, checkedAt: new Date().toISOString(), results });
  }
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1;
} finally {
  await writeFile(`${evidence}/production-http.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, resources: report.resources.length, repeatProbes: report.repeatProbes.length, error: report.error }, null, 2));
