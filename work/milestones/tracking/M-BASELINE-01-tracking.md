# Tracking: Fixture loader + invariant checker

**Milestone:** M-BASELINE-01-fixture-loader-and-invariant-checker
**Epic:** E-BASELINE-instruments-and-fixtures
**Branch:** milestone/M-BASELINE-01-fixture-loader-and-invariant-checker
**Base branch:** epic/E-BASELINE-instruments-and-fixtures
**Started:** 2026-04-21
**Status:** in-progress

## Acceptance Criteria

- [ ] **AC1 — Fixture loader contract.** `loadFixture(id)` returns `{ id, name, dag: { nodes, edges }, routes, theme, opts }` for any id in the catalogue. Deterministic (same id → byte-identical return across calls and processes). Unknown id throws a clear error naming the id and listing available ids.
- [ ] **AC2 — Fixture catalogue.** Single source of truth lists 32 existing test models by id, available through `listFixtures()`. Catalogue is data (committed index file with `{ id, source }` entries), not code. Adding a fixture is a one-line change to the index; future external sources land as sibling entries with their own `source` path.
- [ ] **AC3 — Invariant checker contract.** `checkInvariants(layout)` returns `null` for valid layouts or `{ rejected: true, rule, detail }` for invalid ones. Implements three rules: forward-only edges in layer order; forward-only edges in rendered X; topological X. `checkDeterminism(layoutA, layoutB)` returns `null` if byte-identical.
- [ ] **AC4 — Tests (node:test).** Happy path on all 32 models; edge cases (empty DAG, single-node, no routes, disconnected); error cases (unknown id, malformed fixture, missing `dag.edges`); invariant violations (each rule's fail path); round-trip determinism.
- [ ] **AC5 — Location.** `bench/fixtures/loader.mjs`, `bench/invariants/checker.mjs`, tests under `__tests__/`. `bench/package.json` declares engines `>=22.0.0`, `"type": "module"`, `"test": "node --test"`, depends on `"dag-map": "*"` via npm workspaces. Root `package.json` gains `"workspaces": ["bench", "dag-map"]`; `.nvmrc` at repo root pins `22`. Bench imports dag-map via the public `exports` map, not via relative paths.

## Implementation Log

| Phase | What | Tests | Status |
|-------|------|-------|--------|
| 1 | Bench scaffold: root `workspaces` field, `bench/package.json`, `.nvmrc`, `bench/README.md`, directory layout. No tests yet. | 0 | pending |
| 2 | Fixture loader + catalogue (`bench/fixtures/index.json`, `bench/fixtures/loader.mjs`) — AC1, AC2 | TBD (RED → GREEN) | pending |
| 3 | Invariant checker (`bench/invariants/checker.mjs`) — AC3 | TBD (RED → GREEN) | pending |
| 4 | Full test pass + branch-coverage audit — AC4 verification | TBD | pending |

## Test Summary

- **Total tests:** 0
- **Passing:** 0
- **Build:** pending

## Notes

**Pre-implementation decisions carried in from session audit (2026-04-21):**

- Fixture count is **32**, not 30 — inspection of `dag-map/test/models.js` revealed 30 primary fixtures plus two `_dim` heatmap variants. Spec updated in this session.
- `name` field included in the loader's return contract — dag-map's fixtures carry a human-readable display label (e.g. `"1 — Linear chain (3 nodes, 1 class)"`) and bench consumers will want it.
- Catalogue index uses `{ id, source }` entries, not `{ id, path }`. `source` names the module path; loader dispatches on it. Extensible to future external fixture sources without touching loader logic.
- Node version pinned to `>=22.0.0` in `bench/package.json` engines field (devcontainer runs 22.22.2). `.nvmrc` at repo root pins `22` for contributors outside the devcontainer.
- Bench consumes dag-map via **npm workspace symlink** (`"dag-map": "*"`) resolved through root `package.json`'s `"workspaces": ["bench", "dag-map"]` field. Imports use the public `exports` map: `import { layoutMetro } from 'dag-map'`. No relative paths into `dag-map/src/`.
- Workspace consumption pattern is documented at `docs/dag-map-vendored.md` § "Mutating dag-map per experiment" — bench tests pick up dag-map edits on the next run with no rebuild.

**Workflow audit and doc-gardening-research passes completed before phase 1 started.** Findings resolved (with skill tunings committed to the `ai-workflow` submodule): workflow-audit now flags drift not policy choices; framework `wrap-epic` skill added with origin-only branch cleanup preserving local branches for Git Graph legibility; TDD conventions clarified to scope required-tests at dag-map + reusable bench code (orchestration scripts are smoke-tested); agent-history adopted going forward (no backfill); ADR 0003 drift deferred to `work/gaps.md` (JIT).

## Completion

- **Completed:** pending
- **Final test count:** pending
- **Deferred items:** (none beyond the gaps-entry deferrals)
