# Three-track workflow

How dag-map research progresses, operationally. The decision record is
[ADR 0002](../decisions/0002-adopt-three-track-research-framework.md); this
document is the public reference for *how* that decision plays out in
artefacts and skills.

## The three tracks

Three parallel channels, running continuously. Epics interleave them.

| Track | Purpose | Cadence | Primary artefacts |
|---|---|---|---|
| **1 — Library** | Engineering that ships (dag-map PRs, npm releases, consumer integration) | Continuous | `dag-map/CHANGELOG.md`, npm releases, integration guides |
| **2 — Experiment** | Scientific work: hypothesis → measurement → discussion | Loose (≈ one EXP every few weeks) | `docs/experiments/EXP-NN-<slug>/` |
| **3 — Content** | Public writeups derived from closed experiments | Triggered by closed-positive (or interesting closed-negative) EXPs | `docs/results/published-content.md` (URL+date+EXP-ref only) |

No long-range roadmap. Each epic's scope is chosen after the previous
epic wraps, informed by library needs, consumer-product needs,
experiment follow-ups, and current intuition.

## The epic rhythm

Epics are the unit of focused work. Each epic has:

1. A specific question or goal.
2. A small set of EXPs (Track 2) and/or library PRs (Track 1) that
   advance it.
3. A wrap that covers all three tracks.
4. No predetermined successor.

The wrap artefact reports: library changes and their product impact,
EXPs closed (positive / negative / superseded / inconclusive),
Track 3 decisions, hypothesis-pool gardening, doc-gardening, and
npm-release decision.

## End-to-end flow

An idea moves through phases from trigger to closed epic. Each phase
names the skill that owns it.

### Phase 0 — Epic trigger

One of four signals fires: product need, library gap, experiment
follow-up, or intuition. Pre-skill — the principal frames the epic.

### Phase 1 — Epic framing

Public artefacts produced:

- `work/epics/<epic-id>/epic.md` — goal, scope, constraints, milestones
- `work/epics/<epic-id>/<milestone-id>-<slug>.md` per milestone
- Entry in `work/roadmap.md`

Track decisions at framing time: which library changes this epic
produces (Track 1), which hypotheses get promoted to EXPs (Track 2),
what content shape — if any — is expected (Track 3).

Skills: `plan-epic`, `plan-milestones` (framework skills), optionally
`architect` for ideation.

### Phase 2 — Hypothesis promotion

Skill: **`promote-hypothesis`**.

For each hypothesis selected in Phase 1: re-operationalize for the
current posture (objective-metric default), select fixtures and
baselines, check whether an ADR is warranted, invoke
`design-experiment`.

### Phase 3 — Experiment design

Skill: **`design-experiment`**.

Creates `docs/experiments/EXP-NN-<slug>/` with four required files:

```
EXP-NN-<slug>/
├── hypothesis.md   — claim, why it matters, falsification condition
├── setup.md        — corpora, baselines, metrics, budget, reproducibility fields
├── results/        — raw outputs (CSV/JSON, renders) produced by scripts
└── discussion.md   — findings, caveats, follow-up, Track 3 recommendation
```

Reproducibility protocol fields required in `setup.md`: RNG seed,
configuration file path, code SHA (dag-map + bench), split version
hash. Every entry in `results/` carries these four fields in its
header.

### Phase 4 — Library changes

Concurrent with or interleaved with Phase 5. Library PRs implement the
interventions required by EXPs, close gaps, or advance features. A PR
that implements an EXP's intervention is blocked from merge until the
EXP runs and the result is reviewed.

Framework skills: `patch`, `review-code`.

### Phase 5 — Experiment execution

Skill: **`run-experiment`**.

Runs baseline pass, intervention pass, any additional baselines,
produces the diff and contact sheet, aggregates statistics, classifies
the outcome against the pre-committed falsification condition, drafts
`discussion.md`.

### Phase 6 — Content drafting (conditional)

Skill: **`draft-content`**.

Triggered only for closed EXPs whose `discussion.md` recommends a
post. Drafting happens privately; only the publication-migration step
(URL + date + EXP-ref → `docs/results/published-content.md`) touches
the public repo, and only after external publication.

### Phase 7 — Milestone wrap

Lighter epic wrap. Updates the milestone tracking doc's three-track
section; reviews closing EXPs with the principal; invokes a partial
`doc-gardening-research` pass.

### Phase 8 — Epic wrap

Skill: **`wrap-epic`**.

Assembles the three-track summary at `work/epics/<epic-id>/wrap.md`,
gardens the hypothesis pool, runs a full `doc-gardening-research`
pass, checks whether ADRs are warranted, decides on npm release,
migrates any newly-published content to the public index, produces
the commit-approval prompt with grep-check summary.

### Phase 9 — Transition

Pre-skill. The principal reviews what this epic revealed and frames
the next epic. The wrap does not plan the successor — it hands off
with a clean state.

## Skills and phases

| Phase | Primary skill | Supporting skills |
|---|---|---|
| 0 | — | — |
| 1 | `plan-epic` | `plan-milestones`, `architect` |
| 2 | `promote-hypothesis` | `design-experiment` |
| 3 | `design-experiment` | — |
| 4 | `patch` | `review-code` |
| 5 | `run-experiment` | — |
| 6 | `draft-content` | — |
| 7 | (lighter `wrap-epic`) | `doc-gardening-research` |
| 8 | `wrap-epic` | `doc-gardening-research`, `draft-content` (for publication migration) |
| 9 | — | — |

Framework skills live in `.ai/skills/`. Repo-specific skills live in
`.ai-repo/skills/`:

- `.ai-repo/skills/design-experiment.md`
- `.ai-repo/skills/promote-hypothesis.md`
- `.ai-repo/skills/run-experiment.md`
- `.ai-repo/skills/draft-content.md`
- `.ai-repo/skills/doc-gardening-research.md`
- `.ai-repo/skills/wrap-epic.md`

## Artefact locations

| Artefact | Path |
|---|---|
| Roadmap (current epic only) | `work/roadmap.md` |
| Active epic spec | `work/epics/<epic-id>/epic.md` |
| Milestone specs | `work/epics/<epic-id>/<milestone-id>-<slug>.md` |
| Milestone tracking docs | `work/milestones/tracking/<epic-id>/.../<milestone-id>-tracking.md` |
| Completed epics | `work/done/<epic-id>/` |
| Experiments | `docs/experiments/EXP-NN-<slug>/` |
| Experiment index | `docs/experiments/README.md` |
| ADRs | `docs/decisions/NNNN-<slug>.md` |
| Bibliography | `docs/literature/bibliography.bib` |
| Published content index | `docs/results/published-content.md` |

## Disciplines that cut across all phases

- **Reproducibility protocol.** Every reported result carries seed,
  config path, code SHA, and split version hash. Results that cannot
  produce all four are not reported. Sketch / exploratory runs are
  prefixed `scratch-` and live in gitignored paths.
- **Held-out split discipline.** `bench/fixtures/splits.json` is
  hash-frozen. Training-side code routes fixture reads through
  `bench/fixtures/split-loader.mjs`. A CI guard fails the build on
  direct fixture reads from training code paths. Regenerating the
  split requires an ADR entry and a version bump.
- **Public/private boundary.** Working-draft material — strategy,
  brainstorms, content drafts — lives under `docs/private/` (Dropbox
  bind-mount, gitignored). Committed content must not cite, link to,
  or paraphrase files under `docs/private/` or
  `docs/literature/pdfs/`. The `doc-gardening-research` skill
  enforces this with grep checks at every epic wrap.
- **No unauthorized commits or pushes.** Commits and pushes require
  explicit principal approval. "Continue" and "ok" do not count.

## What this document is not

- Not a schedule. No dates beyond the current epic.
- Not a research plan. The hypothesis pool is a curated menu, not a
  backlog; specific hypotheses are promoted when the moment is right.
- Not immutable. When the workflow materially changes, update this
  document and supersede ADR 0002 with a new ADR.
