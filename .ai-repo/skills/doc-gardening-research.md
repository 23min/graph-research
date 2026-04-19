---
description: Research-repo-specific doc gardening. Extends the framework doc-gardening skill with public/private boundary enforcement, Track 3 promotion, private-source isolation, and hypothesis-pool pruning.
name: doc-gardening-research
when_to_use: |
  - Before any commit to main
  - As a required sub-step of the wrap-epic skill
  - When the user asks to "garden the docs" or "check for leaks"
  - When private content may have drifted into public artefacts
responsibilities:
  - Enforce the public/private boundary between docs/ and docs/private/
  - Promote published Track 3 content (URL + date + EXP reference) to the public content index
  - Run the grep checks for docs/literature/pdfs/ and docs/private/ leaks
  - Prune the hypothesis pool (mark superseded, annotate with EXP outcomes)
  - Update docs/private/README.md with new chronological docs (numbered XX-{name}.md)
  - Defer to framework doc-gardening skill (.ai/skills/doc-gardening.md) for generic checks
output:
  - Doc-gardening report (Markdown) or in-line fixes for simple issues
  - Published content index updates (docs/results/published-content.md)
  - Hypothesis-pool annotations
  - Blockers listed if private content appears in tracked files
invoked_by:
  - wrap-epic skill (always)
  - reviewer agent before commit approval
  - any agent when private-source isolation needs checking
---

# Skill: Doc Gardening (research-repo extension)

Extends the framework `doc-gardening` skill with research-specific checks. Run this *in addition to* the framework skill, not instead of it.

## Required grep checks (blockers)

Run these before every commit to main. Any occurrence in **tracked content** blocks the commit until resolved.

1. `grep -rn "docs/private/" <files-to-commit>` — private-folder path in committed content.
2. `grep -rn "docs/literature/pdfs/" <files-to-commit>` — PDF-folder path in committed content.
3. `grep -rn "research-pdfs" <files-to-commit>` — bind-mount alias for PDF folder.
4. `grep -rn "research-private" <files-to-commit>` — bind-mount alias for private folder.

Authoritative allow-list: `scripts/git-hooks/pre-commit` `ALLOWED_PATHS`. The pre-commit hook enforces the boundary mechanically on staged content; this skill re-runs the same check during epic wrap as a sanity pass and as a doc-gardening step for files the hook may not have been run against (e.g. if the hook wasn't activated in this clone).

Any file whose path starts with one of those entries is allowed to reference the boundary paths (because it documents or enforces the rule). All other tracked files: block on match.

## Public/private boundary

### Classification rules

- **Public (lives in `docs/`):** roadmap, experiments, decisions, literature, methodology, glossary, results, README. Intended for external audiences — collaborators, eventual open-source users, cited-by-URL references.
- **Private (lives in `docs/private/`):** strategy, brainstorms, research directions, hypothesis pool, content drafts, reading lists, correspondence. Never committed; Dropbox bind-mount; intended for the principal only.
- **Numbered private docs:** all top-level `.md` under `docs/private/` follow the `XX-{name}.md` chronological numbering. New docs get the next sequential number.

### Boundary-crossing promotion events

When a private artefact legitimately produces a public one, only the intended subset crosses:

| Private → Public | What crosses | What stays private |
|---|---|---|
| Track 3 draft → published post | URL + date + EXP reference (to `docs/results/published-content.md`) | Draft prose, editorial notes, rejected angles |
| Private strategy doc → ADR | The decision itself + consequences | Deliberation, alternate framings, personal context |
| Hypothesis pool → EXP backlog | Hypothesis statement + operationalization (re-written in EXP folder) | Pool-level commentary, priority rank, speculation |
| Reading list → bibliography entry | BibTeX entry (to `docs/literature/bibliography.bib`) + reading note (to `docs/literature/notes/<bibkey>.md`) | Reading-list commentary about why the paper matters strategically |

### Boundary checks

- [ ] No public doc quotes, paraphrases, or links to a `docs/private/` path.
- [ ] No public doc cites a line or page from `docs/literature/pdfs/`.
- [ ] Every published post URL in the content index has a matching EXP cross-reference.
- [ ] Every new `docs/private/XX-*.md` follows the chronological numbering.

## Track 3 promotion pass

Walk `docs/private/content/<milestone-id>-track3/`. For each draft folder:

1. Check status file: `draft` / `in-review` / `published` / `abandoned`.
2. If `published`:
   - Append an entry to `docs/results/published-content.md`: `YYYY-MM-DD — "<Title>" — <Channel> — derived from EXP-NN — <URL>`.
   - Verify the EXP-NN cross-reference exists (`docs/experiments/EXP-NN-slug/` must be a real folder).
   - Leave the private draft folder in place as archive.
3. If `in-review`: no change; note in the epic tracking doc's Track 3 section only as "in review."
4. If `abandoned`: no change; note in the tracking doc's Track 3 section only as "abandoned" with a one-line reason if strategically relevant.
5. If `draft`: no change.

**Never copy prose from a private draft into a public file.** The migration is strictly: URL + date + EXP reference. Nothing else.

## Hypothesis pool pruning

Walk `docs/private/04-hypotheses/README.md`. For each hypothesis:

1. Check for a matching closed EXP (by keyword or explicit cross-reference). If closed:
   - Annotate the hypothesis entry in the pool with `closed positive (EXP-NN)` or `closed negative (EXP-NN)`.
   - Do not delete from the pool — negative results remain as speculation annotations for future revisits.
2. Check for supersession: is a newer hypothesis in the pool covering the same claim?
   - If yes, mark the older one with `superseded by HN`.
3. If the pool has grown with new hypotheses from the epic, verify numbering is continuous.

## Output format

```markdown
# Doc Health Report (research) — {YYYY-MM-DD}

## Blockers (commit is blocked until these resolve)
- {file:line}: private-path reference found

## Public/private boundary
- {finding}

## Track 3 promotion
- Published this pass: {N} posts — {list with URL + EXP-ref}
- In review: {count}
- Abandoned: {count with one-line reasons if relevant}

## Hypothesis pool
- Annotated as closed: {list}
- Marked superseded: {list}
- Added: {list}

## Chronological numbering
- New private docs added: {list of XX-{name}.md}
- Gaps or collisions: {none | details}

## Suggested actions
1. {action}
```

## When to fix vs. report

- **Fix directly:** Missing EXP cross-reference on a published post (look it up), chronological numbering gaps (renumber), simple annotation updates.
- **Report only:** Any private-path leak (principal must decide whether to remove the reference or rewrite the passage), any hypothesis annotation that requires judgment about whether an EXP truly closed it, any supersession call.

## Invocation pattern

Always called as part of `wrap-epic`. Can also be invoked on-demand:

> Run doc-gardening-research.

The skill produces a report first; the principal decides which items to fix and which to report only.
