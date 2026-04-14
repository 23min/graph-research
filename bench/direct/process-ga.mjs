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

    // Extract line segments from all route paths
    const lines = [];
    for (const rp of layout.routePaths) {
      for (const seg of rp.segments) {
        const lM = [...seg.d.matchAll(/[ML]\s+([\d.-]+)\s+([\d.-]+)/g)];
        for (let k = 1; k < lM.length; k++) {
          lines.push({
            ri: rp.ri,
            x1: Number(lM[k - 1][1]), y1: Number(lM[k - 1][2]),
            x2: Number(lM[k][1]), y2: Number(lM[k][2]),
          });
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

    // 2. Overlaps: different routes at nearly the same position
    let overlaps = 0;
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[i].ri === lines[j].ri) continue;
        // Same-direction parallel segments within lineThickness of each other
        const isHH = Math.abs(lines[i].y1 - lines[i].y2) < 1 && Math.abs(lines[j].y1 - lines[j].y2) < 1;
        const isVV = Math.abs(lines[i].x1 - lines[i].x2) < 1 && Math.abs(lines[j].x1 - lines[j].x2) < 1;
        if (isHH && Math.abs(lines[i].y1 - lines[j].y1) < layout.lineThickness * 1.5) {
          // Check X overlap
          const minX1 = Math.min(lines[i].x1, lines[i].x2), maxX1 = Math.max(lines[i].x1, lines[i].x2);
          const minX2 = Math.min(lines[j].x1, lines[j].x2), maxX2 = Math.max(lines[j].x1, lines[j].x2);
          if (minX1 < maxX2 && minX2 < maxX1) overlaps++;
        }
        if (isVV && Math.abs(lines[i].x1 - lines[j].x1) < layout.lineThickness * 1.5) {
          const minY1 = Math.min(lines[i].y1, lines[i].y2), maxY1 = Math.max(lines[i].y1, lines[i].y2);
          const minY2 = Math.min(lines[j].y1, lines[j].y2), maxY2 = Math.max(lines[j].y1, lines[j].y2);
          if (minY1 < maxY2 && minY2 < maxY1) overlaps++;
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
