# LinguistPro website refresh — release evidence

Published 2026-09-08 at https://kolosei.com/ and https://kolosei.com/ru/ . Implementation commit: `d40754a060e20714fb828ba342de58d1becc48fc` on site `origin/main`. Cloudflare Pages check: completed, success; deployment `10004732-df9f-49de-8c48-0b237544eff7`. Evidence in `deployment.json`.

## Delivered

- Rebuilt EN/RU home, Studio and Reading Room presentation around concrete learning paths, with an original Hebrew reading demonstration, current corpus facts, real signed-out application screenshot, FAQ and contextual next steps.
- Added three substantive bilingual guides: reading Hebrew, learning through songs and technical Hebrew. Updated mobile navigation, typography, dark mode, keyboard focus and social previews.
- Added public `/agents/`, `/ru/agents/`, `/facts/linguistpro.json`, `/llms.txt` and `/llms-full.txt`. Human, JSON and Markdown facts derive from one dated source. Source provenance, corpus edition IDs, BYOK boundaries and owner-pilot MCP limitations are explicit.
- Added canonical entities and SoftwareApplication structured data, reciprocal language alternates, normalized canonical URLs, sitemap coverage, metadata and search-agent crawler access. Source HTML remains useful with JavaScript disabled. The optional Markdown files make retrieval easier; no special ranking status is claimed.
- Updated static Astro build to 7.3.1 to resolve dependency advisories; current audit reports zero vulnerabilities.

## Verification

| Check | Result |
| --- | --- |
| Build | PASS, 34 pages |
| Static semantic/link/discovery checks | PASS, 1633 checks |
| Local browser | PASS, 48 EN/RU desktop/mobile cases |
| Production browser | PASS, 48 EN/RU desktop/mobile cases, zero page/console errors |
| Interaction checks | PASS, keyboard disclosures, FAQ, video disclosure, skip link, agent navigation, language switch, no-JS, dark mode, 320px reflow |
| Production HTTP | PASS, 34 pages + 11 resources, exact local/deployed SHA-256 match and no unexpected redirects |
| Repeat delivery | PASS, five repeated requests each to Russian home and JSON facts |
| Production mobile Lighthouse | Performance 98; accessibility 100; best practices 100; SEO 100 |
| Lighthouse timing | LCP 1.8s; CLS 0; TBT 0ms |
| npm audit | 0 vulnerabilities |
| IndexNow | HTTP 202, 34 canonical URLs received; key validation pending |

Browser screenshots were visually inspected locally and on production, including desktop/mobile home and dark agent reference. Reports use isolated Chrome contexts. Lighthouse is a single synthetic mobile run, not field Core Web Vitals or a guarantee of search position. Browser accessibility checks do not establish physical-device or assistive-technology acceptance.

## Discovery follow-up

IndexNow receipt is recorded in `indexnow-receipt.json`; it does not establish crawling, indexing, ranking, or Google submission. Existing Google Search Console and Bing Webmaster Tools account access was not established in this session. In each verified property, submit `https://kolosei.com/sitemap-index.xml`; inspect the home, both product pages and each guide in the relevant locale.

At 28 and 56 days, record non-brand impressions, queries, clicks and product-entry traffic. Test dated web-enabled ChatGPT/Gemini/Claude questions and record actual citations. No top-position or model-recommendation guarantee is made. The plan links primary search/crawler documentation.

## Scope and maintenance

Product facts were checked against the published product revision and public catalog, as detailed in README. Later independent application releases do not imply this site claims unpublished local features. The product checkout and personal learner state were not changed. Unrelated site files were excluded from commits. The final evidence commit adds only reports, screenshots, documentation and a read-only production verifier; it does not change generated website content.

Maintain factual updates in `src/data/linguistpro.ts` after checking sources, then rebuild all projections and rerun verification. Reproduce this release using the scripts documented in README.
