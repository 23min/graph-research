---
title: Mode 2.5 — Process Bezier Layout (Reference)
status: reference
frozen: 2026-04-17
branch: milestone/M-EVOLVE-01
tag: reference/m-evolve-01
supersedes: (none)
superseded_by: (none yet — pivot to E-EVOLVE-v2 methodology, see D-023)
---

# Mode 2.5 — Process Bezier Layout

## Summary

Mode 2.5 is a rendering variant of `layoutProcess` (Mode 2) in dag-map
that replaces the default orthogonal H-V-H routing with smooth bezier
curves and swaps the card-labelled stations for metro-style punched-out
dots and tick-marked pills. It reuses the Mode 2 Sugiyama positioning
and port assignment verbatim — every difference from Mode 2 lives in the
post-positioning path construction and the station glyphs. The mode
exists to occupy a visual niche that is not addressed in open-source
tooling today: a Celonis-shaped process flow (layered, thick coloured
routes, card-like labels possible) with the softer aesthetic of a metro
map. Freezing happened on 2026-04-17 as part of milestone M-EVOLVE-01
archival, before the pivot to the multi-objective layout methodology
tracked in D-023.

## Motivation

The process-mining visual landscape splits into two clusters (see
`reference_process_flow_tools` memory for the full landscape). Celonis
and Disco render **angular flows** — orthogonal routing, dense labelling,
metric badges — and this remains the commercial gold standard. Generic
layout libraries (ELK, dagre, d3-dag) produce **box-and-arrow** diagrams
that are functional but visually flat. Metro-map renderers (transit
diagrams, Metrolinx-style maps) are the third cluster — clean, legible,
but domain-specific.

Mode 1 (`layoutMetro` + `renderSVG`) sits squarely in cluster three.
Mode 2 (`layoutProcess` + `renderProcess`) sits in cluster one with
the process-flow aesthetic. Mode 2.5 is a deliberate hybrid: it uses
the same layer-and-port layout as Mode 2, but renders routes and
stations in the metro-map visual language. The intent is not to be
"better" than Mode 2 on crossing count or label legibility; it is to
ask whether a softer rendering of process-flow geometry reads more
naturally for certain graph shapes, in the same way transit maps
outperform box-and-arrow for route-heavy graphs.

Two practical pressures drove the experiment:

1. **Route continuity is visually central** for process flow, and
   orthogonal H-V-H routing introduces little corner artefacts at
   every through-station. Smoothing the corners foregrounds the
   shared trunk and makes divergence/convergence legible.
2. **Stockholm-class fixtures** (99 ops, many through-stations, real
   geo coordinates) produce orthogonal routes whose corners compete
   visually with the geographic shape; beziers de-emphasise the grid
   and let the trunk dominate.

## Algorithm — what is shared with Mode 2, what differs

### Shared with Mode 2

The layout pipeline in `dag-map/src/layout-process.js` is executed
identically. Mode 2.5 is triggered by passing `{ routing: 'bezier',
stationStyle: 'metro' }` alongside the normal Mode 2 options.

The full shared pipeline (layout-process.js:28–1240):

- **Phase 1 — Layer assignment**. Topological sort with rank
  adjustment: source nodes that feed into late layers are pushed
  forward ("a component arriving at step 5 appears at step 4, not step
  0"); symmetric rule for sinks (layout-process.js:52–84).
- **Phase 2 — Barycenter crossing reduction**. 24-iteration forward/
  backward sweep (layout-process.js:86–118).
- **Phase 2b — Route-aware ordering refinement**. 8-iteration sweep
  that blends topology-based barycenter positions with a route-shared
  centroid so same-route nodes line up across layers
  (layout-process.js:120–176).
- **Phase 3 — Divergence-aware positioning**. Stations with identical
  route signatures stay at the same Y in a layer; stations with
  different route signatures spread apart into groups with an extra
  group gap. Prevents the "staircase" where linear chains bend over
  many layers (layout-process.js:178–266). A barycenter refinement
  that used to run at the end of this phase was removed (see "Cycling
  patterns"); the divergence grouping is used alone.
- **Adaptive layer gaps**. Gaps widen based on per-gap bending
  complexity and are also sized up for the 45° bezier fit requirement
  (layout-process.js:267–324). Mode 2.5 explicitly participates here:
  when `options.routing === 'bezier'`, the required dx is
  `maxDy + 2*minEntry + 2*bezierR` rather than the H-V-H requirement of
  `2*minEntry + 2*cornerRadius` (layout-process.js:318–323).
- **Junction stagger and neighbour attraction**. Fan-out nodes get a
  small primary-axis push forward, fan-in get pushed back, and three
  iterations of primary-axis attraction break strict grid alignment
  (layout-process.js:326–443).
- **Geographic positioning** (when nodes carry `geoX`/`geoY`). Both
  axes blend grid position with geo position; downstream passes enforce
  layer ordering and minimum station distance
  (layout-process.js:445–516).
- **45° re-fit pass** (bezier only). After all positioning,
  `layout-process.js:518–555` walks layers left-to-right and, for any
  route edge whose dx violates `dx >= dy + 2*cornerRadius +
  4*lineThickness`, pushes every downstream station forward until the
  constraint holds. This is the single positioning step that is
  *gated* on `options.routing === 'bezier'`.
- **Port assignment** (layout-process.js:693–799). See next section —
  this is the quiet centerpiece of Mode 2.5's polish.
- **Obstacle-aware H-V-H routing with stigmergy** (layout-process.js:
  805–1239). Each route claims a wide channel after placing; later
  routes avoid claimed channels. A detour mode (`tryDetourRoute`) is
  available if straight H-V-H crosses station obstacles.
- **Multi-pass refinement**. After all routes placed, re-route each
  route against the final grid state so late routes get a fair chance
  at cleaner channels (layout-process.js:1245–1325).
- **Card placement** (layout-process.js:600–667 plus a re-placement
  pass at 1330–1389). Cards are placed beside stations, checked
  against an occupancy grid, then re-checked against the route grid.
  Mode 2.5 keeps this logic — the cards are just not rendered in the
  `stationStyle: 'metro'` path (see `render-process.js:100`).

### What differs

Two code paths change in Mode 2.5, and nothing else:

**1. Bezier path construction** (layout-process.js:1444–1520). After
the H-V-H routing has run, route segments are post-processed: the
existing path is parsed, its chosen jog position is extracted from the
first `Q` control point, and the path is rewritten as a shape of the
form

```
H ──╮
    ╰──diagonal──╮
                  ╰── H
```

with fixed corner-radius `r = cornerRadius * 2`, a straight 45°
diagonal between the two corners, and short horizontal extensions
at the endpoints. Two fallbacks exist:

- If the segment is effectively horizontal (`dy < 1`), it is drawn
  as a plain `L` — no curve.
- If dx is too tight for the 45° fit with corners
  (`dx < dy + 2*minExt` or `dy < 2*r`), the path drops to a cubic
  bezier fallback that gives up on the 45° guarantee but stays smooth
  (layout-process.js:1466–1473).

The curve family is **quadratic for the corners, linear for the
segments in between**, with a **cubic fallback** only when the 45°
geometry can't fit. The main path is therefore three `L` segments
separated by two `Q` corner arcs — not a single cubic bezier spanning
the segment. This matters because the chosen jogX is honoured when
it fits, preserving the stigmergy-based obstacle avoidance.

Importantly, `src/route-bezier.js` (the stand-alone cubic-bezier
S-curve module used by Mode 1's optional bezier rendering) is *not*
the same code path. Mode 2.5 constructs its curves inline in
`layout-process.js`. `route-bezier.js` is still exported from
`index.js` but Mode 2.5 doesn't call it — a minor surprise worth
flagging for anyone reading this doc.

**2. Station rendering** (render-process.js:100–174). The
`stationStyle: 'metro'` branch replaces the default glyphs:

- Single-route stations: outlined circle with the route's colour as
  stroke (`dotR * 0.85` radius, `1.6 * s` stroke, paper fill). No
  central punched-out dot.
- Multi-route stations: a pill whose stroke uses the *first sorted
  route's colour* with `2.4 * s` stroke width and `pillR = dotR * 0.9`.
  Inside the pill, each route is drawn as a short tick mark at its
  port offset, at 40% opacity, rather than as a coloured punched-out
  dot.

The pill dimensions are derived from actual port offsets
(`layout.portOffset.get("${nd.id}:${ri}")`), not from a synthetic
`(i - (n-1)/2) * trackSpread` grid. This matters because port assignment
can and does break the even-spacing assumption at terminus stations (see
port assignment below) — using `portOffset` directly keeps the pill
sized to the actual dot positions.

Card placement continues to run; cards are simply not rendered in the
`metro` style (the code path at `render-process.js:177–198` is still
executed but produces no output in `stationStyle: 'metro'` only if the
renderer skips it — in practice the current code *does* render cards
even when `stationStyle === 'metro'`, which is what produces the
hybrid metro+card look in practice). The Stockholm solo output
verifies this: the PDF shows metro-style dots and pills with
card-style labels beside them.

### Port assignment — the Mode 2.5 polish

`layout-process.js:693–799` is the heart of why Mode 2.5 reads as a
coherent design rather than a rough hybrid. The commit summary in
`aba071a` describes a **two-mode port assignment**:

- **Trunk detection**: when every route at a station shares the same
  single predecessor station, and that predecessor has exactly the
  same route set, the station is a trunk-continuation. In this case,
  previous-station port ordering is preserved *exactly*. No resort, no
  tiebreaker, no exit-direction sort — the routes keep their port
  slots by continuity (layout-process.js:718–754).
- **Terminus pinning**: when a route ends at this station and a
  previous port is known, it is pinned to the slot closest to its
  previous port before any exit-direction sort runs
  (layout-process.js:755–796). This keeps a trunk line flat through
  a station where one sibling drops out.
- **Divergence / convergence / start stations**: non-terminal routes
  are sorted by their next-station cross-axis position (standard exit-
  direction sort), with terminals having already claimed their slots.

This stability matters far more under bezier rendering than under
H-V-H. An H-V-H segment that swaps port slots between two adjacent
stations produces a small visible zigzag in the orthogonal version —
tolerable, if ugly. Under bezier, the same swap becomes an S-shaped
curve spanning half a layer, which reads visually as a crossing even
when no actual crossing exists. Port stability was therefore promoted
from a polish item to a gating quality concern for Mode 2.5.

## Options reference

All options accepted by `layoutProcess(dag, options)` and relevant to
Mode 2.5:

| Option | Type | Default | Effect |
|---|---|---|---|
| `routing` | `'bezier'` (implicit otherwise) | undefined (H-V-H) | Triggers bezier post-processing and the 45° re-fit pass. Only `'bezier'` is handled as a non-default value. |
| `stationStyle` | `'metro'` \| `'default'` | `'default'` | `'metro'` triggers outlined circles / tick-pill rendering in `render-process.js`. Consumed by the renderer, not the layout. |
| `scale` | number | `1.5` | Global scale multiplier on every length (layerGap, stationGap, trackSpread, dotR, fontSize, etc.). |
| `labelSize` | number | `4.5` | Card font size (pre-scale). Multiplied by `scale`. Stockholm solo uses 18; matrix default is 1.2 injected by the print variant (see below). |
| `direction` | `'ltr'` \| `'ttb'` | `'ltr'` | Primary axis. LTR uses H-V-H (H becomes L with bezier); TTB uses V-H-V. Both are supported in Mode 2.5 but only LTR has received visual tuning. |
| `trackSpread` | number | `12` (5 if `bundling`) | Cross-axis distance between adjacent port slots at a junction. Multiplied by `scale`. |
| `layerGap` | number | `90` | Base primary-axis gap between layers. Subject to adaptive scaling (bending complexity, bezier fit, edge weights). |
| `stationGap` | number | `70` | Base cross-axis gap between stations in the same layer. |
| `cornerRadius` | number | `6` | H-V-H corner radius. Bezier corners use `2 * cornerRadius` for visibly larger arcs (layout-process.js:1458). |
| `routes` | array of `{id, cls, nodes}` | `[]` | Route definitions. Required for anything interesting to render. |
| `edgeWeights` | Map `"from→to" → number` or inline `.weight` | none | Per-edge weights. If present, layer gaps are rescaled to 0.6×–1.5× base gap by max weight crossing that gap (layout-process.js:357–390). |
| `bundling` | boolean | `false` | When true, `trackSpread` defaults to 5 (tight) and ribbon-cable rendering activates in `render-process.js`. Orthogonal to Mode 2.5 — the two combine. |
| `frequency` | boolean | `false` | Enables data-driven thickness/opacity and dashing for low-weight routes in the renderer. |
| `theme` | string \| object | library default | Standard dag-map theme resolution. Paper, ink, muted, and per-class colours. |
| `title` | string | `"DAG (<N> OPS)"` | Rendered at top-left of the SVG. |

No Mode 2.5-specific options exist beyond the two triggers. Everything
else is shared with Mode 2.

## Code locations

| What | File | Lines |
|---|---|---|
| Mode 2.5 variant config (reference usage) | `bench/print/variants.mjs` | 49–54 |
| Mode 2.5 solo selection (Stockholm) | `work/reports/stockholm-bezier-selection.mjs` | 1–19 |
| Layer assignment + source/sink shift | `dag-map/src/layout-process.js` | 52–84 |
| Barycenter crossing reduction | `dag-map/src/layout-process.js` | 86–118 |
| Route-aware ordering refinement | `dag-map/src/layout-process.js` | 120–176 |
| Divergence-aware positioning | `dag-map/src/layout-process.js` | 178–266 |
| Adaptive layer gaps (bezier-aware) | `dag-map/src/layout-process.js` | 267–324 |
| 45° re-fit pass (bezier only) | `dag-map/src/layout-process.js` | 518–555 |
| Port assignment (trunk + terminus stability) | `dag-map/src/layout-process.js` | 693–799 |
| Obstacle-aware H-V-H routing | `dag-map/src/layout-process.js` | 805–1239 |
| Multi-pass re-routing refinement | `dag-map/src/layout-process.js` | 1245–1325 |
| Bezier path post-processing | `dag-map/src/layout-process.js` | 1444–1520 |
| Station dot rendering (metro style) | `dag-map/src/render-process.js` | 100–174 |
| Card placement | `dag-map/src/layout-process.js` | 600–667, 1330–1389 |
| Card rendering | `dag-map/src/render-process.js` | 177–198 |
| Standalone cubic-bezier S-curve (unused by Mode 2.5) | `dag-map/src/route-bezier.js` | 23–60 |

## Visual examples

### Archived reference

- **Stockholm solo** — `work/reports/stockholm-bezier-m-evolve-01.pdf`.
  Stockholm metro fixture (99 ops, geo-laid out) in Mode 2.5. A2
  landscape, `labelSize: 18` and `scale: 2.2` applied via
  `work/reports/stockholm-bezier-selection.mjs` because A2 print at
  native SVG scale makes default 4.5pt labels read at ~3pt.
- **Matrix showcase** —
  `work/reports/showcase-m-evolve-01.pdf` and its HTML twin. A2
  5-column × 5-row matrix:
  - Columns: Metro (Mode 1), Process Default, Process GA,
    **Process Bezier**, Flow Legacy.
  - Rows: Stockholm, Order-to-Cash, Incident Process, Dense
    Interchange, Parallel Processes.

### What Mode 2.5 looks like per fixture

Skimming the HTML confirms the following for the Process Bezier column
(column 4):

- **Stockholm** — the bezier curves let the geo-derived positions
  breathe. The route trunk sweeps through the central stations as a
  smooth colored band; divergences at the outskirts read as gentle
  branches rather than orthogonal elbows. Port stability keeps trunk
  routes flat through dozens of through-stations — the 2.5 output
  visibly lacks the through-station zigzags of pre-`aba071a` runs.
- **Order-to-Cash (o2c_full)** — classic process-mining graph with a
  single dominant trunk and several compliance branches. Bezier
  rendering plus metro stations makes the trunk read as the "happy
  path"; terminus pins keep it flat where branches terminate.
- **Incident Process** — the smallest graph in the set. Less benefit
  here; the bezier curves add little over H-V-H when the graph has
  only a handful of divergences.
- **Dense Interchange (mlcm)** — high junction density exposes port
  assignment. Pre-`aba071a`, this fixture had visible port swaps;
  post-stability, the curves resolve cleanly but the density itself
  still makes the diagram busier than its Mode 2 equivalent.
- **Parallel Processes** — several long parallel routes with few
  merges. Mode 2.5 reads very well on this shape because each route
  is a long smooth arc through its own Y-band.

The 12up matrix layout (A2 landscape) imposes a visual ceiling on
detail; the solo PDF is where Mode 2.5 is evaluated for real.

## Strengths and limitations

### Strengths

- **Aesthetic coherence on geo-laid fixtures**. Stockholm is the
  clearest example: bezier routing defers to the geographic shape
  instead of imposing an orthogonal grid over it.
- **Trunk legibility**. Port stability (trunk + terminus) combined
  with bezier rendering produces visibly unified trunk lines. This
  is the single biggest qualitative difference from Mode 2.
- **Junction smoothing**. Bezier corners at divergence/convergence
  points read as a single gesture rather than two elbows.
- **Deterministic**. No randomness, no GA dependency. Given fixed
  inputs, Mode 2.5 produces identical output.
- **Compatibility**. Mode 2.5 reuses the full Mode 2 pipeline. Any
  Mode 2 improvement (positioning, port assignment, bundling,
  frequency) benefits Mode 2.5 without further work.

### Limitations

- **Port stability depends on a post-M-EVOLVE-01 commit**. The trunk/
  terminus port-stability fix landed in dag-map commit `aba071a` on
  the freeze day itself. Earlier 2.5 exploratory output (cedfb55 and
  before) shows visible port-swap zigzags that the frozen rendering
  does not.
- **GA + bezier is uncharacterised**. Process GA (Mode 2 with
  GA-optimised route ordering) was not evaluated in combination with
  bezier routing — the `process-bezier` variant in
  `bench/print/variants.mjs` is marked `noGA: true`. Whether GA
  ordering helps or hurts under bezier is an open question.
- **45° re-fit widens layouts**. Fixtures with tall cross-axis
  spread (high-divergence layers) require wider layer gaps under
  bezier than under H-V-H. On A2 landscape the effect is invisible;
  on smaller viewports it matters.
- **Cubic fallback is a visual break**. When the 45° fit cannot be
  satisfied, the fallback cubic curve breaks the 45°-max-slope
  guarantee. This happens on steep fan-in/fan-out transitions where
  many routes converge onto a short primary-axis gap. Visually, the
  fallback reads as a "soft teleport" — acceptable but not crisp.
- **Card rendering is unchanged**. Cards sit beside station dots as in
  Mode 2. For dense metro-style fixtures (Stockholm at scale 1.5)
  cards can dominate; the solo Stockholm PDF uses `labelSize: 18`
  only to push cards back into legibility rather than to reshape the
  visual hierarchy.
- **Poor layouts**. Mode 2.5 is weakest when the graph has many short
  edges between layers with large dy — the 45° re-fit widens the
  layout but the bezier curves within each gap still feel crowded
  because the corner radius `r = 2 * cornerRadius` can exceed the
  available space, triggering the cubic fallback per segment. Chain
  graphs with many branches in a single layer (extreme divergence)
  are a particular failure case.
- **TTB untuned**. TTB (`direction: 'ttb'`) is supported by the code
  but has not been visually tuned for bezier. The matrix showcase
  does not include a TTB bezier column.

## Cycling patterns observed

The M-EVOLVE-01 branch log shows several back-and-forth cycles around
route Y behaviour and junction stagger. Documenting them neutrally —
these are the patterns that the pivot to multi-objective fitness
(D-023) is intended to replace with directed search rather than manual
tuning.

**Per-station offsets vs route-fixed offsets** (dag-map commits
`3f2e4c1` → `bc90565`, main repo commits `89c668b` → `5a7cfc7`):

- `3f2e4c1` introduced route-fixed offsets — each route computed its
  cross-axis offset once at its first station and maintained it
  throughout. Stated motivation: "no Y-jumps when other routes join/
  leave at intermediate stations." This eliminated micro-steps at
  through-stations but destroyed junction stagger (because stagger
  relies on different routes occupying different ports at the *same*
  station, which the fixed-offset scheme cannot express).
- `bc90565` reverted to per-station compact offsets. The revert
  commit explicitly acknowledges that small Y-steps at through-
  stations are acceptable when hidden by pill/dot rendering, and that
  the Y-step problem "needs a different solution — not offset
  fixation."
- The *different solution* ultimately landed in `aba071a` as trunk
  + terminus port stability — preserve ports *by continuity* when
  possible, preserve *the closest slot* otherwise, fall back to
  exit-direction sort. This respects both concerns without choosing
  between them.

**V-step refinement sequence** (dag-map commits `dc57c7a` → `59c727c`
→ `89c668b` / `2aa4b1f`):

- `59c727c` introduced "smart V-step": draw a straight line between
  two stations iff their route memberships are equal; otherwise
  V-step to transition between per-station offsets.
- `dc57c7a` tightened the rule to "through-routes maintain source Y
  regardless of other routes joining or leaving; V-step only at
  terminus."
- Subsequent fixes (`2aa4b1f`, the main-repo mirror commits
  `89c668b`, `25108c8`, `b82a509`) iterated on where to put the V-step
  (source or destination, depending on which side has a pill to hide
  it) and how to handle the straight-line conflict case when the
  straight path would pass through a station obstacle belonging to a
  different route (layout-process.js:1109–1174).
- The final shape: near-straight shortcut when port and cross diffs
  are below `dotR * 2.5`, straight-conflict check against station
  obstacles only, then V-step at the pill side if a pill exists,
  otherwise straight at the departing Y.

**Barycenter refinement reverted** (dag-map commit `e6ee114`):

- `06b9473` had added a "hybrid divergence + barycenter positioning"
  step that re-ran barycenter after divergence grouping.
- `e6ee114` reverted it: the barycenter pass "adds noise, not
  signal" because it introduced sub-pixel Y variations on linear
  chains that read as visual noise rather than meaningful
  divergence. Crossing count improved 4→3 with GA after removal.

Pattern summary: each cycle was driven by a competing visual goal
(continuity vs stagger, straightness vs precision, compactness vs
clarity). Resolutions came either from *splitting the rule by
context* (trunk vs terminus; pill vs dot; member-identical vs member-
different), or from *abandoning* a refinement whose aggregate effect
was visual noise. The pivot in D-023 reframes this as a multi-
objective optimisation problem, letting search discover context
splits that manual tuning might miss or accidentally undo.

## How to reproduce

**Branch**: `milestone/M-EVOLVE-01` (from `epic/dagbench-layout-evolution`).
**Tag**: `reference/m-evolve-01` — applied to both the dagbench repo
and the dag-map submodule at the frozen state.

**Render the Stockholm solo**:

```sh
cd /workspaces/worktrees/dagbench/bench
npm run print -- \
  --selection /workspaces/worktrees/dagbench/work/reports/stockholm-bezier-selection.mjs \
  --out /tmp/stockholm-bezier.pdf \
  --orientation landscape \
  --layout 1up
```

**Render the full matrix showcase**:

```sh
cd /workspaces/worktrees/dagbench/bench
npm run print -- \
  --selection /workspaces/worktrees/dagbench/work/reports/showcase-selection.mjs \
  --out /tmp/showcase.pdf \
  --orientation landscape \
  --layout 1up
```

Pass absolute paths to `--selection` and `--out`. The CLI resolves
relative paths from `repoRoot` (see `bench/print/print-pdf.mjs:32`
and `resolveMaybeRelative`), but absolute paths avoid the known
ambiguity.

**Programmatic use**:

```js
import { layoutProcess } from 'dag-map/src/layout-process.js';
import { renderProcess }  from 'dag-map/src/render-process.js';

const opts = {
  direction: 'ltr',
  scale: 1.5,
  routing: 'bezier',
  stationStyle: 'metro',
  routes: fixture.routes,
  theme: whiteTheme(fixture.theme),
};
const layout = layoutProcess(fixture.dag, opts);
const svg    = renderProcess(fixture.dag, layout, opts);
```

## Open questions / future directions

Listed here as reference, not as work items. The pivot to
multi-objective methodology (D-023) may subsume some of these.

- **Port stability under Process GA + bezier**. The `process-bezier`
  variant sets `noGA: true` because GA ordering was tuned against
  H-V-H crossing count, not bezier visual quality. A fitness function
  that penalises port swaps directly (instead of approximating via
  crossings) might make GA + bezier compose cleanly.
- **Bezier parameter space**. The curve construction hard-codes
  `r = 2 * cornerRadius` and the cubic-fallback expansion. A tension
  parameter (control-point distance scale), a per-route corner
  radius, and a smoothing strength applied only on specific topologies
  (e.g., trunk-only) are all unexplored axes.
- **Multi-objective fitness for bezier-specific quality**. Crossings,
  tight-corner count, cubic-fallback count, port-swap count, and
  cross-axis span utilisation can all be measured per layout.
  Composing them under a Pareto front (per D-023) would let Mode 2.5
  be tuned without manual cycling.
- **TTB tuning**. TTB works algorithmically but has never been
  visually assessed in Mode 2.5. A TTB variant for process flows
  with long, narrow graphs is a small add-on — the code path already
  exists.
- **Card rendering in Mode 2.5**. The current behaviour renders
  cards identically to Mode 2 even when `stationStyle: 'metro'`.
  Whether Mode 2.5 benefits from metro-style label tags (short text
  next to the station dot, no card border) or from keeping full cards
  is an aesthetic question worth revisiting.
- **Frequency + bezier**. `frequency: true` enables route
  thickness/opacity scaling and dashed low-weight routes. Dashing on
  a bezier curve renders well; thickness scaling combined with
  tight 45° corners has not been visually verified.
- **Bundling + bezier**. Same question as frequency. The tight
  ribbon-cable rendering in `render-process.js:44–71` is compatible
  with bezier segment data in principle, but has not been exercised
  on Mode 2.5 fixtures.
