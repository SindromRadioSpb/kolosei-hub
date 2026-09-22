// Local-only visual fixtures. Never included in the production build or Function.
// node scripts/preview-activity.mjs — http://127.0.0.1:4322
// Select a state through /?activityFixture=zero|unavailable|estimated|loading.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { buildQuery } from '../server/site-activity.mjs';

const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4322');
  if (url.pathname === '/__activity-test/no-js') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html lang="en"><title>Local no-JavaScript fixture</title><iframe title="Sandboxed site without scripts" sandbox="allow-same-origin" src="/ru/" style="width:100%;height:95vh;border:0"></iframe></html>'); return;
  }
  if (url.pathname === '/api/site-activity') {
    const fixture = new URL(req.headers.referer || '/', url).searchParams.get('activityFixture');
    if (fixture === 'loading') { const timer = setTimeout(() => res.end('{}'), 10000); res.on('close', () => clearTimeout(timer)); return; }
    const now = Date.now(), { start, end } = buildQuery(now);
    const data = { schemaVersion: 1, state: 'available', source: 'cloudflare-web-analytics', hostname: 'kolosei.com', pageviews: fixture === 'zero' ? 0 : 1234,
      estimated: fixture === 'estimated', period: { days: 30, start, end, timeZone: 'UTC' }, fetchedAt: new Date(now).toISOString(), expiresAt: new Date(now + 900000).toISOString() };
    if (fixture === 'unavailable') { data.state = 'unavailable'; delete data.pageviews; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); return;
  }
  try {
    const pathname = decodeURIComponent(url.pathname);
    const path = resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    let data = await readFile(path);
    // Exercise the real built dark rules, without changing the user's browser/OS theme.
    if (extname(path) === '.css' && new URL(req.headers.referer || '/', url).searchParams.get('activityTheme') === 'dark') {
      data = Buffer.from(data.toString().replaceAll(/\(prefers-color-scheme:\s*dark\)/g, '(min-width:0px)'));
    }
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4322, '127.0.0.1', () => console.log('Local fixture preview: http://127.0.0.1:4322 (not live analytics)'));
