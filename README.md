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

Migration status (2026-09-22): the public banner below is still the Web Analytics
version. An isolated `/api/domain-activity` schema-2 backend for zone-wide HTTP
Unique Visitors has been deployed, but Cloudflare rejects the existing token's
missing Zone Analytics Read permission. It returns unavailable, never an invented
count. Do not switch the banner until owner-approved access and live data parity
pass. Plan/status: `docs/planning/KOLOSEI_HTTP_ACTIVITY_2026_09_22.md`.

`SiteActivity.astro` reads `/api/site-activity`, a Cloudflare Pages Function backed by the existing Web Analytics collector. It publishes only the 30-day pageview aggregate for the exact hostname `kolosei.com`, excluding recognized bots and all subdomains. It is not a unique-visitor, online-user or indexing counter. Sampled estimates have a `≈` prefix.

The owner-managed **Production secret** `CLOUDFLARE_ANALYTICS_TOKEN` needs **Account → Account Analytics → Read**, restricted to this account. Never use a `PUBLIC_` environment variable or put the token in Git, HTML or chat. Rotate by replacing the encrypted Pages secret, deploying and verifying `/api/site-activity`, then revoking the old token. Revocation/source errors show unavailable rather than zero. No new subscription or second beacon is needed.

The aggregate is cached up to 15 minutes per edge location (errors: 60 seconds), with a 5-second upstream timeout and concurrent-request coalescing per isolate. Each page load makes one same-origin read; existing open pages do not poll. The UTC window ends at the previous quarter-hour minus five minutes for ingestion, and is exactly 30 days long. Empty successful groups are zero; errors/malformed data are unavailable. `public/_routes.json` limits Function invocation to this endpoint. Raw analytics is not copied to a new database; caches retain only aggregates. Cloudflare's own data lifecycle remains controlled by Cloudflare, not this counter.

Checks: `npm run test:activity`, `npm run build`, `npm run verify`. `node scripts/preview-activity.mjs` serves **local-only synthetic fixtures** at port 4322; `?activityFixture=zero|unavailable|estimated|loading`, `?activityTheme=dark`, and `/__activity-test/no-js`. Never use fixture counts as production evidence. Implementation and evidence: `docs/planning/KOLOSEI_ACTIVITY_2026_09_22.md`.

## Deployment

`main` is deployed through the existing Cloudflare Pages Git integration. Commit only task-related files; this checkout also contains unrelated local documents. After push, verify actual production HTML/assets/reference files and repeat browser checks. A build or successful push is not deployment verification.

The September refresh plan and evidence live in `docs/planning/WEBSITE_DISCOVERY_2026_09_08.md` and `docs/research/website-discovery/2026-09-08/`. Never commit local operational credentials or unrelated runbooks.

After a verified release, `node scripts/submit-indexnow.mjs` previews a bounded sitemap notification; `--apply` verifies live facts and the public domain file before notifying IndexNow. Receipt does not establish indexing or rank.
