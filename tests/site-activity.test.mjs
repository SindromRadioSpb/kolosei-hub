import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONFIG, buildQuery, parseAggregate, createActivityHandler } from '../server/site-activity.mjs';
import { activityView } from '../src/data/site-activity.mjs';

const timestamp = Date.parse('2026-09-22T12:07:00Z');
const body = (count = 42, sampleInterval = 1) => ({ data: { viewer: { accounts: [{ total: [{ count, avg: { sampleInterval } }] }] } } });
const context = (method = 'GET', url = 'https://kolosei.com/api/site-activity') => ({ request: new Request(url, { method }), env: { CLOUDFLARE_ANALYTICS_TOKEN: 'test-secret-never-public' } });
const ok = () => Promise.resolve(Response.json(body()));

test('query has fixed site, exact host, bot exclusion, no dimensions and a bounded UTC period', () => {
  const { query, start, end } = buildQuery(timestamp);
  assert.equal(Date.parse(end) - Date.parse(start), 30 * 86400000);
  assert.equal(end, '2026-09-22T11:55:00.000Z');
  for (const text of [CONFIG.account, CONFIG.site, 'requestHost: "kolosei.com"', 'bot: 0', 'limit: 1', 'count avg { sampleInterval }']) assert.ok(query.includes(text));
  assert.ok(!query.includes('dimensions'));
});

test('valid totals, sampled estimates and real zeros', () => {
  assert.deepEqual(parseAggregate(body()), { pageviews: 42, estimated: false });
  assert.deepEqual(parseAggregate(body(50.4, 2)), { pageviews: 50, estimated: true });
  assert.deepEqual(parseAggregate(body(0)), { pageviews: 0, estimated: false });
  assert.deepEqual(parseAggregate({ data: { viewer: { accounts: [{ total: [] }] } } }), { pageviews: 0, estimated: false });
});

test('reject malformed, partial/error and impossible totals instead of turning them into zero', () => {
  const invalid = [null, {}, { errors: [{ message: 'secret' }], ...body() }, { errors: {}, ...body() },
    { data: { viewer: { accounts: [] } } }, body(-1), body('42'), body(null), body(Infinity), body(1, 0), body(1, null),
    { data: { viewer: { accounts: [{ total: [{ count: 1 }] }] } } }];
  for (const value of invalid) assert.throws(() => parseAggregate(value));
});

test('public result is allowlisted; upstream is fixed and receives only server token, not visitor data', async () => {
  let calls = 0;
  const handle = createActivityHandler({ now: () => timestamp, fetcher: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.cloudflare.com/client/v4/graphql');
    assert.equal(options.headers.Authorization, 'Bearer test-secret-never-public');
    assert.equal(options.redirect, 'manual', 'Cloudflare Workers supports manual, not error');
    assert.deepEqual(Object.keys(options.headers).sort(), ['Authorization', 'Content-Type']);
    assert.ok(!options.body.includes('evil'));
    return Response.json(body());
  } });
  const result = await handle(context('GET', 'https://kolosei.com/api/site-activity?host=evil&days=999'));
  const data = await result.json();
  assert.equal(calls, 1);
  assert.equal(data.state, 'available');
  assert.equal(data.pageviews, 42);
  assert.deepEqual(Object.keys(data).sort(), ['estimated', 'expiresAt', 'fetchedAt', 'hostname', 'pageviews', 'period', 'schemaVersion', 'source', 'state']);
  assert.ok(!JSON.stringify(data).includes('secret'));
  assert.equal(result.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), null);
});

test('outage, HTTP errors, invalid JSON and missing credentials are unavailable without a count', async () => {
  for (const fetcher of [async () => { throw new Error('secret'); }, async () => new Response('secret', { status: 403 }), async () => new Response('not JSON'), async () => Response.json({ errors: [{ message: 'secret' }] })]) {
    const data = await (await createActivityHandler({ fetcher, now: () => timestamp })(context())).json();
    assert.equal(data.state, 'unavailable');
    assert.ok(!('pageviews' in data));
    assert.ok(!JSON.stringify(data).includes('secret'));
  }
  const handle = createActivityHandler({ fetcher: () => assert.fail('must not fetch'), now: () => timestamp });
  assert.equal((await (await handle({ ...context(), env: {} })).json()).state, 'unavailable');
});

test('timeout aborts upstream and returns a bounded unavailable result', async () => {
  let signal;
  const handle = createActivityHandler({ timeout: 10, now: () => timestamp, fetcher: (_, options) => { signal = options.signal; return new Promise(() => {}); } });
  assert.equal((await (await handle(context())).json()).state, 'unavailable');
  assert.equal(signal.aborted, true);
});

test('owner diagnostics redact credentials and never appear in the public response', async () => {
  const messages = [];
  const handle = createActivityHandler({ now: () => timestamp, reportError: value => messages.push(value),
    fetcher: async () => Response.json({ errors: [{ message: 'query rejected test-secret-never-public' }] }) });
  const text = await (await handle(context())).text();
  assert.equal(messages.length, 1);
  assert.ok(messages[0].includes('[redacted]'));
  assert.ok(!messages[0].includes('test-secret-never-public'));
  assert.ok(!text.includes('query rejected'));
});

test('upstream redirects are rejected without following or disclosing credentials', async () => {
  let calls = 0;
  const handle = createActivityHandler({ now: () => timestamp, fetcher: async (_, options) => {
    calls++;
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://example.invalid/' } });
  } });
  assert.equal((await (await handle(context())).json()).state, 'unavailable');
  assert.equal(calls, 1);
});

test('coalesces concurrent callers, caches success, and refreshes after expiry', async () => {
  let clock = timestamp, calls = 0;
  const handle = createActivityHandler({ now: () => clock, fetcher: async () => { calls++; return Response.json(body()); } });
  await Promise.all(Array.from({ length: 12 }, () => handle(context())));
  assert.equal(calls, 1);
  clock += 800000;
  await handle(context());
  assert.equal(calls, 1);
  clock += 100001;
  await handle(context());
  assert.equal(calls, 2);
});

test('edge cache is shared across handlers; query strings do not bypass it; cache failure is harmless', async () => {
  const values = new Map(); let calls = 0;
  const cache = { match: async key => values.get(key)?.clone(), put: async (key, value) => { values.set(key, value.clone()); } };
  const deps = { cache, now: () => timestamp, fetcher: async () => { calls++; return Response.json(body()); } };
  await createActivityHandler(deps)(context());
  await createActivityHandler(deps)(context('GET', 'https://kolosei.com/api/site-activity?random=123'));
  assert.equal(calls, 1);
  assert.equal(values.size, 1);
  const broken = { match: async () => { throw new Error(); }, put: async () => { throw new Error(); } };
  assert.equal((await (await createActivityHandler({ ...deps, cache: broken })(context())).json()).state, 'available');
});

test('negative cache prevents repeated upstream calls and expires after a minute', async () => {
  let clock = timestamp, calls = 0;
  const handle = createActivityHandler({ now: () => clock, fetcher: async () => { calls++; throw new Error(); } });
  await handle(context()); await handle(context()); assert.equal(calls, 1);
  clock += 60001; await handle(context()); assert.equal(calls, 2);
});

test('methods are read-only; HEAD omits body', async () => {
  const handle = createActivityHandler({ now: () => timestamp, fetcher: ok });
  assert.equal((await handle(context('POST'))).status, 405);
  assert.equal(await (await handle(context('HEAD'))).text(), '');
});

test('localized UI distinguishes count, zero, estimate, expired and unavailable data', async () => {
  const data = await (await createActivityHandler({ now: () => timestamp, fetcher: ok })(context())).json();
  assert.deepEqual(activityView(data, 'ru', timestamp), { state: 'available', value: '42' });
  assert.equal(activityView({ ...data, pageviews: 0 }, 'en', timestamp).value, '0');
  assert.equal(activityView({ ...data, estimated: true }, 'ru', timestamp).value, '≈ 42');
  for (const invalid of [null, {}, { ...data, state: 'unavailable' }, { ...data, pageviews: '0' }, { ...data, hostname: 'linguistpro.kolosei.com' }, { ...data, period: { ...data.period, days: 7 } }, { ...data, expiresAt: data.fetchedAt }]) {
    assert.equal(activityView(invalid, 'ru', timestamp).state, 'unavailable');
  }
  assert.equal(activityView(data, 'en', timestamp + 900001).state, 'unavailable');
});

test('only aggregate API invokes Functions; component adds no collector or storage', async () => {
  assert.deepEqual(JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url))), { version: 1, include: ['/api/site-activity', '/api/domain-activity'], exclude: [] });
  const component = await readFile(new URL('../src/components/SiteActivity.astro', import.meta.url), 'utf8');
  assert.ok(!/localStorage|sessionStorage|document\.cookie|sendBeacon|setInterval/.test(component));
  assert.ok(component.includes("fetch('/api/site-activity'"));
  assert.ok(component.includes('aria-live="polite"'));
  assert.ok(component.includes('display: none !important'), 'no-JS loading must override scoped flex styling');
});
