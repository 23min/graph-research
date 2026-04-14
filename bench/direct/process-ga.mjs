// process-ga.mjs — GA for route ordering + positioning in layoutProcess.
//
// Genome = route permutation (which route gets processed first).
// Fitness = composite: crossings, overlaps, bends, sparsity, edge length.
// Measured on actual rendered path geometry from layoutProcess.
//
// Reuses GA operators from permutation-ga.mjs.
// New: formal fitness function, benchmark runner, rule extraction logging.

import { layoutProcess } from '../../dag-map/src/layout-process.js';
import { randomPermutation, orderCrossover, mutateSwap, mutateInsert } from './permutation-ga.mjs';

// ── Fitness function ──────────────────────────────────────────────
// Composite fitness evaluated on the actual H-V-H path geometry.
// Each component is explainable and independently measurable.

export function evaluateProcessFitness(dag, routes, permutation, options = {}) {
  const reorderedRoutes = permutation.map(i => routes[i]);
  const direction = options.direction ?? 'ltr';

  try {
    const layout = layoutProcess(dag, {
      routes: reorderedRoutes,
      scale: 1.5,
      direction,
      theme: 'cream',
      ...(options.layoutOpts || {}),
    });

    // Extract ORTHOGONAL line segments from all route paths.
    // Parse SVG path properly: M/L give endpoints, Q gives curves
    // (rounded corners). Extract the 3 key segments of H-V-H:
    //   H1: start → jog (horizontal)
    //   V:  jog top → jog bottom (vertical)
    //   H2: jog → end (horizontal)
    // For near-straight (H+V step): 2 segments.
    // For straight lines: 1 segment.
    const lines = [];
    for (const rp of layout.routePaths) {
      for (const seg of rp.segments) {
        // Get ALL coordinate points from M, L, and Q commands
        const allNums = seg.d.match(/[\d.-]+/g)?.map(Number) || [];
        if (allNums.length < 4) continue;
        const startX = allNums[0], startY = allNums[1];
        const endX = allNums[allNums.length - 2], endY = allNums[allNums.length - 1];

        // Find jog position from Q control points
        const qM = [...seg.d.matchAll(/Q\s+([\d.-]+)\s+([\d.-]+)/g)];

        if (qM.length === 0) {
          // No curves — straight or H+V step
          const lM = [...seg.d.matchAll(/L\s+([\d.-]+)\s+([\d.-]+)/g)];
          if (lM.length === 2) {
            // H+V step: two orthogonal segments
            const midX = Number(lM[0][1]), midY = Number(lM[0][2]);
            lines.push({ ri: rp.ri, x1: startX, y1: startY, x2: midX, y2: midY });
            lines.push({ ri: rp.ri, x1: midX, y1: midY, x2: endX, y2: endY });
          } else {
            // Single straight line
            lines.push({ ri: rp.ri, x1: startX, y1: startY, x2: endX, y2: endY });
          }
        } else {
          // H-V-H (or V-H-V) with Q curves — extract 3 key segments
          const jogPrimary = Number(qM[0][1]); // jog X for LTR, jog Y for TTB
          const jogCross = Number(qM[0][2]);

          // Determine direction from path structure
          const isHVH = Math.abs(startY - jogCross) < Math.abs(startX - jogPrimary);

          if (isHVH || qM.length >= 2) {
            // H-V-H: H1 at startY, V jog at jogX, H2 at endY
            const jogX = jogPrimary;
            lines.push({ ri: rp.ri, x1: startX, y1: startY, x2: jogX, y2: startY }); // H1
            lines.push({ ri: rp.ri, x1: jogX, y1: startY, x2: jogX, y2: endY });     // V
            lines.push({ ri: rp.ri, x1: jogX, y1: endY, x2: endX, y2: endY });       // H2
          } else {
            // V-H-V: V1 at startX, H jog at jogY, V2 at endX
            const jogY = jogCross;
            lines.push({ ri: rp.ri, x1: startX, y1: startY, x2: startX, y2: jogY }); // V1
            lines.push({ ri: rp.ri, x1: startX, y1: jogY, x2: endX, y2: jogY });     // H
            lines.push({ ri: rp.ri, x1: endX, y1: jogY, x2: endX, y2: endY });       // V2
          }
        }
      }
    }

    // 1. Visual crossings (V×H segment intersections between different routes)
    let crossings = 0;
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[i].ri !== lines[j].ri && segsCross(lines[i], lines[j])) crossings++;
      }
    }

    // 2. Overlaps: any two segments from different routes that run at
    // nearly the same position with overlapping extent. This catches:
    // - Parallel horizontal segments at same Y (HH overlay)
    // - Parallel vertical segments at same X (VV overlay)
    // - H-V-H bend mid-section overlaying on another route's H segment
    let overlaps = 0;
    const threshold = (layout.lineThickness || 5) * 1.8;
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[i].ri === lines[j].ri) continue;
        const a = lines[i], b = lines[j];
        const aIsH = Math.abs(a.y1 - a.y2) < 1;
        const aIsV = Math.abs(a.x1 - a.x2) < 1;
        const bIsH = Math.abs(b.y1 - b.y2) < 1;
        const bIsV = Math.abs(b.x1 - b.x2) < 1;

        // HH: both horizontal, similar Y, overlapping X
        if (aIsH && bIsH && Math.abs(a.y1 - b.y1) < threshold) {
          const minXa = Math.min(a.x1, a.x2), maxXa = Math.max(a.x1, a.x2);
          const minXb = Math.min(b.x1, b.x2), maxXb = Math.max(b.x1, b.x2);
          const overlapLen = Math.min(maxXa, maxXb) - Math.max(minXa, minXb);
          if (overlapLen > threshold) overlaps++;
        }

        // VV: both vertical, similar X, overlapping Y
        if (aIsV && bIsV && Math.abs(a.x1 - b.x1) < threshold) {
          const minYa = Math.min(a.y1, a.y2), maxYa = Math.max(a.y1, a.y2);
          const minYb = Math.min(b.y1, b.y2), maxYb = Math.max(b.y1, b.y2);
          const overlapLen = Math.min(maxYa, maxYb) - Math.max(minYa, minYb);
          if (overlapLen > threshold) overlaps++;
        }
      }
    }

    // 3. Bends + tiny elbows: count direction reversals AND small bends
    let bends = 0;
    let tinyElbows = 0;
    const lt = layout.lineThickness || 5;
    for (const rp of layout.routePaths) {
      let prevDy = 0;
      for (const seg of rp.segments) {
        const lM = [...seg.d.matchAll(/[ML]\s+([\d.-]+)\s+([\d.-]+)/g)];
        if (lM.length >= 3) {
          // Check for tiny elbows: H-V-H where V segment < lineThickness*4
          const pts = lM.map(m => [Number(m[1]), Number(m[2])]);
          for (let k = 1; k < pts.length - 1; k++) {
            const segLen = Math.sqrt((pts[k][0]-pts[k-1][0])**2 + (pts[k][1]-pts[k-1][1])**2);
            if (segLen > 0.5 && segLen < lt * 4) tinyElbows++;
          }
        }
        for (let k = 1; k < lM.length; k++) {
          const dy = Number(lM[k][2]) - Number(lM[k - 1][2]);
          if (Math.abs(dy) > 0.5 && Math.abs(prevDy) > 0.5) {
            if ((prevDy > 0 && dy < 0) || (prevDy < 0 && dy > 0)) bends++;
          }
          if (Math.abs(dy) > 0.5) prevDy = dy;
        }
      }
    }

    // 4. Total edge length (prefer shorter paths)
    let totalLength = 0;
    for (const line of lines) {
      totalLength += Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2);
    }

    // 5. Aspect ratio penalty (prefer balanced, not extremely stretched)
    const aspect = layout.width > 0 && layout.height > 0
      ? Math.max(layout.width / layout.height, layout.height / layout.width)
      : 1;
    const aspectPenalty = Math.max(0, aspect - 3);

    // 6. Staircase penalty — measures total vertical drift across layers.
    // For each route, sum |Y_next - Y_current| for consecutive stations.
    // A flat layout has small total drift. A staircase has large drift.
    // This pushes the GA toward orderings where shared-station routes
    // get adjacent home lanes, keeping the layout compact.
    let staircase = 0;
    for (const rp of layout.routePaths) {
      // Collect station Y positions along this route
      const routeNodes = reorderedRoutes[rp.ri]?.nodes || [];
      let prevY = null;
      for (const nodeId of routeNodes) {
        const sp = layout.stationPos.get(nodeId);
        if (!sp) continue;
        const y = direction === 'ltr' ? sp.y : sp.x;
        if (prevY !== null) staircase += Math.abs(y - prevY);
        prevY = y;
      }
    }
    // Normalize by number of routes and stations for comparability
    const stationCount = layout.stationPos.size || 1;
    const normalizedStaircase = staircase / (stationCount * 10);

    // Composite fitness — weights are GA-evolvable
    const weights = options.weights ?? {
      crossings: 100,
      overlaps: 20,
      bends: 5,
      tinyElbows: 15,
      edgeLength: 0.01,
      aspectPenalty: 10,
      staircase: 8,
    };

    const fitness =
      crossings * weights.crossings +
      overlaps * weights.overlaps +
      bends * weights.bends +
      tinyElbows * weights.tinyElbows +
      totalLength * weights.edgeLength +
      aspectPenalty * weights.aspectPenalty +
      normalizedStaircase * weights.staircase;

    return { fitness, crossings, overlaps, bends, tinyElbows, totalLength: Math.round(totalLength), aspectPenalty: +aspectPenalty.toFixed(2), staircase: +normalizedStaircase.toFixed(1) };
  } catch (e) {
    return { fitness: Infinity, crossings: 999, overlaps: 999, bends: 999, totalLength: 0, aspectPenalty: 0, error: e.message };
  }
}

function segsCross(a, b) {
  const d1 = dir(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
  const d2 = dir(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
  const d3 = dir(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
  const d4 = dir(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function dir(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

// ── GA Runner ─────────────────────────────────────────────────────

export function evolveProcessLayout(dag, routes, {
  populationSize = 30,
  generations = 100,
  eliteCount = 3,
  mutationRate = 0.3,
  seed = 42,
  direction = 'ltr',
  onGeneration = null,
  weights = undefined,
} = {}) {
  let rngState = seed;
  function rng() {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
  }

  const n = routes.length;
  if (n <= 1) return { bestPermutation: [0], bestFitness: { fitness: 0, crossings: 0, overlaps: 0, bends: 0 }, history: [] };

  const evalOpts = { direction, weights };
  let population = [];

  // Include default order
  const defaultPerm = Array.from({ length: n }, (_, i) => i);
  population.push({ perm: defaultPerm, ...evaluateProcessFitness(dag, routes, defaultPerm, evalOpts) });

  for (let i = 1; i < populationSize; i++) {
    const perm = randomPermutation(n, rng);
    population.push({ perm, ...evaluateProcessFitness(dag, routes, perm, evalOpts) });
  }
  population.sort((a, b) => a.fitness - b.fitness);

  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    const nextPop = [];
    for (let i = 0; i < eliteCount; i++) nextPop.push(population[i]);

    while (nextPop.length < populationSize) {
      const p1 = tournament(population, 3, rng);
      const p2 = tournament(population, 3, rng);
      let childPerm = orderCrossover(p1.perm, p2.perm, rng);
      if (rng() < mutationRate) {
        childPerm = rng() < 0.5 ? mutateSwap(childPerm, rng) : mutateInsert(childPerm, rng);
      }
      nextPop.push({ perm: childPerm, ...evaluateProcessFitness(dag, routes, childPerm, evalOpts) });
    }

    nextPop.sort((a, b) => a.fitness - b.fitness);
    population = nextPop.slice(0, populationSize);

    const best = population[0];
    history.push({ gen, ...best });
    if (onGeneration) onGeneration(gen, best, population);
    if (best.crossings === 0 && best.overlaps === 0) break;
  }

  return { bestPermutation: population[0].perm, bestFitness: population[0], history };
}

function tournament(pop, size, rng) {
  let best = pop[Math.floor(rng() * pop.length)];
  for (let i = 1; i < size; i++) {
    const c = pop[Math.floor(rng() * pop.length)];
    if (c.fitness < best.fitness) best = c;
  }
  return best;
}

// ── Benchmark Runner ──────────────────────────────────────────────
// Run GA across all fixtures, log results for rule extraction.

export async function runBenchmark(fixtures, options = {}) {
  const {
    direction = 'ltr',
    generations = 50,
    populationSize = 20,
  } = options;

  const results = [];

  for (const f of fixtures) {
    if (!f.routes || f.routes.length <= 1) continue;

    // Evaluate default ordering
    const defaultPerm = Array.from({ length: f.routes.length }, (_, i) => i);
    const defaultFit = evaluateProcessFitness(f.dag, f.routes, defaultPerm, { direction });

    // Run GA
    const ga = evolveProcessLayout(f.dag, f.routes, {
      populationSize,
      generations,
      direction,
    });

    const improved = ga.bestFitness.crossings < defaultFit.crossings;
    results.push({
      id: f.id,
      routes: f.routes.length,
      nodes: f.dag.nodes.length,
      default: { crossings: defaultFit.crossings, overlaps: defaultFit.overlaps, bends: defaultFit.bends, fitness: defaultFit.fitness },
      evolved: { crossings: ga.bestFitness.crossings, overlaps: ga.bestFitness.overlaps, bends: ga.bestFitness.bends, fitness: ga.bestFitness.fitness },
      bestPerm: ga.bestPermutation,
      improved,
      generations: ga.history.length,
    });

    const delta = defaultFit.crossings - ga.bestFitness.crossings;
    console.log(
      `${f.id.padEnd(25)} ${f.routes.length}R | ` +
      `default: ${defaultFit.crossings}x ${defaultFit.overlaps}o | ` +
      `evolved: ${ga.bestFitness.crossings}x ${ga.bestFitness.overlaps}o | ` +
      `Δ${delta >= 0 ? '+' : ''}${-delta} ${improved ? '✓' : '='} ` +
      `[${ga.bestPermutation}]`
    );
  }

  return results;
}
