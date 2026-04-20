---
title: Research questions
status: draft — under review
date: 2026-04-20
---

# Research questions

What this project is trying to answer. Written at the level of *questions*, not *hypotheses*: a question describes what the project is curious about; a hypothesis commits to a falsifiable claim with a specific metric, effect size, and baseline. Hypotheses live privately in the pool (see `docs/methodology/hypothesis-pool.md`) until they are promoted to `docs/experiments/EXP-NN-<slug>/`. This document names the questions upstream of that process.

The questions are grouped by layer: thesis, methodology, mechanism, perception, dynamics, and scale. Some questions will never become experiments in this project; they are kept because they shape how the project thinks about itself and what it will and will not claim. The list is curated and gardened at every epic wrap; it is not intended to be exhaustive.

## 1. Thesis layer — what the project is really asking

**Q1.** *Does route-based layout, where routes are supplied as input rather than discovered after the fact, produce execution-DAG visualisations that are meaningfully easier to read than layered approaches that discover or colour routes post-hoc?*

This is the project's central question. It frames dag-map as a design choice (routes-as-primitive) rather than as a tuning of a classical layered layout. The downstream work is only interesting if the answer is plausibly yes.

**Q2.** *When route-based layout wins, is it winning on topology (fewer visible crossings, smoother routes) or on identity (each route remains a legible trace through the graph), or both, and can the two be separated?*

Disentangling these matters because the two failure modes need different metrics. If the win is on identity, a crossings-only evaluation will miss it.

**Q3.** *For what classes of DAG is route-based layout the wrong answer?*

An honest research stance names the regime where the project's thesis does not hold. Candidates worth testing include DAGs with no natural route structure, DAGs with heavy cyclic components, and DAGs where route identity is not a primary reading task.

## 2. Methodology layer — how the project evaluates itself

**Q4.** *What is the right measurable definition of "smooth" for a route-based layout?*

Discrete bend counts, squared turning angles, and curvature integrals are three candidate metrics. They are not interchangeable and their rankings on the same layout can disagree. A metric choice is a methodological commitment; the choice should be defended.

**Q5.** *Does trading weighted-sum fitness for Pareto-front reporting change which layouts the method prefers, or only which layouts the method reports?*

A Pareto front exposes trade-offs that a scalar collapses. Whether the exposed structure changes the *conclusion* — versus only the *presentation* — is an empirical question with consequences for how the project will frame all subsequent claims.

**Q6.** *How susceptible is any aesthetic metric the project uses to the kind of adversarial warping that keeps aesthetic scores near-constant while changing the drawing visibly?*

This question is owed to the field. A method of evaluation that cannot answer it is not defensible as evidence.

## 3. Mechanism layer — where structure comes from

**Q7.** *Do branch geometries drawn from biological or physical optimality principles — flow networks, phyllotaxis, constructal angles, dendritic branching — produce measurably better DAG layouts than uniform or heuristic alternatives, or are those principles a narrative device that does not survive measurement?*

The project has a standing interest in biomimicry. This question is the honest framing: biomimicry is worth taking seriously only if it makes layouts measurably better on pre-specified metrics. Each biological source is a candidate mechanism; each must earn its place.

**Q8.** *When a route diverges or converges, what geometry of the branching point best preserves the reader's ability to follow each route individually?*

Candidate geometries: fixed-radius arcs, cubic Béziers, progressive-angular curves, G²-continuous spline families. The question is mechanism-agnostic; the answer is expected to depend on graph structure and reading task.

**Q9.** *Does fixing a trunk — the longest or most-trafficked path — as a layout anchor produce layouts that stay legible when the rest of the graph is perturbed or grown?*

A "main path" anchor is a hypothesis about how readers attend to DAGs: longest path first, branches as deviations. Testing it means measuring whether perturbations off the trunk are cheaper to read than perturbations through it.

## 4. Perception layer — how humans actually read these

**Q10.** *For a task of tracing a single route through a dense DAG, are curvilinear layouts faster, slower, or indistinguishable from octilinear layouts?*

Task-time and preference are often confused in this area. The project defaults to task-time for functional claims and pairwise preference for aesthetic claims. The two signals can disagree, and disagreement is informative.

**Q11.** *What visual variables — line colour, line weight, station shape, station size — most efficiently encode "this is a distinct route" versus "this is a structurally important node"?*

Pre-attentive visual variables (Cleveland-McGill) are not equally effective for all reading tasks. The question is empirical: which encodings transfer to route-based DAGs, which do not.

**Q12.** *For dense layouts, how does reader performance degrade with graph size, and can the degradation curve be flattened by progressive disclosure (hide low-frequency routes, collapse sub-sub-branches) without losing the structural reading?*

A scaling question with a perceptual payoff. Answers here determine whether the project's method is interesting only on small fixtures or transfers to the sizes real products produce.

## 5. Dynamics layer — graphs that change

**Q13.** *When a DAG is grown incrementally — one node added at a time — what layout update strategy best preserves the reader's mental map?*

Mental-map preservation under change is a well-established research thread (Archambault et al., Purchase). The question is specifically whether route-based decomposition provides update affordances that node-first layouts lack — e.g. whether pinning the trunk and relaxing branches produces less total node displacement than recomputing globally.

**Q14.** *Is Euclidean displacement the right metric for mental-map decay, or does human spatial memory decay in a way a weighted metric captures better (e.g. recency-weighting, trunk-discount)?*

The answer shapes how all dynamics-layer claims are measured. Before committing to a metric, it should be justified against alternatives.

## 6. Scale and delivery layer — does any of this ship

**Q15.** *At what graph size do SVG-based renderings of route-based DAGs stop being interactive on commodity hardware, and what rendering substrate extends the range without compromising the layout quality the project cares about?*

This is a question about whether the project's results reach the consumer products at all. It is the only question in this list where the answer is mostly an engineering measurement rather than a research finding — but the measurement is still needed, and the answer affects which hypotheses in Q10–Q12 are testable at realistic sizes.

## 7. What this document is not

- Not an experiment list. Experiments live under `docs/experiments/`.
- Not a hypothesis list. Hypotheses live privately and are promoted individually.
- Not a roadmap. The questions are not prioritised; prioritisation happens when an epic is framed and one or more questions are chosen as the target.
- Not immutable. Questions are added, refined, retired, or withdrawn at every epic wrap.

## 8. How questions become experiments

A research question is a shape, not a commitment. An experiment commits to a specific operationalisation of one question: specific metric, specific baselines, specific falsification condition. Many questions will admit multiple experiments; some will admit none that the current tooling can run.

The path from question to experiment:

```
research question                     private hypothesis                 public experiment
(what is the project curious ──────> (one falsifiable claim  ──────────> (EXP-NN-<slug>/ with
about?)                                about one operationalisation)      hypothesis + setup + results + discussion)
```

An epic pulls one or more questions, identifies the hypotheses from the private pool that would answer them, and runs them as EXPs. Which questions the next epic pulls is decided at epic framing, not here.

## 9. Cross-references

- [ADR 0002](decisions/0002-adopt-three-track-research-framework.md) — three-track research framework
- [methodology/three-track-workflow.md](methodology/three-track-workflow.md) — operational detail
- [methodology/hypothesis-pool.md](methodology/hypothesis-pool.md) — how hypotheses move from private pool to public EXP
- [requirements/dag-map.md](requirements/dag-map.md) — extracted requirements from the frozen EVOLVE-01 work
- `experiments/` — per-experiment records (populated as experiments are run)
