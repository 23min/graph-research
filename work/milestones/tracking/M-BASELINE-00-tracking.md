# Tracking: Absorb dag-map via git subtree

**Milestone:** M-BASELINE-00-absorb-dag-map-via-subtree
**Epic:** E-BASELINE-instruments-and-fixtures
**Branch:** milestone/M-BASELINE-00-absorb-dag-map-via-subtree
**Base branch:** epic/E-BASELINE-instruments-and-fixtures
**Started:** 2026-04-20
**Status:** complete

## Acceptance Criteria

- [x] AC1 — Submodule removal (`dag-map` entry gone from `.gitmodules`; `git submodule status` does not list dag-map)
- [x] AC2 — Subtree import at `dag-map-upstream/main` HEAD (recorded in `dag-map-vendored.md` and squash commit message)
- [x] AC3 — Vendored state recorded (`docs/dag-map-vendored.md`, `dag-map/LICENSE` carried)
- [x] AC4 — Three wrapper scripts (`scripts/dag-map-sync.mjs`, `dag-map-push.mjs`, `dag-map-status.mjs`) with `--dry-run` defaults
- [x] AC5 — Rule and doc updates (`.ai-repo/rules/research.md` rule 4; regenerated `CLAUDE.md`; README dag-map section; epic ADR section)
- [x] AC6 — Commit-discipline tooling (advisory check wired into `scripts/git-hooks/pre-commit`)
- [x] AC7 — Verification pass (byte-identical `diff -rq` against fresh clone at imported SHA; dag-map's own tests pass)

## Implementation Log

| Phase | Commit | What | Status |
|-------|--------|------|--------|
| 1 | `db3c088` | Submodule removal (`git submodule deinit` + `git rm`) | done |
| 2 | `efc7b68` + `08e9721` (auto) + `6982ccf` | Subtree add at `f9e4fa2` + dag-map-vendored.md | done |
| 3 | `de4fab3` | Wrapper scripts (`dag-map-sync/push/status.mjs`) + commit-discipline check | done |
| 4 | `86fc1dc` + `15a7eb4` | Rule 4 update + CLAUDE regen + README | done |
| 5 | `239c2a8` | Commit-discipline hook wiring | done |
| 6 | (this commit) | Verification + tracking-doc finalisation | done |

## Notes

Upstream HEAD at spec-draft: `f9e4fa2` ("feat: bindEvents, selected state, interactive edge hit areas") — one commit past prior submodule pin `30075e3`. Import target re-confirmed at execution via `git rev-parse dag-map-upstream/main` — unchanged at `f9e4fa2`.

**Actual imported SHA:** `f9e4fa234480086e03be3922e20e49ddd4b643ab` (`f9e4fa2`).

**Verification outcome:**

- **Byte-identical check:** `diff -rq --exclude=.git` against a fresh `git clone https://github.com/23min/DAG-map.git` at `f9e4fa2` showed zero differences under `dag-map/` against upstream at `f9e4fa2`. dag-map/ is byte-identical to upstream; vendoring metadata lives at `docs/dag-map-vendored.md` outside the subtree. ✓
- **dag-map's own tests:** `cd dag-map && node --test test/unit/*.test.mjs` — **304 tests, 304 pass, 0 fail** (with `playwright` installed via `npm install` inside `dag-map/`). ✓ A cosmetic drift in `dag-map/package-lock.json` appeared after `npm install` (recorded `"license"` field aligning from MIT → Apache-2.0 to match `package.json`) and was reverted locally; it is not a functional change and would regenerate on any dev's machine.

**Outstanding follow-ups (not in scope here):**

- ADR-0003 epic-vs-filesystem drift flagged in the epic spec (epic says "priority-sweep ratification of consolidated requirements"; filed 0003 is "LLM-assisted research methodology"). Handle via `wf:patch` or alongside M-BASELINE-01's setup.
- Upstream `dag-map/package-lock.json` has a stale `"license": "MIT"` field (package.json says `Apache-2.0`); candidate for a future trivial upstream PR via `scripts/dag-map-push.mjs`.
- `scripts/dag-map-push.mjs`'s "commits touching dag-map/" counter includes pre-subtree submodule-link commits (`20fde14`, `61ef0b8`) because `git log -- dag-map/` treats those path-as-gitlink commits as touching the path. Display-only; `git subtree push` itself filters correctly at push time. A follow-up could narrow the counter by bounding against the initial squash commit (`efc7b68`).

**Script smoke-tests (all clean):**

- `node scripts/dag-map-status.mjs` — reports "up to date with upstream main", clean working tree, commits touching dag-map/ listed. ✓
- `node scripts/dag-map-sync.mjs` — reports "already in sync with upstream main". ✓
- `node scripts/dag-map-push.mjs` — dry-run lists candidate commits; exits with the "(dry run — pass --apply …)" hint. ✓
- `node scripts/check-dag-map-commit-discipline.mjs` — no output on empty staged state (expected). ✓

## Completion

- **Completed:** 2026-04-20
- **Deferred items:** (none beyond the outstanding follow-ups above, which are scoped as separate patches)
