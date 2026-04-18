# Graph Visualization — Field Map

A map of the graph visualization landscape relevant to dag-map: what the
problem classes are, who works on them, what code exists, and where the
research is alive, stalled, or commercially protected.

Reference material, not strategy. Strategic positioning, publication plans,
and "where dag-map sits in the landscape" belong in `research-directions.md`.

## How to read this document

The field splits three ways and the splits matter.

**Three communities that barely talk to each other:**

1. **Algorithmic / theoretical** (GD Symposium, JGAA, LIPIcs). Cares about
   complexity, provable bounds, planarity, crossing numbers, specific graph
   classes. Runs GD annually since 1992, plus BWGD (Bertinoro) and GNV as
   invite-only pencil-and-paper workshops.
2. **InfoVis / HCI** (IEEE VIS, EuroVis, CGF). Cares about user studies,
   aesthetics, interaction, task-based evaluation.
3. **Applied / tools** (Graphviz, dagre, ELK, Gephi, Cytoscape, d3-sankey, Tom
   Sawyer, yFiles). Cares about "does it work in a browser on real data."
   Typically 10-20 years behind theory but is what people actually ship.

**Five application domains** with their own vocabulary, venues, and sometimes
their own algorithms for what is the same math underneath: process mining, BPM,
cartography/transit, bioinformatics, social network analysis.

**The axis that controls which algorithm applies:** what's given vs. free.
Your dag-map log already makes this split for *routes* (input vs. discovered).
The same lens applies to *positions*: XY may be given by the data, constrained
by the data, discovered by the algorithm, or a mix. This is the first question
to ask about any layout problem.

## Quick orientation table

| Area | Routes | Node XY | Graph type | Alive / Stalled | Who owns it |
|------|--------|---------|------------|-----------------|-------------|
| General undirected layout | N/A | discovered | any | mature, incremental | Kobourov, Hu, Brandes |
| DAG / Sugiyama | N/A | rank+order | DAG | stable, some revival | Gansner, Brandes, Dunne |
| Process mining DFG | discovered | discovered | cyclic | commercially protected | van der Aalst lineage |
| BPMN / swimlane | authored | lane-constrained | DAG-ish | stalled academically | Camunda, Signavio |
| Metro / MLCM | INPUT | geo-fixed/schematic | any | very active | Nöllenburg, Wolff, Bast |
| Sankey / alluvial | weighted | columnar | layered | moderate | Dwyer, d3 community |
| Edge bundling | N/A | fixed | any | active | Holten, Wallinger, Auber |
| Constraint-based | N/A | constrained | any | niche, correct | Dwyer (Monash) |
| Confluent drawings | discovered | free | any | theory-only | Eppstein, Nöllenburg |
| DR / semantic-distance | N/A | discovered | k-NN implicit | very hot | McInnes, Kobak |
| Temporal / dynamic | N/A | per-snapshot | evolving | active, fragmented | Archambault, Beck |
| Geographic / spatial | N/A | given (with distortion) | any | transit-map active | Bast, Speckmann |
| Learned / GNN layout | N/A | discovered via NN | any | hype-peaking | Shen, Tiezzi |

## 1. General undirected layout — force-directed and stress

**What it is.** Given a graph with no other information, produce coordinates
that look nice: short edges, few crossings, near-uniform edge length, symmetry,
good angular resolution.

**Audit trail.**

- Tutte (1963) — barycentric planar drawing. The ancestor.
- Eades (1984) — "A Heuristic for Graph Drawing" — first spring model.
- Kamada–Kawai (1989) — energy formulation, Newton-Raphson solver.
- Fruchterman–Reingold (1991) — the famous spring/repulsion algorithm.
- Hall (1970), revived by Koren (2005) — spectral drawing via Laplacian eigenvectors.
- Gansner, Koren, North (2004, GD) — "Graph Drawing by Stress Majorization" —
  adapted SMACOF from the MDS community to graph drawing. Better convergence
  than Kamada–Kawai.
- Walshaw (2000), Hachul–Jünger (2004), Hu (2005), Harel–Koren — multilevel
  force-directed for large graphs (FM³, sfdp).
- Jacomy et al. (2014) — ForceAtlas2 (the Gephi default).
- Martin et al. (2011), Zheng et al. (2019) — GPU stress.
- Meng et al. (2023, Nature Comms) — NeuLay: GNN reparametrization of FDL,
  10–100× speedups, sometimes lower-energy layouts than FDL can reach.

**Who's active.** Stephen Kobourov (Arizona/TU Vienna). Yifan Hu (historically
AT&T, then Yahoo/Google). Ulrik Brandes (ETH Zürich). Stefan Hachul, Michael
Jünger (Köln). Yehuda Koren.

**Code.** Graphviz (neato, sfdp, fdp), OGDF (C++), d3-force, cytoscape.js,
Gephi/ForceAtlas2, sigma.js, networkx, igraph, graph-tool, graphlayouts (R).

**Open / stalled.** The vanilla problem is "done" — nobody dethrones FR / stress
/ FM³ for the general case. Active edges: scalability into millions of nodes;
hairball avoidance on scale-free graphs with strong community structure;
multilevel + constraints together. Symmetry aesthetic is stalled — no metric
matches human perception.

## 2. DAGs and layered (Sugiyama) drawing — dag-map's home turf

**What it is.** DAGs drawn with layers (rank) + node order per layer +
coordinates + routing. Also generalizes to *leveled* drawings where layers come
from the data (e.g., layer = timestamp bucket).

**Audit trail.**

- Sugiyama, Tagawa, Toda (1981) — the framework. Everything since is refinements.
- Gansner, Koutsofios, North, Vo (1993) — "A Technique for Drawing Directed
  Graphs," the `dot` paper. Network simplex for rank, iterated barycenter/median
  for ordering, network simplex again for X. What Graphviz `dot` does.
- Brandes–Köpf (2001) — "Fast and Simple Horizontal Coordinate Assignment."
  The coordinate step most modern implementations use. ≤2 bends per edge.
- Eiglsperger, Siebenhaller, Kaufmann (2005) — orthogonal layouts for UML.
- Buchheim, Jünger, Leipert — tree drawing, O(n) layered algorithms.
- Mennens, Scheepens, Westenberg (2019, CGF) — "A Stable Graph Layout Algorithm
  for Processes." Novel ranking + order-constraint + crossing minimization, with
  phased animation for mental-map preservation. Faster than industry standard
  for 250+ edges. Sponsored in a process-mining commercial context.
- Wilson, Crnovrsanin, Puerta, Dunne (2025, IEEE TVCG) — "Fast and Readable
  Layered Network Visualizations Using Large Neighborhood Search." LNS
  metaheuristic, quality-within-time-budget.
- Zheng et al. (IEEE VIS 2024) — scalability of optimal edge-crossing
  minimization in layered layouts, evaluates 9 LP techniques, up to 17×
  speedups, open-source Python toolkit.

**Who's active.** Ulrik Brandes. Cody Dunne's group at Northeastern (evaluation,
LNS). Ignaz Rutter (Passau), Fabrizio Montecchiani, Giuseppe Liotta (Perugia).
Sergey Pupyrev, Michael Kaufmann, Torsten Ueckerdt on layered, linear, and
book-embedding layouts.

**Code.** Graphviz dot, dagre / @dagrejs/dagre (JS, de-facto web standard),
ELK / elkjs (Eclipse Layout Kernel — heavier, usually better quality), OGDF
(C++), yFiles (commercial, state-of-the-art, expensive).

**Open / stalled.** 2-layer crossing minimization is well understood
theoretically (NP-hard; barycenter/median are the workhorses). Practice is
surprisingly stagnant — dagre has been in bug-fix mode for years and most web
projects inherit its output unchanged. Active: optimal ILP solvers that scale;
incremental/stable layout for dynamic DAGs (Mennens's territory); semantic-aware
Sugiyama (process data, ER diagrams, build graphs).

## 3. Process mining — DFGs, Petri nets, process trees

**What it is.** An event log (case, activity, timestamp) triples is mined into a
model. The common output is a **directly-follows graph (DFG)**: nodes are
activities, a→b means "b immediately followed a in some trace," edge weights
are frequencies or durations. Other outputs: Petri nets, process trees, BPMN,
causal nets.

DFGs are almost always **cyclic** (loop activities re-enter). Cycle handling
matters: usually by special-casing self-loops and hiding/compressing small
cycles visually.

**Audit trail.**

- van der Aalst and the ProM / Alpha-miner tradition, Eindhoven, late 1990s
  onward. Van der Aalst is the de-facto founder of process mining.
- Weijters, van der Aalst — Heuristics Miner (2006), noise-tolerant.
- Günther, van der Aalst — Fuzzy Miner (2007). What Disco uses under the hood.
- Leemans, Fahland, van der Aalst — Inductive Miner (2013), IvM (2014), guaranteed soundness.
- Leemans et al. (2019) — Directly Follows visual Miner (DFvM) and
  DFM→Petri-net translations showing commercial tools' performance measures can
  be unreliable without alignments.
- Lee, Song, van der Aalst (BPM 2025 / 2026) — "Layouting Object-Centric
  Directly Follows Graphs." Assigns distinct axes per object type for
  object-centric process mining.
- Eckhard, Wittges, Rinderle-Ma (2025, BIS) — systematic review, 33 papers;
  DFG dominates, almost all control-flow.

**Who's active.** Van der Aalst (RWTH Aachen). Sander Leemans (RWTH). Boudewijn
van Dongen (TU/e). Hajo Reijers. Stefanie Rinderle-Ma (TUM). Marlon Dumas
(Tartu, co-founder of Apromore).

**Code.** ProM (Java, academic, plugin-based — the research substrate). PM4Py
(Python, open source — the practical research tool). Apromore (open platform).
Celonis (commercial, market leader). Fluxicon Disco (commercial). SAP Signavio,
UiPath, IBM, Microsoft Power Automate Process Mining.

**Open / stalled / protected.** One of the most commercially protected areas.
Celonis alone is a multi-billion company. Research publishes at ICPM and BPM,
but innovation mostly lands in commercial platforms, not open source.

Concrete open problems:

- **Stability / mental-map preservation under filtering.** When a user drags a
  slider that changes edge visibility, layout should not reshuffle. Mennens
  2019 is the main work; explicitly positioned as a rebuke of commercial tools.
- **MLCM-style layout for DFGs.** Almost unknown in process mining. Your dag-map
  approach is directly relevant if cycles are unrolled or isolated.
- **Object-centric process mining visualization** (OCEL 2.0 spec, ~2024) — new,
  wide open.
- **Animated replay** of cases through a process map — Disco does it, but
  research on doing it without visual collisions is thin.

PhD-thesis-shaped gap: "process visualizations stable under filtering, using
MLCM instead of force-directed." Likely collaborator: Rinderle-Ma at TUM.

## 4. BPMN / swimlane layout — the unloved sibling

**What it is.** BPMN diagrams are *authored*, not mined — so layout means
laying out an existing author-drawn diagram. The hard part is **swimlanes**:
pools partition by participant, lanes sub-partition by role. Sequence flow
cannot cross pool boundaries. Node positions must satisfy hard lane-containment
constraints on top of Sugiyama.

**Audit trail.**

- Gschwind, Pinggera, Zugal, Reijers, Weber (2014) — "A Linear Time Layout
  Algorithm for Business Process Models." The reference.
- Albrecht, Effinger, Held, Kaufmann (2010) — BPEL auto-layout.
- US patent 9,959,518 — self-organizing NN approach for BPM diagrams with
  swimlanes. Yes, there are patents, which chills research.
- bpmn-js (Camunda's JS library) uses simple layered layout but doesn't really
  solve the lane-constrained Sugiyama problem.

**Who's active.** Very little recent academic work. The topic is largely owned
by Camunda, Signavio (now SAP), and smaller BPMN tooling vendors.

**Code.** bpmn-js (JS, open, rendering is good, layout is minimal). Camunda
Modeler. yFiles BPMN layout (commercial, the best). jsPlumb layouts.

**Open / stalled.** Stalled academically, protected commercially. The good
layouts are proprietary.

Open problem: given a BPMN model with complex gateways, nested subprocesses,
and swimlanes, produce a Sugiyama-style layout respecting lane constraints with
minimal intra- and inter-lane crossings. **The math is all done** — it's
Sugiyama + separation constraints, exactly the CoLA framework (§9). The gap is
just *packaging it into an open BPMN-layout library*. **Real opportunity for a
solo dev.**

## 5. Metro-map / schematic-network layout (MLCM) — dag-map's current frame

**What it is.** Given a graph with fixed or near-fixed node positions (stations
at geographic locations) and a set of *lines* passing through them, produce a
clean schematic drawing. Classic: London Tube. Subproblems:

- schematic layout (where to put stations — octilinear, k-linear, ortho-radial, free)
- line ordering at each station (MLCM proper)
- label placement

**Audit trail.**

- Beck (1933) — London Tube map. The prehistory.
- Barkowsky, Latecki, Richter (2000) — discrete curve evolution schematization.
- Hong, Merrick, do Nascimento (2006) — spring-embedder-based metro maps.
- Benkert, Nöllenburg, Uno, Wolff (GD 2006) — minimizing intra-edge crossings.
  The first MLCM paper.
- Nöllenburg, Wolff (2011, IEEE TVCG) — "Drawing and Labeling High-Quality
  Metro Maps by Mixed-Integer Programming." MILP gold standard. 7 hard design
  rules. Minimizes soft-constraint violations.
- Asquith, Gansner, Nöllenburg (2008) — MLCM formalization.
- Nöllenburg (GD 2009) — improved MLCM algorithm.
- Bekos, Kaufmann, Potika, Symvonis — MLCM complexity results.
- Kornaropoulos, Tollis — MLCM with constraint relaxations.
- Fink, Haverkort, Nöllenburg, Roberts, Schuhmann, Wolff (GD 2012) — "Drawing
  Metro Maps Using Bézier Curves."
- Bast, Brosi, Storandt (SIGSPATIAL 2018; EuroVis 2020; SSTD 2021) — the LOOM
  software suite. Stuttgart light rail from GTFS, geographically correct /
  octilinear / orthoradial variants.
- Nickel, Nöllenburg (2019, 2020) — "Towards Data-Driven Multilinear Metro
  Maps." Adapts the MILP to any set of k≥2 orientations (not just octilinear),
  with data-driven k via k-means.
- Wu, Niedermann, Takahashi, Roberts, Nöllenburg (EuroVis 2020, CGF) — "A
  Survey on Transit Map Layout from Design, Machine, and Human Perspectives."
  **Read this. It's the literature.**
- Wu et al. (2022, CGF) — shape-guided mixed metro map layout. Distortion to
  embed symbolic shapes.
- Archambault, Liotta, Nöllenburg, Piselli, Tappini, Wallinger (GD 2024) —
  bundling-aware drawing. Joint optimization of layout + bundling, not sequential.

**Who's active.** **Martin Nöllenburg** (TU Wien) is the center of gravity.
Alexander Wolff (Würzburg). Hanna Bast (Freiburg, LOOM). Maxwell Roberts (Essex,
design/usability). Hsiang-Yun Wu. Soeren Nickel. Soeren Terziadis (TU
Eindhoven, post-TU Wien). Markus Wallinger (TU Wien, edge-path bundling).

**Code.**

- **LOOM** (Bast/Brosi/Storandt) — software suite for automated geographically-
  correct or schematic transit maps. GTFS input, pipeline
  `gtfs2graph | topo | loom | transitmap`, optional `octi` for octilinear.
  Permissive license, C++. **The closest open-source cousin to dag-map.**
- **juliuste/transit-map** (JS + Gurobi, MILP) and the public-transport/
  generating-transit-maps org — the JS-world effort, Julia MILP using COIN-CBC.
- **OpenMetroMaps** — viewer/editor + research optimization algorithms collection.
- Nöllenburg's Karlsruhe metro code (research prototype, restricted).

**Open / stalled.** Very active.

- **Scalability.** MILP solves ~100-node networks in minutes. Berlin S+U (~170
  nodes) takes tens of minutes. Tokyo/London full is out of reach.
- **Joint layout + bundling** (GD 2024 is the seminal shot).
- **Non-octilinear aesthetics** (Nickel–Nöllenburg k-linear, ortho-radial).
- **Dynamic metro maps.** Adding/closing a line with minimal visual disruption.
  Largely unsolved.
- **Beyond-metro applications.** Applying MLCM to execution traces (dag-map) or
  to process-mining DFGs is under-explored. Rome2Rio's blog post shows scaling
  pain nobody has written up.

Community is small (~15 active researchers), friendly, open to implementation-
focused contributions. GD 2025 accepted several practical metro-layout papers.

## 6. Flow diagrams — Sankey and alluvial

**What it is.** Layered graphs where edge *width* is meaningful (quantity).
Nodes positioned in columns (usually time or process-stage ordered), edges
connect columns with width = flow. Alluvial is a subtype emphasizing category
membership over time.

**Audit trail.**

- Sankey (Riall Sankey, 1898) — energy flows in steam engines.
- Minard (1869) — Napoleon's march. Ur-example.
- Rosvall, Bergstrom (2010) — alluvial diagrams for community structure.
- Bostock's d3-sankey (2012) — iterative relaxation, barycenter ordering. Most-used.
- Zarate, Le Bodic, Dwyer, Gange, Stuckey (2018, IEEE VIS) — "Optimal Sankey
  Diagrams Via Integer Programming." Proves flow-crossing minimization NP-hard.
- Hu, Yen (2019, arXiv) — Markov-chain-based barycenter, near-ILP-optimal.
- Zhao et al. (2023) — NeatSankey. Heuristic + force-directed + bundling.
- OmicsSankey (bioRxiv 2025) — crossing reduction for single-cell RNA-seq.

**Who's active.** Dwyer's group at Monash (IP formulations). Application-driven
mostly (energy, bioinformatics).

**Code.** d3-sankey (JS, foundation for everything). plotly-sankey. Google
Charts. R: ggalluvial, networkD3. No Gephi or NetworkX support.

**Open / stalled.**

- **Width-aware crossing cost** — thick-thick crossing worse than thin-thin.
  Under-researched.
- **Cyclic Sankey** (recycled flows with right-to-left edges between last and
  first layer) — explicitly noted as unsolved in Hu–Yen.
- **Many-column Sankey** (20+) breaks current tools.

## 7. Edge bundling — reducing clutter without changing layout

**What it is.** Given positions fixed, route edges so similar ones follow close
paths and bundle. Reduces clutter, reveals high-level patterns. Two flavors:

- **Ambiguous** (FDEB, hierarchical): merges edges that may not share a graph
  path. Pretty, but introduces false implied structure.
- **Unambiguous** (edge-path bundling, confluent): only bundles along actual
  graph paths. Preserves edge identity.

**Audit trail.**

- Holten (2006, TVCG) — Hierarchical Edge Bundles. B-splines bent toward
  hierarchy paths.
- Holten, van Wijk (2009, EuroVis) — Force-Directed Edge Bundling. Edges as
  springs with pairwise attraction. The reimplementation darling.
- Cui, Zhou, Qu, Wong, Li (2008) — Geometry-based edge clustering.
- Lambert, Bourqui, Auber (2010) — Skeleton-Based Edge Bundling.
- Ersoy, Hurter, Paulovich, Cantareira, Telea (2011) — KDEEB, image-based KDE.
- Pupyrev, Nachmanson, Kaufmann (2012) — Ink minimization on Sugiyama.
- Wallinger, Archambault, Auber, Nöllenburg, Peltonen (2022, IEEE TVCG) —
  "Edge-Path Bundling: A Less Ambiguous Edge Bundling Approach." Bundles along
  shortest graph paths. Tunable via shortest-path distances, Euclidean, or
  combinations. Directed bundling emerges naturally.
- S-EPB (Wallinger, OSF 2022) — spanner-based accelerator, 5 to 256× faster
  via biconnected component decomposition.
- Dickerson, Eppstein, Goodrich, Meng (2003) — confluent drawings (§10).

**Who's active.** Markus Wallinger (TU Wien), David Auber (Bordeaux), Alexandru
Telea (Utrecht), David Archambault (Swansea), Romain Bourqui (Bordeaux).

**Code.** d3.ForceBundle (JS), edgebundle (R, reimplements EPB + others),
Tulip's bundling plugin (C++), xpeterk1/edge-path-bundling (Python, faithful
EPB port), mwallinger-tu/edge-path-bundling (original JS).

**Open / stalled.** Still very active.

- **Dynamic bundling** (bundle stability under layout changes) — basically unsolved.
- **3D / VR bundling** — Immersive Edge Path Bundling extends EPB to 3D via
  Three.js and A-Frame, but admits no quantitative validation.
- **Bundling + directionality + weight** simultaneously.
- **Confluent vs. bundling unification** — philosophically same problem, mathematically
  different. Obvious gap.

## 8. Dimension-reduction / semantic-distance layouts

**What it is.** Nodes carry high-dimensional attributes or a pre-defined
distance matrix; place them in 2D so distances are approximately preserved. The
"graph" is often implicit (a k-NN graph) rather than given.

This is exactly the "abstract distance between two nodes" case.

**Audit trail.**

- Torgerson (1952) — classical MDS.
- Kruskal (1964) — non-metric MDS / stress.
- Sammon (1969) — Sammon mapping.
- Kamada–Kawai (1989), Gansner-Koren-North (2004) — stress applied to graphs.
- Hinton, Roweis (2002) — SNE.
- van der Maaten, Hinton (2008) — t-SNE. Adds t-distribution. State of the art for a decade.
- Maaten (2014) — Barnes-Hut t-SNE for scalability.
- Linderman et al. (2019) — FIt-SNE (FFT-accelerated).
- McInnes, Healy, Melville (2018, JOSS) — UMAP. Fuzzy simplicial sets from
  algebraic topology. Preserves more global structure than t-SNE, faster, now dominant.
- Narayan, Berger, Cho (2021) — densMAP. Preserves local density.
- PacMAP, TriMap, IVIS, PHATE and others (2020–2024).
- Draganov et al. (IJCAI 2023) — "ActUp." t-SNE and UMAP are closer than they look.
- Methodological pushback: t-SNE and UMAP distort distances; cluster sizes and
  inter-cluster distances in 2D are often hyperparameter artifacts. Chari,
  Pachter (2023) argued they can mislead. Kobak, Berens (2019) showed
  initialization matters more than the method.

**Who's active.** Leland McInnes (UMAP, Tutte Institute). Dmitry Kobak (Tübingen,
the pointed critic). Philipp Berens. James Melville. Andrew Draganov (Aarhus).

**Code.** scikit-learn (t-SNE, MDS), openTSNE, umap-learn, PyMDE, pyDRMetrics,
graphlayouts::stress (R, for graphs with actual topology).

**Open / stalled.** One of the fastest-moving corners.

- **Faithfulness metrics** — how do we know when UMAP/t-SNE lie?
- **Interpretability** — why is this cluster here?
- **Trajectory preservation for temporal data** — Poličar et al. (2024) showed
  existing methods corrupt time-series structure.
- **Hybrid graph + semantic attributes.** A common real case: DAG topology
  *and* per-node embeddings. Blending them is wide open.

For dag-map: if a consumer has a DAG plus per-node semantic embeddings, X from
topology + Y from first-PC-of-embedding is a good baseline I haven't seen published.

## 9. Constraint-based layout — the Monash school

**What it is.** Generic stress/force-directed plus *hard and soft constraints*:
"align these vertically," "keep this set inside this box," "this node left of
that one." Solved by stress majorization with gradient projection.

**Audit trail.**

- Ryall, Marks, Shieber (1997) — interactive constraint-based drawing.
- He, Marriott (1998) — constrained graph layout.
- Dwyer, Koren, Marriott (2006) — IPSep-CoLA. Stress majorization + gradient
  projection. Foundational.
- Dwyer (2009) — scalable version.
- Wang, Wang, Sun, Zhu, Lu, Fu, Sedlmair, Deussen, Chen (2017, IEEE TVCG) —
  "Revisiting Stress Majorization as a Unified Framework." Reformulates stress
  on edge *vectors* not just lengths. Models star shapes, cluster separation,
  directional constraints in one framework. GPU-parallelized to 10K nodes.

**Who's active.** Tim Dwyer (Monash) is the canonical figure. Kim Marriott
(Monash). Michael Wybrow (Monash). Yehuda Koren. The Konstanz group (Oliver Deussen).

**Code.** **WebCola** (JS, Dwyer et al., open) — the only real open-source
constraint-based layout engine for the web. cytoscape-cola wraps it.

**Open / stalled.** Active but small community — mostly the Monash group. The
limiting factor is the API: specifying good constraints for a given domain
requires expertise.

Open problem: **automatic constraint inference** from data structure (if nodes
have a `layer` attribute → horizontal alignment; if they have a `parent`
attribute → containment). Nobody has packaged this well for an application domain.

This is the right framework for dag-map's planned Mode 4 (consumer-provided XY)
and for BPMN swimlane layout. The math is done; packaging is the gap.

## 10. Confluent drawings / beyond planarity

**What it is.** Allow edges to *merge and split* at junctions, so drawings that
would have many crossings become planar drawings where tracks share. "Beyond
planarity" is the umbrella for relaxations of planarity (k-planar, RAC,
fan-planar, quasi-planar) that allow controlled crossings.

**Audit trail.**

- Thurston (1988) — train tracks in topology (where the name comes from).
- Dickerson, Eppstein, Goodrich, Meng (GD 2003; JGAA 2005) — "Confluent
  Drawings: Visualizing Non-planar Diagrams in a Planar Way." Identifies
  graph classes that are confluently drawable (interval graphs, cographs) vs.
  not (Petersen minus a vertex).
- Hui, Schaefer, Štefankovič (2005) — Train tracks and confluent drawings.
  Strongly-confluent subclass.
- Eppstein, Goodrich, Meng (2006) — δ-confluent drawings.
- Eppstein, Goodrich, Meng (Algorithmica 2007) — Confluent Layered Drawings.
- Hirsch, Meijer, Rappaport (2007) — Biclique edge cover graphs + confluent.
- Eppstein, Simons (2011) — Confluent Hasse diagrams.
- Eppstein, Holten, Löffler, Nöllenburg, Speckmann, Verbeek (GD 2013) — Strict
  Confluent Drawing. NP-complete in general; polynomial for outerplanar strict
  confluent with fixed vertex ordering.
- Angelini, Didimo, Liotta, Montecchiani, Bekos — extensive beyond-planarity
  literature from 2010 onward. "Graph Drawing Beyond Planarity" survey (ACM
  Computing Surveys 2019) covers main directions and open problems.
- Masařík, Hliněný (GD 2023), Balko et al. (GD 2024) — uncrossed number of graphs.

**Who's active.** David Eppstein (UC Irvine, prolific). Michael Goodrich (UC
Irvine). Martin Nöllenburg. Walter Didimo, Fabrizio Montecchiani, Giuseppe
Liotta (Perugia). Michael Kaufmann (Tübingen). Michael Bekos (Ioannina).
Stephen Kobourov. Sergey Pupyrev.

**Code.** Hardly any production code. Confluent drawings are studied
theoretically; practical implementations are ad hoc prototypes. **Massive gap
and opportunity.**

**Open / stalled.** Theory is very active each year at GD and SoCG. Practical
implementation is near-zero.

- **Heuristics that scale.** Existing algorithms are exponential or restricted.
- **Integration with Sugiyama.** Confluent layered drawings exist on paper
  (Eppstein-Goodrich-Meng 2007) but no production implementation.
- **dag-map's trunk-branch insight is on point.** A trunk with branches peeling
  off is literally a confluent-drawing primitive. A paper "Confluent-style
  trunk-branch drawings for directed acyclic workflows" at GD's applied track
  would get attention.

## 11. Temporal / dynamic graphs and cycle unrolling

**What it is.** The graph changes over time. Two framings:

- **Dynamic graph drawing**: sequence of snapshots → sequence of layouts that
  preserve the mental map.
- **Temporal (event-based) networks**: edges have timestamps/durations. Often
  represented as **time-expanded graphs** — create a copy of each node per
  time step, edges go between time-specific copies. Turns cyclic temporal
  structure into a static DAG.

The intuition that cycles resolve by unrolling is correct and is the time-
expansion construction.

**Audit trail.**

- Eick, Steffen, Sumner (1992) — Seesoft, early software evolution visualization.
- Brandes, Wagner (1997) — Bayesian dynamic layout.
- Diehl, Görg, Kerren (2001–2005) — foresighted layout.
- Brandes, Corman (2003) — "Visual Unrolling of Network Evolution."
  Pseudo-3D with snapshots stacked as layers. The origin of unrolling in
  visualization.
- Archambault, Purchase, Pinaud (2011) — animation vs. timeline comparison.
- Beck, Burch, Diehl, Weiskopf (2017, CGF) — "A Taxonomy and Survey of Dynamic
  Graph Visualization." **The reference survey.**
- Kempe, Kleinberg, Kumar (2002) — time-expanded temporal network formalism.
  Nicosia, Tang et al. — temporal network metrics.
- Xu, Kliger, Hero (2012, arXiv) — "A Regularized Graph Layout Framework for
  Dynamic Network Visualization." DMDS / DGLL with temporal regularization.
- Tinarrage, Ponciano, Linhares, Traina, Poco (arXiv 2023, IEEE TVCG) —
  ZigzagNetVis. Uses zigzag persistent homology to suggest temporal
  resolutions for sparse temporal graphs.
- TimeLighting (CGF), Massive Sequence View, and the space-time-cube line.

**Who's active.** Daniel Archambault (Swansea/Newcastle). Fabian Beck
(Bamberg). Steffen Koch. Jorge Poco (FGV Rio). Daniel Weiskopf. Stephen
Kobourov. Petra Mutzel. Takanori Fujiwara. Ulrik Brandes. Christos Faloutsos's
group on large temporal networks.

**Code.** SoNIA (dead but instructive). DyNetML. rEvolver. visone. Pajek for
dynamic. networkx-temporal. graph-tool temporal. Gephi Timeline. Practice lags
research.

**Open / stalled.** Very active, very fragmented.

- **Aggregation granularity** (how many timeslices?) still heuristic.
  ZigzagNetVis is the first principled answer.
- **Stable incremental layout** for online arrivals — partial solutions only.
- **Time-expanded graph visualization** — surprisingly under-tooled given its
  importance in OR (transportation, scheduling). n × T nodes gets unreadable fast.
- **Space-time cube** visualizations — 3D, interactive, experimental.

dag-map's planned Mode 5 (time-expanded round-trip converter) is on the right
track. Kempe–Kleinberg–Kumar is the canonical reference.

## 12. Geographic / spatial / physical networks

**What it is.** Nodes have true coordinates (lat/lon, floor plan, sensor, brain
region). The layout problem is *distortion under constraints*: move nodes as
little as possible while making the diagram legible (straighten paths, separate
overlaps).

**Audit trail.**

- Imhof (1975) — cartographic principles.
- Agrawala, Stolte (2001) — Line Drive (route maps).
- Neyer (1999) — line simplification with restricted orientations.
- Cabello, de Berg, van Kreveld — schematization of polygons.
- Dwyer, Koren, Marriott (GD 2005) — stress majorization with orthogonal
  ordering constraints. Explicit demo on NSW rail and an Internet backbone
  network: orthogonal-ordering-constrained stress dramatically improves
  readability while preserving geography.
- LOOM (Bast/Brosi/Storandt, 2018–2021) — geographic → schematic transit maps at scale.
- Buchin, Meulemans, Renssen, Speckmann — edge-move polygon schematization.

**Who's active.** Hanna Bast's group (Freiburg) on transit. Bettina Speckmann
(TU/e). Wouter Meulemans (TU/e). Maarten Löffler. Tim Dwyer on the constraint
side. The entire cartography community (ICA, AutoCarto) overlaps heavily but
rarely cites graph-drawing papers.

**Code.** LOOM (C++). d3-geo projections. QGIS + plugins. Deck.gl for
large-network rendering on maps. Kepler.gl. Research code is scattered.

**Open / stalled.**

- **Multi-scale schematic maps** — zoom in for geography, zoom out for
  schematic. Largely unsolved for complex networks.
- **Route-aware distortion** — distort so routes of interest are clear while
  other parts stay faithful. Rome2Rio's blog aimed here.
- **Physical networks** (Pósfai et al., Nature Comms 2024) — edges constrained
  to curve to avoid overlap in 3D. Brand new.

## 13. Learned / ML-based layout

**What it is.** Use neural networks — typically GNNs — to produce or accelerate
layouts.

**Audit trail.**

- Giovannangeli, Lalanne, Bourqui (2019–2021) — DeepGD.
- Wang, Jin, Wang, Tu, Shen (2021) — DeepDrawing, encoder-decoder.
- Tiezzi et al. (2021, arXiv) — "Graph Neural Networks for Graph Drawing"
  (GND). Any differentiable loss (edge crossings, stress) drives the GNN.
- Wang, Yen, Hu, Shen (2021) — DeepGD / DeepGD-SL.
- Meng et al. (2023, Nature Comms) — NeuLay. GNN reparametrizes FDL energy.
  10–100× speedup, sometimes lower energy.
- Zhao et al. (2024, Journal of Visualization) — GNNs for *evaluating* layout
  quality, not just producing.

**Who's active.** Han-Wei Shen (Ohio State). Xiaoru Yuan (Peking). David Auber
(Bordeaux). Barabási / IBM group for NeuLay. Matteo Tiezzi.

**Code.** NeuLay and DeepGD on GitHub. Others are research prototypes.

**Open / stalled.** Hype-cycle peaking. The methods work but mostly replicate
stress/FR rather than transcend them. Genuine open question: **can learned
layouts beat hand-designed heuristics on aesthetic benchmarks?** So far:
marginal speed wins, modest hairball-avoidance wins, no clear aesthetic wins.
Learning to satisfy hard constraints (orthogonality, confluent merging) is
still hard for GNNs.

