---
title: EgorGenom
description: Parent-driven whole-genome sequencing analysis for a child with suspected genetic disease. Open-source nf-core/raredisease pipeline on WSL2.
status: active
publishDate: 2025-08-01
updateDate: 2026-05-24
repo: https://github.com/SindromRadioSpb
featured: true
order: 2
---

Whole-genome sequencing analysis run in parallel with the clinical team in Israel. Built on the open-source **nf-core/raredisease** pipeline (Nextflow, WSL2 Ubuntu 24.04), with custom layers for phenotype-to-gene scoring, transcript-aware variant prioritization, and ACMG-style triage.

Methodologically committed: every candidate variant validated against live ClinVar / OMIM before integration into reports (local databases lag, sometimes severely). Documentation versioned and updated in the same session as findings — stale documentation is harmful in a clinical context.

**Current focus (May 2026):** prioritized variant list reconciled with phenotype, deferred analyses queued (STRipy 174K, PrimateAI, LOFTEE, RNA-seq, EpiSign, GeneMatcher submission, GIAB validation).

The repository is private out of clinical sensitivity. Methodology, anonymized findings, and contributions back to nf-core/raredisease may be shared publicly as work progresses.
