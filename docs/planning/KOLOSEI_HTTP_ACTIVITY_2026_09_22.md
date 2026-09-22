# Kolosei HTTP activity — source migration

## Approved direction

Replace the browser-pageview banner with Cloudflare HTTP Traffic Unique Visitors,
including automated traffic, with an immediately visible IP-based explanation.
No claim about people, useful bots or successful indexing. Preserve design, both
languages, no update date/details link, no paid plan or new collector.

## Recon

2026-09-22: main/origin/main both 486bc69; unrelated untracked files preserved.
Owner UI: HTTP Traffic, Previous 30 days, Unique Visitors 2.33k; overview 24h 145.
Zone ID be1e72a9dd17a5b30f1d0e9e127cc0b2, Free plan. Zone-wide scope may include
proxied subdomains and is explicitly different from the old exact-host metric.
Existing Account Analytics Read token stays encrypted in Pages; do not assume
access failure or expand permissions without a real query and owner approval.

## Main route and gates

1. Add an isolated v2 aggregate endpoint while retaining the current v1 banner.
   Query httpRequests1dGroups uniq.uniques for one whole interval, without
   dimensions: never sum daily unique counts in application code. Use 30 complete
   UTC days (day-granularity dataset); explain this period on the final banner.
2. Reuse bounded timeout, secret redaction, coalescing and caching. Version/cache
   and zone scope are explicit. No individual IP, URL, country or visitor record
   is requested or published. Malformed/partial/source failures are unavailable.
3. Test/build/static verify and deploy backend stage; compare real aggregate with
   owner dashboard on matched dates. Verify source access and aggregation before
   switching UI. If interval-wide uniqueness cannot be established, retain the
   provider-metric wording without claiming cross-day deduplication; document it.
4. Switch RU/EN banner and privacy/README, visible explanation, no silent pageview
   fallback. Check 380/768/1440 widths, zero/unavailable, production identity,
   served assets and three no-cache API reads. No app/Docker/learning-state work.

## References

- https://developers.cloudflare.com/analytics/graphql-api/features/data-sets/
- https://developers.cloudflare.com/analytics/graphql-api/migration-guides/zone-analytics/
- https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/

## Status

Backend stage prepared: isolated `/api/domain-activity` schema 2, current banner
and `/api/site-activity` schema 1 unchanged. Shared transport preserves existing
behavior; cache namespace and source metadata are isolated. Automated gates:
18/18 tests PASS, Astro build PASS, 34 pages / 1633 static checks PASS, Wrangler
4.136.2 Functions compilation PASS, diff check PASS. Live verification pending.
2.33k remains dashboard evidence, not an API result or fixture. This backend-only
stage is deployable without switching the banner or expanding token privileges.
