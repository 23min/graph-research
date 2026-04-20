---
title: dag-map — extracted requirements (draft for review)
status: draft — under review, not ratified
source: extracted from `docs/experiments/EXP-01-weighted-sum-cycling/` and the frozen `reference/m-evolve-01` tag
date: 2026-04-20
---

# dag-map — extracted requirements

This document extracts what dag-map was asked to optimise during EVOLVE-01, rearranged into requirement language. It is **descriptive of the past, not prescriptive for the future**. The v1 effort was closed as a negative result (see ADR 0001, ADR 0002); some of what it treated as a requirement may have been the wrong framing. Items I suspect of that are flagged in §5 — they are kept, not pruned, so the review can decide.

The document is deliberately not linked from `CLAUDE.md`'s *Current Work* and does not scope any epic. It is input to the next planning round, not the plan itself.

## 1. Scope and origin

Every line below derives from one of:

- **Weighted-sum energy terms** registered in `bench/config/default-weights.json` + `bench/energy/*.mjs` at tag `reference/m-evolve-01`.
- **Hard invariants** in `bench/invariants/checker.mjs`.
- **Pipeline-slot design** in the M-EVOLVE-01 strategy registry.
- **Manually-tuned heuristics** inside `layoutProcess` / `layoutMetro` that encoded a requirement without ever exposing it as a metric.
- **Epic / milestone narrative** in `docs/experiments/EXP-01-weighted-sum-cycling/design-notes/`.
- **Reverted experiments**, which are themselves signals about latent requirement conflicts.

The extraction is exhaustive, not curated. Pruning happens during review.

## 2. Optimisation techniques EVOLVE-01 actually tried

Listed so the review has one place to see the search space that was explored.

### 2.1 Pipeline decomposition — six strategy slots

| Slot | Role | Strategies registered |
|---|---|---|
| `extractRoutes` | derive routes across the DAG | default only |
| `orderNodes` | within-layer node ordering | none, barycenter, median, spectral, hybrid, shuffle |
| `reduceCrossings` | crossing-reduction pass | none, barycenter, greedy, route-aware |
| `assignLanes` | cross-axis port/lane assignment | default, ordered, direct, swimlane |
| `refineCoordinates` | post-positioning refinement | none, barycenter |
| `positionX` | final horizontal positioning | default only |

Extended continuous / integer knobs alongside the categorical genes: `crossingPasses` (1–50), `spectralBlend` (0–1), `shuffleSeed` (integer-random).

### 2.2 Continuous genome actually driven by the GA

Only two parameters. The strategy genes were defined but never selected by the GA in production runs.

- `render.mainSpacing`
- `render.subSpacing`

### 2.3 GA machinery

- Island model with migration.
- Gaussian mutation for continuous genes, categorical mutation for strategy genes.
- Weighted-sum scalar fitness (11 terms, weights in `default-weights.json`).
- Pairwise-vote UI ("Tinder") feeding a Bradley–Terry refit of the weights.
- Snapshot / gallery / run-control infrastructure.

### 2.4 Targeted, narrower GAs

- `bench/direct/process-ga.mjs` — route-ordering GA for Mode 2, trained separately for LTR and TTB.
- `bench/direct/permutation-ga.mjs` — generic permutation GA.

### 2.5 Manually-tuned heuristics inside Mode 2 / Mode 2.5 (`layoutProcess`)

Each of these was an iterative hill-climb and therefore part of the optimisation history even though no GA drove it:

- Layer assignment with source/sink rank shift.
- 24-iteration barycenter crossing reduction (alternating forward/backward sweep).
- 8-iteration route-aware ordering refinement blending topology barycenter with a route-shared centroid.
- Divergence-aware positioning — group stations by route signature; different signatures separated by a group gap.
- Adaptive layer gaps driven by per-gap bending complexity and the 45° bezier-fit requirement.
- Junction stagger plus three passes of primary-axis neighbour attraction.
- Geographic positioning blend when nodes carry `geoX`/`geoY`.
- 45° re-fit pass (bezier only).
- Port assignment with two-mode logic: trunk-continuation detection, terminus pinning, exit-direction sort for the rest.
- Obstacle-aware H-V-H routing with stigmergy (channel-claiming).
- `tryDetourRoute` fallback when straight routing crosses station obstacles.
- Multi-pass re-routing refinement after initial placement.
- Bezier path post-processing with cubic fallback when the 45° fit cannot be satisfied.
- V-step placement rules (source-side vs destination-side, pill-aware).

### 2.6 Reverted experiments (informative as requirement-conflict signals)

- Route-fixed Y offsets (destroyed junction stagger — requirement conflict).
- Hybrid divergence-plus-barycenter positioning — reverted, "noise, not signal".
- Swimlane lane model — reverted.
- Straightening experiment — reverted.
- A broken crossing detector silently optimised for months; fixed at commit `ac2b630`. Meta-lesson: without a reproducibility protocol, an incorrect objective is indistinguishable from genuine gradient.

## 3. What was being optimised — the eleven energy terms

All from `bench/config/default-weights.json` at freeze. Weights reflect a hand-tuning posture, not anchored to any external evidence (see §5).

| Term | Weight | Measures | Intent as encoded |
|---|---:|---|---|
| `stretch` | 0.05 | Edge length vs topological ideal | Compactness; edges shouldn't span many more layers than topology demands |
| `bend` | 40 | Sum of squared turning angles on route polylines | Smooth routes; fewer sharp corners |
| `crossings` | 20 | Abstract layer-model edge crossings | Classical readability criterion |
| `monotone` | 20 | X-retreat along rendered polylines | Routes should not curl back; matches left-to-right execution direction |
| `envelope` | 1.3 | Log aspect-ratio deviation from target | Fits the canvas |
| `channel` | 0.006 | Parallel same-direction route proximity | Avoid "maze wall" — parallel routes must be visually distinct |
| `repel_nn` | 100 | Node-node proximity (bounded quadratic) | No colliding nodes |
| `repel_ne` | 40 | Node-edge proximity (bounded quadratic) | Label-crowding proxy |
| `overlap` | 50 | Edges with identical (y_start, y_end) | Distinct edges must be visually distinct |
| `direction_changes` | 30 | Y-reversals along a route | Minimise wavy routes |
| `polyline_crossings` | 40 | Real projected-segment intersections | Visible crossings, as opposed to the abstract `crossings` count |

## 4. Candidate requirements, grouped

Requirements below are grouped by intent, not ranked. The grouping is a preparation for the priority sweep; it is not itself the sweep.

### 4.1 Correctness (hard invariants)

| Req | Source | Note |
|---|---|---|
| Forward-only edges in layer order (`layer_v > layer_u`) | `invariants/checker.mjs` rule 1 | Rejection, not penalty |
| Forward-only edges in rendered X (`x_v > x_u`) | rule 1 | Rejection |
| Topological X — any two nodes in different layers must have X consistent with layer order | rule 2 | Rejection |
| Deterministic layout — identical input produces byte-identical output | rule 7 | Rejection; anchors reproducibility protocol |
| Public API backward compatibility — 285 dag-map tests pass through any refactor | M-EVOLVE-01 acceptance | Not a layout metric but a shipping constraint |

### 4.2 Topology readability

| Req | Source |
|---|---|
| Minimise abstract (layer-model) crossings | `crossings` |
| Minimise real (as-rendered) crossings | `polyline_crossings` — distinct because the two diverged |
| Minimise bend energy (squared turning angles) | `bend` |
| Minimise Y-reversals along routes | `direction_changes` |
| Monotone X along rendered polylines (no curl-back) | `monotone` |

### 4.3 Route-level aesthetics — the dag-map differentiator

| Req | Source | Scoreable? |
|---|---|---|
| Trunk continuity — shared backbone reads as one gesture | port-stability code in `layout-process.js:693–799`; never entered the energy | No — expressed imperatively |
| Port stability — preserve port slots at trunk-continuation stations | trunk-detection branch in port assignment | No |
| Terminus pinning — a route ending at a station is pinned to the closest previous slot | terminus branch | No |
| Clean divergence/convergence — same-route-signature stations align, different-signature groups separate | divergence-aware positioning phase | Only indirectly, via `channel` and `direction_changes` |
| Smooth corners under bezier rendering — 45° fit, tight corner radius | Mode 2.5 45° re-fit pass and corner construction | No — the goal is enforced by geometry, never scored |
| Route colour / class preserved visually across the trunk | renderer, not layout | Not in objective |

### 4.4 Spacing and collision avoidance

| Req | Source |
|---|---|
| Node-node clearance above threshold | `repel_nn` |
| Node-edge clearance above threshold (label-crowding proxy) | `repel_ne` |
| Parallel same-direction route separation above threshold | `channel` |
| Same-layer station gap | `stationGap` option + adaptive tuning |
| Adaptive cross-layer gap based on bending complexity and edge weights | `layerGap` + adaptive scaling in `layout-process.js:267–324` |
| No two edges collapsing to identical (y_start, y_end) | `overlap` |

### 4.5 Canvas and composition

| Req | Source |
|---|---|
| Target aspect ratio (envelope) | `envelope` |
| Compactness (edges not much longer than topological ideal) | `stretch` |
| Adaptive layer gaps respect bezier-fit and edge-weight scaling | `layout-process.js` |
| Geographic fidelity when nodes carry `geoX`/`geoY` | geographic-blend phase; applied to Stockholm fixture |

### 4.6 Reproducibility

| Req | Source |
|---|---|
| Seeded RNG for any stochastic strategy | `bench/ga/prng.mjs`, `shuffleSeed` gene |
| Deterministic layout given identical input | invariant rule 7 |

### 4.7 Consumer shape (implicit, never written down)

These were visible only through fixture selection and mode choice. They are included so the review can decide whether to elevate them or reject them.

- **FlowTime** — process-flow aesthetic: Mode 2 card stations, orthogonal H-V-H routing, bezier variant (Mode 2.5), weighted edges.
- **Liminara** — execution-DAG visuals: Mode 1 metro stations, route-based curvilinear.
- **Alpha-stage iteration posture** — API is not frozen; kill-your-darlings is allowed (per ADR 0002 §Consequences).

## 5. Flagged — may have been wrong-direction requirements

Items I'm suspicious of. Kept here, not pruned, so the review can decide. Each flag names the suspicion and the reason.

1. **The weighted-sum framing itself.** Collapsing conflicting aesthetic metrics into one scalar with hand-tuned weights produced fitness cycling — improvements on one axis paid for by losses on another. ADR 0001 diagnoses this. *Anything below that was only there to make the scalar sum tractable — e.g. the specific weight values — is suspect as a requirement.*

2. **`monotone` penalty as a soft metric.** Rule 1 (forward-only X) already rejects non-monotone layouts as an invariant. A soft penalty for the same thing is either redundant with the invariant or is patching a different failure mode (routes curling inside a layer). If the latter, it should be named as that failure mode, not as "monotone".

3. **`overlap` measured by `(y_start, y_end)` equality.** This treats two edges as overlapping only when both endpoints coincide in Y. Edges that are visually indistinguishable over most of their length but diverge at one end are not caught. The metric may have been targeting the wrong visual failure.

4. **`envelope` target aspect ratio.** The "right" aspect ratio depends on the consumer canvas (FlowTime dashboard vs Liminara node cards vs A2 print). Treating it as a library-level requirement with a fixed target may have been wrong; it may be a rendering-time concern the library should not optimise for at all.

5. **Bradley–Terry weight refit from Tinder pairwise votes.** The mechanism was built to anchor the weights to preferences, but the preferences it collected were from the principal only, on a 34-fixture pool. The refit may have propagated a single person's intuition into what was presented as an empirical weight.

6. **`repel_ne` as a label-crowding proxy.** Labels are a renderer concern (size, font, style, placement). The node-edge distance metric does not measure label crowding — it measures node-edge geometry. This may have been a requirement-of-convenience.

7. **`channel` at weight 0.006.** Two orders of magnitude smaller than other spacing terms. Either the requirement is real and the weight was wrong, or the requirement is a special case of `repel_ne` that was double-counted.

8. **Crossing-reduction strategies as part of dag-map's requirements.** Barycenter / median / greedy-switching are known Sugiyama techniques. Asking dag-map to "support crossing reduction" was phrased as a dag-map requirement but may be better expressed as a dag-map *capability* that the consumer may or may not invoke.

9. **Port stability + trunk continuity as code invariants rather than metrics.** Two routes that read as one continuous trunk is arguably *the* distinguishing dag-map aesthetic. It was never scored, never surfaced to the GA, and its enforcement depended on a late-freeze commit (`aba071a`). Either it is load-bearing — in which case it is a requirement and needs a metric — or it is not, in which case the trunk-detection code is speculative.

10. **Mode 2.5 bezier geometry constraints as layout requirements.** The 45° re-fit pass, corner-radius choice, and cubic-fallback behaviour were tuned for visual quality but never entered any objective. They may belong at the renderer layer, not the layout layer.

11. **Geographic fidelity (`geoX`/`geoY` blend) on non-geographic fixtures.** The feature exists because of Stockholm. Whether a generic consumer wants geo-blending or considers it noise is unexamined.

12. **"Backward compatibility with 285 dag-map tests" as a freeze constraint.** Valid during EVOLVE-01 because the point was to refactor without regression. Going forward, if the alpha posture (ADR 0002) allows kill-your-darlings, this should not be elevated to a permanent requirement.

## 6. Known gaps — things that were not requirements but arguably should have been

Flagged so the review can decide whether to add them.

- **Label legibility, measured directly** — label-collision count, label-to-route clearance, glanceable contrast. Currently only proxied by `repel_ne`.
- **Trunk continuity as a scoreable metric** — how many consecutive trunk stations preserve port order.
- **Port-swap count** — how many times a route changes its port slot between adjacent stations. Cheap to count.
- **Tight-corner and cubic-fallback counts under bezier rendering** — direct quality signals for Mode 2.5.
- **Route-signature group separation** — whether divergent groups are actually separated or merely ordered.
- **Consumer-level acceptance** — what FlowTime and Liminara render on their fixtures, as a black-box signal independent of internal metrics.

## 7. Suggested axes for the first priority sweep

Rather than a single ranked list, three axes let the review triage without collapsing trade-offs prematurely:

- **Hardness** — invariant (rejection) / soft-metric (scoreable) / aesthetic-judgement (only pairwise)
- **Measurability** — objectively countable / preference-measurable / requires user study
- **Source** — FlowTime-driven / Liminara-driven / dag-map-internal / general graph-drawing literature

Cheap-and-critical requirements (invariant × countable × consumer-driven) should be tackled first; expensive-and-optional ones (aesthetic × user-study × general literature) deferred until beta. That ordering is a suggestion; the review decides the sweep.

## 8. Status and next step

This document is draft input to the next planning round. It does not scope any epic. Once reviewed, pruned, and re-organised, it becomes the basis for framing the first post-pivot epic — which, per ADR 0002, will be chosen outcome-dependent from consumer-product need, library gap, experiment follow-up, or intuition.
