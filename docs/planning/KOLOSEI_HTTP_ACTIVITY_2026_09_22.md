# Kolosei HTTP activity — source migration

Current status: permission blocker resolved with explicit owner approval.
Real API returns 2327; UI/privacy switch passed local verification, release pending. Historical
staging and blocker evidence below is retained, not the current blocker state.

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

### Live gate: explicit permission blocker

Backend commit `2343b52ca65142a70b7b2951622e30f4197c142c` deployed successfully as
Pages `8d939afd-7f68-4bd3-ae44-5fef378b0da6` (31 seconds). Production v2 request
at 2026-09-22T12:46:17.632Z returns `unavailable`, no count. Authenticated Function
diagnostics identify the exact rejection: missing
`com.cloudflare.api.account.zone.analytics.read` for this zone. Token identity was
redacted; no secret value was read. Log stream paused after diagnosis.

Required next authority: add **Zone / Analytics / Read** to the existing
`kolosei-public-activity` token, **Include / Specific zone / kolosei.com** only.
Retain existing Account Analytics Read while the v1 banner remains active. No DNS,
edit, all-zones, billing or global-key permission is needed. Do not apply this
security-sensitive expansion without owner confirmation. Editing the existing
token's permission may avoid replacing the encrypted Pages secret.

Prepared (not wired into the public banner): bilingual v2 formatting/copy and
strict UI schema/time/scope validation in `src/data/domain-activity.mjs`.
19/19 deterministic tests PASS including rejection of old pageview payloads as
visitors, legitimate zero, rounded thousands and stale/malformed results.
Public banner is deliberately still v1. No evidence yet proves availability of
the 30-day dataset, aggregate value, interval deduplication or dashboard parity.
After permission, refresh the source after its 60-second negative cache expires,
resolve any remaining source limits, then perform the UI/privacy release gates.

Regression proof at 2026-09-22T12:47:25.654Z: production verifier PASS for six
EN/RU home/guide/privacy HTML files and CSS byte parity; three no-cache v1 reads
remain available (90 sampled pageviews). Backend staging has not changed the
public metric. The following copy/tests/documentation commit has no active UI or
Function-runtime change; responsive acceptance of the future UI remains pending.

### Permission and source verification

Owner explicitly approved adding Zone Analytics Read. Updated the existing token
via Cloudflare UI, preserving Account Analytics Read and restricting the added
permission to Include / Specific zone / kolosei.com. Summary displayed only the
account read and kolosei.com Analytics Read; saved token inventory confirms one
account / one zone. No new credential, secret disclosure or replacement, edit
permission, other token, subscription or DNS change.

Real production API at 2026-09-22T12:52:46.330Z: available, uniqueVisitors=2327,
window [2026-08-23T00:00:00Z, 2026-09-22T00:00:00Z), expires 13:07:46.330Z.
This rounds to 2.33k, consistent with the owner dashboard's displayed 2.33k.
Exact parity for a matched custom dashboard interval is not claimed: the UI's
rolling period and this completed-day window differ. Provider deduplication
internals are not independently established. Public wording attributes Unique
Visitors to Cloudflare, explicitly IP-based, including automated traffic and
proxied subdomains, not people or pageviews. Application code performs no daily
unique-count summation and no pageview fallback.

### UI release gates

- 20/20 deterministic tests PASS, including visible qualifier and privacy parity.
- Astro build PASS; 34 pages / 1633 static checks PASS; Wrangler 4.136.2 Functions
  compilation PASS; diff whitespace check PASS.
- CUA browser: nine rounded/zero/unavailable cases at actual 380, 768, 1440 CSS px
  PASS with no horizontal overflow and visible qualifiers. Browser's existing
  zoom required viewport dimensions to be adjusted; actual innerWidth verified.
- Mobile/desktop light and intermediate forced-dark built-CSS screenshots reviewed.
  Minimum inspected text contrast light 5.10:1, dark 9.39:1. Keyboard skip link
  reaches main-content; footer focus remains visible. No new interactive controls.
- Loading fixture becomes unavailable; no-JS sandbox hides loading and displays
  the fallback plus definition. Fixtures (1234) are local-only, never live data.
- Skill a11y-debugging guided semantic/focus/contrast checks through the authorized
  CUA browser. No Lighthouse score, physical-device or screen-reader acceptance
  is claimed. Production UI/asset verification follows deployment.
- Legacy schema-1 endpoint remains unchanged for compatibility; public component
  requests only schema-2 domain aggregate once per page load. Privacy RU/EN and
  README describe the changed source, scope, rounding and complete-day window.
