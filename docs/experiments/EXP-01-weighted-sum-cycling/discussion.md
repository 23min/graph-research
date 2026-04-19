# EXP-01 — Discussion

## What the results say

The v1 framing could not validate its central hypothesis, and the failure modes were structural rather than incidental. Three observations carry forward:

1. **The cycling / revert pattern reflects the framing, not the workmanship.** A weighted-sum scalar fitness over conflicting aesthetic metrics (crossings vs. bends, edge length vs. monotonicity, density vs. area) has no coherent preference when an improvement on one axis produces a loss on another. The manual-tuning sequence of refinements-then-reverts and the GA's min-stagnation-with-avg-oscillation are two views of the same phenomenon: the search surface contains a trade-off structure the scalar objective cannot resolve.

2. **The crossing-detector bug is a methodology observation.** Every GA run before commit `ac2b630` optimised a broken crossing signal. In isolation this is a correctness fix; as a methodology point, it illustrates that without a reproducibility protocol (seed + config + code SHA + held-out split on every reported result) errors in the objective function are indistinguishable from genuine fitness signal.

3. **Weights need an anchor.** The 11-term `default-weights.json` was tuned to smooth energy cliffs — a reasonable practical move — but there was no user-study, preference-panel, or external benchmark to say whether the smoothed weighting reflected anything readers perceive. Any claim about "better layouts" rests on the weights; if the weights are not anchored to external evidence, the claim is not either.

## What the results do not say

- They do not say that GA-based configuration is wrong for layered layout. A GA with a vector fitness, a Pareto archive, and held-out evaluation could still be the right instrument.
- They do not say the pipeline refactor from M-EVOLVE-01 was wasted. The six-slot decomposition is a useful substrate for *any* configurator, and the byte-level equivalence tests prove it did not regress existing behaviour.
- They do not say Mode 2 / Mode 2.5 are dead ends. They say those engines were not validated *under the weighted-sum framing*. A methodology that can evaluate them honestly is a prerequisite for any claim, positive or negative, about their quality.

## Caveats

- The observed fitness numbers (min ≈ 493–510, max up to 2635) are from production runs on the 34-fixture pool with the specific weights in `default-weights.json` as of freeze. Different weights, different fixtures, and the post-`ac2b630` crossing detector would produce different numbers. The qualitative pattern — stagnation with oscillation — is the signal; the specific values are illustrative.
- The revert patterns are genuine but not unique to this project: any heuristic-tuning effort on a conflicting multi-objective surface produces similar trajectories. They are evidence of the framing's mismatch, not of process dysfunction.
- The Mode 2.5 design note (see `design-notes/mode-2.5-bezier-process.md`) describes a promising direction that a v2-style methodology could evaluate on its own terms; it is preserved here for that reason.

## What motivated the pivot

Two external reference points plus the observations above converged on the same conclusion:

- **Van Wageningen, Mchedlidze & Telea (GD 2025), *Same Quality Metrics, Different Graph Drawings*** demonstrated that drawings can be warped into arbitrary shapes while keeping aesthetic-metric values near-constant. Any single-metric or weighted-sum claim has to answer this critique head-on: near-equal score does not mean near-equal drawing. ([VanWageningen2025SameQualityMetrics])

- **Di Bartolomeo, Di Battista & Patrignani (CGF 2024), *Evaluating Graph Layout Algorithms: A Systematic Review*** sets the reporting bar the graph-drawing community now expects: standard corpora (Rome-Lib, AT&T, GLaDOS), named baselines, per-metric breakdown (not weighted-sum collapse), and a task-based user study. v1 met none of these. ([DiBartolomeo2024EvaluatingGraphLayout])

The combination made the structural bound visible. Under the v1 framing, even a successful strategy-combination GA would have produced a result that did not meet the reporting template Di Bartolomeo et al. (CGF 2024) set for systematic review — standard corpora, named baselines, per-metric breakdown, user study — and therefore could not have been reported without anticipating rejection on methodology grounds. The pivot (see `docs/decisions/0001-pivot-from-weighted-sum-single-corpus-ga-to-multi-objective-methodology.md` and `work/epics/E-EVOLVE-v2-methodology/epic.md`) reframes the work around the methodology rather than the algorithm:

- Multi-objective optimisation with a Pareto front (NSGA-II) replacing the scalar weighted-sum.
- Standard corpora — AT&T/North, RandDAG, Graphviz Examples, Co-Phylogenetic Trees — with a frozen held-out split.
- Automated-configuration baselines (SMAC, irace) run on the same budget.
- Named layout baselines (dagre, OGDF Sugiyama, Nöllenburg–Wolff / Bast grid-graph) evaluated per metric.
- User study designed during M-V2-02, executed when the pipeline is ready.

## Carry-forward artefacts

- Pipeline decomposition and strategy-slot registry (retained as `bench/` imports in graph-research).
- Accurate H-V-H crossing detector (commit `ac2b630`).
- Bench print utility (commit `b6e3ead`).
- Mode 2 / Mode 2.5 engines, preserved at `reference/m-evolve-01` for future evaluation under the v2 methodology.
- Reference artefacts (showcase PDFs, HTML sidecars) at `work/reports/` in the frozen branch.

## Status

Closed (negative result). Supersession by `E-EVOLVE-v2-methodology`.
