import { createActivityHandler } from './site-activity.mjs';

export const ZONE = 'be1e72a9dd17a5b30f1d0e9e127cc0b2';
export function buildDomainQuery(now) {
  // The source has daily resolution. Never imply a rolling minute-resolution window.
  const end = new Date(Math.floor(now / 86400000) * 86400000).toISOString();
  const start = new Date(Date.parse(end) - 30 * 86400000).toISOString();
  return { start, end, query: `query KoloseiDomainActivity {
    viewer { zones(filter: {zoneTag: "${ZONE}"}) {
      total: httpRequests1dGroups(limit: 1, filter: {
        date_geq: "${start.slice(0, 10)}", date_lt: "${end.slice(0, 10)}"
      }) { uniq { uniques } }
    } }
  }` };
}

export function parseDomainAggregate(body) {
  if (!body || (body.errors != null && (!Array.isArray(body.errors) || body.errors.length))) throw new Error('source');
  const zones = body.data?.viewer?.zones;
  if (!Array.isArray(zones) || zones.length !== 1) throw new Error('zone');
  const rows = zones[0]?.total;
  if (!Array.isArray(rows) || rows.length > 1) throw new Error('aggregate');
  if (!rows.length) return { uniqueVisitors: 0 };
  const count = rows[0]?.uniq?.uniques;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('shape');
  return { uniqueVisitors: count };
}

export function createDomainActivityHandler(deps = {}) {
  return createActivityHandler({ ...deps, queryBuilder: buildDomainQuery, parser: parseDomainAggregate,
    schemaVersion: 2,
    metadata: { source: 'cloudflare-http-traffic', domain: 'kolosei.com', scope: 'zone',
      metric: 'unique-visitors', aggregation: 'source-period-aggregate', periodKind: 'complete-utc-days' },
    cacheKey: 'https://kolosei.com/api/domain-activity?internal-cache=v2' });
}
