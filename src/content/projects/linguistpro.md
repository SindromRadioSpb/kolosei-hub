---
title: LinguistPro
description: Offline-first Hebrew learning workspace — PWA with OPFS + SQLite WASM, Google TTS, SRS, SBL transliteration. Preregistered ulpan-research initiative.
status: active
publishDate: 2024-09-01
updateDate: 2026-05-28
domain: linguistpro.kolosei.com
repo: https://github.com/SindromRadioSpb/tts-prototype-android
featured: true
order: 1
---

A premium learning workstation for Hebrew, built around one idea: **your data stays yours**. Texts, audio, progress, notes — all in browser OPFS + SQLite WASM, never on someone else's server. Cloud only used for heavy compute (TTS, neural translation), where users supply their own keys.

Unlike textbook apps that march you through a fixed curriculum, LinguistPro is an editor for working with any Hebrew text: paste a paragraph, get a table with niqqud, transliteration, translation, and audio per line. Work line by line, extract complex sentences into SRS cards, train, track progress.

**Status (May 2026):** v3.3 in production on Hetzner CX23 + Coolify (migrated from Railway). Ships per-user Gemini API key (key stored in browser only, zero server-side retention), extended morphology dictionary, and Knowledge Graph lazy chunks. v3.2 delivered notes redesign, text-card system, analytics foundation.

**Research mode:** opt-in cohort-based analytics with IRB-style consent, supporting a Hebrew-ulpan diploma project. Preregistered at OSF (`osf.io/zdv9j`). Next milestone: 2 testing cohorts × 20 students.
