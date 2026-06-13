---
title: HDLE Premium
tagline: Desktop Hebrew lexicography & terminology extraction
description: A desktop workbench for Hebrew lexicography and terminology extraction. Import documents, build reference corpora, extract multi-word terms with Stanza NLP, and batch-translate via Google Cloud Translation v3 — with encrypted credentials and full project portability.
status: active
productType: product
version: v1.0.1
publishDate: 2025-11-01
updateDate: 2026-05-20
repo: https://github.com/SindromRadioSpb/v_book
detailUrl: /products/v-book
featured: true
order: 3
gcpServices:
  - Cloud Translation v3
gcpPlanned:
  - Vertex AI
  - Document AI
changelog:
  - date: "2026-05"
    text: "Reference-corpus integration (M12) in progress; local NLLB offline translation and adaptive worker batching."
  - date: "2026-04"
    text: "Project Exchange — portable .hdleproj bundles with SHA256 integrity for cross-machine sharing."
  - date: "2026-03"
    text: "Security hardening (P0): AES-256-GCM credential encryption, OS-keyring storage, audit logging."
---

**HDLE Premium** (Hebraic Dynamic Lexicon Engine) is a desktop application for professional Hebrew lexicography and terminology extraction — the same Hebrew-NLP core as LinguistPro, aimed at translators, terminologists and researchers rather than learners.

Import documents (TXT, DOCX, PDF with OCR), define reference corpora — a 387k-document Hebrew Wikipedia baseline ships with it — then extract multi-word expressions and lemmatized terms with PMI / T-score scoring and FTS5 concordance search. A translation-memory and batch-translation pipeline runs through **Google Cloud Translation API v3** (official client) with budget guards and usage tracking, alongside a free fallback tier.

Built with Python + PyQt6, SQLAlchemy + SQLite (WAL, FTS5), and Stanza for Hebrew lemmatization and POS tagging. Credentials are encrypted at rest with **AES-256-GCM** and stored in the OS keyring; nothing is sent anywhere except the translation provider the user selects. Projects export to portable `.hdleproj` bundles (ZIP + SHA256) for conflict-free sharing across machines. Exports: Excel, CSV, JSONL, TBX, TMX.
