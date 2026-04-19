# 0002 — Adopt three-track research framework

## Status

active — supersedes ADR 0001 in part (the prescription only; 0001's diagnosis remains valid)

## Context

Prior framings of this project's research approach emphasised methodology
infrastructure as a prerequisite for defensible claims: ADR 0001 recorded
a pivot from a single-objective GA to a multi-objective methodology epic
with NSGA-II, automated-configuration baselines, standard corpora, and
per-metric reporting. That framing treated the library (dag-map) as one
engine among several under comparison and structured the work as a
linear buildout of measurement infrastructure preceding any applied
result.

A re-examination of the project's actual goals revealed a mismatch
between that framing and two things the project cares about most:

1. **Library improvement for the products that consume dag-map** —
   FlowTime and Liminara — needs to ship continuously, not after a
   multi-milestone methodology build.
2. **The distinguishing contribution of dag-map** — route-based
   curvilinear layout for execution DAGs — is not a question about
   which configurator to use, and is not best served by a framework
   designed to compare configurators.

The present ADR records a shift from methodology-first to
results-first, with three parallel tracks that run continuously and
reinforce each other rather than a linear sequence of
methodology-infrastructure milestones.

## Decision

Adopt a three-track research framework as the operating mode going
forward:

- **Track 1 — Library.** Engineering work that ships. Quality
  improvements, bug fixes, API refinements, npm releases, consumer
  product integration. Cadence: continuous. Success criterion:
  releases go out, consumers use them, no regressions on fixtures
  that matter.
- **Track 2 — Experiment.** Scientific work. Each `EXP-NN` folder
  carries hypothesis, setup, results, and discussion, with full
  reproducibility protocol (seed + config + code SHA + split version
  hash). Cadence: loose; one experiment every few weeks. Success
  criterion: the lab notebook is continuous, auditable, and
  regenerable.
- **Track 3 — Content.** Public writeups (blog, LinkedIn, long-form).
  Triggered by closed experiments with defensible claims. Drafts live
  privately (`docs/private/content/`, gitignored); only URL + date
  + EXP cross-reference migrate to the public content index
  (`docs/results/published-content.md`) on actual publication.

Epics are the unit of focused work across all three tracks. Each
epic's wrap covers all three tracks and includes: library-change
summary, experiment outcomes (positive / negative / superseded /
inconclusive), content decisions, hypothesis-pool pruning,
doc-gardening, and npm-release decision. The framework is codified
operationally in six repo-specific skills under `.ai-repo/skills/`:
`doc-gardening-research`, `design-experiment`, `promote-hypothesis`,
`run-experiment`, `draft-content`, and `wrap-epic`.

Several disciplines are retained from prior framings and promoted to
first-class rules:

- **Reproducibility protocol.** Every reported result carries seed,
  config path, code SHA, and split version hash. Results without
  those four are not reported.
- **Held-out split discipline.** Fixtures are hash-frozen and
  training-side code is barred from reading held-out paths. A CI
  guard enforces the boundary.
- **Public/private boundary.** Working-draft material
  (strategy, brainstorms, content drafts) lives under `docs/private/`
  and never flows directly into committed public artefacts.
  `doc-gardening-research` enforces the boundary with grep checks at
  every epic wrap.
- **Apache-2.0 for code, CC-BY-4.0 for docs.** Repository licensing
  is codified at the root; dag-map is aligned to Apache-2.0 to match
  the broader product stack and gain explicit patent grants.

Epic sequencing is deliberately outcome-dependent. No long-range
roadmap is maintained. The next epic's scope is decided after the
current epic wraps, informed by library needs, consumer-product
needs, experiment follow-ups, and current intuition.

## Alternatives considered

- **Continue ADR 0001's methodology-first epic as scoped.** Retained
  the measurement spine but deferred library improvement and product
  integration to the end of a multi-milestone buildout — the opposite
  of what the consumer products needed in the near term.
- **Scope-cut methodology epic without introducing the three-track
  framing.** Kept the measurement spine but left library engineering
  and public content implicit, which is how earlier iterations
  arrived at the situation where these tracks were neither planned
  nor tracked. The three-track framing is the minimum change that
  makes all three visible and legible.
- **Abandon methodology discipline entirely and ship engineering only.**
  Rejected because the reason earlier work cycled without converging
  was precisely the absence of measurement. Held-out splits, vector
  fitness, and reproducibility artefacts are load-bearing regardless
  of which research questions are asked; those survive the pivot,
  just not the configurator-comparison buildout that sat on top of
  them.

## Consequences

- **ADR 0001's prescription is superseded.** 0001's diagnosis of the
  single-objective GA's structural limits remains valid and is not
  retracted. The six-milestone methodology epic it outlined is no
  longer the active plan; its artefact (`work/epics/
  E-EVOLVE-v2-methodology/`) was scaffolded on a research branch and
  is not merged to main under this framework.
- **No active epic is declared by this ADR.** The next epic is
  framed as a separate step, driven by consumer-product need and
  current intuition, not by methodology plan. `work/epics/` and
  `docs/roadmap.md` reflect this honestly rather than filling in a
  placeholder.
- **Six skills under `.ai-repo/skills/` are the executable form of
  this ADR.** Changes to the framework's operational details update
  the skills; changes to the framework itself require a superseding
  ADR.
- **The hypothesis pool is a curated menu, not a backlog.** Located
  privately (gitignored); promoted to EXP backlog when the moment is
  right. Pool gardening is part of every epic wrap.
- **Library stability as a design rule** activates when dag-map
  stabilises beyond the principal's own products (i.e. at beta).
  During alpha, iteration is aggressive and kill-your-darlings is
  welcome.
- **Human-study posture is evaluated per epic.** Default is
  objective-metric evaluation on fixtures the products actually
  consume. Small pairwise-preference pilots are available when a
  specific hypothesis needs aesthetic-preference data; full
  task-based studies are reserved for publication preparation if
  and when experiments accumulate to justify it.
