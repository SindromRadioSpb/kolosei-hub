// Read-only production proof. No collector calls, form submissions or owner data changes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { activityView } from '../src/data/site-activity.mjs';

const origin = 'https://kolosei.com';
const get = async path => {
  const response = await fetch(origin + path, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, path);
  return response;
};
const normalize = text => text.replace(/<script\b[^>]*src=["']https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js[^"']*["'][^>]*>[\s\S]*?<\/script>/g, '').replace(/>\s+</g, '><').trim();
const sha = value => createHash('sha256').update(value).digest('hex');
const pages = [];
const assets = new Set();
for (const path of ['/', '/ru/', '/guides/hebrew-through-songs/', '/ru/guides/hebrew-through-songs/', '/privacy/', '/ru/privacy/']) {
  const html = await (await get(path)).text();
  const local = await readFile(`dist${path}index.html`, 'utf8');
  assert.equal(sha(normalize(html)), sha(normalize(local)), `served HTML mismatch: ${path}`);
  assert.equal((html.match(/data-activity-lang=/g) || []).length, 1);
  // Injection is request-dependent: Node HTTP probes may have none while Chrome has one.
  // A real-browser check must separately establish that the collector is present exactly once.
  const beaconCount = (html.match(/src=["']https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js/g) || []).length;
  assert.ok(beaconCount <= 1, 'collector must never be duplicated');
  assert.ok(!html.includes('CLOUDFLARE_ANALYTICS_TOKEN'));
  for (const match of html.matchAll(/(?:href|src)="(\/_astro\/[^"?#]+)"/g)) assets.add(match[1]);
  pages.push({ path, sha256: sha(normalize(html)), httpBeaconCount: beaconCount, status: 'PASS' });
}
for (const asset of assets) {
  assert.equal(sha(Buffer.from(await (await get(asset)).arrayBuffer())), sha(await readFile('dist' + asset)), `asset mismatch: ${asset}`);
}
const probes = [];
for (let i = 0; i < 3; i++) {
  const response = await get('/api/site-activity');
  const data = await response.json();
  assert.equal(activityView(data).state, 'available', 'live aggregate must be available, not a fabricated zero/fallback');
  assert.deepEqual(Object.keys(data).sort(), ['estimated', 'expiresAt', 'fetchedAt', 'hostname', 'pageviews', 'period', 'schemaVersion', 'source', 'state']);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  probes.push(data);
}
const alternative = await (await get('/api/site-activity?hostname=linguistpro.kolosei.com&days=1')).json();
assert.equal(alternative.hostname, 'kolosei.com');
assert.equal(alternative.period.days, 30);
console.log(JSON.stringify({ status: 'PASS', checkedAt: new Date().toISOString(), pages, assets: [...assets], probes }, null, 2));
