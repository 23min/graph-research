# graph-research

A personal research notebook on graph drawing, with a focus on layered
and metro-map layout of directed acyclic graphs. This repository holds
experiments, literature notes, architectural decisions, and a bench
harness used to evaluate the [`dag-map`](https://github.com/23min/DAG-map)
layout library (maintained here as a submodule).

Work proceeds under a three-track process — library engineering,
scientific experiments, and public writeups — codified in the skills
under `.ai-repo/skills/` and anchored in `docs/decisions/0002`. The
repository is kept in public as a lab notebook: rigorous for the
author, not polished for reviewers.

## Structure

- `docs/` — research artefacts (literature, methodology, experiments, decisions, results, glossary)
- `work/` — active and archived epic and milestone specs, tracking docs
- `bench/` — evaluation harness (grown per-epic, not pre-built)
- `dag-map/` — layout library under test (submodule)
- `.ai/` — AI workflow framework (submodule)
- `.ai-repo/` — project-specific rules, config, skills
- `scripts/` — utility scripts (PDF fetch, setup)

## Setup

Open in a devcontainer-capable editor (VS Code, Cursor, or `devcontainer up`).

The devcontainer:
- installs Node 22, Python, and dev dependencies
- runs `git submodule update --init --recursive`
- runs `bash .ai/sync.sh` to generate the AI-assistant adapter files
- bind-mounts `~/Dropbox/Research/graph-research-pdfs` at `/workspaces/research-pdfs` and symlinks `docs/literature/pdfs` to it

If the Dropbox mount is absent (CI, remote Codespaces, collaborators without the folder), `docs/literature/pdfs` remains an empty directory. Run `node scripts/fetch-pdfs.mjs` to pull open-access papers from `docs/literature/bibliography.bib`. Paywalled papers are acquired out-of-band and dropped into the mount.

## Current focus

Three-track framework active as of 2026-04-19 (see `docs/decisions/0002-adopt-three-track-research-framework.md`).
No active epic at this moment; the next epic is in framing.

## Contributing

This is a personal research log kept in public. Issues and pull requests are disabled. If something here sparks a thought — a paper I should read, a flaw in an argument, a related result — please open a [Discussion](https://github.com/23min/graph-research/discussions). Happy to talk.

## License

Code: Apache-2.0 (see `LICENSE`).
Documentation and research notes: Creative Commons Attribution 4.0 (see `LICENSE-docs`).
Citation metadata: see `CITATION.cff`.
