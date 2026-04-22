---
id: M-BASELINE-07-fixture-split-discipline
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-05]
---

# Milestone: Fixture split discipline + ADR 0004

**ID:** M-BASELINE-07
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Decide what the fixture set should actually contain, split it into `train / validation / test` with hash-frozen stratification, implement the split-aware read path, add the CI guard that prevents training-side code from reading held-out fixtures, and record the versioning discipline as ADR 0004. This is the one milestone in the epic whose deliverable is primarily a *decision*, not code.

## Context

After M-05 the contact sheet exists. That means for the first time we can look at dag-map today across a fixture set and ask "do these fixtures actually test what we care about?" The answer will inform what gets added (external corpora? stress fixtures? process-mining samples?) and what gets dropped. This decision happens here, not in M-01, because M-01 was deliberately scoped to the 32 test models already on `main` so the baseline could take shape without waiting on a fixture-selection debate.

The split discipline is load-bearing for every future EXP: once frozen, training-side code reads only the train / validation partition; held-out is touched only by the EXP's final evaluation pass. Violations are caught by a CI guard that treats direct reads of held-out paths from training code as build failures.

## Acceptance Criteria

1. **Fixture-set decision (captured in ADR 0004).**
   - ADR 0004 records: which fixtures are in v1 (the 32 on `main` plus any additions), the stratification axes (candidates: node count, route count, fan-out, class count), the split proportions (candidate: 60 / 20 / 20), the held-out rationale
   - External corpora decision: ADR 0004 explicitly states whether Rome-Lib, AT&T/North, GLaDOS, RandDAG subsets are included in v1 or deferred to a future fixture-set version

2. **`splits.json` format.**
   - Committed at `bench/fixtures/splits.json`
   - Schema: `{ version: string, sha256: string, train: [...ids], validation: [...ids], test: [...ids] }`
   - `sha256` is the hash of the canonicalised content of all fixtures referenced, computed by the split generator, verified on every split load
   - The `version` field is a semver-like string; bumping requires a new ADR

3. **Split loader.**
   - `bench/fixtures/split-loader.mjs` exposes `loadTrain()`, `loadValidation()`, `loadTest()` returning fixture arrays
   - Also exposes `loadAll()` for tooling that legitimately needs the full set (e.g. contact sheet), guarded with a warning-on-stdout
   - Verifies the `sha256` on every load; throws on mismatch

4. **CI guard.**
   - A test under `bench/fixtures/__tests__/split-guard.test.mjs` greps training-side code (`bench/**`, excluding `bench/fixtures/` and `bench/contact-sheet/`) for direct reads of `bench/fixtures/*.json` or `bench/fixtures/*.mjs` that are not the loader
   - Fails the test run on any violation
   - Allowed-list is data (a committed file), not code — so exemptions are reviewable

5. **Regeneration procedure.**
   - `bench/fixtures/generate-split.mjs` produces `splits.json` deterministically from a seed + stratification config
   - Regenerating requires (a) bumping the `version`, (b) updating ADR 0004 or writing a superseding ADR, (c) re-running all tests
   - The script is idempotent: same seed + same config + same fixture contents → same `splits.json`

6. **Contact sheet integration.**
   - M-05's JSON report and M-06's PDF header now include the real split version hash (replacing the placeholder added in those milestones)
   - An optional contact-sheet flag (`--split <train|validation|test|all>`) renders only that partition

7. **Tests.**
   - Round-trip: generate split → load split → verify `sha256` matches
   - Tamper detection: mutate a fixture after split generation, verify `sha256` mismatch is caught
   - Invariant: train ∪ validation ∪ test = all; intersections are empty; totals match the fixture catalogue count
   - CI guard: synthesise a training-side file that reads a held-out fixture directly, verify the guard catches it

## Technical Notes

- Stratification is feasible even at 32 fixtures if the axes are chosen well. More axes → smaller strata → less flexibility; start with one or two (e.g. size bucket).
- The `sha256` covers the canonicalised fixture content, not file paths — renames do not invalidate a split; content changes do.
- The CI guard is implemented as a `node --test` suite so it runs in the same pipeline as everything else; no separate tooling.
- External corpora discussion in the ADR: defer if acquisition / licensing / format-conversion cost exceeds what this epic can absorb. The point of the ADR is to make the defer-or-include decision explicit and date-stamped.

## Out of Scope

- Stratification beyond the axes the ADR commits to — refinement is a future ADR
- Cross-validation folds — held-out is a single test partition, not k-fold
- Dynamic re-splitting — once frozen, the split is immutable until a new version is published
- Research-question-specific splits — the v1 split serves all foreseeable EXPs; specialisation is later

## Dependencies

- M-BASELINE-05 complete (so the contact sheet can inform fixture-set selection)

## Deliverables

- `docs/decisions/0004-fixture-split-versioning.md`
- `bench/fixtures/splits.json` (committed, hash-verified)
- `bench/fixtures/split-loader.mjs`
- `bench/fixtures/generate-split.mjs`
- `bench/fixtures/__tests__/split-guard.test.mjs`
- `bench/fixtures/__tests__/split-loader.test.mjs`
- `bench/fixtures/allowed-training-reads.json` — committed allow-list for CI guard exemptions
- Updated M-05 and M-06 outputs to include the real split version hash in headers
