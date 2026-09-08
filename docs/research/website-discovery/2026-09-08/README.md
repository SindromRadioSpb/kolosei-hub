# Website discovery evidence — 2026-09-08

Human-reviewable artifacts for the Kolosei / LinguistPro public-site refresh. The implementation plan is [WEBSITE_DISCOVERY_2026_09_08.md](../../../planning/WEBSITE_DISCOVERY_2026_09_08.md).

## Provenance

Site baseline: `6ad900ec70fa12d687d15cba46705d6c0f9b73c2`. Product source: fetched published `origin/main` at `f9b8eb954d22c3c53f13e88e3e988045b3201320`; the local media-downloader feature branch was excluded from public claims. Times in JSON are UTC; the review date is 2026-09-08 in Israel.

Public source GETs, without keys or personal profile access:

- https://linguistpro.kolosei.com/api/public-corpora — 77 Study Songs, 74 Physics, 60 Materials Science items, all public catalog entries.
- https://linguistpro.kolosei.com/data/benyehuda/corpus-catalog-v7.json — 26455 catalog entries, 796 marked prepared. This does not establish individual derivative/audio availability.
- `product-capture.json` records the current app screenshot provenance when captured. Browser state is isolated and signed out.

## Reproduce

```sh
npm ci
npm run build
npm run verify -- --output=docs/research/website-discovery/2026-09-08/static-report.json
npm run preview -- --host 127.0.0.1 --port 4322
npm run verify:browser -- --base=http://127.0.0.1:4322 --output=docs/research/website-discovery/2026-09-08/local
npm run verify:browser -- --base=https://kolosei.com --output=docs/research/website-discovery/2026-09-08/production
```

Browser checks use installed Google Chrome through Playwright, in temporary contexts. They never use the owner's browser profile or write learner state to a server. The static verifier checks rendered outputs, internal links/assets/anchors, reciprocal language alternates, graph consistency, sitemap and reference parity. These are technical tests, not proof of search rank or physical-device accessibility acceptance.

## Artifacts

- `static-report.json`: generated structural check results.
- `local/`, `production/`: automated browser evidence and full-page desktop/380px screenshots; dark-mode variants are included.
- `lighthouse-*.json`: synthetic Lighthouse measurements, not field Core Web Vitals.
- `release-report.md`: final implementation, deployment and verification evidence.
- Public `public/og/linguistpro-{en,ru}.png`: code-native social images; reproduce with `npm run images:social`.

Review the screenshots and release report. Do not edit generated reports or screenshots as if they were source content. Factual changes belong in `src/data/linguistpro.ts`, with fresh source checks; guide edits belong in `src/data/guides.ts`.

## Search baseline and follow-up

Two exploratory web searches (`site:kolosei.com LinguistPro`; `"LinguistPro" иврит песни читальный зал`) returned the application subdomain and unrelated similarly named products. No reliable rank, complete index coverage or traffic estimate can be inferred from that sample. Consistent “LinguistPro by Kolosei” naming, canonical entities and substantive product pages help distinguish the product.

The sampled application search result contained older hidden interface text, including obsolete no-server-data claims. That application HTML is outside this site-only change; the public site now provides a dated, explicit source rather than copying those stale claims. A separate app-shell content audit may be useful.

Search Console and Bing account verification/submission remain account-dependent. Do not fabricate successful submissions, verification tokens or search metrics. See the plan for the 28/56-day measurement protocol.
