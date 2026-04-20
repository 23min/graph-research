# Tracking: Absorb dag-map via git subtree

**Milestone:** M-BASELINE-00-absorb-dag-map-via-subtree
**Epic:** E-BASELINE-instruments-and-fixtures
**Branch:** milestone/M-BASELINE-00-absorb-dag-map-via-subtree
**Base branch:** epic/E-BASELINE-instruments-and-fixtures
**Started:** 2026-04-20
**Status:** in-progress

## Acceptance Criteria

- [ ] AC1 — Submodule removal (`dag-map` entry gone from `.gitmodules`; `git submodule status` does not list dag-map)
- [ ] AC2 — Subtree import at `dag-map-upstream/main` HEAD (recorded in `VENDORED.md` and squash commit message)
- [ ] AC3 — Vendored state recorded (`dag-map/VENDORED.md`, `dag-map/LICENSE` carried)
- [ ] AC4 — Three wrapper scripts (`scripts/dag-map-sync.mjs`, `dag-map-push.mjs`, `dag-map-status.mjs`) with `--dry-run` defaults
- [ ] AC5 — Rule and doc updates (`.ai-repo/rules/research.md` rule 4; regenerated `CLAUDE.md`; README dag-map section; epic ADR section)
- [ ] AC6 — Commit-discipline tooling (advisory pre-commit or documented manual check)
- [ ] AC7 — Verification pass (byte-identical `diff -rq` against fresh clone at imported SHA; dag-map's own tests if present)

## Implementation Log

| Phase | What | Status |
|-------|------|--------|
| 1 | Submodule removal | pending |
| 2 | Subtree add + VENDORED.md | pending |
| 3 | Wrapper scripts + commit-discipline check | pending |
| 4 | Rule 4 update + CLAUDE regen + README | pending |
| 5 | Commit-discipline hook | pending |
| 6 | Verification + self-review | pending |

## Notes

Upstream HEAD at spec-draft: `f9e4fa2` ("feat: bindEvents, selected state, interactive edge hit areas") — one commit past prior submodule pin `30075e3`. Actual import SHA re-confirmed at execution and recorded below.

**Actual imported SHA:** _(filled in during phase 2)_

**Verification outcome:** _(filled in during phase 6)_

## Completion

- **Completed:** pending
- **Deferred items:** (none)
