---
id: M-BASELINE-01-fixture-loader-and-invariant-checker
epic: E-BASELINE-instruments-and-fixtures
status: complete
completed: 2026-04-22
depends_on: [M-BASELINE-00]
---

# Milestone: Fixture loader + invariant checker

**ID:** M-BASELINE-01
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** complete

## Goal

Establish the smallest possible foundation the rest of the baseline sits on: a deterministic fixture loader that returns a canonical fixture shape, and a hard-invariant checker that rejects layouts which violate the non-negotiable correctness rules before any scoring runs.

## Context

Today dag-map's 32 test models (30 primary fixtures plus two `_dim` heatmap variants) live in `dag-map/test/models.js` as imperative JavaScript objects consumed directly by the test suite. They are not addressable by stable ID, not deterministic across consumers, and have no validation layer. Every future milestone in this epic consumes fixtures, so the loader must exist first.

The invariant checker is paired with the loader because the two together form "correctness plumbing before any metric runs." The invariants from EVOLVE-01 (forward-only edges in layer order, forward-only edges in rendered X, determinism) are the rejection gate that EXP-01 proved is load-bearing — without it, a broken layout can still produce numeric scores and "optimisation" is optimising garbage.

No code from `reference/m-evolve-01` is imported; both components are rewritten from scratch on `main`.

## Acceptance Criteria

1. **Fixture loader contract.**
   - `loadFixture(id)` returns `{ id, name, dag: { nodes, edges }, routes, theme, opts }` for any id present in the fixture catalogue, where `name` is the human-readable display label carried by each fixture (e.g. `"1 — Linear chain (3 nodes, 1 class)"`)
   - The function is deterministic: same id → byte-identical return object across calls and processes
   - Unknown id throws a clear error naming the id and listing available ids

2. **Fixture catalogue.**
   - A single source of truth lists the 32 existing test models by id, available through `listFixtures()`
   - The catalogue is data, not code — the id → source mapping is read from a committed index file, not hardcoded. Index entries are `{ id, source }` pairs; `source` is the module path the loader reads the fixture from (initially `"dag-map/test/models.js"` for all 32)
   - Adding a fixture is a one-line change to the index; future external fixture sources land as sibling entries with their own `source` path without touching loader dispatch logic

3. **Invariant checker contract.**
   - `checkInvariants(layout)` returns `null` for valid layouts, or `{ rejected: true, rule, detail }` for invalid ones
   - Implements three rules: forward-only edges in layer order; forward-only edges in rendered X; topological X (any two nodes in different layers have X consistent with layer order)
   - `checkDeterminism(layoutA, layoutB)` compares two renders of the same genome + fixture and returns `null` if byte-identical, or a rejection object otherwise

4. **Tests (node:test).**
   - Happy path: loader returns each of the 32 models; invariant checker accepts valid layouts produced by `layoutMetro` on each model
   - Edge cases: empty DAG, single-node DAG, fixture with no routes, disconnected components
   - Error cases: unknown fixture id, malformed fixture on disk, missing `dag.edges` field
   - Invariant violations: hand-crafted broken layouts that must be rejected by each rule
   - Round-trip: `checkDeterminism` on two `loadFixture` calls of the same id returns null

5. **Location.**
   - Both land in a new `bench/` directory at the repo root — `bench/fixtures/loader.mjs` and `bench/invariants/checker.mjs` — so subsequent milestones have an established home
   - `bench/package.json` declares `"engines": { "node": ">=22.0.0" }`, `"type": "module"`, a `test` script running `node --test`, and depends on `"dag-map": "*"` resolved via npm workspaces
   - Root `package.json` gains `"workspaces": ["bench", "dag-map"]`; `.nvmrc` at repo root pins `22`. Bench imports dag-map through the public `exports` map (`import { layoutMetro } from 'dag-map'`), not via relative paths into `dag-map/src/`
   - No changes to `dag-map/` itself

## Technical Notes

- The fixture catalogue index file can be as simple as a committed `fixtures/index.json` listing `{ id, source }` entries. Over-engineering to an abstract registry is unnecessary at this scale.
- The loader reads from `dag-map/test/models.js` via ES module import for the initial 32 fixtures. Future externals land as sibling entries with their own `source` path; the loader dispatches on `source`.
- Workspace consumption is live: `node_modules/dag-map` is a symlink to `../dag-map/`, so edits to dag-map source are picked up on the next `node --test` run with no rebuild. See `docs/dag-map-vendored.md` § "Mutating dag-map per experiment" for the full pattern.
- Invariant checker is pure — no IO, no state. Writable as a ~50-line file.
- Branch coverage is mandatory (project rule): every rule's pass and fail path tested.

## Out of Scope

- No scoring metrics beyond the hard-invariant rules — A2–A5 are the next milestone
- No external baselines — C1 and C2 are later milestones
- No rendering, no PDF, no contact sheet
- No held-out split discipline — the loader reads the full fixture set as one pool; M-07 adds the split
- No fixtures beyond the 32 test models already on `main`

## Dependencies

- None. This is the foundation milestone.

## Deliverables

- `bench/fixtures/loader.mjs`
- `bench/fixtures/index.json`
- `bench/fixtures/__tests__/loader.test.mjs`
- `bench/invariants/checker.mjs`
- `bench/invariants/__tests__/checker.test.mjs`
- `bench/package.json`
- `bench/README.md` — one-paragraph orientation
