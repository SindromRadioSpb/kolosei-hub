import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDomainQuery, parseDomainAggregate, createDomainActivityHandler, ZONE } from '../server/domain-activity.mjs';

const now = Date.parse('2026-09-22T12:00:00Z');
const body = count => ({ data: { viewer: { zones: [{ total: [{ uniq: { uniques: count } }] }] } } });
const context = { request: new Request('https://kolosei.com/api/domain-activity?zone=evil&days=999'), env: { CLOUDFLARE_ANALYTICS_TOKEN: 'test-only-secret' } };

test('domain query uses one source aggregate, fixed zone, 30 complete UTC days and no visitor dimensions', () => {
  const { start, end, query } = buildDomainQuery(now);
  assert.equal(start, '2026-08-23T00:00:00.000Z');
  assert.equal(end, '2026-09-22T00:00:00.000Z');
  assert.ok(query.includes(ZONE));
  assert.ok(query.includes('httpRequests1dGroups(limit: 1'));
  assert.ok(query.includes('uniq { uniques }'));
  assert.ok(!/dimensions|sum|requestHost|bot:/.test(query));
  assert.equal(buildDomainQuery(Date.parse('2026-03-01T00:00:00Z')).start, '2026-01-30T00:00:00.000Z');
});

test('domain parser accepts source count or zero, rejects partial and multiple groups instead of adding uniques', () => {
  assert.deepEqual(parseDomainAggregate(body(1234)), { uniqueVisitors: 1234 });
  assert.deepEqual(parseDomainAggregate(body(0)), { uniqueVisitors: 0 });
  assert.deepEqual(parseDomainAggregate({ data: { viewer: { zones: [{ total: [] }] } } }), { uniqueVisitors: 0 });
  for (const invalid of [null, {}, body('1234'), body(-1), body(1.2), body(Infinity),
    { ...body(1234), errors: [{ message: 'partial' }] },
    { data: { viewer: { zones: [] } } },
    { data: { viewer: { zones: [{ total: [...body(1).data.viewer.zones[0].total, ...body(2).data.viewer.zones[0].total] }] } } }]) {
    assert.throws(() => parseDomainAggregate(invalid));
  }
});

test('v2 public payload has explicit source/scope, no pageview fallback, no secrets or visitor data', async () => {
  const handle = createDomainActivityHandler({ now: () => now, fetcher: async (_, options) => {
    assert.ok(!options.body.includes('evil'));
    return Response.json(body(1234));
  } });
  const data = await (await handle(context)).json();
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.scope, 'zone');
  assert.equal(data.uniqueVisitors, 1234);
  assert.deepEqual(Object.keys(data).sort(), ['aggregation', 'domain', 'expiresAt', 'fetchedAt', 'metric', 'period', 'periodKind', 'schemaVersion', 'scope', 'source', 'state', 'uniqueVisitors']);
  assert.ok(!JSON.stringify(data).includes('secret'));
  const failure = await (await createDomainActivityHandler({ now: () => now, fetcher: async () => Response.json({ errors: [{ message: 'denied' }] }) })(context)).json();
  assert.equal(failure.state, 'unavailable');
  assert.ok(!('uniqueVisitors' in failure));
  assert.ok(!('pageviews' in failure));
});

test('v1 cache never supplies v2, and v2 traffic remains coalesced and cached', async () => {
  let calls = 0;
  const keys = [];
  const cache = { match: async key => { keys.push(key); return Response.json({ schemaVersion: 1, state: 'available', expiresAt: new Date(now + 900000).toISOString() }); }, put: async () => {} };
  const handle = createDomainActivityHandler({ cache, now: () => now, fetcher: async () => { calls++; return Response.json(body(1234)); } });
  const responses = await Promise.all(Array.from({ length: 8 }, () => handle(context)));
  assert.equal(calls, 1);
  assert.ok(keys.every(key => key.includes('domain-activity?internal-cache=v2')));
  assert.equal((await responses[0].json()).schemaVersion, 2);
});
