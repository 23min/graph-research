# docs/

Research artefacts. This tree grows as the work progresses; entries are added when there is something real to record, not pre-emptively.

## Layout

- `graph-visualization-field-map.md` — survey of the graph-drawing research landscape (communities, active researchers, open problems); background reading for the hypothesis pool and methodology
- `research-questions.md` — thesis-level questions the project is currently curious about; upstream of hypotheses and experiments
- `literature/` — systematic review: bibliography (single source of truth for citations), per-paper notes, thematic reviews, PDFs (gitignored, out-of-band)
- `methodology/` — how the research is conducted; start at `three-track-workflow.md` for the operating model
- `experiments/` — per-experiment records (hypothesis, setup, results, discussion)
- `decisions/` — numbered ADRs recording methodological and architectural decisions
- `requirements/` — extracted or proposed requirements for the components under study; drafts-for-review, not ratified scope
- `results/` — committed quantitative outputs; regenerated from scripts, not handwritten
- `glossary.md` — metro-map / layered-layout vocabulary

Active roadmap and epic tracking live under `/work/`, not here.

## Conventions

- **Experiment IDs** — `EXP-NN-slug`, stable forever, referenced from commits and methodology docs.
- **Decision IDs** — 4-digit sequential (`0001-...`).
- **Citations** — always via `literature/bibliography.bib`; no ad-hoc references.
- **Reproducibility** — every reported number carries seed + config + code SHA + split hash.

Full discipline: `.ai-repo/rules/research.md`.
