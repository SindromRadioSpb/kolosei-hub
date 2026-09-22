// Server only. Public requests cannot select an account, hostname, metric or period.
export const CONFIG = Object.freeze({
  account: '3e189c3946c80c757e01a4162fa83a98',
  site: 'c0d89f3e893743efadbd4a9db0c359e2',
  hostname: 'kolosei.com',
  days: 30,
  ttl: 900,
  errorTtl: 60,
  timeout: 5000,
});
const DAY = 86400000;
const SOURCE = 'cloudflare-web-analytics';
const CACHE_KEY = 'https://kolosei.com/api/site-activity?internal-cache=v1';

export function buildQuery(now) {
  // Stable quarter-hour windows, with five minutes allowed for ingestion.
  const end = new Date(Math.floor(now / 900000) * 900000 - 300000).toISOString();
  const start = new Date(Date.parse(end) - CONFIG.days * DAY).toISOString();
  return { start, end, query: `query KoloseiActivity {
    viewer { accounts(filter: {accountTag: "${CONFIG.account}"}) {
      total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: {
        siteTag: "${CONFIG.site}", requestHost: "${CONFIG.hostname}", bot: 0,
        datetime_geq: "${start}", datetime_lt: "${end}"
      }) { count avg { sampleInterval } }
    } }
  }` };
}

export function parseAggregate(body) {
  if (!body || (body.errors != null && (!Array.isArray(body.errors) || body.errors.length))) throw new Error('source');
  const accounts = body.data?.viewer?.accounts;
  if (!Array.isArray(accounts) || accounts.length !== 1) throw new Error('account');
  const rows = accounts[0]?.total;
  if (!Array.isArray(rows) || rows.length > 1) throw new Error('aggregate');
  // A successful, scoped query with no groups is a legitimate zero.
  if (!rows.length) return { pageviews: 0, estimated: false };
  const { count, avg } = rows[0] ?? {};
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 0 || count > Number.MAX_SAFE_INTEGER ||
      typeof avg?.sampleInterval !== 'number' || !Number.isFinite(avg.sampleInterval) || avg.sampleInterval < 1) throw new Error('shape');
  return { pageviews: Math.round(count), estimated: avg.sampleInterval > 1 };
}

export function createActivityHandler({ fetcher = fetch, now = Date.now, cache, timeout = CONFIG.timeout, reportError = () => {} } = {}) {
  let local;
  let pending;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
  };
  const response = (payload, ttl) => new Response(JSON.stringify(payload), {
    headers: { ...headers, 'Cache-Control': `public, max-age=${ttl}` },
  });
  const valid = (value) => value?.schemaVersion === 1 &&
    ['available', 'unavailable'].includes(value.state) && Date.parse(value.expiresAt) > now();

  async function load(env) {
    if (local && valid(local)) return local;
    try {
      const saved = await cache?.match(CACHE_KEY);
      if (saved) {
        const value = await saved.json();
        if (valid(value)) { local = value; return value; }
      }
    } catch { /* Cache failure must not break the site. */ }
    const fetchedAt = now();
    const range = buildQuery(fetchedAt);
    const base = { schemaVersion: 1, source: SOURCE, hostname: CONFIG.hostname,
      period: { days: CONFIG.days, start: range.start, end: range.end, timeZone: 'UTC' },
      fetchedAt: new Date(fetchedAt).toISOString() };
    let payload;
    const controller = new AbortController();
    let timer;
    try {
      const token = env?.CLOUDFLARE_ANALYTICS_TOKEN;
      if (typeof token !== 'string' || !token.trim()) throw new Error('configuration');
      const result = await Promise.race([
        (async () => {
          const upstream = await fetcher('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST', redirect: 'error', signal: controller.signal,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: range.query }),
          });
          if (!upstream.ok) throw new Error(`http_${upstream.status}`);
          const raw = await upstream.text();
          if (raw.length > 65536) throw new Error('size');
          const decoded = JSON.parse(raw);
          if (Array.isArray(decoded?.errors) && decoded.errors.length) {
            // Cloudflare query diagnostics stay in the owner's Function logs, never in the public response.
            const message = decoded.errors.map(error => String(error?.message ?? 'query_error')).join('; ');
            throw new Error(`graphql: ${message.replaceAll(token, '[redacted]').replace(/[a-zA-Z0-9_-]{32,}/g, '[redacted]').slice(0, 400)}`);
          }
          return parseAggregate(decoded);
        })(),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeout); }),
      ]);
      payload = { ...base, state: 'available', ...result };
    } catch (error) {
      try { reportError(String(error?.message ?? 'source').replaceAll(env?.CLOUDFLARE_ANALYTICS_TOKEN || '\u0000', '[redacted]').slice(0, 500)); } catch { /* Diagnostics cannot affect the response. */ }
      // No raw upstream body, credentials or diagnostic detail is public.
      payload = { ...base, state: 'unavailable' };
    } finally { clearTimeout(timer); }
    const ttl = payload.state === 'available' ? CONFIG.ttl : CONFIG.errorTtl;
    payload.expiresAt = new Date(fetchedAt + ttl * 1000).toISOString();
    local = payload;
    try { await cache?.put(CACHE_KEY, response(payload, ttl)); } catch { /* Best effort. */ }
    return payload;
  }

  return async function handle({ request, env }) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, {
      status: 405, headers: { ...headers, Allow: 'GET, HEAD', 'Cache-Control': 'no-store' },
    });
    if (!pending) pending = load(env).finally(() => { pending = undefined; });
    const payload = await pending;
    // Never extend a cached payload's original expiration.
    const ttl = Math.max(0, Math.min(60, Math.floor((Date.parse(payload.expiresAt) - now()) / 1000)));
    const result = response(payload, ttl);
    return request.method === 'HEAD' ? new Response(null, { headers: result.headers }) : result;
  };
}
