---
title: LinguistPro
tagline: Turn real-world Hebrew into a learning workspace
tagline_ru: Превращайте живой иврит в учебное пространство
description_ru: Local-first среда для изучения иврита — превращает статьи, документы, фото, аудио, видео и субтитры в построчные учебные материалы с никудом, переводом, аудио, морфологией и повторением.
description: A local-first Hebrew learning workspace that turns articles, documents, images, audio, video and captions into line-by-line study material with niqqud, translation, audio, morphology and review.
status: active
productType: product
version: v3.11
publishDate: 2024-09-01
updateDate: 2026-09-08
domain: linguistpro.kolosei.com
repo: https://github.com/SindromRadioSpb/tts-prototype-android
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
  - date: "2026-09-08"
    text: "Updated public reference: Study Songs and Materials Science collections, shared discovery, recorded vocabulary familiarity and derived Obsidian study packages."
  - date: "2026-08-29"
    text: "The open Physics — Year 1 Problem Book is live in the Reading Room: 9 chapters, 74 bilingual cards, reviewed answers and complete exam-format solutions."
  - date: "2026-07-30"
    text: "v3.11 — multimodal Studio import: articles, documents, photos, audio, video and captions; long-media processing, progressive tables and source-aware karaoke."
  - date: "2026-07-29"
    text: 'Graded retelling: simplify a source to A1–B2 as a separate derived text, with measured vocabulary coverage before and after.'
  - date: "2026-07-24"
    text: "Reading Room and Studio now share one canonical personal word note while keeping machine reference meaning separate."
  - date: "2026-07-11"
    text: "Reading-to-memory loop shipped: FSRS-6, contextual review across surfaces and production-grade Anki export/read-back."
---

A premium learning workstation for Hebrew, built around one idea: **start with the language you actually want to understand**. The core workspace lives in browser-local OPFS + SQLite WASM. Optional cloud sync, research and agent integrations are separate, consent-controlled capabilities.

Unlike textbook apps that march everyone through one curriculum, LinguistPro works with real sources: paste text, fetch an article, open a document or photo, or bring audio, video and captions. It creates a line-by-line workspace with niqqud, translation, audio, morphology and source-aware review.

**Status (September 2026):** the v3.11 series is in production on Hetzner + Coolify. The shipped product includes multimodal Studio import, the Reading Room, honest morphology, FSRS-6 retention, the reviewed 74-problem Physics corpus and optional consent-controlled account and agent surfaces.

**The Reading Room:** literature from Project Ben-Yehuda, Study Songs, Physics and Materials Science, sharing morphology and contextual review with the Studio. The dated public counts and sources are maintained in `src/data/linguistpro.ts` and rendered on the product and reference pages.

**Research mode:** opt-in, cohort-based analytics with IRB-style consent, supporting a Hebrew-ulpan pedagogy diploma project. Preregistered at OSF (`osf.io/zdv9j`). Preregistration does not establish measured learning effectiveness.
