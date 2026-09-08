import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Domain-verification token is deliberately hosted as a public text file, not a private account credential.
const config = JSON.parse(await readFile(new URL('./indexnow.json', import.meta.url), 'utf8'));
const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.ok(urls.length > 0 && urls.length <= 100, 'Unexpected sitemap size; review before submission.');
assert.ok(urls.every(value => { const u = new URL(value); return u.protocol === 'https:' && u.host === config.host && !u.search && !u.hash; }), 'Only canonical public site pages may be submitted.');
const file = new URL(config.keyLocation).pathname.slice(1);
assert.equal((await readFile('public/' + file, 'utf8')).trim(), config.key);
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ mode: 'DRY_RUN', host: config.host, count: urls.length, urls, next: 'After deployment: node scripts/submit-indexnow.mjs --apply' }, null, 2));
} else {
  const verification = await fetch(config.keyLocation, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert.equal(verification.status, 200, 'Verification file is not live.');
  assert.equal((await verification.text()).trim(), config.key, 'Live domain-verification file does not match.');
  // Refuse a stale build: deployed product facts must equal the locally reviewed output.
  const live = await fetch(`https://${config.host}/facts/linguistpro.json`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), JSON.parse(await readFile('dist/facts/linguistpro.json', 'utf8')));
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ...config, urlList: urls }), signal: AbortSignal.timeout(30000),
  });
  const receipt = { submittedAt: new Date().toISOString(), endpoint: 'https://api.indexnow.org/indexnow', httpStatus: response.status, urlCount: urls.length, urls, outcome: response.status === 200 ? 'RECEIVED' : response.status === 202 ? 'RECEIVED_KEY_VALIDATION_PENDING' : 'FAILED', indexed: 'NOT_ASSERTED', note: 'Acceptance records a notification receipt, not crawling, indexing, ranking or Google submission.' };
  await mkdir('docs/research/website-discovery/2026-09-08', { recursive: true });
  await writeFile('docs/research/website-discovery/2026-09-08/indexnow-receipt.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
  assert.ok([200, 202].includes(response.status), `IndexNow returned ${response.status}`);
}
