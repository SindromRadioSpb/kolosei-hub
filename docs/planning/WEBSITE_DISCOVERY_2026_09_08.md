# Kolosei: LinguistPro website and discovery

Date: 2026-09-08. Owner request: plan and implement updated presentation, an AI/agent information layer, and search discoverability. Scope: kolosei-hub only. Product checkout is read-only; unrelated untracked site files are excluded.

## Evidence and claim boundaries

Site baseline: `6ad900ec70fa12d687d15cba46705d6c0f9b73c2`, equal to origin/main. Product authority: fetched origin/main `f9b8eb954d22c3c53f13e88e3e988045b3201320`; local media-downloader branch is not published evidence.

Live GET /api/public-corpora: Study Songs 77; Physics 74; Materials Science 60. Live /data/benyehuda/corpus-catalog-v7.json: works 26455, baked 796. Baked is a catalog preparation flag, not proof that every derivative or audio file is available. Historical 735-live/61-held counts are not current evidence. Sources and edition IDs are captured in the public facts projection. Do not label the whole multilingual catalog as Hebrew-only or promise universal public-domain rights.

Product sources: Studio/Room discovery plan 2026-09-07 (production 3.11.485); Obsidian morphology implementation 2026-09-06 (technical pass; native owner acceptance separate); All-Corpora MCP R packet 2026-08-26 (owner-reported Hermes pass, wider availability NOT_APPROVED); Materials PB2 public TTS plan 2026-09-01. No provider calls or user-state mutation needed.

## Plan and design review before implementation

1. Reframe EN/RU home and both product pages around the learning outcome. Retain portfolio and existing URLs. Add scenario guides and questions with practical next actions.
2. Use one dated factual source for corpus metrics, capabilities, human agent reference, JSON and Markdown. Explicitly distinguish public information retrieval from authenticated owner-pilot MCP actions.
3. Build canonical entity graph (Organization, WebSite, WebPage, SoftwareApplication, breadcrumbs), normalized canonical/hreflang, social images, indexable HTML, sitemap and crawler policy. No invented reviews, prices, credentials, search actions or public MCP installation flow.
4. Verify generated HTML links/anchors/schema/language pairs, browser interactions, mobile 380px and desktop screenshots, keyboard, reduced motion and no-JS content. Build, scoped commit/push, verify production bytes and repeat browser checks.

Visual tokens: paper white #fbfdff; pale blue #edf3fa; ink #18334d; slate #53697c; ocean #176b66; violet #62529b. Segoe UI for Cyrillic/Latin; Georgia for large Hebrew sample. Reading illustration supplies identity, not stock AI art. Left-aligned compact text with generous leading, two purposeful routes, quiet surrounding chrome. Existing branding stays recognizable. No autoplay or external fonts.

Layout: header -> split reading hero [purpose + actions | Hebrew + optional help] -> Studio/Room paths -> corpus shelf -> learning method -> questions -> public agent reference -> founder/contact. Product pages develop these paths; guides address independent search intentions. The Hebrew demonstration is explicitly illustrative, not a screenshot or full application.

R1/R10/R11: no invented morphology or accuracy percentages; demo has only a simple translated sentence. R2/R8: contextual reading and removable support, no promises of fluency. R4/R6: responsive two-path navigation and source-aware collections. R5: lead with user benefit, infrastructure secondary. R9/R12: HTML/JSON/Markdown derived from one factual source. R14/R15: public descriptors grant no account access or content rights. R16/R17: no implicit model calls, no fabricated tutor certification.

## External primary guidance

- Google AI search: https://developers.google.com/search/docs/appearance/ai-features — ordinary crawl/index/content requirements; no special AI files or schema required, no guaranteed indexing/rank.
- OpenAI crawlers: https://developers.openai.com/api/docs/bots — OAI-SearchBot is search, GPTBot training, ChatGPT-User user-directed retrieval.
- Anthropic crawlers: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler — Claude-SearchBot / Claude-User distinct from training crawler.

llms.txt is optional agent convenience, not a ranking standard. Keep current permissive public-site crawling policy, explicitly document search agents. No change to application subdomain rights or authentication. No keyword stuffing, doorway translations or hidden prompt instructions.

## After release: measurable discovery

Submit sitemap in existing verified Google Search Console and Bing Webmaster Tools accounts if accessible; otherwise provide exact owner follow-up. Do not invent verification tokens. Inspect canonical home, product and guide URLs. Record baseline and 28/56-day non-brand impressions, queries, clicks and product-entry traffic. Sample dated English/Russian questions in web-enabled ChatGPT/Gemini/Claude and record actual citations, not model-memory claims. These external outcomes cannot be proven by a deployment test. No automatic provider spend or new analytics consent required.

## Verification ledger

Implemented; local build, 1633 static checks and 48 desktop/mobile browser cases pass. Initial local Lighthouse reports 100 in all four categories. Production verification follows. Durable results and screenshots: docs/research/website-discovery/2026-09-08/. Reproduce with npm run build and the site verification script added in this change.

## Deployment discovery correction

The website is deployed by **Cloudflare Pages**, confirmed by the existing successful GitHub check on site baseline `6ad900e`. Coolify hosts the application subdomain, not this website. No production app changes were made. The site server redirects directory routes to trailing-slash URLs; canonical, hreflang and sitemap were aligned accordingly.

Compatible audit updates left Astro 6 advisories; moved the static build to pinned Astro 7.3.1 after checking the official migration guide and Node >=22.12 compatibility. The full build succeeds and npm audit reports zero vulnerabilities. No hosted runtime server or experimental Astro feature was introduced.

## IndexNow notification

Added a public domain-verification file and a bounded, dry-run-first notification script for the canonical sitemap URLs. After deployment, verify live key and facts before the single submission. A 200 response means received; 202 means key validation pending. Neither proves indexing or rank, and this is not a Google Search Console submission. Primary protocol: https://www.indexnow.org/documentation .
