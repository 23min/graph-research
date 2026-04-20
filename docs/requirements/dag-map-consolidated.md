---
title: dag-map — consolidated requirements (draft for review)
status: draft — under review, not ratified
supersedes: none
related: requirements/dag-map.md (EVOLVE-01 extraction), research-questions.md, methodology/hypothesis-pool.md
date: 2026-04-20
---

# dag-map — consolidated requirements

A single view of what dag-map is being asked to deliver, merging two upstream inputs:

1. **The EVOLVE-01 extraction** (`requirements/dag-map.md`) — what was actually optimised, with the extraction author's flags on items that may have been the wrong framing.
2. **The project's research questions** (`research-questions.md`) — what the project is currently curious enough about to consider testing.

The result is a deduped, classified list of candidate requirements. No entry here is ratified. The purpose of the document is to give the first priority sweep a single surface to work on rather than two.

## 1. Method

Two passes over the two upstream inputs.

**Pass A — coverage merge.** Every EVOLVE-01 requirement is kept, even if no research question probes it (correctness invariants are a common case). Every research question that implies a requirement is added, even if EVOLVE-01 did not encode it (streaming stability is a common case).

**Pass B — dedupe and reclassify.** Where EVOLVE-01 expressed a requirement via a metric that a research question has since challenged (e.g. discrete bend count vs curvature integral), the requirement is stated at the *intent* level and the choice of metric is flagged as an open question. Where EVOLVE-01 encoded a goal imperatively (port stability as code, never scored), it is elevated to a requirement with its measurement question noted.

Each entry carries five fields:

| Field | What it means |
|---|---|
| **Intent** | What the requirement is really about, one sentence, metric-agnostic |
| **Class** | `invariant` (rejection, not penalty) / `soft-metric` (scoreable) / `aesthetic` (pairwise only) / `capability` (what the library supports; not a layout goal) |
| **Source** | EVOLVE-01 extraction section, research question, or both |
| **Measurement status** | `measured` / `partial` / `unmeasured` / `open (see Q…)` |
| **Open question** | Research question this requirement is waiting on, if any |

## 2. Correctness invariants

Rejection-level, not optimisation. Violations disqualify a layout before any scoring.

| Intent | Class | Source | Measurement status | Open question |
|---|---|---|---|---|
| Forward-only edges in layer order | invariant | EVOLVE-01 §4.1 | measured | — |
| Forward-only edges in rendered X | invariant | EVOLVE-01 §4.1 | measured | — |
| Topological X consistent with layer order | invariant | EVOLVE-01 §4.1 | measured | — |
| Deterministic layout — identical input → byte-identical output | invariant | EVOLVE-01 §4.1 | measured | — |

Public API backward compatibility is treated as a **process constraint during refactors, not as a permanent requirement**. Alpha posture (ADR 0002) allows kill-your-darlings; once beta is declared, this can be re-elevated to an invariant.

## 3. Topology readability

The classical graph-drawing concerns: does the reader see crossings, how sharp are the corners, do routes progress forward.

| Intent | Class | Source | Measurement status | Open question |
|---|---|---|---|---|
| Minimise visible edge crossings (as rendered, not as abstract layer-model count) | soft-metric | EVOLVE-01 §4.2 (`polyline_crossings`), Q2 | measured | Q2 — is visible crossing count the whole story, or does route identity add a term? |
| Route polylines progress forward in X | soft-metric | EVOLVE-01 §4.2 (`monotone`) | measured | — (EVOLVE-01 §5 flag 2 — may duplicate invariant; retained because it catches in-layer curl-back) |
| Minimise visual "corner load" along routes | soft-metric | EVOLVE-01 §4.2 (`bend`, `direction_changes`), Q4 | measured, metric under review | Q4 — discrete bend count, squared turning angles, or curvature integral? Distinct metrics disagree on the same layout |

The *abstract layer-model crossing count* from EVOLVE-01 is demoted from a requirement to a *capability* the library may expose internally (§7) because visible crossings are what readers perceive. If a future research question shows the abstract count correlates with task time independently of visible crossings, the requirement returns.

## 4. Route-level legibility — the dag-map differentiator

The requirements that follow from the "routes are a primitive" thesis. This is the surface where EVOLVE-01's imperative enforcement and the research-questions layer have the most to say to each other.

| Intent | Class | Source | Measurement status | Open question |
|---|---|---|---|---|
| Each route remains a legible, continuous visual trace across the DAG | aesthetic | EVOLVE-01 §4.3 (trunk continuity; imperative only), Q1, Q2 | unmeasured | Q1, Q2 — needs a scoreable metric for route continuity; candidates include port-swap count, per-route bend variance, route-identity colour persistence |
| Ports at through-stations are stable — a route does not swap slots without structural reason | aesthetic | EVOLVE-01 §4.3 (`layout-process.js:693–799` port stability; never scored) | unmeasured | Q1 — port-swap count is cheap to compute and is a candidate metric for the above |
| Divergence and convergence points preserve individual route identity | aesthetic | EVOLVE-01 §4.3, Q8 | unmeasured | Q8 — which branching geometry (progressive curves, G² splines, fixed arcs) best preserves route identity for the reader |
| Same-route-signature stations align; different-signature groups separate | soft-metric | EVOLVE-01 §4.3 (divergence-aware positioning) | partial (encoded in `layout-process.js` positioning phase, not in the energy) | — |
| A main trunk — longest path or highest-trafficked route — is visually salient | aesthetic | Q9 | unmeasured | Q9 — whether trunk salience is a layout-level or rendering-level concern |

**Notes on flagged items from EVOLVE-01 §5 that land here:**

- *Flag 9 — port stability never scored.* Elevated above: this is now a candidate requirement with measurement-status `unmeasured` and a named open question. The flag itself is resolved.
- *Flag 10 — Mode 2.5 bezier geometry.* Split across Q4 (smoothness metric) and Q8 (branching geometry). Still unresolved; the flag remains open.

## 5. Spacing and collision

Nodes do not collide; labels are not crowded; parallel routes are distinguishable.

| Intent | Class | Source | Measurement status | Open question |
|---|---|---|---|---|
| Node-node clearance above threshold | soft-metric | EVOLVE-01 §4.4 (`repel_nn`) | measured | — |
| Label legibility — text is readable and not crowded by unrelated geometry | aesthetic | EVOLVE-01 §4.4 (proxied by `repel_ne`), Q11 | unmeasured at surface level | Q11 — visual variable encoding and label-as-first-class measurement |
| Parallel same-direction routes remain visually distinguishable | soft-metric | EVOLVE-01 §4.4 (`channel`), Q2 | measured (EVOLVE-01 §5 flag 7 on weight calibration) | — |
| Distinct edges do not collapse to identical (y_start, y_end) | soft-metric | EVOLVE-01 §4.4 (`overlap`) | measured | — (EVOLVE-01 §5 flag 3 — metric may not catch partial-length coincidence; retained) |

*Flag 6 — `repel_ne` as a label-crowding proxy* — resolved as: label legibility is a requirement at the aesthetic/measurement level (Q11), and `repel_ne` is a geometry proxy that may or may not correlate. The surface-level requirement and the geometric proxy are now separate entries, and the correlation between them is an open question.

## 6. Composition, canvas, scale

How the layout fills space and how it behaves as graphs grow.

| Intent | Class | Source | Measurement status | Open question |
|---|---|---|---|---|
| Compactness — layouts do not waste canvas (edges not much longer than topological ideal) | soft-metric | EVOLVE-01 §4.5 (`stretch`) | measured | — |
| Adaptive layer gaps respond to bending complexity and (when applicable) bezier-fit requirements | capability | EVOLVE-01 §4.5 (`layout-process.js:267–324`) | not a scoring term | — |
| Geographic fidelity when nodes carry geoX/geoY | capability | EVOLVE-01 §4.5 (geo-blend phase) | not a scoring term | EVOLVE-01 §5 flag 11 — whether geo-blending is wanted on non-geographic fixtures is untested |
| Readable interactive frame rate up to N nodes on commodity hardware | soft-metric | Q15 | unmeasured | Q15 — at what N does SVG stop being interactive; what substrate extends it |
| Layouts at reduced width or density preserve the structural reading | soft-metric | Q12 | unmeasured | Q12 — progressive disclosure shape |

*Flag 4 — envelope target aspect ratio as a library-level requirement* — resolved as: aspect ratio is **not** a library requirement. Demoted to a capability: dag-map may accept an aspect-ratio hint from the consumer, but does not optimise for one by default. The `envelope` energy term is retired.

## 7. Library capabilities (not layout goals)

Things dag-map should be able to do, but which are not layout-quality requirements. Listed so the sweep can decide which belong in the library at all.

- Accept routes as input and treat them as a layout primitive
- Produce both rendered polylines and structural metadata (stations, routes, layers, ports) as output
- Expose a pipeline of strategy slots so algorithmic choices are configurable (from EVOLVE-01 M-EVOLVE-01 refactor)
- Compute abstract layer-model crossing count (used by crossing-reduction strategies internally; not a user-facing metric)
- Compute polyline-crossing count (user-facing quality metric)
- Produce deterministic output given deterministic input
- Accept optional geoX/geoY and weight annotations on nodes and edges

Capabilities are *not prioritised alongside requirements*. They answer a different question: "what is in the library's API surface" vs "what does a good layout look like".

## 8. Consumer-shape requirements

What FlowTime and Liminara need, articulated separately from layout-quality requirements so product pressure does not silently distort the research direction.

| Intent | Source | Notes |
|---|---|---|
| Process-flow aesthetic (Mode 2 / Mode 2.5): card stations, orthogonal or bezier routing, weighted edges | FlowTime | Currently supplied by `layoutProcess` + `renderProcess` |
| Execution-DAG aesthetic (Mode 1): metro-station rendering, route-based curvilinear routing | Liminara | Currently supplied by `layoutMetro` + `renderSVG` |
| Highlight a failure path or a dominant happy path | Both, Q12-adjacent | Not in the current API; Q12 (progressive disclosure) is the closest research probe |
| Stable layout under incremental node addition | Neither product has asked yet; likely becomes relevant once streams are visualised | Q13, Q14 are the research probes |

Listed so the first priority sweep can decide whether any of these become ratified requirements for the next epic or remain product-driven features that do not constrain research.

## 9. Explicitly retired

Requirements that appeared in EVOLVE-01 and are dropped in the consolidated view. Listed so the retirement is explicit and the history is traceable.

| Retired | Reason |
|---|---|
| `envelope` — target aspect ratio as a library-level objective | Aspect ratio is a canvas concern, not a layout-quality concern (EVOLVE-01 §5 flag 4). Demoted to capability |
| Weighted-sum scalar fitness as the top-level evaluation mode | Framing-level retirement per ADR 0001. Metrics survive individually; the scalar does not |
| Bradley–Terry refit from single-principal pairwise votes | Not a legitimate user study; replaced by honest pairwise study design as a future research move (Q10) |
| Abstract layer-model crossing count as a user-facing requirement | Demoted to internal capability (§7); visible crossings (§3) are the user-facing version |
| "All 285 dag-map tests must pass" as a permanent requirement | Refactor-window constraint only; alpha posture allows kill-your-darlings |

## 10. Explicitly added

Requirements that did not appear in EVOLVE-01 but are justified by research questions or by flagged gaps.

| Added | Source |
|---|---|
| Route continuity as a scoreable metric (vs imperative code) | Q1, Q2; EVOLVE-01 §5 flag 9 |
| Port stability as a measurable requirement | EVOLVE-01 §5 flag 9 |
| Label legibility at the surface level (not just `repel_ne` geometry) | Q11; EVOLVE-01 §5 flag 6 |
| Readable frame rate at larger graph sizes | Q15 |
| Mental-map preservation under incremental growth | Q13 |
| Progressive-disclosure behaviour for dense graphs | Q12 |

## 11. Flagged for the priority sweep

The first priority sweep should make decisions on each of these before the next epic is framed.

1. **Which of Q4's three "smoothness" metrics does the project adopt as the definition of the `bend` requirement?** This single decision affects every soft-metric in §3.
2. **Does port stability earn a scoreable metric, and if so which?** Candidate: port-swap count. Affects every item in §4.
3. **Is label legibility a library requirement (§5) or a renderer requirement (§7)?** The distinction changes what dag-map optimises.
4. **Are streaming / mental-map preservation requirements (§10, Q13) in scope for the next epic, or deferred until a consumer product needs them?** Affects whether the pipeline learns an update primitive.
5. **Which of the consumer-shape needs in §8 become ratified requirements?** Product pressure needs explicit acceptance before it silently shapes the research direction.

## 12. What this document is not

- Not ratified. Every entry is a candidate pending the priority sweep.
- Not a plan. Epics are the unit of work; this document is input to epic framing.
- Not a living registry of every idea. Retirements are explicit; additions are justified; ungrounded wishes are not admitted.
- Not a successor to `requirements/dag-map.md`. The extraction remains as the evidence base. This document is the review surface built on top of it.
