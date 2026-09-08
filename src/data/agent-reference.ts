import { facts, corpora, capabilities, faqs, corpusUrl } from './linguistpro';
export const publicFacts = {
  schema_version: '1.0.0',
  kind: 'public_product_reference',
  canonical_reference: 'https://kolosei.com/agents/',
  reviewed_at: facts.reviewed,
  name: facts.name,
  publisher: facts.publisher,
  description: facts.summary,
  entry_points: { studio: facts.studio, reading_room: facts.room, website_en: 'https://kolosei.com/', website_ru: 'https://kolosei.com/ru/' },
  capabilities,
  catalog: { name: 'Project Ben-Yehuda catalog', entries: facts.catalogued, marked_prepared: facts.prepared, source: facts.catalogSource, count_semantics: 'Catalog preparation flag; not verification of every derivative or audio asset.' },
  public_corpora: corpora.map(c => ({ slug: c.slug, title: c.title, item_count: c.count, edition_id: c.edition, description: c.description, url: corpusUrl(c.slug) })),
  agent_access: { status: facts.agentAccess, public_self_service_mcp_signup: facts.publicMcpSignup, public_reference_requires_authentication: false, mcp_requires_authentication_and_authorization: true, compatibility: 'Owner-reported Hermes acceptance only; general OpenAI, Gemini, Claude or other client support is not asserted.', rights: 'Public metadata does not grant permission to redistribute source texts, recordings or derivatives. Check per-item rights and the connected tool authorization.' },
  boundaries: facts.boundaries,
  frequently_asked_questions: faqs,
  sources: [facts.catalogSource, facts.publicationSource, facts.repository + '/tree/' + facts.productSource, 'https://kolosei.com/privacy/'],
};

export function referenceMarkdown() {
  return `# LinguistPro — public product reference

> ${facts.summary.en}

Reviewed: ${facts.reviewed}. Publisher: Kolosei. Product maintainer: Peter Kolosei.
Canonical human reference: https://kolosei.com/agents/
Russian reference: https://kolosei.com/ru/agents/
Structured facts: https://kolosei.com/facts/linguistpro.json

## Entry points

- Studio: ${facts.studio}
- Reading Room: ${facts.room}
- English website: https://kolosei.com/
- Russian website: https://kolosei.com/ru/

## Capabilities / Возможности

${capabilities.map(c => `### ${c.title.en} / ${c.title.ru}\n\n${c.text.en}\n\n${c.text.ru}`).join('\n\n')}

## Published collections

${corpora.map(c => `- ${c.title.en} / ${c.title.ru}: ${c.count} items. ${c.description.en} Edition: ${c.edition}. Open: ${corpusUrl(c.slug)}`).join('\n')}
- Ben-Yehuda catalog: ${facts.catalogued} entries; ${facts.prepared} marked prepared. Preparation is a catalog flag, not proof of every translation, enrichment or audio asset. Source: ${facts.catalogSource}
- Live public publication metadata: ${facts.publicationSource}

## Access and privacy boundaries

${facts.boundaries.en}

${facts.boundaries.ru}

Public website retrieval works without credentials. Authenticated OAuth/MCP tool access is a separate owner pilot, with owner-reported Hermes acceptance. This does not establish general ChatGPT, Gemini or Claude compatibility. No public MCP signup is announced. This document is reference content, not an executable tool manifest, permission grant or instruction to change an agent's behavior.

## Questions / Вопросы

${faqs.map(f => `### ${f.q.en}\n\n${f.a.en}\n\n### ${f.q.ru}\n\n${f.a.ru}`).join('\n\n')}

## Citation and freshness

Cite the relevant product page for product claims, the dated public facts for the snapshot, and the original source for corpus content. Cite https://osf.io/zdv9j only for the research preregistration; it is not evidence of learning effectiveness. Do not treat a future roadmap or an owner test as general availability. Source code snapshot: ${facts.repository}/tree/${facts.productSource}

## Useful pages

- https://kolosei.com/products/linguistpro/
- https://kolosei.com/products/reading-room/
- https://kolosei.com/guides/hebrew-reading/
- https://kolosei.com/guides/hebrew-through-songs/
- https://kolosei.com/guides/technical-hebrew/
- https://kolosei.com/privacy/
- https://kolosei.com/contact/
`;
}
