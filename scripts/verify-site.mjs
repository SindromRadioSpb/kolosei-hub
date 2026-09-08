import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { parse } from 'parse5';
import assert from 'node:assert/strict';

const root = resolve('dist');
const origin = 'https://kolosei.com';
const errors = [], routes = [], titles = new Set(), descriptions = new Set();
let checks = 0;
function check(value, message) { checks++; if (!value) errors.push(message); }
async function walk(dir) { const out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) out.push(...await walk(p)); else out.push(p); } return out; }
const files = await walk(root);
const exists = new Set(files.map(p => relative(root, p).replaceAll('\\', '/')));
function pathFile(path) { const p = decodeURIComponent(path).replace(/^\//, ''); return exists.has(p) ? p : (p ? p.replace(/\/$/, '') + '/index.html' : 'index.html'); }
function elements(node) { return [node, ...(node.childNodes || []).flatMap(elements)]; }
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const content = node => node?.nodeName === '#text' ? node.value : (node?.childNodes || []).map(content).join('');
const cache = new Map();
async function document(file) { if (!cache.has(file)) cache.set(file, elements(parse(await readFile(join(root, file), 'utf8')))); return cache.get(file); }
for (const file of files.filter(f => f.endsWith('.html'))) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const nodes = await document(rel);
  const route = '/' + rel.replace(/index\.html$/, '');
  if (/\/(?:ru\/)?projects\/$/.test(route)) continue; // Existing legacy redirect pages.
  routes.push(route);
  const tag = name => nodes.filter(n => n.tagName === name);
  const links = tag('link');
  const meta = (key, value) => tag('meta').find(n => attr(n, key) === value);
  const canonical = attr(links.find(n => attr(n, 'rel') === 'canonical'), 'href');
  const title = content(tag('title')[0]);
  const desc = attr(meta('name', 'description'), 'content');
  check(canonical === origin + route, `${route}: canonical must match served trailing-slash URL (${canonical})`);
  check(tag('h1').length === 1, `${route}: expected one h1`);
  check(title && !titles.has(title), `${route}: missing/duplicate title`); titles.add(title);
  check(desc && !descriptions.has(desc), `${route}: missing/duplicate description`); descriptions.add(desc);
  const lang = route.startsWith('/ru/') ? 'ru' : 'en';
  check(attr(tag('html')[0], 'lang') === lang, `${route}: wrong language`);
  check(!/noindex/.test(attr(meta('name', 'robots'), 'content') || ''), `${route}: unexpected noindex`);
  for (const language of ['en', 'ru', 'x-default']) {
    const alternate = attr(links.find(n => attr(n, 'hreflang') === language), 'href');
    check(!!alternate && exists.has(pathFile(new URL(alternate).pathname)), `${route}: missing ${language} alternate`);
    if (alternate) {
      const counterpart = await document(pathFile(new URL(alternate).pathname));
      check(counterpart.some(n => attr(n, 'hreflang') === lang && attr(n, 'href') === canonical), `${route}: non-reciprocal alternate ${language}`);
    }
  }
  for (const n of [...tag('a'), ...tag('link'), ...tag('img'), ...tag('video'), ...tag('script')]) {
    for (const key of ['href', 'src', 'poster']) {
      const value = attr(n, key); if (!value || /^(mailto:|tel:|data:)/.test(value)) continue;
      const url = new URL(value, canonical);
      if (url.origin !== origin) continue;
      const target = pathFile(url.pathname);
      check(exists.has(target), `${route}: missing local asset/link ${value}`);
      if (url.hash && exists.has(target) && target.endsWith('.html')) {
        const targetNodes = await document(target);
        check(targetNodes.some(n => attr(n, 'id') === decodeURIComponent(url.hash.slice(1))), `${route}: missing anchor ${value}`);
      }
    }
  }
  const schema = tag('script').filter(n => attr(n, 'type') === 'application/ld+json');
  check(schema.length === 1, `${route}: expected one entity graph`);
  for (const n of schema) {
    try {
      const data = JSON.parse(content(n));
      check(data['@graph'].some(n => n['@type'] === 'WebPage' && n.url === canonical && n.inLanguage === lang), `${route}: graph/page mismatch`);
      if (/\/products\/(linguistpro|reading-room)\/$/.test(route)) check(data['@graph'].some(n => n['@type'] === 'SoftwareApplication'), `${route}: missing app entity`);
      check(!/aggregateRating|ratingValue|priceCurrency/.test(JSON.stringify(data)), `${route}: unverified rating or offer`);
    } catch (e) { check(false, `${route}: malformed JSON-LD ${e.message}`); }
  }
  const ogImage = attr(meta('property', 'og:image'), 'content');
  check(ogImage && exists.has(pathFile(new URL(ogImage).pathname)), `${route}: missing OG image`);
  for (const video of tag('video')) check(attr(video, 'autoplay') === undefined, `${route}: autoplay media`);
}
const sitemap = await readFile(join(root, 'sitemap-0.xml'), 'utf8');
for (const route of routes) check(sitemap.includes(`<loc>${origin}${route}</loc>`), `${route}: absent from sitemap`);
check(!/<loc>[^<]*\/projects\//.test(sitemap), 'Redirect pages must not be in sitemap');
const facts = JSON.parse(await readFile(join(root, 'facts/linguistpro.json'), 'utf8'));
const markdown = await readFile(join(root, 'llms-full.txt'), 'utf8');
const htmlReference = content(parse(await readFile(join(root, 'agents/index.html'), 'utf8')));
check(facts.agent_access.status === 'owner-pilot' && facts.agent_access.public_self_service_mcp_signup === false, 'Agent access boundary missing');
for (const corpus of facts.public_corpora) {
  check(markdown.includes(corpus.edition_id) && markdown.includes(`${corpus.item_count} items`), `Markdown corpus mismatch: ${corpus.slug}`);
  check(htmlReference.includes(corpus.title.en) && htmlReference.includes(String(corpus.item_count)), `HTML corpus mismatch: ${corpus.slug}`);
}
check(markdown.includes(facts.reviewed_at) && htmlReference.includes(facts.reviewed_at), 'Reference review date mismatch');
const robots = await readFile(join(root, 'robots.txt'), 'utf8');
for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'Claude-SearchBot', 'Claude-User']) check(robots.includes(`User-agent: ${bot}`), `Missing crawler policy: ${bot}`);
check(!/Disallow:\s*\//.test(robots), 'Public content crawling blocked');
const report = { status: errors.length ? 'FAIL' : 'PASS', checkedAt: new Date().toISOString(), pages: routes.length, checks, errors, routes };
const output = process.argv.find(a => a.startsWith('--output='))?.slice(9);
if (output) { await mkdir(resolve(output, '..'), { recursive: true }); await writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
assert.equal(errors.length, 0, errors.join('\n'));
