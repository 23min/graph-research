# Fixture loader + invariant checker — Tracking

**Started:** 2026-04-21
**Completed:** 2026-04-22
**Branch:** milestone/M-BASELINE-01-fixture-loader-and-invariant-checker (merged into `epic/E-BASELINE-instruments-and-fixtures` at `b82bbdd`)
**Spec:** work/epics/E-BASELINE-instruments-and-fixtures/M-BASELINE-01-fixture-loader-and-invariant-checker.md
**Commits:** `bd84d69` (milestone start — spec refinements), `e424655` (tracking-doc template alignment), `a7a3866` (implementation — bench workspace + loader + checker)

## Acceptance Criteria

- [x] AC1: Fixture loader contract — `loadFixture(id)` returns canonical shape, deterministic, clear error on unknown id
- [x] AC2: Fixture catalogue — committed `{ id, source }` index, `listFixtures()`, one-line to add
- [x] AC3: Invariant checker contract — `checkInvariants(layout)` + `checkDeterminism(a, b)` with three rules
- [x] AC4: Tests (node:test) — happy, edge, error, invariant-violation, round-trip
- [x] AC5: Location — `bench/` workspace, engines `>=22.0.0`, npm workspaces wiring, `.nvmrc`

## Decisions made during implementation

Pre-implementation decisions carried in from the session audit on 2026-04-21 (locked into the spec before any code was written):

- Fixture count is **32**, not 30 — inspection of `dag-map/test/models.js` revealed 30 primary fixtures plus two `_dim` heatmap variants. Spec updated.
- `name` field included in the loader's return contract — dag-map's fixtures carry a human-readable display label and bench consumers will want it.
- Catalogue index uses `{ id, source }` entries, not `{ id, path }`. `source` names the module path; loader dispatches on it. Extensible to future external fixture sources without touching loader logic.
- Node version pinned to `>=22.0.0` in `bench/package.json` engines field (devcontainer runs 22.22.2). `.nvmrc` at repo root pins `22` for contributors outside the devcontainer.
- Bench consumes dag-map via **npm workspace symlink** (`"dag-map": "*"`) resolved through root `package.json`'s `"workspaces": ["bench", "dag-map"]` field. Imports use the public `exports` map: `import { layoutMetro } from 'dag-map'`. No relative paths into `dag-map/src/`.

## Work Log

<!-- One entry per AC (preferred) or per meaningful unit of work.
     Append-only — don't rewrite earlier entries. -->

### Bench workspace scaffold (pre-AC)

Done 2026-04-22. Root `package.json` gained `workspaces: ["bench", "dag-map"]`; `.nvmrc` pins `22`; `bench/package.json` declares `engines >=22.0.0`, `type: module`, `test` script over `node --test`, and `dag-map: *` as a workspace dep. `bench/README.md` written for one-paragraph orientation. `npm install` wired `node_modules/dag-map` as a symlink to the sibling workspace; `import { layoutMetro } from 'dag-map'` resolves through dag-map's public `exports` map.

### AC1 + AC2: fixture loader + catalogue

Done 2026-04-22. `bench/fixtures/loader.mjs` exports `loadFixture(id)` (async) and `listFixtures()`. Loader reads `bench/fixtures/index.json` eagerly at module load and caches source-module imports. Returns are `structuredClone`d per call so caller mutation cannot leak across calls. Unknown-id error message names the id and lists available ids. Catalogue is 32 entries of `{ id, source: "dag-map/test/models.js" }`; source is resolved as a repo-root-relative filesystem path so new sources land as sibling entries without touching loader dispatch logic. 11 tests cover happy-path shape, name field, key whitelist, determinism, mutation isolation, unknown-id error, full-catalogue round-trip, single-node fixture, two-node fixture.

### AC3 + AC4: invariant checker

Done 2026-04-22. `bench/invariants/checker.mjs` exports `checkInvariants({ dag, positions, layers })` and `checkDeterminism(a, b)`. The checker validates structural shape at the boundary (throws `TypeError` on missing dag/nodes/edges, non-Map positions, layer/position gaps for nodes in `dag.nodes`), then applies three rules in order: `forward-only-layers` (edge endpoints strictly increase in layer), `forward-only-x` (edge endpoints strictly increase in rendered x), `topological-x` (every cross-layer pair has x consistent with layer order). Returns `null` or `{ rejected, rule, detail }`. Layers default to a Kahn's-algorithm longest-path rank over the dag when not supplied. `checkDeterminism` canonical-JSON-serializes `{ positions, routePaths, extraEdges }` (handling `Map` via sorted-key lowering) and compares byte strings. 24 tests cover: every fixture + `layoutMetro` → accept, single-node + empty DAG accept, disconnected components accept, rule-1/2/3 rejection paths (back-edge layers, equal layers, back-x, equal-x, non-edge topological-x), derived-layers path, la > lb pair ordering, malformed-input throws (no dag, no edges, no nodes, no positions, non-Map positions, incomplete positions, incomplete custom layers), and determinism round-trip across all 32 fixtures.

### Branch coverage audit

Done 2026-04-22. Walked both `loader.mjs` and `checker.mjs` line-by-line. Every `if`/`??`/ternary/early-return has a test exercising each side, including defensive boundary throws and the `la > lb` branch in the pair loop. No unreachable branches required documentation.

### Interpretation notes

- **Scope of "no changes to dag-map/"**: the spec forbids mutating `dag-map/`, so the loader resolves `source: "dag-map/test/models.js"` as a repo-root-relative filesystem path rather than adding a subpath to dag-map's `exports` map. Bench's library imports of dag-map (`layoutMetro`) still go through the public `exports` map, matching the spec's stated intent; fixture-data paths are treated as a separate category.
- **Defensive branches**: the loader originally had a redundant "id in catalogue but missing from source" throw. Removed per project rules ("Don't add validation for scenarios that can't happen") — the "every catalogued id is loadable" test is the integrity check; a mismatch would fail that test at PR time rather than at runtime.
- **`loadFixture(id)` deep-clones on every call** (via `structuredClone`) rather than memoizing and returning shared references. Costs more per call but eliminates mutation-leak risk — consumers can freely modify the returned object without affecting other consumers.
- **"Fixture with no routes" edge case** (AC4 bullet) is vacuously covered: none of the 32 catalogue fixtures has empty routes, and `checkInvariants` does not consume the `routes` field — layouts without routes are handled identically to layouts with them. The "single-node layout (no edges)" test stands in as the no-edge-no-route accept case.
- **"Malformed fixture on disk" error case** (AC4 bullet) is not unit-tested: `index.json` and `dag-map/test/models.js` are both repo-controlled, and corruption would surface as a module-init parse failure rather than a testable runtime path. Skipped per the project rule against validation of scenarios that cannot happen under normal operation.

## Reviewer notes (optional)

- Workflow audit and doc-gardening-research passes completed before implementation started. Findings resolved (with skill tunings committed to the `ai-workflow` submodule): workflow-audit now flags drift not policy choices; framework `wrap-epic` skill added with origin-only branch cleanup preserving local branches for Git Graph legibility; TDD conventions clarified to scope required-tests at dag-map + reusable bench code (orchestration scripts are smoke-tested); agent-history adopted going forward (no backfill); ADR 0003 drift deferred to `work/gaps.md` (JIT).
- ESLint and Prettier are **not** configured in this milestone. The TDD convention doc notes that the bench validation pipeline "lands in bench/package.json when the bench is imported," but AC5's deliverable list does not include lint/format tooling. Adding them is deferred to a later milestone (candidate: bundled with the metrics or external-baseline milestone, or a dedicated tooling milestone) so M-BASELINE-01 stays minimal. Validation for this milestone is `npm test` at the repo root (runs both dag-map's and bench's test scripts via workspaces).

## Validation

- `npm test` at repo root → 332 tests pass (304 dag-map + 28 bench over 11 loader cases and 17 checker cases at the time of first green). Final bench count after branch-coverage additions: 35 tests (11 loader + 24 checker).
- Command: `cd /workspaces/graph-research && npm test --workspaces --if-present`
- Lint/format: not configured this milestone (see reviewer note above).

## Deferrals

- ADR 0003 drift was deferred at milestone-start and lives in `work/gaps.md`.
- ESLint + Prettier configuration for bench — logged as a gap in `work/gaps.md` so it doesn't get lost between milestones. Short form: AC5 didn't list lint/format, so M-BASELINE-01 stayed minimal; candidate home is the metrics milestone or a dedicated tooling milestone.

## Doc findings

Scoped doc-gardening sweep at wrap time (2026-04-22). Change-set restricted to `bench/`, `.nvmrc`, root `package.json`/`package-lock.json`, and workflow surfaces under `work/` — no files touched under `docs/`.

- **Private-source leak grep (rule 9)**: clean. Greps for all four boundary-path prefixes (the two tracked-directory prefixes under `docs/` and the two bind-mount aliases they symlink to) over all milestone-commit diffs produced zero matches. No blockers.
- **TODO / debug-code scan**: clean. Grep for `TODO|FIXME|XXX|HACK|console\.(log|error|warn)|debugger` across `bench/` produced zero matches.
- **`docs/index.md` missing (stale-index warning)**: the framework doc-gardening skill's content catalog (`docs/index.md`) has not yet been generated in this repo. Per the skill's contract, this warrants a `lint:full` run to bootstrap the index — but the wrap-milestone skill explicitly defers full lint runs to `wrap-epic` for efficiency. Recorded here as drift; no action this milestone. Resolution path: bootstrap the index as part of the first `wrap-epic` on E-BASELINE, or in a dedicated doc-gardening session if the gap outlives the epic.
- **`docs/` tree untouched by this milestone**: all implementation landed under `bench/`; the only narrative documentation change was `bench/README.md` (one paragraph). No cross-referencing issues within `docs/` could have been introduced. No fix-now, no gaps, no dismissals beyond the stale-index warning above.
