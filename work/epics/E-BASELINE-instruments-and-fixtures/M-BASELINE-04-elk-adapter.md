---
id: M-BASELINE-04-elk-adapter
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-01, M-BASELINE-02]
---

# Milestone: ELK adapter

**ID:** M-BASELINE-04
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Wrap the `elkjs` library (the WASM port of Eclipse Layout Kernel) so any fixture loaded by M-01 can be laid out by ELK's layered algorithm and scored by the M-02 metrics. Second external baseline in the same contract as M-03.

## Context

ELK's layered algorithm (`org.eclipse.elk.layered`) is considered the stronger Sugiyama-family baseline in the graph-drawing community and is the honest reference point for anyone reading a "vs named baselines" comparison. The elkjs port makes it usable from Node without a Java runtime; integration cost is higher than dagre (ELK-JSON graph-shape conversion, asynchronous API) but not prohibitive.

This milestone is structurally parallel to M-03: pure translation, no tuning, identical output shape. The reason it is a separate milestone rather than bundled with dagre is the integration cost difference — elkjs has its own idioms (promise-based API, ELK-JSON schema, option namespacing) and a snag here should not block dagre from shipping.

## Acceptance Criteria

1. **Adapter contract.**
   - `async layoutElk(fixture, options)` returns a layout object with the same shape as `layoutMetro` and `layoutDagre`
   - The async signature is acceptable because contact sheet generation (M-05) is already async-friendly; the adapter does not attempt to synchronise elkjs
   - `edges`, `nodes`, `layer` drawn from ELK's output; `routes` reconstructed from fixture route metadata same as M-03

2. **Configuration pass-through.**
   - Defaults to `org.eclipse.elk.layered` as the algorithm
   - Minimum configurable options: layer direction (`RIGHT`, `DOWN`), node-node spacing, layer spacing
   - `options.elk` sub-object passes through verbatim to elkjs

3. **Invariant compatibility.**
   - Layouts from `layoutElk` pass `checkInvariants` on any fixture where ELK completes successfully
   - ELK failures (on malformed input) throw clear errors naming the fixture and the ELK message

4. **Scoreability.**
   - `scoreLayout(await layoutElk(fixture), cfg)` returns a finite five-metric vector for every M-01 fixture

5. **Tests.**
   - Happy path: ELK runs on ≥ 5 representative fixtures, invariants pass, scoring produces finite values
   - Edge case: single-node fixture; no-route fixture
   - Error case: unknown id; malformed fixture
   - Determinism: ELK's layered algorithm is deterministic given a seed; the adapter fixes any non-determinism it finds or documents the exception

6. **Dependency discipline.**
   - `elkjs` added as a `bench/` dependency only
   - Version pinned; lockfile committed

## Technical Notes

- ELK's graph JSON is `{ id, children: [...nodes], edges: [{sources, targets}] }` with options nested under `layoutOptions`. The adapter converts the fixture into this shape, awaits `elk.layout(graph)`, and reads coordinates back from `children[i].x`, `children[i].y` and edge `sections[0].startPoint`, `bendPoints`, `endPoint`.
- ELK coordinates are in its own coordinate space; verify the orientation (y-down vs y-up) and normalise to match dag-map conventions.
- Route polyline reconstruction: same approach as M-03 — walk the route's node sequence, concatenate per-edge polyline points. ELK gives `sections` per edge with `startPoint`, `bendPoints[]`, `endPoint`.
- elkjs 0.9+ has a worker-threaded mode and a main-thread mode; use main-thread for simplicity at baseline scale. Revisit if M-05 shows a performance problem.

## Out of Scope

- ELK algorithms other than `layered` — stress, force, radial are available but not baseline-relevant
- Tuning ELK for aesthetic parity with dag-map — baseline records defaults
- A Java-based ELK invocation — elkjs WASM is sufficient at baseline scale
- Worker-threaded scaling — revisit only if contact sheet generation blocks on ELK

## Dependencies

- M-BASELINE-01 complete
- M-BASELINE-02 complete

## Deliverables

- `bench/adapters/elk.mjs`
- `bench/adapters/__tests__/elk.test.mjs`
- Updated `bench/package.json` with `elkjs` dependency and lockfile
