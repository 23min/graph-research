# Glossary

Terminology specific to layered / metro-map graph layout. Definitions added as they come up in the work rather than pre-emptively.

- **DAG** — Directed Acyclic Graph. Primary input class for this repo's evaluation.
- **Layered layout** — a drawing in which nodes are assigned to discrete horizontal (or vertical) layers and edges travel monotonically across layers; the Sugiyama family is the canonical example.
- **Metro-map layout** — a stylised layered layout in which edges are drawn as straight or octilinear line segments carrying named routes (lines), emulating transit-map conventions.
- **Aesthetic metric** — a computable quantity scoring a drawing along a single axis (crossings, bends, edge length, stress, overlap, monotonicity, area).
- **Pareto front** — the set of non-dominated configurations under a vector of aesthetic metrics.
- **Automated algorithm configuration** — search over an algorithm's hyperparameter space to find configurations that perform well on a target distribution of instances. NSGA-II, SMAC, and irace are instances.
