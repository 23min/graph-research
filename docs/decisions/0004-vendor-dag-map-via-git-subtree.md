# 0004 — Vendor dag-map via git subtree

## Status

active

## Context

`graph-research` depends on the `dag-map` library for layout engines
(`layoutMetro`, `layoutFlow`, `layoutHasse`) and for the 30 test models
that will seed the baseline fixture set. Until now, `dag-map` has been
included as a git submodule pinned at a specific SHA, with the upstream
repo at `https://github.com/23min/DAG-map.git`.

The submodule had been pinned at SHA `30075e3` on branch
`chore/relicense-apache-2.0`. At import time for this ADR, dag-map's
upstream `main` has advanced one commit to `f9e4fa2` ("feat:
bindEvents, selected state, interactive edge hit areas").

Two other consumers push to `dag-map`'s upstream repo on an ongoing
basis: **Liminara** (uses `layoutHasse` for CUE schema validation) and
**FlowTime** (uses the layered layout engines for execution-DAG
rendering). The research programme in this repo also modifies `dag-map`
— exposing internals, adjusting adapter seams, prototyping new layout
variants — on a cadence that is ragged and exploratory rather than
product-driven.

The submodule model produces three problems at this intersection:

1. **Two-repo commits.** Every research-driven dag-map change is two
   atomic steps (commit on a dag-map branch, bump submodule SHA here),
   with the research intent split across repos and commit messages.
2. **Branch proliferation in dag-map.** Exploratory research branches
   accumulate on the dag-map repo alongside Liminara/FlowTime product
   branches, muddying the signal of what's production-bound.
3. **Reproducibility noise.** Every reported result carries a "dag-map
   submodule SHA" distinct from the graph-research SHA, so the
   reproducibility header is two hashes where one should do.

The research repo needs to modify dag-map freely in service of
experiments without flooding dag-map's branch list or fragmenting
commit history. Liminara and FlowTime need dag-map to remain its own
independently-publishable library with its own release cadence.
Research contributions that are broadly useful should land back in
dag-map as ordinary outside-contributor PRs.

## Decision

Absorb `dag-map` into `graph-research` at path `dag-map/` using
**`git subtree`** with `--squash` at the initial import. The canonical
upstream remains `https://github.com/23min/DAG-map.git`, added as the
remote `dag-map-upstream`. `graph-research` treats dag-map as just
another tracked directory for day-to-day edits. When research-driven
changes in `dag-map/` are broadly useful, they are contributed back
upstream via `git subtree push` + PR, exactly as any outside contributor
would.

The existing `dag-map` submodule is removed; `.gitmodules` loses the
entry.

Specific rules:

- **Import is `--squash`.** The graph-research log sees one commit per
  sync ("squashed dag-map at SHA X"), not every upstream commit. Avoids
  log pollution; the upstream SHA is recorded in
  `dag-map/VENDORED.md` at each sync.
- **Commit discipline: dag-map edits in their own commits.**
  A commit that modifies files under `dag-map/` does *not* also modify
  files outside it. This makes `git subtree push` produce clean PRs
  against upstream. Commits that span both are either split before
  committing or flagged as non-upstreamable in the commit message.
- **Sync operations are wrapped.** Three scripts under `scripts/`
  expose the workflow: `dag-map-sync.mjs` (pull upstream changes into
  `dag-map/`), `dag-map-push.mjs` (push a commit range to an upstream
  branch for PR), `dag-map-status.mjs` (show local vs. upstream diff).
  Raw `git subtree` commands are not part of the day-to-day flow.
- **Reproducibility protocol updated.** Rule 4's
  "dag-map submodule SHA" is retired. The single "graph-research code
  SHA" now captures dag-map state deterministically, since dag-map is
  part of the repo. `dag-map/VENDORED.md` records the upstream SHA at
  last sync for audit of what upstream state we are on.
- **LICENSE carried.** `dag-map/LICENSE` (Apache-2.0) is tracked as
  part of the vendored tree; dag-map's attribution is preserved.

## Alternatives considered

- **Keep the submodule.** Status quo. Rejected: every research-driven
  dag-map change is a two-repo dance, and branch proliferation on the
  dag-map repo mixes research exploration with product development.
- **Vendor as plain files (no subtree).** Copy source in, drop history,
  sync with a copy-over script. Rejected: loses the ability to
  contribute back upstream as a clean branch; drift diffing ("what did
  we change vs. upstream?") becomes manual.
- **Monorepo — publish dag-map from graph-research.** Absorb dag-map
  as a workspace and publish it from this repo. Rejected: would
  contend with Liminara and FlowTime's ongoing push flow to dag-map's
  existing repo. Forces consumers to switch their source of truth.
- **Fork-as-submodule.** graph-research's submodule points at a fork
  of dag-map owned by the research side. Rejected: moves branch
  proliferation from the main dag-map repo to the fork without
  removing it. Every research-driven change still two-step
  (commit on fork, bump submodule SHA here).
- **Git subtree without `--squash`.** Preserves upstream's
  per-commit history in graph-research's log. Rejected: floods the
  research log with library-internal commits; the information is
  recoverable by consulting upstream, and the squash commit SHA is
  sufficient to pin exact state.

## Consequences

- **One-repo-one-commit for research-driven dag-map changes.** A
  research branch that exposes an internal for a metric can commit
  the dag-map change, the metric code, and the test all on one branch
  with clear authorship. Upstreaming the dag-map portion is a
  `git subtree push` when the change is broadly useful.
- **dag-map's upstream repo stays focused.** Liminara and FlowTime
  continue pushing to upstream as before; research exploration no
  longer crowds the branch list.
- **Reproducibility headers simplify.** Every artefact's
  reproducibility block names one repo SHA (graph-research) instead
  of two (graph-research + dag-map submodule). `rules.md` rule 4 is
  updated by the same milestone that lands the subtree import.
- **Commit discipline is now load-bearing.** Mixed commits break
  `git subtree push`. The discipline is easy in principle but has to
  be taught. The M-BASELINE-00 milestone includes an advisory
  pre-commit warning (non-blocking) to surface mixed commits at
  authoring time.
- **Upstream contributions become manual in cadence.** Nothing auto-
  syncs either direction. This is the intended posture: upstream
  contributions happen when a research change is stable and broadly
  useful, not on every commit. A stale local `dag-map/` is acceptable
  between syncs; the reproducibility header records exactly which
  upstream SHA was the last import point.
- **Subtree commands are wrapped, not exposed.** The three scripts
  under `scripts/` are the interface. Anyone touching dag-map sync
  uses those rather than learning subtree incantations. The scripts
  default to `--dry-run`.
- **Previous submodule history is preserved in dag-map's upstream
  repo.** Nothing is lost; the submodule's pre-import history lives
  in `dag-map-upstream` and can be consulted there. Imported history
  inside graph-research starts at the initial subtree squash commit.
