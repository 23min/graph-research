# Literature

Systematic review tracking. The BibTeX file is the single source of truth for citations; per-paper notes and thematic reviews sit alongside it.

## Structure

- `bibliography.bib` — canonical BibTeX. Every cited paper in the repo has an entry here.
- `notes/<bibkey>.md` — per-paper reading notes, keyed to BibTeX key.
- `reviews/<topic>.md` — thematic synthesis across multiple papers.
- `pdfs/` — PDF storage; symlinked to the Dropbox bind-mount (`/workspaces/research-pdfs`) when available. Gitignored.

## How to add a paper

1. Add a BibTeX entry to `bibliography.bib` with at minimum: `title`, `author`, `year`, `venue`, and either `doi` or `url`.
2. Drop the PDF into `~/Dropbox/graph-research-pdfs/<bibkey>.pdf` (or run `node scripts/fetch-pdfs.mjs` for open-access papers).
3. Create `notes/<bibkey>.md` as you read.
4. When multiple papers are read on a theme, create a `reviews/<topic>.md` that synthesises them.

## Inclusion criteria

Papers are included in the bibliography if they are cited from a methodology doc, experiment, or ADR, or if they are candidates for such a citation. Unused papers can be pruned (with a note in the commit message) to keep the corpus focused.
