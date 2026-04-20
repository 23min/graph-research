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

## Rationale

See `docs/decisions/0004-vendor-dag-map-via-git-subtree.md` (ADR 0004).

## Attribution

dag-map is Apache-2.0 licensed. The LICENSE file in this directory is
part of the vendored tree and preserved here per the license terms.
