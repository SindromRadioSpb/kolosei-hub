import { facts } from '../data/linguistpro';
export function GET() {
  return new Response(`# Kolosei — LinguistPro

> ${facts.summary.en}

Reviewed: ${facts.reviewed}. Founder: Peter Kolosei. Contact: peter@kolosei.com.

## Product and learning

- [LinguistPro Studio](https://kolosei.com/products/linguistpro/): import, bilingual study tables, morphology, review and export.
- [Reading Room](https://kolosei.com/products/reading-room/): literature, Study Songs, Physics and Materials Science.
- [Practical guides](https://kolosei.com/guides/): reading Hebrew, learning with songs and technical Hebrew.
- [Russian website](https://kolosei.com/ru/): equivalent Russian product information.

## Public agent reference

- [Reference and access boundaries](https://kolosei.com/agents/): public website retrieval versus authenticated owner-pilot MCP.
- [Complete reference in Markdown](https://kolosei.com/llms-full.txt): dated bilingual capabilities, collections, questions and sources.
- [Structured product facts](https://kolosei.com/facts/linguistpro.json): versioned JSON snapshot generated from the same facts as the website.

## Studio and accountability

- [About Kolosei](https://kolosei.com/about/): founder and other work.
- [Products](https://kolosei.com/products/): LinguistPro, HDLE Premium and research projects.
- [Technology](https://kolosei.com/technology/): technical architecture and providers.
- [Privacy](https://kolosei.com/privacy/): local data, cloud processing and optional integrations.
- [Contact](https://kolosei.com/contact/): support and research contact.
- [Research preregistration](https://osf.io/zdv9j): methodology only, not proof of learning outcomes.

This index helps agents find public information. It is not an API or a grant of content rights. Direct OAuth/MCP access remains an authenticated owner pilot; general self-service access is not announced.
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
