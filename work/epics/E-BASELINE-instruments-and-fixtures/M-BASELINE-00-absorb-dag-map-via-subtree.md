---
id: M-BASELINE-00-absorb-dag-map-via-subtree
epic: E-BASELINE-instruments-and-fixtures
status: in-progress
depends_on: []
---

# Milestone: Absorb dag-map via git subtree

**ID:** M-BASELINE-00
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** in-progress

## Goal

Migrate `dag-map` from a git submodule to a `git subtree` import inside
`graph-research`, so research-driven dag-map edits commit atomically
with the research code that needs them. Add the wrapper scripts, rule
updates, and documentation that make the new topology safe for
day-to-day use, and preserve the ability to contribute changes back
upstream via ordinary PRs.

## Context

ADR 0004 decides the topology: dag-map absorbed at `dag-map/` via
`git subtree add --squash`, upstream tracked as the `dag-map-upstream`
remote, sync in both directions via wrapped scripts. This milestone
executes that decision.

The initial import point is upstream `main`'s HEAD at the time of
execution. At spec-draft time that is `f9e4fa2` ("feat: bindEvents,
selected state, interactive edge hit areas"), one commit past the
prior submodule pin `30075e3`. If upstream advances between spec-draft
and execution, the actual import SHA is re-confirmed via
`git fetch dag-map-upstream && git rev-parse dag-map-upstream/main`
and recorded in `dag-map-vendored.md` and the squash commit message.

No edits to dag-map happen in this milestone — only the topology
change and the plumbing around it. M-BASELINE-01 (currently paused)
resumes after this milestone merges, with its bench imports resolving
against plain paths into `dag-map/`.

## Acceptance Criteria

1. **Submodule removal.**
   - The `dag-map` submodule is removed via `git submodule deinit -f dag-map` + `git rm dag-map`.
   - `.gitmodules` has its `[submodule "dag-map"]` entry deleted; the `.ai` submodule entry remains untouched.
   - A clean clone of the repo at this milestone's HEAD has no `dag-map` submodule referenced anywhere.

2. **Subtree import at latest upstream main.**
   - Before importing, `git fetch dag-map-upstream` is run to obtain the current upstream HEAD on `main`.
   - `git subtree add --prefix=dag-map dag-map-upstream main --squash` produces a tree at `dag-map/` matching the current upstream `main` HEAD.
   - The squash commit's message follows the form: `chore(dag-map): import via subtree at <short-SHA>` where `<short-SHA>` is the actual SHA imported, recorded at execution.
   - A remote named `dag-map-upstream` is configured locally (pointing at `https://github.com/23min/DAG-map.git`) as a precondition to the import. Remote configuration is not tracked by git; the one-line add-remote command is documented in the README's dag-map section and in `dag-map-vendored.md`.

3. **Vendored state recorded.**
   - `docs/dag-map-vendored.md` is committed with: upstream repo URL, initial import SHA, import date, the commit discipline rule ("dag-map edits commit only under `dag-map/`"), and a pointer to ADR 0004.
   - `dag-map/LICENSE` (Apache-2.0, carried by the import) is present and tracked.

4. **Wrapper scripts.**
   - `scripts/dag-map-sync.mjs` — pulls upstream changes into `dag-map/`. Default behaviour: `--dry-run` summary of the incoming changes. With `--apply`, runs `git subtree pull --prefix=dag-map dag-map-upstream <branch> --squash` and updates the "last sync SHA" field in `dag-map-vendored.md`. Requires a clean working tree and refuses to run otherwise.
   - `scripts/dag-map-push.mjs` — produces an upstream-bound commit range. Default: `--dry-run` showing which commits under `dag-map/` would be pushed. With `--apply`, runs `git subtree push --prefix=dag-map dag-map-upstream <branch>` and prints the resulting remote branch and a GitHub compare-URL for opening the PR.
   - `scripts/dag-map-status.mjs` — prints the last-sync SHA from `dag-map-vendored.md`, the current upstream HEAD (via `git fetch dag-map-upstream` + `git rev-parse`), the local `dag-map/` diff against the last-sync point, and the count of unpushed commits touching `dag-map/`.
   - All three scripts exit non-zero with a clear error if `dag-map-upstream` remote is missing, and print the one-line command to add it.

5. **Rule and documentation updates.**
   - `.ai-repo/rules/research.md` rule 4 (reproducibility protocol) is updated: "dag-map submodule SHA" is removed from the four-field list; the list becomes seed, config file, code SHA, split version hash. A sentence is added: "The dag-map state is captured by the code SHA, since dag-map is vendored via subtree (ADR 0004)."
   - `CLAUDE.md` (auto-generated from `.ai-repo/rules/research.md` by `.ai/sync.sh`) is regenerated to pick up the rule change.
   - `README.md` gains a "dag-map" section with the three-command workflow (`scripts/dag-map-*.mjs`) and a one-line pointer to ADR 0004.
   - The epic spec's ADRs section is updated: the reference to ADR 0004 as "fixture-split versioning" is moved forward — M-BASELINE-07's ADR will take the next available number at write time (likely 0005 or 0006).

6. **Commit discipline tooling (advisory).**
   - A pre-commit hook at `.husky/pre-commit` or equivalent (kept light-touch, no new dev-dep unless already present) warns — not blocks — when a single commit modifies files both inside and outside `dag-map/`. The warning names the two file groups and cites ADR 0004's commit-discipline rule.
   - If no hook framework exists in the repo yet, the equivalent check is packaged as `scripts/check-dag-map-commit-discipline.mjs` and documented in the README as a manual `pre-push` verification. Tooling choice is left to implementation; the AC is that the warning exists somewhere in the local workflow.

7. **Verification pass.**
   - After migration, the file tree under `dag-map/` is byte-identical to a fresh `git clone https://github.com/23min/DAG-map.git` at the imported SHA. The verification command (`diff -rq --exclude=.git ...`) and its result are recorded in the milestone tracking doc.
   - Running the dag-map package's own test command (if one exists after entering `dag-map/`) passes — i.e. absorbing dag-map didn't break its own tests. If dag-map has no standalone test command, the verification is deferred to M-BASELINE-01, which imports from `dag-map/` under its own test suite. The outcome is recorded in the tracking doc regardless.

## Technical Notes

- **Initial import SHA:** the current `dag-map-upstream/main` HEAD at execution time. At spec-draft that is `f9e4fa234480086e03be3922e20e49ddd4b643ab` ("feat: bindEvents, selected state, interactive edge hit areas"). The submodule was previously pinned at `30075e3` on `chore/relicense-apache-2.0`; this milestone deliberately advances to main's latest. Re-confirm the target SHA at execution (`git fetch dag-map-upstream && git rev-parse dag-map-upstream/main`) and record the actual SHA in `dag-map-vendored.md` and the squash commit message.
- **Why squash:** keeps the research log readable (one commit per sync). Every sync is recorded in `dag-map-vendored.md`. Upstream per-commit history is always consultable via the `dag-map-upstream` remote.
- **Why `--dry-run` default on wrapper scripts:** subtree operations rewrite history in subtle ways. Accidental runs during exploration should be no-ops; opt-in to apply.
- **Commit discipline warning, not block:** reviewers can override when a commit is genuinely atomic and upstreaming is not intended (e.g. research-only dag-map tweaks that will never be PR'd). A blocking hook would create false-positive friction.
- **Script dependencies:** prefer `node:child_process` over shelling out through a package. No new npm dependencies added for this milestone.

## Out of Scope

- No content changes to any file under `dag-map/`. The absorption is structural only; dag-map source arrives byte-identical.
- No initial upstream sync attempted — `30075e3` is the import point and remains the last-sync SHA until a future explicit `dag-map-sync.mjs --apply`.
- No CI workflow integration (e.g. a GitHub Action that rejects mixed commits). Advisory local tooling only.
- No bench harness code. M-BASELINE-01 is the next milestone and it adds `bench/`.
- No changes to `dag-map`'s own development workflow upstream. Liminara and FlowTime continue pushing to upstream as before; their processes are not affected.
- No handling of merge conflicts arising from divergent local edits during a sync — the sync script's MVP is "fail loud, let the human resolve." A quality-of-life pass can follow in a later milestone if friction shows up.

## Dependencies

- ADR 0004 ratified (written in this same branch; must be committed alongside or before the migration itself).

## Deliverables

- `docs/decisions/0004-vendor-dag-map-via-git-subtree.md` (already drafted on the epic branch)
- `docs/dag-map-vendored.md`
- `dag-map/LICENSE` (carried by the subtree import; tracked after the fact)
- `scripts/dag-map-sync.mjs`
- `scripts/dag-map-push.mjs`
- `scripts/dag-map-status.mjs`
- `scripts/check-dag-map-commit-discipline.mjs` (or equivalent hook)
- `.gitmodules` (edited — `dag-map` entry removed)
- `.ai-repo/rules/research.md` (rule 4 updated)
- `CLAUDE.md` (regenerated via `.ai/sync.sh` after the rule update)
- `README.md` (dag-map section added)
- `work/epics/E-BASELINE-instruments-and-fixtures/epic.md` (M-00 added to milestones table; ADR section updated)
- `work/milestones/tracking/M-BASELINE-00-tracking.md` (created at milestone start)
