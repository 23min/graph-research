# 0001 — Pivot from weighted-sum single-corpus GA to multi-objective methodology

## Status

superseded by [0002](0002-adopt-three-track-research-framework.md) — the diagnosis in this ADR remains valid; the prescription (six-milestone methodology epic) is retired

## Context

An earlier layout-evolution effort (preserved at tag `reference/m-evolve-01` and documented under `docs/experiments/EXP-01-weighted-sum-cycling/`) used a single-objective genetic algorithm with a weighted-sum scalar fitness over conflicting aesthetic metrics, evaluated on a single ~34-fixture in-house pool that was shared by both optimisation and evaluation. That effort landed a pipeline refactor of `layoutMetro` into strategy slots, but its central thesis — *evolve strategy combinations, not just numeric parameters* — never materialised. The genome stayed at two numeric spacing parameters. Observed GA fitness trajectories showed minimum stagnation with average and maximum oscillation, consistent with a scalar objective trading gains in one metric for losses in another.

Two external reference points converge on the same conclusion:

- **Van Wageningen, Mchedlidze & Telea (GD 2025), *Same Quality Metrics, Different Graph Drawings*** demonstrates that drawings can be warped into arbitrary shapes while keeping aesthetic-metric values near-constant. A weighted-sum or single-metric claim has no defence against this: near-equal score does not mean near-equal drawing.
- **Di Bartolomeo, Di Battista & Patrignani (CGF 2024), *Evaluating Graph Layout Algorithms: A Systematic Review*** establishes the reporting template the graph-drawing community now expects: standard corpora (Rome-Lib, AT&T/North, GLaDOS), named baselines, per-metric breakdown rather than weighted-sum collapse, and a task-based user study.

The prior effort met none of these. A crossing-detector bug (fixed in a later commit) also meant GA runs before that commit optimised a broken signal, illustrating that without seed + config + code SHA + held-out-split reproducibility discipline, errors in the objective are indistinguishable from genuine fitness gradient.

## Decision

Freeze the prior effort at `reference/m-evolve-01` (not merged), archive its documentation under `docs/experiments/EXP-01-weighted-sum-cycling/`, and start a new epic `E-EVOLVE-v2-methodology` that reframes the work along methodology rather than single-algorithm lines:

- **Multi-objective optimisation (NSGA-II).** Replace the weighted-sum scalar with a Pareto-front search over individual metrics (crossings, bends, edge length, stress, overlap, monotonicity, area). A configuration is a *set* of non-dominated candidates, not a single best.
- **Standard corpora.** Import AT&T/North, RandDAG, Graphviz Examples, and Co-Phylogenetic Trees subsets from the GLaDOS archive. Existing in-house fixtures remain available but stop being the sole evaluation set.
- **Held-out split, frozen by hash.** Stratified train/validation/test of in-house fixtures, with SHA-256 hashes so the split is verifiable and non-drifting. A CI guard prevents training code from reading test or external fixtures.
- **Automated algorithm configuration baseline (SMAC or irace).** Run on the same budget as the GA. Reviewers will ask why GA over Bayesian / racing methods — running the baselines answers this empirically rather than by assertion.
- **Named baselines.** dagre, OGDF Sugiyama, and Nöllenburg–Wolff MIP (or Bast et al.'s grid-graph approximation for metro) evaluated on the same corpora with the same metrics. Win rate reported *per metric*, not per weighted fitness.
- **User study deferred but designed.** A small task-based study is a publication prerequisite but not a near-term milestone. Fixture selection and tasks are specified during M-V2-02 so the harness is ready if and when the study runs.

## Alternatives considered

- **Continue the weighted-sum GA and fix the genome to actually evolve strategy combinations.** Would have left van Wageningen et al.'s critique unanswered, so no evaluation the work produced could have been reported without anticipating rejection on methodology grounds.
- **Skip NSGA-II and go straight to SMAC3 as the only configurator.** Loses the Pareto-front artefact, which is the specific thing that exposes trade-off structure reviewers want to see. SMAC3 is a single-objective Bayesian method; MO variants exist but add complexity before the baseline is in.
- **Keep the single in-house fixture pool and add corpora later.** Defers the held-out discipline, meaning every result produced in the interim would be non-publishable and would have to be re-run once the discipline landed. Cheaper to pay the corpora cost up front.

## Consequences

- No merge of the prior epic's work to `main`. The branch, tag, and reference artefacts stay for retrieval; they are documented under `docs/experiments/EXP-01-weighted-sum-cycling/`.
- Multi-objective output changes the shape of "best" — any shipping default must be chosen from the Pareto front with an explicit selection procedure (hypervolume, knee-point, operator-guided, or hybrid). Choice-of-point discipline becomes part of the methodology.
- External corpora import adds disk and CI weight; the held-out CI guard adds complexity the prior harness did not have.
- SMAC3 is Python, introducing a Python dependency into the bench via subprocess. `uv` handles the environment; `:subprocess` or `node:child_process` handles invocation.
- Time-to-shippable library defaults extends, because validating the defaults is a prerequisite that previously did not exist. This is intentional: the new scope bounds claims about the work to what the methodology can defend.
