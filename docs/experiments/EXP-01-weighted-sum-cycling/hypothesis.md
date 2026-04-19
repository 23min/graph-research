# EXP-01 — Hypothesis

## Claim

**Evolving strategy combinations (not only numeric parameters) with a genetic algorithm would produce measurably better metro-map / layered graph layouts than hand-tuned heuristics.**

The pipeline under evaluation was `layoutMetro` in `dag-map`, decomposed into six swappable strategy slots: `extractRoutes`, `orderNodes`, `reduceCrossings`, `assignLanes`, `refineCoordinates`, `positionX`. The central thesis of the v1 epic (`E-EVOLVE-layout-pipeline`) was that the GA should search over **combinations of strategies** — which crossing reducer, which lane assigner, which ordering heuristic — rather than only over numeric knobs like `mainSpacing` and `subSpacing`.

## Why it would matter

If the claim held, it would provide:
- A systematic way to discover better-than-manual default configurations for layered/metro-map layout.
- A reusable pattern (pipeline + genome over strategy slots) for automating other layered-drawing algorithms.
- A shipping default for `dag-map` grounded in measurement rather than intuition.

## Falsification criteria

The hypothesis would be considered falsified if:

- **F1.** Strategy-combination search did not produce layouts that scored better on the bench's weighted-sum fitness than a hand-tuned baseline on a held-out set of fixtures.
- **F2.** Observed GA fitness trajectories showed cycling or oscillation without monotone improvement over generations, indicating the search surface was structurally incompatible with the objective.
- **F3.** The project could not reach a state where the genome actually selected strategy combinations rather than only numeric parameters, within the planned milestone budget.

## Outcome (as of freeze on 2026-04-17)

F3 triggered first: the genome never advanced beyond two numeric spacing parameters, and M-EVOLVE-02 / M-EVOLVE-03 / M-EVOLVE-04 (the milestones that would have introduced strategy-combination genes and the evolution-run benchmark) were never started. F2 was independently visible in the fitness trajectories during the parameter-level GA runs that did occur. F1 was never cleanly measured because there was no held-out fixture set to measure it on.

See `results/summary.md` for what was actually produced and `discussion.md` for why the structural obstacles that triggered F2 and F3 were not fixable inside the v1 framing — and motivated the pivot to `E-EVOLVE-v2-methodology`.
