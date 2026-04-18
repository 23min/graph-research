# docs/

Research artefacts. This tree grows as the work progresses; entries are added when there is something real to record, not pre-emptively.

## Layout

- `research-questions.md` — the open questions driving the work
- `roadmap.md` — milestone sequencing
- `literature/` — systematic review: bibliography, per-paper notes, thematic reviews, PDFs (gitignored)
- `methodology/` — how the research is conducted (split protocol, metrics, reproducibility, user-study design)
- `experiments/` — per-experiment records (hypothesis, setup, results, discussion)
- `decisions/` — numbered ADRs recording methodological decisions
- `results/` — committed quantitative outputs; regenerated from scripts, not handwritten
- `glossary.md` — metro-map / layered-layout vocabulary

## Conventions

- **Experiment IDs** — `EXP-NN-slug`, stable forever, referenced from commits and methodology docs.
- **Decision IDs** — 4-digit sequential (`0001-...`).
- **Citations** — always via `literature/bibliography.bib`; no ad-hoc references.
- **Reproducibility** — every reported number carries seed + config + code SHA + split hash.

Full discipline: `.ai-repo/rules/research.md`.
