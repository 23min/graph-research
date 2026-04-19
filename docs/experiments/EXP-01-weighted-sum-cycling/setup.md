# EXP-01 — Setup

## Scope

Layered / metro-map DAG layout only. Mode 1 (`layoutMetro`) was the primary engine under test; Mode 2 (`layoutProcess`) and Mode 2.5 (bezier variant) were explored but not validated under the weighted-sum framing.

## Pipeline under test

`dag-map`'s `layoutMetro` was refactored into six strategy slots with a registry:

| Slot | Role |
|------|------|
| `extractRoutes` | Derive or consume routes (lines) across the DAG |
| `orderNodes` | Order nodes within each layer |
| `reduceCrossings` | Apply a crossing-reduction pass |
| `assignLanes` | Assign parallel-edge lanes (metro-style) |
| `refineCoordinates` | Post-hoc coordinate adjustment (stagger, V-step, jog) |
| `positionX` | Final horizontal positioning |

See `design-notes/epic.md` and `design-notes/M-EVOLVE-01-pipeline-refactoring.md`.

## Genome

File: `bench/genome/tier1.mjs` (historical). As of freeze, only two numeric parameters:

- `mainSpacing` (float)
- `subSpacing` (float)

`bench/genome/strategy-genes.mjs` defined strategy fields as fixed options passed into `layoutMetro`; they were **not** selected by the GA.

## Fixture pool

34 in-house fixtures across four categories:

- MLCM fixtures (hand-crafted crossing challenges)
- Real metro networks (Stockholm, Wien, BVG, Lisboa, Nantes, Montpellier)
- Internal models (from `dag-map/test/models.js`, node count ≥ 8)
- Random generated DAGs

No train/validation/test split. Both GA optimisation and evaluation read from the same pool.

## Fitness function

File: `bench/config/default-weights.json` (historical, commit `1daa360`). An 11-term weighted-sum energy covering crossings, bends, edge length, stress, overlap, monotonicity, area, and related aesthetic metrics. Weights were hand-tuned to "smooth energy cliffs" without a reference user-study.

## GA parameters

- Population: inherited from earlier bench experiments; exact numbers are in commits within `design-notes/tracking/M-EVOLVE-01-tracking.md`.
- Seeded RNG, single-objective scalar minimisation.

## External corpora

**None.** No Rome-Lib, AT&T/North, GLaDOS, or other standard graph-drawing benchmarks were used at any stage of v1.

## User study

**None.** No task-based or preference-based human evaluation was run to validate the weights or the metric set.

## Reproducibility artefacts

Frozen at tag `reference/m-evolve-01` on both the main repo and the `dag-map` submodule. The branch and tag preserve all code exactly as it stood at freeze. See `design-notes/REFERENCE.md` for the full retrieval instructions and the commit-level inventory.
