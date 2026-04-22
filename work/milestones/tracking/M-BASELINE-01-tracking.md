# Fixture loader + invariant checker — Tracking

**Started:** 2026-04-21
**Completed:** pending
**Branch:** milestone/M-BASELINE-01-fixture-loader-and-invariant-checker
**Spec:** work/epics/E-BASELINE-instruments-and-fixtures/M-BASELINE-01-fixture-loader-and-invariant-checker.md
**Commits:** bd84d69

## Acceptance Criteria

- [ ] AC1: Fixture loader contract — `loadFixture(id)` returns canonical shape, deterministic, clear error on unknown id
- [ ] AC2: Fixture catalogue — committed `{ id, source }` index, `listFixtures()`, one-line to add
- [ ] AC3: Invariant checker contract — `checkInvariants(layout)` + `checkDeterminism(a, b)` with three rules
- [ ] AC4: Tests (node:test) — happy, edge, error, invariant-violation, round-trip
- [ ] AC5: Location — `bench/` workspace, engines `>=22.0.0`, npm workspaces wiring, `.nvmrc`

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

pending — root `workspaces` field, `bench/package.json`, `.nvmrc`, `bench/README.md`, directory layout. No tests yet; unblocks the AC work.

## Reviewer notes (optional)

- Workflow audit and doc-gardening-research passes completed before implementation started. Findings resolved (with skill tunings committed to the `ai-workflow` submodule): workflow-audit now flags drift not policy choices; framework `wrap-epic` skill added with origin-only branch cleanup preserving local branches for Git Graph legibility; TDD conventions clarified to scope required-tests at dag-map + reusable bench code (orchestration scripts are smoke-tested); agent-history adopted going forward (no backfill); ADR 0003 drift deferred to `work/gaps.md` (JIT).

## Validation

- pending (run on milestone wrap: `cd bench && node --test`, lint, format)

## Deferrals

- (none — ADR 0003 drift was deferred at milestone-start and already lives in `work/gaps.md`)
