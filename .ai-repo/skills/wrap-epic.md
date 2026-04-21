---
name: wrap-epic
description: End-of-epic ritual for graph-research. Overrides the framework `wrap-epic` — runs research-layer gardening (three-track Library/Experiment/Content summary, hypothesis-pool annotations, doc-gardening-research pass, Track 3 content promotion, npm release decision, private/public boundary grep checks) before delegating to the framework generic flow (integration merge, archival to `work/done/`, origin-branch cleanup, commit-approval). Use when an epic's final milestone closes ("wrap E-<id>"). Local branches preserved. Commit and push require explicit human approval.
disable-model-invocation: true
argument-hint: "[epic-id]"
---

# Skill: Wrap Epic — research extension

This is the **graph-research extension** of the framework `wrap-epic` skill. It layers research-discipline concerns onto the generic epic-closure flow defined at `.ai/skills/wrap-epic.md`.

The flow runs in two phases:

- **Phase A — Research-layer preparation** (steps 1–7 below). All artefacts produced here are committed to the epic branch *before* the integration merge runs. This ensures the integration target (`main`) sees a finished epic, not a half-wrapped one.
- **Phase B — Generic framework wrap** (steps 8–12 below). Delegates to the framework skill for integration merge, archival, branch cleanup, and commit-approval. The research extension does not reimplement those steps.

When this skill's description disagrees with the framework skill's description, **the research extension's intent wins within this repo**; the framework provides the baseline. Both skills live in the repo and are readable side-by-side.

## Trigger

All milestones in the epic are complete. Every status surface (milestone specs, tracking docs, epic spec milestone table, roadmap, `CLAUDE.md` Current Work) says so. Running `workflow-audit` first is required, not optional, at epic scale.

## Phase A — Research-layer preparation

### Step 1 — Workflow-audit + doc-gardening-research pre-flight

Run both skills, in either order. Zero Blockers must remain before proceeding. If either reports findings that need principal decisions, pause wrap and resolve them first.

- `workflow-audit` confirms status surfaces are coherent.
- `doc-gardening-research` confirms the private/public boundary is clean, Track 3 drafts are classified, hypothesis pool is reachable.

### Step 2 — Assemble the three-track summary

Create `work/epics/<epic-id>/wrap.md`. Extends the framework's base template (see `.ai/skills/wrap-epic.md` Step 1) with research-specific sections:

```markdown
# Epic wrap — <epic-id>

**Date:** YYYY-MM-DD
**Closed by:** <principal>
**Integration target:** main
**Epic branch:** epic/<epic-id>
**Merge commit:** <sha — filled in at Step 8>

## Milestones delivered

- M-<epic-id>-NN — <title> (merged <short-sha>)
...

## Summary

Two to four sentences on what the epic delivered.

## Track 1 — Library (dag-map)

- PRs pushed upstream: <count; link upstream compare URL>
- API changes: <list, each with ADR ref if applicable>
- Bug fixes: <list>
- Fixture-impact summary (consumers of dag-map):
  - FlowTime fixtures: <N regressions, M improvements, or "unchanged">
  - Liminara fixtures: <N regressions, M improvements, or "unchanged">
  - Research-side bench fixtures: <N regressions, M improvements>
- npm release decision: <release vX.Y.Z | hold until next epic | hold-with-reason>

## Track 2 — Experiments

Closed in this epic:

| EXP | Outcome | Headline | Post-worthy? |
|---|---|---|---|
| EXP-NN | positive \| negative \| inconclusive \| superseded | <one-line> | yes \| no \| deferred |

Hypothesis-pool impact (see Step 3 below for the actual gardening):

- Promoted: <list H-IDs>
- Closed-positive (annotated): <list>
- Closed-negative (annotated): <list>
- Superseded: <list>

## Track 3 — Content

- Post candidates identified: <count>
- Drafts created: <count>
- In review: <count>
- Published this epic (URL + date + EXP ref):
  - <list>
- Abandoned: <count, with one-line reasons if strategically relevant>

## ADRs ratified

- ADR-NNNN — <slug>  (or: "none")

## Follow-ups carried forward

- Pointers to `work/gaps.md` entries that survive the wrap
- Open questions the epic did not settle

## Handoff

What is ready for the next epic, and what is deliberately left open.
```

### Step 3 — Hypothesis-pool gardening

In `docs/private/04-hypotheses/README.md` (private, Dropbox-bound — edits are local-only, not committed):

1. For every EXP that closed positive in this epic: find the hypothesis entry and append `closed positive (EXP-NN)` annotation.
2. For every EXP that closed negative: append `closed negative (EXP-NN)` — do not remove the hypothesis; negative results stay for future revisits.
3. For any hypothesis whose premise is now invalidated by an EXP outcome: mark `superseded by EXP-NN` or `superseded by H-MM`.
4. For any new hypotheses added during the epic: verify the chronological numbering is continuous and each entry is complete.

The hypothesis pool is private. These annotations stay in `docs/private/`; only the summary counts land in the wrap artefact (Step 2).

### Step 4 — Doc-gardening-research, final pass

Invoke `doc-gardening-research` one last time. All Blockers must be zero:

- [ ] No private-path references in tracked files (grep checks per the skill).
- [ ] All chronological numbering in `docs/private/` is continuous.
- [ ] Track 3 published posts migrated to `docs/results/published-content.md`.
- [ ] Tracking docs' Track 3 sections contain only neutral process summaries.
- [ ] `docs/experiments/README.md` index reflects all closed EXPs.

### Step 5 — Track 3 content promotion

For each Track 3 post in the private workspace:

- **Draft → in-review:** principal reviews the draft. No automation.
- **In-review → approved for publication:** principal approves. Assistant may suggest edits.
- **Approved → published:** principal publishes externally. After publication, `draft-content` skill's publication-migration step is invoked to update `docs/results/published-content.md`.

The wrap skill **does not publish anything externally.** It ensures the drafts are in review-ready state and that the status file for each draft reflects reality.

### Step 6 — ADR check (research-specific)

Extends the framework's generic ADR check (see `.ai/skills/wrap-epic.md` Step 2) with research-repo candidates. Ask for each epic-internal decision:

- Would future-me regret forgetting the reasoning behind this?
- Is it a methodology shift (Bradley–Terry → objective-metric, weighted-sum → NSGA-II, etc.)?
- Is it a fixture-set change (split version bump, new external corpus inclusion)?
- Is it a consumer-impact change (dag-map API change that affects FlowTime or Liminara)?
- Is it a supersession of a prior ADR?

If yes, draft under `docs/decisions/NNNN-<slug>.md` using the next available 4-digit number.

### Step 7 — npm release decision for dag-map

Determine whether the epic's Track 1 work merits a version bump:

- **Patch** (`0.X.Y → 0.X.Y+1`): bug fixes, documentation, internal refactors.
- **Minor** (`0.X.Y → 0.X+1.0`): new opt-in strategies, new options, non-breaking API additions.
- **Major** (`0.X → 1.0`, or post-1.0 major bumps): breaking API changes, default changes that affect output visibly.

During alpha, minor and patch are the norm. Majors are reserved for breaking-change clusters.

If releasing:
- Update `dag-map/CHANGELOG.md` on the epic branch (before the integration merge in Step 8).
- Tag the release after the integration merge lands on main.
- Write release notes covering the changes in principal-facing language.

If not releasing, record "hold until next epic" with a one-line reason in the wrap artefact.

## Phase B — Generic framework wrap

### Step 8 — Framework Step 3: merge epic into main

Follow `.ai/skills/wrap-epic.md` Step 3 verbatim:

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff epic/<epic-id>
```

Record the merge SHA in the wrap artefact's `Merge commit` field. **Pause for principal approval** before this step; do not push yet.

### Step 9 — Framework Step 4: archive the epic folder

Follow `.ai/skills/wrap-epic.md` Step 4:

```bash
git mv work/epics/<epic-id>/ work/done/<epic-id>/
```

Uses `completedEpicPathTemplate` from `.ai-repo/config/artifact-layout.json` (resolves to `work/done/<epic-id>/`). Stage the move.

Also update inbound references — check `work/roadmap.md` and `CLAUDE.md` Current Work for links that pointed at `work/epics/<epic-id>/…`; they need to point at `work/done/<epic-id>/…`.

### Step 10 — Framework Step 5: branch cleanup on origin

Follow `.ai/skills/wrap-epic.md` Step 5. Delete every milestone branch of the epic on origin, plus the epic branch on origin. **Local branches are preserved** so Git Graph continues to label the merged-in history (see the framework skill's Principles section for the rationale). Verify each branch is merged into `main` before issuing `git push origin --delete`; do not force.

### Step 11 — Framework Step 6: commit archival + wrap

Follow `.ai/skills/wrap-epic.md` Step 6. Commit message template:

```
chore(E-<id>): wrap epic — archive to work/done, record wrap.md
```

### Step 12 — Framework Step 7: push main

Follow `.ai/skills/wrap-epic.md` Step 7. **Pause for principal approval** before `git push origin main`.

## Phase C — Next-epic seeding

### Step 13 — Ask the framing questions

After the wrap commits land and `main` is pushed, ask the principal:

- "What did this epic reveal that you did not know before?"
- "Which hypotheses from the pool feel more or less relevant now?"
- "What is the product (FlowTime / Liminara) asking for next?"
- "Is there an intuition worth following even if it's not on the pool?"

These seed the next epic's framing. The wrap skill does not plan the next epic — it hands off with a clean state and sharpened questions.

## Anti-patterns

- Wrapping with Blockers outstanding from any gardening pass.
- Planning the next epic during the wrap — separate activity.
- Publishing Track 3 content without principal review.
- Bundling a content publication with the wrap commit. Publication is external; the commit records the URL after the fact.
- Committing an EXP's positive outcome while its negative follow-up is still in progress. Wait.
- Reimplementing framework steps 3–7 inside the research extension. Delegate — the framework owns those.

## Invocation

> Wrap E-BASELINE.

Produces:
- Wrap artefact with three-track summary (staged).
- Pool annotations (private, edited in place).
- ADR drafts (staged).
- Release decision (recorded in wrap artefact; CHANGELOG staged if releasing).
- Framework flow: integration merge, archival, branch cleanup, push — each pausing for principal approval.
- Next-epic seed questions asked after the wrap commits.

Does not commit or push without explicit principal approval.

## What this skill does NOT do

- Run experiments (that is `run-experiment`).
- Draft new posts (that is `draft-content`).
- Plan the next epic (that is a separate activity).
- Commit or push without the principal's explicit approval.
- Reimplement the generic framework wrap steps — those live at `.ai/skills/wrap-epic.md`.
