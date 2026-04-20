---
id: M-BASELINE-02-scoring-metrics
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-01]
---

# Milestone: Scoring metrics

**ID:** M-BASELINE-02
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Implement the four soft-metric scoring functions that turn a layout object into numbers: visible-crossings count, bend energy, stretch, and node-node / node-edge clearance. Four pure functions, one test suite, one set of numbers per (fixture, engine) pair.

## Context

After M-01 the repo can load fixtures and reject invalid layouts. After M-02 it can score valid ones. Scoring is what turns "here is a layout" into "here is a defensible comparison." The four metrics were chosen during epic framing against the eleven-term EVOLVE-01 set: five metrics total (A1 was in M-01), leaving six EVOLVE-01 terms deferred or retired per the consolidated requirements.

The bend metric uses sum of squared turning angles — one choice among three candidates from research question Q4. The choice is documented as a baseline commitment, not a final one; a future EXP may propose replacing it with curvature integral.

## Acceptance Criteria

1. **A2 — visible-crossings counter.**
   - `E_visible_crossings(layout)` returns the number of proper segment intersections on route polylines
   - Segments sharing an endpoint do not count; consecutive segments within the same route are automatically excluded
   - Proper intersection test uses the orientation / cross-product method; no floating-point equality
   - O(S²) in total segments across all routes — acceptable at baseline scale

2. **A3 — bend energy (sum of squared turning angles).**
   - `E_bend(layout)` sums the square of the turning angle at every interior point of every route polyline
   - Straight-through points contribute 0; 90° corners contribute (π/2)²
   - Degenerate cases (zero-length segments) contribute 0 and do not NaN

3. **A4 — stretch.**
   - `E_stretch(layout, cfg)` sums a per-edge penalty `max(0, (actual − ideal) / ideal)²` where `ideal = factor · layer_distance · layer_spacing`
   - Same-layer edges contribute 0
   - `factor` and `layer_spacing` are config parameters; defaults are documented in `bench/config/defaults.json`

4. **A5 — clearance (two sub-metrics).**
   - `E_repel_nn(layout, cfg)` — bounded quadratic penalty on pairs of nodes closer than `threshold`; `((threshold − d) / threshold)²` per pair
   - `E_repel_ne(layout, cfg)` — same form for (node, non-incident segment) pairs; endpoint-touching pairs are skipped
   - Both saturate at 1 per pair when entities coincide; no 1/d singularities

5. **Tests.**
   - Each metric tested in isolation on hand-crafted layouts with known expected values
   - Happy path, edge cases (empty layout, single-node, two-node), error cases (missing fields, malformed layout)
   - Invariant: each metric returns a non-negative number for any valid layout
   - Determinism: same input → byte-identical output across calls

6. **Integration.**
   - A `scoreLayout(layout, cfg)` helper returns `{ visible_crossings, bend, stretch, repel_nn, repel_ne }` in one call
   - All five metrics run in < 50ms on any fixture from the M-01 loader (soft performance bound; violate only with evidence)

## Technical Notes

- The metrics operate on the output shape produced by `layoutMetro` and `layoutFlow` today: `{ nodes: [{id, x, y, layer}], edges, routes: [{ id, points: [{x,y},...] }] }`. If that shape differs between engines, the scoring layer normalises; it does not special-case per engine.
- Each metric is its own file under `bench/metrics/`. Ten-to-forty-line functions are expected; no helper explosion.
- The EVOLVE-01 versions of these metrics (at `reference/m-evolve-01` under `bench/energy/`) are design references; code is rewritten, not imported.
- Branch coverage is mandatory: each metric's degenerate-case guard tested.

## Out of Scope

- No weighted-sum scalar — the five metrics stay as a vector; no scalar fitness is computed
- No GA, no optimisation
- No scoring of layouts from external engines — that lands when C1/C2 adapters exist
- No metric calibration to a user study — calibration is a future EXP concern
- Abstract layer-model crossing count is explicitly not implemented (demoted to internal capability per consolidated requirements §7; visible crossings is the user-facing version)
- Monotone, envelope, channel, overlap, direction-changes metrics are deferred (consolidated requirements §2 lists them as retired or deferred pending EXP need)

## Dependencies

- M-BASELINE-01 complete (fixture loader exists; invariant checker gates scoring)

## Deliverables

- `bench/metrics/visible-crossings.mjs`
- `bench/metrics/bend.mjs`
- `bench/metrics/stretch.mjs`
- `bench/metrics/repel-nn.mjs`
- `bench/metrics/repel-ne.mjs`
- `bench/metrics/index.mjs` — exposes `scoreLayout(layout, cfg)`
- `bench/config/defaults.json` — default `factor`, `layer_spacing`, `repel_threshold_px`
- `bench/metrics/__tests__/*.test.mjs` — one test file per metric plus one integration test for `scoreLayout`
