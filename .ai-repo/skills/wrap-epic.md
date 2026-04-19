---
description: End-of-epic ritual covering all three tracks. Summarizes library changes, experiment outcomes, and content decisions; gardens the hypothesis pool and the private/public boundary; decides on npm release and publication promotion; produces the commit-approval package.
name: wrap-epic
when_to_use: |
  - When an epic's final milestone closes
  - When the user says "wrap E-<id>"
  - As the final step before any commit that closes an epic
responsibilities:
  - Track 1 (Library) summary: PRs, changelog, npm release decision
  - Track 2 (Experiment) summary: EXPs closed with outcomes, fixture impacts
  - Track 3 (Content) summary: posts drafted, published, abandoned
  - Hypothesis-pool gardening: annotate with EXP outcomes, mark supersessions
  - Doc-gardening pass (delegates to doc-gardening-research skill)
  - ADR check: any decisions that need to be recorded
  - Commit-approval prompt: explicit, with grep checks summarised
output:
  - Wrap artefact at work/epics/<epic>/wrap.md
  - Updated docs/experiments/README.md index
  - Updated docs/private/04-hypotheses/README.md annotations
  - Updated docs/results/published-content.md (if posts published)
  - npm release tag/notes (if release decided)
  - ADR draft(s) (if warranted)
  - Blocker list if any boundary checks fail
invoked_by:
  - reviewer agent when closing an epic
  - any agent when the user explicitly wraps
---

# Skill: Wrap Epic

The ritual that transforms a completed epic into a committed, shipped, shareable set of artefacts — while enforcing the public/private boundary and the research-discipline rules.

## Trigger

All milestones in the epic are complete. Ready to close.

## Step 1 — Assemble the three-track summary

Create `work/epics/<epic-id>/wrap.md`:

```markdown
# Epic wrap — <epic-id>

Date: YYYY-MM-DD
Closed by: <principal>

## Track 1 — Library

- PRs merged: <count>
- API changes: <list, each with ADR ref if applicable>
- Bug fixes: <list>
- Fixture-impact summary:
  - FlowTime fixtures: <N regressions, M improvements>
  - Liminara fixtures: <N regressions, M improvements>
  - Metro fixtures: <N regressions, M improvements>
- npm release decision: <release | hold | hold-with-reason>

## Track 2 — Experiments

Closed in this epic:

| EXP | Outcome | Headline | Post-worthy? |
|---|---|---|---|
| EXP-NN | positive | <headline> | yes/no/deferred |
| EXP-MM | negative | <headline> | yes/no/deferred |
| EXP-LL | inconclusive | <headline> | no |

Hypothesis-pool impact:
- Promoted: <list H-IDs>
- Closed-positive (added annotations): <list>
- Closed-negative (added annotations): <list>
- Superseded: <list>

## Track 3 — Content

- Post candidates identified: <count>
- Drafts created: <count>
- In review: <count>
- Published this epic:
  - <list: date — title — channel — EXP ref — URL>
- Abandoned: <count with one-line reasons>

## Cross-cutting

- ADRs drafted: <list>
- Bibliography entries added: <count>
- Reading-list entries added: <count>
```

## Step 2 — Hypothesis-pool gardening

In `docs/private/04-hypotheses/README.md`:

1. For every EXP that closed positive in this epic: find the hypothesis entry and append `closed positive (EXP-NN)` annotation.
2. For every EXP that closed negative: append `closed negative (EXP-NN)` — do not remove the hypothesis.
3. For any new hypotheses added during the epic: verify numbering is continuous and the entry is complete.
4. For any hypothesis whose premise is now invalidated by an EXP outcome: mark `superseded by EXP-NN` or `superseded by H-MM`.

## Step 3 — Doc-gardening pass

Invoke the `doc-gardening-research` skill. Expect its output as a report. All Blockers must be resolved before proceeding to the commit-approval prompt.

Specifically verify:

- [ ] No private-path references in tracked files (grep checks from doc-gardening-research).
- [ ] All chronological numbering in `docs/private/` is continuous (no gaps, no collisions).
- [ ] Track 3 published posts migrated to `docs/results/published-content.md`.
- [ ] Tracking docs' Track 3 sections contain only neutral process summaries.
- [ ] `docs/experiments/README.md` index reflects all closed EXPs.

## Step 4 — ADR check

For each decision made during this epic, ask:

- *"Would future-me regret forgetting the reasoning behind this decision?"*

If yes and not already documented: draft an ADR.

ADRs that commonly come out of epic wraps:

- A new default parameter in dag-map.
- A new strategy option that survives ablation.
- A deprecation or removal decision.
- A scope cut or framing shift that affects subsequent epics.
- A supersession of a prior ADR.

Draft under `docs/decisions/<NNNN>-<slug>.md` using the project's ADR template.

## Step 5 — npm release decision

Determine whether the epic's Track 1 work merits a version bump:

- **Patch** (0.3.x → 0.3.x+1): bug fixes, documentation, internal refactors.
- **Minor** (0.3.x → 0.4.0): new opt-in strategies, new options, non-breaking API additions.
- **Major** (0.x → 1.0, or post-1.0 major bumps): breaking API changes, default changes that affect output noticeably.

During alpha, minor and patch are the norm. Majors are reserved for breaking-change clusters.

If a release is decided:
- Update `dag-map/CHANGELOG.md`.
- Tag the release.
- Write npm release notes covering the changes in principal-facing language.

If not decided:
- Note "hold until next epic" with a one-line reason.

## Step 6 — Content promotion

For each Track 3 post in the private workspace:

- **Draft → in-review:** principal reviews the draft. No automation.
- **In-review → approved for publication:** principal approves. Assistant may suggest edits.
- **Approved → published:** principal publishes externally. After publication, `draft-content` skill's publication-migration step is invoked to update the public index.

The wrap skill does not publish anything externally. It ensures the drafts are in review-ready state and the status file is accurate.

## Step 7 — Commit-approval prompt

Before proposing any commit to main:

1. Summarize the wrap artefact.
2. List Blockers remaining (if any — zero is the precondition).
3. Run the final grep checks one more time:
   - `docs/private/`
   - `docs/literature/pdfs/`
   - `research-pdfs`
   - `research-private`
4. Verify no test suite is red (framework rule).
5. Present the commit-approval prompt to the principal with the wrap artefact as the rationale.

Never commit without explicit principal approval. "Continue" does not count — the principal must affirmatively say "commit." This is the hard rule from `.ai-repo/rules/research.md` and it applies here with special force because epic wraps touch many files at once.

## Step 8 — Next-epic question (not planning)

After the wrap commits, ask the principal:

- "What did this epic reveal that you did not know before?"
- "Which hypotheses from the pool feel more or less relevant now?"
- "What is the product (FlowTime / Liminara) asking for next?"
- "Is there an intuition worth following even if it's not on the pool?"

These questions seed the next epic's framing. The wrap skill does not plan the next epic. It only hands off with a clean state and sharpened questions.

## Anti-patterns

- Wrapping with Blockers outstanding. Don't.
- Planning the next epic during the wrap. Separate ritual, separate skill (epic-kickoff, not yet authored).
- Publishing Track 3 content without principal review. Never.
- Bundling a content publication with the commit. Publication is an external act; the commit records the URL after the fact.
- Committing an EXP's positive outcome while its negative follow-up is still in progress. If a supersession is in flight, wait.

## Invocation pattern

> Wrap E-BENCH-experiment-harness.

Produces: wrap.md, pool annotations, ADRs if any, release decision, commit-approval prompt. Does not commit.

## What this skill does NOT do

- Run experiments. That is `run-experiment`.
- Draft new posts. That is `draft-content`.
- Plan the next epic. That is a separate activity.
- Commit or push. The principal approves.
