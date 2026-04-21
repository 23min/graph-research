# Git hooks

Tracked hook scripts for this repository. Activation is per-clone and
**not automatic** — run the steps below once after cloning.

## Current hooks

- `pre-commit` — enforces private-source isolation (rule 9). Blocks any
  staged content that adds references to `docs/private/` or
  `docs/literature/pdfs/`, unless the file sits under an allow-listed
  path (`CLAUDE.md`, `.ai-repo/rules/`, `docs/decisions/`, etc.). Only
  newly-added diff lines are inspected; pre-existing references in
  un-touched lines are grandfathered.
- The same hook also runs an **advisory** (non-blocking) check on mixed
  commits — staged changes that touch both `dag-map/` and files outside
  it — per ADR 0004's commit-discipline rule. The warning prints but
  does not block; the commit proceeds either way.

## Activation — option 1 (symlink, recommended)

```
ln -s ../../scripts/git-hooks/pre-commit .git/hooks/pre-commit
```

From the repo root. The symlink points at the tracked script, so
updates to the hook land automatically.

## Activation — option 2 (core.hooksPath)

If you prefer to point git at the tracked directory directly:

```
git config core.hooksPath scripts/git-hooks
```

This applies to the local clone only. Not compatible with hook
scripts that need to coexist with another hooks path (e.g. husky).

## Bypassing (discouraged)

`git commit --no-verify` skips the pre-commit check. Only use this if
you have a concrete reason and document it in the commit message —
the rule itself remains in force.
