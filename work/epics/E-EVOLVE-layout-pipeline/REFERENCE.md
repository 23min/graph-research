---
epic: E-EVOLVE-layout-pipeline
status: frozen
frozen: 2026-04-17
branch: milestone/M-EVOLVE-01
tag: reference/m-evolve-01
superseded_by: E-EVOLVE-v2-methodology (pending, see D-023)
---

# E-EVOLVE-layout-pipeline — Reference Snapshot

This epic was frozen on 2026-04-17 rather than merged. The decision to pivot is recorded in `docs/decisions/D-023-pivot-to-multi-objective-methodology.md`. The branch and tag are preserved so the work remains retrievable and browsable. Nothing from this branch was merged to `main` at freeze time.

## How to retrieve

```bash
git checkout reference/m-evolve-01
git submodule update --init --recursive
cd dag-map && git checkout reference/m-evolve-01
```

Tag exists on both the main repo and the `dag-map` submodule.

## What the branch contains

**Landed (complete per milestone tracking):**
- **M-EVOLVE-01 pipeline refactoring** — `layoutMetro` decomposed into six strategy slots (`extractRoutes`, `orderNodes`, `reduceCrossings`, `assignLanes`, `refineCoordinates`, `positionX`) with a registry. Byte-level equivalence tests confirm defaults reproduce pre-refactor behavior. 318 dag-map + 316 bench tests green.

**Explored, not validated under the forthcoming methodology:**
- **Mode 2 (process flow)** — `layoutProcess` + `renderProcess`. Celonis-style process layout with card stations and H-V-H orthogonal routing.
- **Mode 2.5 (process bezier)** — same layout, bezier routing + metro-style dot stations. See `docs/history/layout/mode-2.5-bezier-process.md` for the full design note.
- **Port assignment stability** — trunk detection + terminus pinning for Mode 2 / Mode 2.5. See `dag-map` commit `aba071a`.
- **Process-flow route-ordering GA** — LTR and TTB optimized separately (`bench/direct/process-ga.mjs`). Not part of the evolutionary strategy framework from the epic spec; it's a targeted GA for a single decision.
- **Geo-metro fixture work** — partial. `bench/fixtures/metro/stockholm.json` gained `geoX`/`geoY` coordinates.
- **Accurate crossing detector** — H-V-H decomposition for polyline crossings (`bench/energy/polyline_crossings.mjs`). Commit `ac2b630`. Prior GA runs optimized a broken crossing signal.
- **Bench print utility** — A2 PDF export with matrix + grid modes. Commit `b6e3ead`. Deferred cherry-pick to `main` (will land with E-EVOLVE-v2 worktree setup).

## Divergence from the epic spec

The epic's core thesis was **"evolve strategy combinations, not just parameters."** This did not happen. As of freeze:
- The genome (`bench/genome/tier1.mjs`) evolves two numeric spacing parameters (`mainSpacing`, `subSpacing`).
- `bench/genome/strategy-genes.mjs` defines strategy fields, but they are passed to `layoutMetro` as fixed options — not selected by the GA.
- Milestones M-EVOLVE-02 / -03 / -04 remain "not started."
- The bulk of post-refactor work became manual tuning of Mode 2 / Mode 2.5 layout heuristics.

## Cycling / revert patterns

Evidence of convergence difficulty in heuristic-space. Documented honestly because it motivated the pivot:

| Area | Pattern |
|------|---------|
| Stagger / V-step / jog | Sequence `7fe6932 → c6e2956 → 138edeb → 89c668b → 5a7cfc7 (revert)` — iterative refinement of a single feature culminating in a revert. |
| Per-station vs fixed offsets | `3f2e4c1` fixed-Y offsets → `bc90565` reverted to per-station (broke stagger otherwise). |
| Barycenter refinement | `e6ee114` removed — "adds noise, not signal." |
| Swimlane experiment | `47d3ba2` reverted. |
| Straightening | `8ab1c2d` reverted. |
| Crossing detector | Fixed in `ac2b630` — prior runs had wrong signal. |

Fitness oscillation during production GA runs (min fitness stagnates, avg/max oscillate wildly with spikes up to 2635) is consistent with weighted-sum objective trading gains in one term for losses in another.

## Key commits

```
1a9d0e6  chore(bench): snapshot stockholm geo coords and dag-map port-stability update
34b51a0  chore(work): archive M-EVOLVE-01 showcase PDFs and HTML as reference
b6e3ead  feat(bench): A2 PDF print utility with matrix + grid modes          ← cherry-pick candidate
ef30ad4  feat(bench): mode 2.5 comparison, process fixtures, geo metro
ac2b630  fix(bench): accurate crossing detector — proper H-V-H decomposition  ← prior GA signal was wrong
9867893  feat(bench): add Process Default column (no GA) alongside Process GA
58bc2e8  feat(bench): separate GA optimization for LTR and TTB
46aae41  feat(bench): process layout GA + benchmark runner (#17-20)
eb77823  docs(research): Mode 2 process layout roadmap
```

dag-map submodule:
```
aba071a  feat(layout-process): stabilize port assignment at trunk and terminus stations
cedfb55  feat(layout-process): mode 2.5 bezier, port assignment, gap pre-detection
```

## Reference artifacts

Printed reference captures from the M-EVOLVE-01 freeze. A2 landscape PDFs, vector, white background, suitable for physical printing.

| Artifact | Purpose |
|----------|---------|
| `work/reports/showcase-m-evolve-01.pdf` | 5×5 matrix: metro-ref × process-default × process-ga × process-bezier × flow-legacy, on Stockholm, O2C, Incident Process, Dense Interchange, Parallel Processes. |
| `work/reports/showcase-m-evolve-01.html` | HTML sidecar with embedded SVGs (for future inspection). |
| `work/reports/stockholm-bezier-m-evolve-01.pdf` | Solo Stockholm × Process Bezier, A2 1-up, `labelSize: 18 × scale: 2.2`. |
| `work/reports/stockholm-bezier-m-evolve-01.html` | HTML sidecar. |

Selection files live at `work/reports/showcase-selection.mjs` and `work/reports/stockholm-bezier-selection.mjs`. They are live configuration, not archival.

## Pivot rationale (short)

See `docs/decisions/D-023-pivot-to-multi-objective-methodology.md` for the full record. Summary:

- Weighted-sum fitness over conflicting objectives produces cycling without exposing the Pareto trade-off surface.
- No standard graph-drawing corpora (Rome-Lib, AT&T, GLaDOS) in the evaluation — overfitting risk.
- No held-out fixture set — same fixtures drive optimization and evaluation.
- No user-study validation of the quality metrics.
- Relevant recent results (van Wageningen et al., GD 2025) show aesthetic metrics can be gamed while producing visually poor output — a direct threat to any weighted-sum claim.

The pivot moves to NSGA-II multi-objective + SMAC/irace baseline + standard corpora + held-out split. See `work/epics/E-EVOLVE-v2-methodology/` once written.
