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

## Release

`main` is deployed through the existing Cloudflare Pages Git integration. Commit only task-related files; this checkout also contains unrelated local documents. After push, verify actual production HTML/assets/reference files and repeat browser checks. A build or successful push is not deployment verification.

The September refresh plan and evidence live in `docs/planning/WEBSITE_DISCOVERY_2026_09_08.md` and `docs/research/website-discovery/2026-09-08/`. Never commit local operational credentials or unrelated runbooks.

After a verified release, `node scripts/submit-indexnow.mjs` previews a bounded sitemap notification; `--apply` verifies live facts and the public domain file before notifying IndexNow. Receipt does not establish indexing or rank.
