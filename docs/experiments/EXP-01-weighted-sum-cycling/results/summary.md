# EXP-01 — Results (summary)

No formal quantitative result set was produced under the v1 framing. This file records qualitative outcomes observable from the frozen branch and its commit history. Numeric artefacts, where they exist, live inside the `reference/m-evolve-01` checkout and are reproducible only under the v1 harness.

## What landed

- **M-EVOLVE-01 pipeline refactoring** — complete. `layoutMetro` decomposed into six strategy slots with a registry. Byte-level equivalence tests confirmed defaults reproduced pre-refactor behaviour. 318 `dag-map` + 316 bench tests green at freeze.
- **Mode 2 / Mode 2.5 exploration** — partial. `layoutProcess` and `renderProcess` implemented; port-assignment stability (trunk + terminus pinning) landed at `dag-map` commit `aba071a`.
- **Accurate H-V-H crossing detector** — landed at commit `ac2b630`. This is important: every GA run prior to this commit was optimising a broken crossing signal.
- **Process-flow route-ordering GA** — a narrow targeted GA for route ordering under `bench/direct/process-ga.mjs`; not the strategy-combination GA the epic had scoped.
- **Geo-metro fixture work** — partial. `bench/fixtures/metro/stockholm.json` gained `geoX`/`geoY` coordinates.
- **Bench print utility** — A2 PDF matrix/grid exports. Commit `b6e3ead`.

## What did not land

- **M-EVOLVE-02 / M-EVOLVE-03 / M-EVOLVE-04** — not started.
- **Strategy-combination genome** — never implemented. The GA continued to evolve the two numeric spacing parameters through the entire v1 timeline.
- **Held-out fixture set** — not implemented.
- **External corpora** — not imported.
- **User-study validation** of metric weights — not performed.

## Observed fitness behaviour

Production GA runs (on the parameter-level genome, against the 34-fixture pool) showed:

- Minimum fitness **stagnating** in a range of ≈ 493–510.
- Average and maximum fitness **oscillating**, with peak values up to 2635.

This profile — stable min, oscillating avg/max — is consistent with a weighted-sum scalar objective trading gains in one term for losses in another: the GA repeatedly explores a trade-off surface without the scalar objective being able to prefer one point on it over another. No stable improvement over generations.

## Cycling / revert evidence

Evidence of heuristic-tuning cycles in the commit log, preserved because they motivated the pivot rather than as a judgement of authorship:

| Area | Pattern |
|------|---------|
| Stagger / V-step / jog | Sequence `7fe6932 → c6e2956 → 138edeb → 89c668b → 5a7cfc7 (revert)` — iterative refinement of a single feature culminating in a revert. |
| Per-station vs fixed offsets | `3f2e4c1` fixed-Y offsets → `bc90565` reverted to per-station. |
| Barycenter refinement | `e6ee114` removed — "adds noise, not signal." |
| Swimlane experiment | `47d3ba2` reverted. |
| Straightening | `8ab1c2d` reverted. |
| Crossing detector | Fixed in `ac2b630` — prior runs had wrong signal. |
