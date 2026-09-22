# Активность Kolosei — implementation packet

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

No Cloudflare analytics API token is currently available in the process environment. A logged-in Cloudflare owner browser can inspect analytics but is not a credential for server code. If a new read token is required, the owner creates it and stores it as a Cloudflare Pages production secret; never paste it in chat or commit it. Required access: Account Analytics Read restricted to this account. Token creation/configuration and a successful real aggregate are release prerequisites, not reasons to fabricate a count.

## Status

- Recon and design plan: complete.
- Data: owner dashboard confirms a 30-day view (90 pageviews / 40 visits at the inspected instant, recognized bots excluded). This is dashboard evidence, not proof of the new API query. The public API additionally fixes the exact hostname.
- Access: owner created the token and saved it. Browser confirms `CLOUDFLARE_ANALYTICS_TOKEN` is Secret / Value encrypted in Production. Secret value was not read or copied by the agent.
- Implementation: local server Function, shared RU/EN block, privacy corrections and isolated local preview fixtures prepared.
- Automated: 12/12 deterministic tests PASS; Astro build PASS; static verifier PASS (34 pages, 1633 checks).
- Browser: PASS for 9 RU/EN zero/estimated/unavailable cases at actual 380/768/1440 CSS-pixel viewport widths, no horizontal overflow. Loading transitions to unavailable on the 7-second client timeout. Keyboard skip-link focus reaches main. No-JS sandbox exposed a loading-style specificity bug; corrected and rechecked: loading hidden, fallback visible. Local forced-dark stylesheet fixture uses the actual built dark rules; inspected visually. Minimum text contrast: light 5.10:1, dark 9.39:1. Not a physical-device or screen-reader acceptance claim. Fixture count 1234 is local-only, not production traffic.
- Function packaging: Wrangler 4.136.2 `pages functions build` PASS (compatibility date 2026-05-24 matches Pages).
- Deployment: ready for controlled Git deployment; NOT yet verified live. Since a Pages production secret is available only to a deployed Function, validate the real query immediately using `node scripts/verify-activity-production.mjs`; source errors display unavailable, never zero. Do not describe the release as complete until it passes.

## Primary references

- https://developers.cloudflare.com/analytics/graphql-api/
- https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/
- https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/
- https://developers.cloudflare.com/analytics/graphql-api/sampling/
- https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/
- https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/
- https://developers.cloudflare.com/pages/functions/routing/
