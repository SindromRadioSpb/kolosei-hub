---
title: EgorGenom
tagline: Health-AI research vertical — rare-disease genomics
tagline_ru: Health-AI исследовательская вертикаль — геномика редких болезней
description_ru: Полногеномный анализ, который ведёт родитель для ребёнка с подозрением на генетическое заболевание, параллельно с клинической командой. Health-AI исследовательская вертикаль на открытых пайплайнах nf-core — пока не коммерческий продукт.
description: Parent-driven whole-genome sequencing analysis for a child with a suspected genetic disease, run in parallel with the clinical team. A health-AI research vertical built on the open-source nf-core pipelines — not yet a commercial product.
status: active
productType: research
publishDate: 2025-08-01
updateDate: 2026-05-30
detailUrl: /products/egorgenom
featured: true
order: 4
gcpPlanned:
  - Vertex AI
  - BigQuery
  - Cloud Storage
  - Document AI
---

Whole-genome sequencing analysis run in parallel with a clinical team, built on the open-source **nf-core/sarek** and **nf-core/raredisease** pipelines (Nextflow, WSL2 Ubuntu 24.04), with custom layers for phenotype-to-gene scoring, transcript-aware variant prioritization, and ACMG-style triage.

Methodologically committed: every candidate variant is validated against live ClinVar / OMIM before integration into reports (local databases lag, sometimes severely), and documentation is versioned in the same session as the findings — stale documentation is harmful in a clinical context. A blinded multi-expert review protocol and a reproducibility layer (`RUNBOOK`, pinned Docker digests) make the analysis re-runnable.

**This is a research vertical, not a product.** The repository is **private out of clinical sensitivity** — it contains identifiable patient data. A de-identification plan governs any future public release of the generic pipeline and methodology, with raw data deposited to controlled-access archives only.

**Where Google Cloud fits (planned):** Vertex AI for phenotype-to-gene scoring models, BigQuery for population-frequency datasets (gnomAD) at scale, Cloud Storage for de-identified genomic data, and Document AI for parsing clinical PDFs. See [Technology](/technology) for how this sits alongside the production Google Cloud usage in our language products.
