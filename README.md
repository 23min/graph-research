# graph-research

_TODO: project description._

## Structure

- `docs/` — research artefacts (literature, methodology, experiments, decisions, results, glossary)
- `work/` — epic and milestone specs, tracking docs
- `bench/` — evaluation harness (imported from the frozen `reference/m-evolve-01` work)
- `dag-map/` — layout library under test (submodule)
- `.ai/` — AI workflow framework (submodule)
- `.ai-repo/` — project-specific rules, config, skills
- `scripts/` — utility scripts (PDF fetch, setup)

## Setup

Open in a devcontainer-capable editor (VS Code, Cursor, or `devcontainer up`).

The devcontainer:
- installs Node 22, Python (for `git-filter-repo` and SMAC3 later), and dev dependencies
- runs `git submodule update --init --recursive`
- runs `bash .ai/sync.sh` to generate the AI-assistant adapter files
- bind-mounts `~/Dropbox/graph-research-pdfs` at `/workspaces/research-pdfs` and symlinks `docs/literature/pdfs` to it

If the Dropbox mount is absent (CI, remote Codespaces, collaborators without the folder), `docs/literature/pdfs` remains an empty directory. Run `node scripts/fetch-pdfs.mjs` to pull open-access papers from `docs/literature/bibliography.bib`. Paywalled papers are acquired out-of-band and dropped into the mount.

## Current focus

_TODO: active milestone._

## License

Code: Apache 2.0 (matches the upstream GLaDOS archive convention).
Documentation and research notes: Creative Commons Attribution 4.0.
