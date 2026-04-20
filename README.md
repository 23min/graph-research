# graph-research

A public research log on the automatic layout of flow-structured graphs — DAGs, process flows, transit-style schematic networks — with an emphasis on aesthetics as a first-class algorithmic property rather than a stylesheet applied afterwards.

The working hypothesis is that the class of diagrams I keep needing — flows with named routes, a direction of travel, and shared interchanges — is underserved by off-the-shelf layout libraries (Dagre, ELK, Graphviz) and by the metro-map literature it borrows from. Each community has part of the picture; none has the full problem. The companion library [`dag-map`](https://github.com/23min/DAG-map) is the implementation surface; this repo is the lab notebook around it: corpora, experiments, decisions, literature notes, and write-ups.

The immediate drivers behind dag-map are two of my own projects: [FlowTime](https://github.com/23min/flowtime), a deterministic discrete-time engine for modelling service flows (routes are work classes through services and queues over time bins), and [Liminara](https://github.com/23min/liminara), a runtime for reproducible nondeterministic computation (runs are DAGs of typed operations with recorded decisions and determinism policies). Both produce flow-structured DAGs with routes-as-input and both need layouts stable under update, so they are where real requirements enter the library. dag-map itself is an open-source library with a broader ambition, and "best-in-class" is set against the literature and established baselines (LOOM, dagre, the MLCM and stability work) — not only against my own use cases. Part of the research here is figuring out how high that bar actually is.

Work proceeds under a three-track process — library engineering, scientific experiments, and public writeups — recorded in `docs/decisions/0002-adopt-three-track-research-framework.md`. Reproducibility is first-class: every reported result carries seed + config + code SHA + split-version hash.

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

No active epic as of 2026-04-19. The operating frame is recorded in
`docs/decisions/0002-adopt-three-track-research-framework.md` and
`work/roadmap.md`. The next epic is in framing.

## Contributing

This is a personal research log kept in public. Issues and pull requests are disabled. If something here sparks a thought — a paper I should read, a flaw in an argument, a related result — please open a [Discussion](https://github.com/23min/graph-research/discussions). Happy to talk.

## License

Code: Apache-2.0 (see `LICENSE`).
Documentation and research notes: Creative Commons Attribution 4.0 (see `LICENSE-docs`).
Citation metadata: see `CITATION.cff`.
