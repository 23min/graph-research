---
id: E-BASELINE-instruments-and-fixtures
status: in-progress
framing: 2026-04-20
---

# Epic: Baseline — instruments and fixtures

**ID:** E-BASELINE

## Goal

Build — from scratch, on `main` — the measurement and rendering instruments that let dag-map be evaluated honestly on a defined fixture set, against named external baselines, and frozen as the v0 reference point that every future EXP compares against.

## Context

Today dag-map on `main` has three layout engines (`layoutMetro`, `layoutFlow`, `layoutHasse`), 285 passing unit tests, and 30 hand-crafted test models. It has no scoring metrics, no external-baseline comparison, no held-out fixture split, no print-quality contact sheet, no reproducibility-protocol plumbing. Everything of that shape was built at `reference/m-evolve-01` and was deliberately not merged during the post-EVOLVE-01 pivot (ADR 0001, ADR 0002).

The pivot's scoped-out methodology epic (`E-EVOLVE-v2-methodology`) was rejected as six-milestones-of-infrastructure-before-any-result. This epic does less: no GA, no multi-objective optimiser, no new layout intervention, no user study. It only builds the measuring stick.

Design lessons from EVOLVE-01 carry forward as *design*, not as *code*: no cherry-picks. Every instrument is rewritten on `main` so the frozen branch stays out of `main`'s history.

**Hasse is out of scope.** `layoutHasse` stays in dag-map because Liminara uses it for CUE schema validation, but it has different requirements, different consumers, and no research track. The baseline does not include it.

## Scope

### In Scope

- **Metrics (A1–A5).** Hard-invariant checker; visible-crossings counter; bend energy (sum of squared turning angles); stretch; node-node + node-edge clearance
- **Rendering (B1–B3).** Multi-engine HTML contact sheet with metric overlays; per-fixture JSON report; A2 PDF print utility
- **External baselines (C1–C2).** dagre adapter and ELK adapter, both from `main` day one
- **Fixture plumbing (D1).** Canonical fixture loader; deterministic read path
- **Fixture split discipline (D3).** Stratified split with hash-frozen `splits.json`, `split-loader.mjs`, CI guard, and ADR 0004 on split versioning
- **Baseline v0 lock.** Canonical contact-sheet HTML + per-fixture JSON + A2 PDF committed under `docs/results/baseline-v0/` with the reproducibility protocol header on every output

### Out of Scope

- No GA, NSGA-II, SMAC, or irace — all deferred to future epics
- No new layout intervention, no pipeline refactor, no changes to `layoutMetro` / `layoutFlow` beyond what adapter/metric code strictly requires
- No Bradley–Terry refit, no Tinder UI
- No user study; no pairwise-preference tooling
- `layoutHasse` — kept in dag-map, not baselined
- No Mode 2.5 bezier variant — stays at `reference/m-evolve-01`
- External corpora beyond what M-07 commits to (Rome-Lib, AT&T, GLaDOS may come in M-07 depending on the split decision; they are not assumed)

## Constraints

- **No cherry-picking from `reference/m-evolve-01`.** Every instrument built fresh on `main` with only the design lessons carried forward
- **Rule 9 applies** (private-source isolation, per `.ai-repo/rules/research.md`)
- **Reproducibility protocol applies to every baseline artefact.** Each committed output file carries seed + config + code SHA + split version hash in its header
- **Hasse is not touched.** Any instrument that incidentally works on layoutHasse output does so for free; nothing is tailored to it
- **TDD by default** for the scoring metrics (A1–A5) and the fixture loader — pure functions with clear input/output contracts
- **All 285 existing dag-map tests continue to pass at every milestone.** Alpha posture allows kill-your-darlings elsewhere, but regression of existing behaviour during baseline work is not intended

## Success Criteria

- [ ] The five metrics compute on any layout object from `layoutMetro`, `layoutFlow`, dagre, or ELK, and on any fixture in the loader
- [ ] The HTML contact sheet renders all selected fixtures across all four engines with metric scores per cell, served via a static-file dev command
- [ ] The A2 PDF print utility produces a vector PDF suitable for physical review
- [ ] The held-out fixture split is hash-frozen; the CI guard fails the build on direct fixture reads from training-side code paths
- [ ] ADR 0003 (priority-sweep ratification of consolidated requirements) and ADR 0004 (fixture-split versioning) are committed
- [ ] Baseline v0 is committed under `docs/results/baseline-v0/` and declared frozen; reproducing it from `main` at the epic's wrap SHA produces byte-identical output

## Risks & Open Questions

| Risk / Question | Impact | Mitigation |
|---|---|---|
| ELK adapter integration (elkjs WASM or Java subprocess) reveals unexpected friction | Med | M-04 is isolated; dagre still ships from M-03 if ELK slips |
| The 30 existing test models are not a representative fixture set | Med | M-07 is explicitly tasked with deciding the full fixture set after the contact sheet (M-05) reveals coverage gaps |
| A single "bend" metric (A3) will disagree with what the research questions eventually want (Q4 may prefer curvature integral) | Low | A3 is documented as a baseline choice, not a final commitment; a future EXP can propose replacement with evidence |
| The reproducibility protocol adds plumbing overhead to every instrument | Low | The discipline is load-bearing; pay it up front rather than retrofit |
| Building on `main` without a working bench substrate means early milestones have no place to run yet | Low | M-01 delivers the loader; subsequent milestones build on it; no substrate needs to exist beforehand |

## Milestones

| ID | Title | Status |
|---|---|---|
| M-BASELINE-00 | Absorb dag-map via git subtree | complete |
| M-BASELINE-01 | Fixture loader + invariant checker | paused (pending M-00) |
| M-BASELINE-02 | Scoring metrics (visible crossings, bend, stretch, clearance) | not started |
| M-BASELINE-03 | dagre adapter | not started |
| M-BASELINE-04 | ELK adapter | not started |
| M-BASELINE-05 | HTML contact sheet + per-fixture JSON report | not started |
| M-BASELINE-06 | A2 PDF print utility | not started |
| M-BASELINE-07 | Fixture split discipline + split-versioning ADR | not started |
| M-BASELINE-08 | Baseline v0 lock | not started |

## ADRs

- **ADR 0003** — priority-sweep ratification of `docs/requirements/dag-map-consolidated.md`. Recorded at epic framing, before M-01 starts; captures the five decisions in §11 of the consolidated doc. (Note: the filesystem ADR 0003 currently records "LLM-assisted research methodology"; the intended-by-this-epic priority-sweep ratification needs a reconciliation pass.)
- **ADR 0004** — vendor dag-map via git subtree. Recorded at the start of M-00; changes the repo topology so research-driven dag-map edits commit atomically with research code
- **Split-versioning ADR** — fixture-split versioning discipline. Recorded in M-07; takes the next available ADR number at that time

## References

- `docs/decisions/0002-adopt-three-track-research-framework.md` — framework
- `docs/requirements/dag-map-consolidated.md` — the requirements this epic operationalises (pending ratification as ADR 0003)
- `docs/research-questions.md` — upstream of future EXPs that will use this baseline
- `docs/methodology/hypothesis-pool.md` — how future EXPs enter the project
- `docs/experiments/EXP-01-weighted-sum-cycling/` — design lessons carried forward from the frozen work
