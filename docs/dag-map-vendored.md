# Vendored state — dag-map

This directory is imported from an external repository via `git subtree`.
It is part of this repo's tracked source; it is NOT a submodule.

## Upstream

- **Repository:** <https://github.com/23min/DAG-map>
- **Remote (local, not tracked by git):** `dag-map-upstream`
- **Add the remote locally:**
  `git remote add dag-map-upstream https://github.com/23min/DAG-map.git`

## Last sync

- **Date:** 2026-04-20
- **Upstream branch:** `main`
- **Upstream SHA:** `f9e4fa234480086e03be3922e20e49ddd4b643ab` (`f9e4fa2`)
- **Upstream commit:** "feat: bindEvents, selected state, interactive edge hit areas"
- **Import method:** `git subtree add --prefix=dag-map dag-map-upstream main --squash`

## Commit discipline (load-bearing)

A single commit in this repo either modifies files under `dag-map/` OR
files outside `dag-map/`, but NOT both. This is what makes
`git subtree push` produce clean PRs against upstream. Mixed commits
break upstreaming.

The repo ships an advisory check (`scripts/check-dag-map-commit-discipline.mjs`)
that warns when a staged commit crosses the boundary. Warnings can be
overridden when a commit is research-only and will never be upstreamed.

## Day-to-day workflow

- **Status:** `node scripts/dag-map-status.mjs` — last-sync SHA, upstream HEAD,
  local diff, unpushed dag-map commits.
- **Sync from upstream:** `node scripts/dag-map-sync.mjs` (`--dry-run` by default).
- **Push to upstream for PR:** `node scripts/dag-map-push.mjs --branch=<name>`
  (`--dry-run` by default).

All three scripts default to `--dry-run` and refuse to run without a
clean working tree.

## Mutating dag-map per experiment

Research experiments routinely modify `dag-map/` — exposing an
internal, prototyping a layout variant, tweaking a heuristic. This
section describes how that mutation works day-to-day and how it
relates to the upstream `dag-map` repository.

### Consumption from bench

The `bench/` harness depends on `dag-map` as an npm workspace member.
`node_modules/dag-map` is a symlink to `../dag-map/`, so edits under
`dag-map/src/` are picked up by bench on the next run with no rebuild
or reinstall. The default import path is the public `exports` map:

```js
import { layoutMetro } from 'dag-map';
```

Bench code does not reach into `dag-map/src/` via relative imports.
Experiments that need a symbol not currently re-exported add the
export to `dag-map/src/index.js` — a one-line dag-map edit, committed
atomically on the experiment branch per the commit discipline above.

### Experiment-branch pattern

Each `EXP-NN-<slug>` experiment runs on its own branch off `main`.
dag-map edits live as commits on that branch, interleaved with the
research code that drives them. Because the whole repo is one git
history, `git checkout <exp-branch-sha>` restores both the research
code and the dag-map state it assumes — the single-SHA reproducibility
that ADR 0004 enables.

The commit discipline ("dag-map edits in their own commits, separate
from research-only commits") still holds on experiment branches. It
keeps open the option to upstream a subset of the branch's dag-map
edits via `dag-map-push.mjs` without dragging research code along.

### Three flavours of dag-map edit

| Flavour | Example | Where it lands |
|---|---|---|
| **Broadly useful** | bug fix; polish; missing public export | merge to `main`, then upstream via `dag-map-push.mjs` as a PR against the `dag-map` repo |
| **Research-private** | alternative crossing-reduction heuristic scoped to a single EXP | stays on the experiment branch; never upstreamed |
| **Borderline** | internal symbol an experiment needs exposed | decided case by case — either add to `src/index.js` and upstream (flavour 1), or keep the reach-in local to the branch (flavour 2) |

The decision is editorial, not mechanical: would Liminara or FlowTime
want to inherit the change? If the answer is "nothing specific to our
hypothesis," it stays local.

### Baseline immutability

Baseline v0 (the M-BASELINE epic's locked output) is frozen at its
wrap SHA. Later experiments that mutate dag-map on their branches do
not contaminate the baseline, because reproducing the baseline is
always `git checkout <baseline-wrap-sha>` — which restores dag-map to
the exact state in which the baseline was produced. Baseline and
experiment live in the same repo without interfering.

### Other upstream consumers

`dag-map`'s upstream repository also serves two consumers outside the
research programme: **Liminara** uses `layoutHasse` for CUE schema
validation, and **FlowTime** uses the layered engines for execution-DAG
rendering. Research-private variants never reach those consumers
because they never get pushed upstream.

`layoutHasse` is out of research scope for the current epic set — it
stays in dag-map for Liminara, and experiment branches do not modify
it. Broadly-useful changes merged to `main` and pushed upstream should
be considered for their impact on Liminara and FlowTime before the
push; treat the dag-map upstream PR like any external contribution.

### Reproducibility recap

- Every experiment's `setup.md` reproducibility block carries the repo
  code SHA. That SHA captures both the research code and the dag-map
  state at the experiment's tip — one hash, not two.
- The "Last sync" block at the top of this file records the upstream
  SHA at the last import point. It does not change as experiments
  mutate `dag-map/` locally; it only updates on `dag-map-sync.mjs`
  runs.
- An experiment whose dag-map edits were never upstreamed is still
  reproducible: the research repo carries the full history. Upstream
  reproducibility — running an experiment outside this repo — requires
  either that the edits were upstreamed or that the experiment's SHA
  is recorded with the writeup.

## Rationale

See `docs/decisions/0004-vendor-dag-map-via-git-subtree.md` (ADR 0004).

## Attribution

dag-map is Apache-2.0 licensed. The LICENSE file in this directory is
part of the vendored tree and preserved here per the license terms.
