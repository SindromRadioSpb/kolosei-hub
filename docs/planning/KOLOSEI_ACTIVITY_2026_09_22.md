# Активность Kolosei — implementation packet

Historical v1 release report. The owner subsequently approved migration of the
banner to Cloudflare HTTP Traffic Unique Visitors. Current scope/status:
`KOLOSEI_HTTP_ACTIVITY_2026_09_22.md`. The v1 endpoint's pageview meaning remains
unchanged; never interpret its 90-pageview snapshot as HTTP unique visitors.

## Approved scope

Compact bilingual block before the shared footer: «Активность Kolosei» / “Kolosei activity”, pageviews for the last 30 days. No site-update date, detail link, online indicator, people count or indexing claim. Entire exact hostname `kolosei.com`, all paths and languages; LinguistPro and other subdomains excluded. Existing Cloudflare Web Analytics collector only; no extra beacon, Umami or subscription.

Baseline: `main` at `1bcb3a2`, synchronized with origin/main on 2026-09-22. Unrelated untracked files are preserved. Cloudflare Pages serves the static Astro site. Live HTML already has the Cloudflare beacon; the Web Analytics site tag is `c0d89f3e893743efadbd4a9db0c359e2` (not the public beacon token). Dashboard reports 28 pageviews / 16 visits for its last-24-hour snapshot; these are distinct metrics, not implementation fixtures.

## Design pass and review

Reuse existing system font and tokens: background #fbfdff, soft background #edf3fa, foreground #18334d, secondary #53697c, accent #176b66, border #d5e0e9; existing dark-mode equivalents. A quiet horizontal strip with title left and tabular numeric total right; stack on narrow screens. No animation, flashing dot, promotional badge or new controls. Number is the visual focus; period always visible. Review: fits existing editorial layout, adds no competing call to action, and satisfies the requested title-plus-period scope.

## Main implementation route

1. Confirm Web Analytics scope/history and GraphQL access. Never substitute HTTP requests or visits for browser pageviews. A 30-day read must succeed before release.
2. Pages Function `/api/site-activity`, server-only read token; exact account/site/hostname and fixed bounded period. Aggregate without path dimensions or event scan. No request-controlled query, upstream URL or filters. Short timeout, shared edge cache, in-isolate request coalescing, cached unavailable response on source errors. Only this API route invokes Functions; static pages stay static.
3. Public response is an allowlisted aggregate: schema, state, pageviews, period boundaries, source, sampling indicator and retrieval time. No credentials, raw upstream errors, per-visitor data, paths or referrers. Loading, available zero, unavailable and stale data remain distinct; do not present expired results as current.
4. Shared Astro component + small same-origin read script. One request per page, no tracking added, no polling or persistent client storage. RU/EN copy and no-JS fallback. Update website privacy paragraphs, not unrelated app claims.
5. Deterministic Node tests for query scope, valid/zero/error/malformed/sampled responses, timeout, cache, concurrency, secrets, fixed time bounds and UI formatting. Build + existing static verifier. Browser checks RU/EN, 380/768/1440 widths, dark mode, loading/zero/unavailable/available, keyboard and no overflow.
6. Scoped commit/push only when release gates and live data access pass. Verify Cloudflare Pages deployment identity, public endpoint and served UI. Do not touch app Docker images, learning data or unrelated files.

## Access and release gate

The owner created a read token and stored it as a Cloudflare Pages production secret; it is not available in the agent's process environment and was never pasted into chat or committed. Required access: Account Analytics Read restricted to this account. A logged-in Cloudflare owner browser is not a credential for server code. Encrypted binding and real aggregate are verified below.

## Status

- Recon and design plan: complete.
- Data: owner dashboard confirms a 30-day view (90 pageviews / 40 visits at the inspected instant, recognized bots excluded). This is dashboard evidence, not proof of the new API query. The public API additionally fixes the exact hostname.
- Access: owner created the token and saved it. Browser confirms `CLOUDFLARE_ANALYTICS_TOKEN` is Secret / Value encrypted in Production. Secret value was not read or copied by the agent.
- Implementation: local server Function, shared RU/EN block, privacy corrections and isolated local preview fixtures prepared.
- Automated: 14/14 deterministic tests PASS; Astro build PASS; static verifier PASS (34 pages, 1633 checks).
- Browser: PASS for 9 RU/EN zero/estimated/unavailable cases at actual 380/768/1440 CSS-pixel viewport widths, no horizontal overflow. Loading transitions to unavailable on the 7-second client timeout. Keyboard skip-link focus reaches main. No-JS sandbox exposed a loading-style specificity bug; corrected and rechecked: loading hidden, fallback visible. Local forced-dark stylesheet fixture uses the actual built dark rules; inspected visually. Minimum text contrast: light 5.10:1, dark 9.39:1. Not a physical-device or screen-reader acceptance claim. Fixture count 1234 is local-only, not production traffic.
- Function packaging: Wrangler 4.136.2 `pages functions build` PASS (compatibility date 2026-05-24 matches Pages).
- Deployment: production code `93f38333d857981bf83b475bb4f9fe910e3e9f52`, Cloudflare Pages deployment `fcac793f-f5db-4ef3-a343-3be35227dcdd`. Live aggregate and production browser checks PASS. A subsequent evidence-only commit updates this report and the HTTP verification script, not the deployed website or Function sources.

### Production compatibility correction

Initial deployment `c1d4e52` correctly returned unavailable, not zero. Redacted owner-only diagnostic logs (`b552d33`) identified an actual Workers runtime incompatibility: `fetch` does not accept `redirect: 'error'`. Corrected to `manual`; non-2xx (including redirects) is rejected, preserving the no-credential-forwarding boundary. Added explicit redirect-mode and 302 regression checks. No token recreation or permission expansion was needed. Node-only mocks and a successful Worker compilation did not establish runtime compatibility; production validation remains mandatory.

The release HTTP probe initially required a beacon in every Node response. Live Chrome inspection showed exactly one existing automatic beacon while Node responses omitted it. Corrected the HTTP gate to prohibit duplicates and require a separate real-browser presence check; no collector was added or analytics configuration changed. Do not mistake request-dependent injection for a collector outage.

### Final evidence, 2026-09-22

- **Automated:** 14 deterministic cases cover schema, 30-day UTC bounds, hostname/site/bot filters, legitimate zero, sampled results, malformed/error/timeout results, credential redaction, redirect rejection, positive/negative cache, concurrency, methods and frontend formatting. Build and 1633 static checks pass. Wrangler compilation passes. Generated public assets contain neither the API secret variable name nor the server-only account/site query configuration.
- **Production HTTP:** `node scripts/verify-activity-production.mjs` PASS at 12:21:17Z. Six EN/RU home/guide/privacy documents match local HTML after removing only optional Cloudflare injection and inter-tag whitespace; CSS bytes match. Three no-cache API probes return `available`, 90 pageviews, `estimated: true`, a fixed 30-day UTC interval 2026-08-23T12:10:00Z–2026-09-22T12:10:00Z. Retrieval time 12:19:56.347Z, expiry 12:34:56.347Z. Query-string attempts cannot select a subdomain or change the period.
- **Production Chrome:** RU home at 380 CSS px, RU song guide at 768, EN home at 1440 show `≈ 90`, available state, exactly one original Cloudflare beacon, no horizontal overflow. The RU live page is left open as the deliverable. These normal smoke page loads can contribute to the site's existing analytics; no fake traffic generator was used.
- **Owner-live:** read-only dashboard previously showed 90 pageviews over 30 days; secret type/encryption and deployment identity inspected. Secret value never read; no learning state or app operations touched.
- **Limitations:** browser instrumentation, not physical Android/iPhone or screen-reader acceptance. Cloudflare sampling/blocking/ingestion means pageviews are not an exact people count, bot inventory or indexing proof. Existing tabs read once; reload for a fresh cached result. Window cutoff trails the current quarter-hour by five minutes, with cache up to 15 minutes.
- **Operations:** source diagnostics remain in authenticated Cloudflare Function logs, with token redaction; public responses expose only the aggregate/state contract. The diagnostic log stream was stopped. Token rotation and local fixture commands are documented in README. No additional subscription, database or collector.

## Primary references

- https://developers.cloudflare.com/analytics/graphql-api/
- https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/
- https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/
- https://developers.cloudflare.com/analytics/graphql-api/sampling/
- https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/
- https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/
- https://developers.cloudflare.com/pages/functions/routing/
