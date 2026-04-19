---
description: Create a new EXP-NN experiment folder with hypothesis / setup / results / discussion structure. Ensures reproducibility protocol fields are present and cross-references are seeded.
name: design-experiment
when_to_use: |
  - When a hypothesis has been promoted from the pool and needs an EXP folder
  - When a library gap needs scientific investigation (not just a bug fix)
  - When the user asks to "design an experiment" or "start EXP-NN"
responsibilities:
  - Create docs/experiments/EXP-NN-slug/ with the four required files
  - Populate hypothesis.md, setup.md, results/ (empty), discussion.md (placeholder)
  - Record reproducibility protocol fields: seed, config path, code SHA, split version hash
  - Seed cross-references to bibliography entries, ADRs, and adjacent experiments
  - Register the new experiment in docs/experiments/README.md index
output:
  - docs/experiments/EXP-NN-slug/hypothesis.md
  - docs/experiments/EXP-NN-slug/setup.md
  - docs/experiments/EXP-NN-slug/results/ (empty dir with a .gitkeep)
  - docs/experiments/EXP-NN-slug/discussion.md (placeholder)
  - Updated docs/experiments/README.md index entry
invoked_by:
  - promote-hypothesis skill (always — creates the EXP folder as its output)
  - builder agent (when a library PR needs an associated EXP)
  - planner agent (when scoping an epic)
---

# Skill: Design Experiment

Create a rigorous experiment folder that future-you can read in six months and understand what was tried, why, how, and what was found.

## Input requirements

Before creating the folder:

- EXP-NN number — next sequential, checked against `docs/experiments/README.md`
- Slug — short kebab-case, describes the claim (`routes-as-input-ft`, `phyllotaxis-divergence`, `curvature-metric`)
- Hypothesis statement — canonical form: *"For graphs with property P, applying intervention X will change metric M by at least δ compared to baseline B, because of mechanism R."*
- Fixture set — which corpora/fixtures will be used (FlowTime, Liminara, metro, MLCM, synthetic)
- Baselines — what the intervention is compared against
- Metrics — vector fitness components plus any experiment-specific ones

## Folder layout

```
docs/experiments/EXP-NN-slug/
├── hypothesis.md
├── setup.md
├── results/
│   └── .gitkeep
└── discussion.md
```

## Template: hypothesis.md

```markdown
# EXP-NN — <Short Title>

## Hypothesis

<Canonical form statement.>

## Why this matters

<One paragraph: what the result will tell us, regardless of direction.
What decision does this experiment unblock? Which of the three tracks
does it serve?>

## Falsification condition

<Specific numeric condition that would make us report this as negative.
Be concrete: "if the observed effect size is below 0.3 or the 95% CI
crosses zero, report as null." Pre-commit to this before running.>

## Source

<One of:
- Promoted from hypothesis pool: `docs/private/04-hypotheses/HNN-<slug>.md`
- Library gap: `dag-map/gaps.md` item "<title>"
- Product need: FlowTime / Liminara context
- Experiment follow-up: supersedes or extends EXP-MM>

## Cross-references

- Bibliography: {bibkeys}
- ADR: {ADR number if a decision will follow}
- Adjacent experiments: {EXP-MM, EXP-LL}
```

## Template: setup.md

```markdown
# EXP-NN Setup

## Corpora / Fixtures

<Named set. Include the split version hash if using the held-out split.>

- Path(s): {bench/fixtures/...}
- Split version: {splits.json version}
- Split SHA-256: {hash}

## Baselines

<Each baseline named, with a one-paragraph description of what it computes
and how it is invoked. At minimum: the current dag-map default on the same
fixtures.>

## Metrics

<Vector fitness components used plus any EXP-specific metrics. For each:
name, formula or reference, higher-or-lower-is-better, unit.>

## Intervention

<Precise description of what changes compared to the baseline. Config file
path, parameter values, code path.>

## Budget

<How many runs, how many seeds, how many fixtures. Compute time expected.>

## Reproducibility protocol

- **RNG seed:** {integer}
- **Configuration file:** {path, committed}
- **Code SHA (dag-map):** {git rev-parse HEAD at run time}
- **Code SHA (bench):** {git rev-parse HEAD at run time}
- **Split version hash:** {SHA-256 of splits.json}

Every entry in `results/` must carry all four fields in its file header.

## How to reproduce

```
# exact command(s) to reproduce the experiment
node bench/run-experiment.mjs EXP-NN
```
```

## Template: discussion.md (placeholder)

```markdown
# EXP-NN Discussion

<!--
Populated after results/ is written. Cover:
1. What the numbers say (headline result with CI).
2. What the numbers do not say (scope limits, confounds).
3. Outcome classification: positive / negative / superseded / inconclusive.
4. What to try next (follow-up hypothesis, if any).
5. Track 3 recommendation: post-worthy? Which type? Defer?
-->

## Outcome

<!-- positive | negative | superseded | inconclusive -->
Status: _to be written_

## Headline

_to be written_

## Detailed findings

_to be written_

## Caveats and scope

_to be written_

## Follow-up

_to be written_

## Track 3 recommendation

_to be written_
```

## Index entry (docs/experiments/README.md)

Append to the experiments index:

```markdown
| EXP-NN | <slug> | open | <one-line hypothesis summary> | {YYYY-MM-DD} |
```

Statuses: `open` | `closed-positive` | `closed-negative` | `superseded` | `inconclusive`.

## Post-creation checks

- [ ] All four required files exist.
- [ ] hypothesis.md has a falsification condition.
- [ ] setup.md has all four reproducibility protocol fields.
- [ ] Index entry added to `docs/experiments/README.md`.
- [ ] Bibliography entries cited exist in `docs/literature/bibliography.bib`.
- [ ] No references to `docs/private/` paths in any of the four files.

## What this skill does NOT do

- Run the experiment. That is `run-experiment`.
- Promote a hypothesis from the pool. That is `promote-hypothesis`.
- Decide whether the experiment should be a post. That decision is in `discussion.md` at close time, and execution is `draft-content`.
