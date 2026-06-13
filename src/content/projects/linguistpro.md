---
title: LinguistPro
tagline: Offline-first Hebrew learning workspace
description: A privacy-first Hebrew learning workspace — turn any Hebrew text into a line-by-line table with niqqud, transliteration, translation and audio. PWA with OPFS + SQLite WASM; Gemini and Google Cloud do the heavy compute under the learner's own key.
status: active
productType: product
version: v3.6
publishDate: 2024-09-01
updateDate: 2026-05-17
domain: linguistpro.kolosei.com
statusPage: https://stats.uptimerobot.com/hzdU5PQBqp
detailUrl: /products/linguistpro
featured: true
order: 1
gcpServices:
  - Gemini API
  - Cloud Text-to-Speech
  - Cloud Translation v3
gcpPlanned:
  - Vertex AI
changelog:
  - date: "2026-05-17"
    text: 'v3.6 "Smart Learning Graph" — offline shared-root/lemma suggestions and a learner-confirmed "what you know" panel (no AI, no telemetry).'
  - date: "2026-05"
    text: "Production moved to Hetzner CX23 + Coolify; per-user Gemini API key stored in-browser only, zero server-side retention."
  - date: "2026-04"
    text: "v3.2 — premium notes redesign, text-card system with peer sharing, opt-in research/analytics foundation."
---

A premium learning workstation for Hebrew, built around one idea: **your data stays yours**. Texts, audio, progress and notes all live in browser-local OPFS + SQLite WASM — never on someone else's server. The cloud is used only for heavy compute (text-to-speech, neural translation, morphological analysis), and there the learner supplies their own key.

Unlike textbook apps that march you through a fixed curriculum, LinguistPro is an **editor for working with any Hebrew text**: paste a paragraph, get a table with niqqud, transliteration, translation and audio per line. Work line by line, extract complex sentences into spaced-repetition (SRS) cards, train, and track progress.

**Status (May 2026):** v3.6 in production on Hetzner CX23 + Coolify. Ships per-user Gemini API key (stored in the browser only, zero server-side retention), an extended morphology dictionary, and a "Smart Learning Graph" that suggests connections between texts a learner already knows.

**The Reading Room:** a bilingual library — the Hebrew canon with morphology on tap. It catalogues **26,000+ public-domain works** from [Project Ben-Yehuda](https://benyehuda.org/), organised by period and author, with 796 already translated (Gemini) and vocalised (Dicta niqqud) and the rest in progress — a graded path from short, high-frequency texts to the full canon. See [linguistpro.kolosei.com/library.html](https://linguistpro.kolosei.com/library.html).

**Research mode:** opt-in, cohort-based analytics with IRB-style consent, supporting a Hebrew-ulpan pedagogy diploma project. Preregistered at OSF (`osf.io/zdv9j`). Next milestone: two testing cohorts of 20 students.
