---
id: M-BASELINE-08-baseline-v0-lock
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-01, M-BASELINE-02, M-BASELINE-03, M-BASELINE-04, M-BASELINE-05, M-BASELINE-06, M-BASELINE-07]
---

# Milestone: Baseline v0 lock

**ID:** M-BASELINE-08
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Run the full instrument against the frozen fixture split, commit the canonical baseline artefacts under `docs/results/baseline-v0/`, and declare the result the official v0 reference point. After this milestone, "dag-map today" has a specific, reproducible, auditable meaning.

## Context

Everything before M-08 has been *building the instrument*. M-08 is where the instrument is used in anger for the first time. The baseline it produces does not evaluate any new intervention — the whole point is that dag-map has not been changed. The point is to fix a reference against which every future EXP can answer the question "did we improve?" with evidence.

This milestone is short because all the work has already been done. What M-08 adds is the act of *declaring the result official* — running the orchestrator on the frozen split, committing the outputs with the full reproducibility header, and tagging the repo so future regressions can be bisected back to this state.

## Acceptance Criteria

1. **Canonical run.**
   - `bench/contact-sheet/orchestrator.mjs` is run against the M-07 held-out split, producing HTML + JSON, and separately against the full split for the print PDF
   - All artefacts carry the complete reproducibility header: seed, config path, code SHA (main repo + dag-map submodule if it is a submodule at this point; else just main repo), split version hash
   - Engine failures (if any) are documented in the report, not hidden

2. **Committed artefacts.**
   - `docs/results/baseline-v0/contact-sheet.html` — the canonical HTML contact sheet
   - `docs/results/baseline-v0/report.json` — the canonical JSON report
   - `docs/results/baseline-v0/showcase-a2.pdf` — the canonical A2 PDF
   - `docs/results/baseline-v0/README.md` — orientation: what this is, what was fixed, how to reproduce, when it was frozen, what it is a baseline *for*

3. **Reproducibility verification.**
   - A test under `bench/__tests__/baseline-v0-reproducibility.test.mjs` re-runs the orchestrator and asserts byte-identical output against the committed artefacts (modulo whitelisted non-deterministic fields like creation date, handled by the PDF determinism work in M-06)
   - The test fails the build if the baseline would change — this is a feature: any future PR that changes dag-map's layout output visibly *requires* an accompanying baseline-v0 update with reviewer approval

4. **Tag.**
   - A git tag `baseline-v0` is applied to the commit that lands the artefacts
   - The tag is referenced from `docs/results/baseline-v0/README.md` and from `docs/requirements/dag-map-consolidated.md` §11 as the "before" state against which priority-sweep decisions can be measured

5. **Baseline content declaration.**
   - `docs/results/baseline-v0/README.md` states explicitly: "this baseline reflects dag-map as of commit `<SHA>`. The contact sheet shows four engines (`layoutMetro`, `layoutFlow`, dagre, ELK) across the v1 fixture split. No layout interventions have been applied. Every future EXP that claims an improvement does so by producing a comparable sheet and pointing to specific (fixture, engine, metric) cells where the comparison is favourable."

6. **No scope creep.**
   - No new metric, adapter, or instrument is added in this milestone
   - If the canonical run reveals a bug in an earlier milestone's output, the fix goes into a patch on that milestone and M-08 re-runs — M-08 does not absorb the fix into itself

## Technical Notes

- The artefacts committed here are produced by scripts committed in earlier milestones; this is the one place in the research rules where "results are regenerated, never handwritten" is tested at epic scale.
- The reproducibility test is not a fast unit test — it runs the full contact-sheet pipeline. Mark it accordingly (slow, integration-tagged) so it does not bog down the inner TDD loop.
- The git tag is applied after the commit lands on `main`, by the principal, not by automation. Tag application is an explicit act that declares the state official.

## Out of Scope

- Any interpretation of the baseline results — "dag-map is weak on X" conclusions are material for the priority sweep (ADR 0003, before this epic) or for a future EXP framing, not for this milestone
- Comparison against previous baselines — there is no previous baseline
- Publication — content-track decisions about what, if anything, to publish based on the baseline happen in the next epic wrap, not here
- Performance benchmarks — timing measurements are not part of the baseline v0 (they are a separate instrument, not built in this epic)

## Dependencies

- All earlier milestones complete

## Deliverables

- `docs/results/baseline-v0/contact-sheet.html`
- `docs/results/baseline-v0/report.json`
- `docs/results/baseline-v0/showcase-a2.pdf`
- `docs/results/baseline-v0/README.md`
- `bench/__tests__/baseline-v0-reproducibility.test.mjs`
- Git tag `baseline-v0` applied to the landing commit
