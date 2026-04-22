---
id: M-BASELINE-03-dagre-adapter
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-01]
---

# Milestone: dagre adapter

**ID:** M-BASELINE-03
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Wrap the `dagre` library so any fixture loaded by M-01 can be laid out by dagre and scored by the M-02 metrics in exactly the same shape as a `layoutMetro` or `layoutFlow` output. One external baseline, identical calling contract.

## Context

dagre is the standard Sugiyama-family layered layout engine in the JavaScript ecosystem: npm-native, synchronous, small dependency surface, widely known to reviewers. Running the baseline metrics against dagre output answers the implicit question "how does dag-map compare to a well-known external engine?" without committing to a full user study.

The adapter is a pure translation layer — fixture-in, layout-out — with no dagre-specific tuning. Dagre does not know about routes; route-level metadata (class, id) is carried through from the fixture to the output layout shape so the metrics can still compute per-route scores.

## Acceptance Criteria

1. **Adapter contract.**
   - `layoutDagre(fixture, options)` returns a layout object with the same shape as `layoutMetro`: `{ nodes: [{id, x, y, layer}], edges, routes: [{id, cls, points: [{x,y},...]}] }`
   - `edges` and `nodes` are drawn from the fixture; coordinates are read from dagre's output graph
   - `routes` are reconstructed from the fixture's route metadata; `points` are concatenations of per-edge polylines along each route's node sequence

2. **Configuration pass-through.**
   - Minimum dagre configuration: `rankdir` (defaults to `LR`), `nodesep`, `ranksep`, `edgesep`
   - `options` accepts a `dagre` sub-object that is passed through verbatim; the adapter itself does not opinion-ate

3. **Invariant compatibility.**
   - Layouts produced by `layoutDagre` pass `checkInvariants` from M-01 on any fixture where dagre completes successfully (dagre's layered output satisfies forward-only and topological-X by construction)
   - When dagre fails (e.g. on fixtures with cycles), the adapter throws a clear error naming the fixture and the dagre failure

4. **Scoreability.**
   - `scoreLayout(layoutDagre(fixture), cfg)` returns a valid five-metric vector with no NaN or Infinity values on any of the 32 M-01 fixtures
   - A test runs dagre on every fixture in the loader and asserts finite, non-negative scores

5. **Tests.**
   - Happy path: dagre runs on a representative subset (≥ 5 fixtures of varying sizes), invariants pass, scoring produces finite values
   - Edge case: fixture with one node; fixture with no routes
   - Error case: fixture id that does not exist; fixture that dagre cannot lay out
   - Deterministic: same fixture + same options → byte-identical layout object across calls

6. **Dependency discipline.**
   - `dagre` is added as a dependency of `bench/` only — not of `dag-map/`
   - Version pinned; the `bench/package-lock.json` is committed

## Technical Notes

- dagre's node coordinates are at the geometric centre; dag-map layouts also centre-origin, so no coordinate transform is usually needed. Normalise anyway so the metric inputs are identical in convention across engines.
- Route polylines: for each route, walk its node sequence; for each consecutive pair, read the dagre edge's `points` array (dagre populates this); concatenate. Handle the last-point-of-edge-N equals first-point-of-edge-N+1 case.
- Layer numbers: dagre assigns ranks; map dagre rank → `layer` integer on each node.
- No attempt to make dagre "metro-like" — this is a baseline adapter, not a competitor. The point is to see what dagre produces, not to make it better.

## Out of Scope

- Any tuning of dagre's parameters for aesthetic parity — future EXPs may want this; the baseline records dagre's defaults
- Support for dagre's non-layered modes (dagre is layered-only; included for completeness)
- ELK integration — that's M-04
- Contact sheet integration — that's M-05; the adapter only needs to produce valid layouts and score them

## Dependencies

- M-BASELINE-01 complete (fixture loader + invariant checker)
- M-BASELINE-02 complete (scoring metrics) — needed to assert scoreability in AC4

## Deliverables

- `bench/adapters/dagre.mjs`
- `bench/adapters/__tests__/dagre.test.mjs`
- Updated `bench/package.json` with `dagre` dependency and lockfile
