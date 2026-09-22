# Kolosei public website

Bilingual Astro static site at https://kolosei.com/ presenting LinguistPro Studio, Reading Room and the Kolosei portfolio.

## Development

Node >=22.12.0. `npm ci`, then `npm run dev`. Build with `npm run build`.

- `npm run verify`: verify generated HTML, links, metadata, language pairs, sitemap and public reference parity.
- `npm run preview -- --host 127.0.0.1 --port 4322`: serve the build locally.
- `npm run verify:browser`: desktop/mobile interactions and screenshots using installed Chrome.
- `npm run images:social`: reproduce the checked-in social preview images using local typography.
- `npx astro preview stop`: stop the detached preview server.

## Content and agent reference

- `src/data/linguistpro.ts`: reviewed capabilities, collection facts, access boundaries and FAQs. Verify source URLs and date before changing facts.
- `src/data/guides.ts`: practical EN/RU learning guides.
- `src/data/agent-reference.ts`: JSON and Markdown projections from those same facts.
- `/agents/`, `/ru/agents/`, `/llms.txt`, `/llms-full.txt`, `/facts/linguistpro.json`: public read-only reference. This is not public MCP onboarding.
- `src/data/structured-data.ts`: canonical website, organization, application and breadcrumb graph.

Page URLs use trailing slashes to match production directory hosting; file URLs retain their extensions. The sitemap excludes legacy redirect routes. Do not invent prices, endorsements, ratings or general availability of pilot integrations.

## Public activity counter

`SiteActivity.astro` reads `/api/domain-activity` (schema 2), a Cloudflare Pages Function returning the HTTP Traffic **Unique Visitors** source aggregate for the **kolosei.com zone**, including automated traffic and proxied subdomains. This is IP-based, not a count of people, browser pageviews, useful bots or indexing. The banner always displays this qualification and the period: **30 complete UTC days**, excluding today. Numbers >=1000 use compact rounding with `≈`. Never hardcode the dashboard value or add browser pageviews to this metric. Application code requests one `httpRequests1dGroups / uniq.uniques` aggregate without dimensions; it does not add daily unique values or claim independently verified cross-day deduplication.

The owner-managed **Production secret** `CLOUDFLARE_ANALYTICS_TOKEN` has **Zone → Analytics → Read**, restricted to **Include → Specific zone → kolosei.com**, approved and saved on 2026-09-22. Existing **Account → Account Analytics → Read** remains for the legacy `/api/site-activity` schema-1 browser-pageview endpoint, whose meaning is unchanged and which is not read by the current banner. Never use a `PUBLIC_` environment variable or put the token in Git, HTML or chat. Rotate by replacing the encrypted Pages secret, deploying and verifying the aggregate endpoints, then revoking the old token. Source errors show unavailable rather than zero. No new subscription or second beacon is needed.

The aggregate is cached up to 15 minutes per edge location (errors: 60 seconds), with a 5-second upstream timeout and concurrent-request coalescing per isolate. Each page load makes one same-origin read; open pages do not poll. The v2 window ends at the latest UTC midnight and is exactly 30 days long. Thus the total does not grow immediately after a same-day visit; it advances daily and can change with source processing. Empty successful groups are zero; errors/malformed data are unavailable. `public/_routes.json` limits Function invocation to the two explicit aggregate routes. No raw IPs, paths or visitor records are queried; no new database is created. Cloudflare's own data lifecycle remains controlled by Cloudflare, not this counter.

Checks: `npm run test:activity`, `npm run build`, `npm run verify`, `node scripts/verify-activity-production.mjs` after deployment. `node scripts/preview-activity.mjs` serves **local-only synthetic fixtures** at port 4322; `?activityFixture=zero|unavailable|estimated|loading` (estimated means a rounded fixture), `?activityTheme=dark`, and `/__activity-test/no-js`. Never use fixture counts as production evidence. Current plan/evidence: `docs/planning/KOLOSEI_HTTP_ACTIVITY_2026_09_22.md`; the earlier `KOLOSEI_ACTIVITY_2026_09_22.md` is the historical v1 release.

## Deployment

`main` is deployed through the existing Cloudflare Pages Git integration. Commit only task-related files; this checkout also contains unrelated local documents. After push, verify actual production HTML/assets/reference files and repeat browser checks. A build or successful push is not deployment verification.

The September refresh plan and evidence live in `docs/planning/WEBSITE_DISCOVERY_2026_09_08.md` and `docs/research/website-discovery/2026-09-08/`. Never commit local operational credentials or unrelated runbooks.

After a verified release, `node scripts/submit-indexnow.mjs` previews a bounded sitemap notification; `--apply` verifies live facts and the public domain file before notifying IndexNow. Receipt does not establish indexing or rank.
