// generate.mjs — Generate process-flow-like DAGs for stress testing layoutProcess.
// Deterministic: seeded PRNG so fixtures are reproducible.
//
// Key insight: in process mining, routes (case variants) ARE the graph.
// Every edge belongs to at least one route. The DAG is the union of all
// route edges. This matches how Celonis/Disco build process maps.

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a process-flow DAG from route definitions.
// Routes first, DAG derived — every edge is covered by at least one route.
function buildFromRoutes(id, routeDefs) {
  const nodeSet = new Map();
  const edgeSet = new Set();
  const routes = [];

  for (const rd of routeDefs) {
    const nodes = [];
    for (const name of rd) {
      if (!nodeSet.has(name)) nodeSet.set(name, { id: name, label: name });
      nodes.push(name);
    }
    routes.push({ nodes });
    for (let i = 1; i < nodes.length; i++) {
      edgeSet.add(`${nodes[i - 1]}->${nodes[i]}`);
    }
  }

  const dag = {
    nodes: [...nodeSet.values()],
    edges: [...edgeSet].map(e => e.split('->')),
  };

  return { id, dag, routes, theme: 'cream' };
}

// Generate process-flow variants from a skeleton.
// skeleton: array of step names defining the "happy path"
// variants: number of route variants to generate
// Each variant shares most steps but may skip, add, or replace some.
function generateProcess(id, { skeleton, variants = 4, branchProb = 0.3, skipProb = 0.2, seed = 42 }) {
  const rand = mulberry32(seed);
  const routes = [skeleton]; // happy path is always route 0

  for (let v = 0; v < variants - 1; v++) {
    const route = [];
    for (let i = 0; i < skeleton.length; i++) {
      const step = skeleton[i];

      // Skip step? (never skip first or last)
      if (i > 0 && i < skeleton.length - 1 && rand() < skipProb) continue;

      route.push(step);

      // Branch: insert an alternative step after this one?
      if (i < skeleton.length - 1 && rand() < branchProb) {
        const alt = step + '_alt' + (v + 1);
        route.push(alt);
      }
    }
    routes.push(route);
  }

  return buildFromRoutes(id, routes);
}

// Generate a process with parallel paths that diverge and reconverge.
function generateParallelProcess(id, { stages, pathsPerStage = 2, routes: routeCount = 4, seed = 42 }) {
  const rand = mulberry32(seed);

  // Build stage structure: each stage has N parallel activities
  const stageNodes = [['start']];
  for (let si = 0; si < stages; si++) {
    const paths = [];
    const n = 1 + Math.floor(rand() * pathsPerStage);
    for (let pi = 0; pi < n; pi++) {
      paths.push(`S${si}_P${pi}`);
    }
    stageNodes.push(paths);
  }
  stageNodes.push(['end']);

  // Generate routes as paths through the stages
  const routes = [];
  for (let ri = 0; ri < routeCount * 3 && routes.length < routeCount; ri++) {
    const path = ['start'];
    for (let si = 1; si < stageNodes.length - 1; si++) {
      const opts = stageNodes[si];
      path.push(opts[Math.floor(rand() * opts.length)]);
    }
    path.push('end');
    const key = path.join(',');
    if (!routes.some(r => r.join(',') === key)) routes.push(path);
  }

  return buildFromRoutes(id, routes);
}

// Pre-built process-flow fixtures — realistic topologies
export const randomFixtures = [
  // --- Skeleton-based (like real process mining variants) ---

  // Simple approval process: 5 steps, 3 variants
  generateProcess('proc-approval', {
    skeleton: ['submit', 'review', 'approve', 'notify', 'close'],
    variants: 3, branchProb: 0.3, skipProb: 0.15, seed: 1,
  }),

  // Order fulfillment: 7 steps, 5 variants (some skip, some branch)
  generateProcess('proc-order', {
    skeleton: ['receive', 'validate', 'pick', 'pack', 'ship', 'deliver', 'confirm'],
    variants: 5, branchProb: 0.25, skipProb: 0.2, seed: 10,
  }),

  // Incident management: genuinely divergent paths through the process
  buildFromRoutes('proc-incident', [
    ['detect', 'triage', 'assign', 'investigate', 'resolve', 'verify', 'close'],
    ['detect', 'triage', 'escalate', 'expert_review', 'resolve', 'verify', 'close'],
    ['detect', 'auto_classify', 'assign', 'quick_fix', 'verify', 'close'],
    ['detect', 'triage', 'assign', 'investigate', 'workaround', 'document', 'close'],
    ['detect', 'triage', 'escalate', 'vendor_fix', 'test', 'verify', 'close'],
    ['detect', 'auto_classify', 'known_error', 'apply_fix', 'verify', 'close'],
  ]),

  // Loan application: genuinely different approval paths
  buildFromRoutes('proc-loan', [
    ['apply', 'screen', 'credit_check', 'appraise', 'underwrite', 'approve', 'fund', 'close'],
    ['apply', 'screen', 'credit_check', 'underwrite', 'approve', 'fund', 'close'],
    ['apply', 'screen', 'credit_check', 'appraise', 'underwrite', 'reject', 'notify', 'close'],
    ['apply', 'screen', 'auto_decline', 'notify', 'close'],
    ['apply', 'screen', 'credit_check', 'manual_review', 'committee', 'approve', 'fund', 'close'],
  ]),

  // Software release: 6 steps, 4 variants (some skip testing)
  generateProcess('proc-release', {
    skeleton: ['develop', 'build', 'test', 'stage', 'deploy', 'monitor'],
    variants: 4, branchProb: 0.2, skipProb: 0.25, seed: 40,
  }),

  // --- Parallel-path processes ---

  // 4 stages, 3 parallel paths each, 5 routes
  generateParallelProcess('proc-parallel-4', { stages: 4, pathsPerStage: 3, routes: 5, seed: 50 }),

  // 5 stages, 3 parallel paths, 6 routes — complex
  generateParallelProcess('proc-parallel-5', { stages: 5, pathsPerStage: 3, routes: 6, seed: 60 }),

  // 6 stages, 3 parallel paths, 8 routes — many variants
  generateParallelProcess('proc-parallel-many', { stages: 6, pathsPerStage: 3, routes: 8, seed: 70 }),

  // --- Time/distance weighted processes ---

  // Order process with realistic time weights (hours)
  // Some steps are fast (validation: 0.5h), some are slow (shipping: 48h)
  (() => {
    const f = buildFromRoutes('proc-order-timed', [
      ['receive', 'validate', 'pick', 'pack', 'ship', 'deliver', 'confirm'],
      ['receive', 'validate', 'backorder', 'pick', 'pack', 'ship', 'deliver', 'confirm'],
      ['receive', 'validate', 'pick', 'pack', 'express_ship', 'deliver', 'confirm'],
      ['receive', 'reject', 'notify', 'close'],
    ]);
    f.edgeWeights = {
      'receive→validate': 0.5, 'validate→pick': 2, 'validate→backorder': 24,
      'validate→reject': 0.1, 'backorder→pick': 48, 'pick→pack': 1,
      'pack→ship': 4, 'pack→express_ship': 1, 'ship→deliver': 48,
      'express_ship→deliver': 12, 'deliver→confirm': 2,
      'reject→notify': 0.5, 'notify→close': 0.1,
    };
    return f;
  })(),

  // Loan process with time weights (days)
  (() => {
    const f = buildFromRoutes('proc-loan-timed', [
      ['apply', 'screen', 'credit_check', 'appraise', 'underwrite', 'approve', 'fund', 'close'],
      ['apply', 'screen', 'credit_check', 'underwrite', 'approve', 'fund', 'close'],
      ['apply', 'screen', 'auto_decline', 'notify', 'close'],
    ]);
    f.edgeWeights = {
      'apply→screen': 1, 'screen→credit_check': 2, 'screen→auto_decline': 0.1,
      'credit_check→appraise': 5, 'credit_check→underwrite': 3,
      'appraise→underwrite': 7, 'underwrite→approve': 3, 'approve→fund': 2,
      'fund→close': 1, 'auto_decline→notify': 0.1, 'notify→close': 0.1,
    };
    return f;
  })(),

  // Staggered starts: routes enter the process at different points
  // Like a manufacturing line where components arrive at different stages
  buildFromRoutes('proc-staggered', [
    ['intake', 'inspect', 'prep', 'assemble', 'test', 'pack', 'ship'],
    ['intake', 'inspect', 'prep', 'rework', 'test', 'pack', 'ship'],
    ['supplier_A', 'prep', 'assemble', 'test', 'pack', 'ship'],
    ['supplier_B', 'assemble', 'test', 'pack', 'ship'],
    ['returns', 'inspect', 'rework', 'test', 'scrap'],
  ]),

  // --- Hand-crafted edge cases ---

  // All routes share a bottleneck
  buildFromRoutes('proc-bottleneck', [
    ['A', 'B', 'X', 'C', 'D'],
    ['E', 'F', 'X', 'G', 'H'],
    ['I', 'J', 'X', 'K', 'L'],
    ['M', 'N', 'X', 'O', 'P'],
  ]),

  // Two routes cross: A→B→D and C→B→E, with B as shared node
  buildFromRoutes('proc-crossing', [
    ['start', 'A', 'B', 'C', 'end1'],
    ['start', 'D', 'B', 'E', 'end2'],
    ['start', 'A', 'F', 'C', 'end1'],
    ['start', 'D', 'G', 'E', 'end2'],
  ]),

  // Long chain with one shortcut route
  buildFromRoutes('proc-shortcut', [
    ['begin', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'finish'],
    ['begin', 'S1', 'S4', 'S7', 'finish'],
    ['begin', 'S2', 'S3', 'S5', 'S6', 'finish'],
    ['begin', 'S1', 'S3', 'S5', 'S7', 'finish'],
  ]),

  // Diamond with multiple merge points
  buildFromRoutes('proc-multi-diamond', [
    ['in', 'A1', 'B1', 'merge1', 'C1', 'D1', 'merge2', 'out'],
    ['in', 'A2', 'B2', 'merge1', 'C2', 'D2', 'merge2', 'out'],
    ['in', 'A1', 'B2', 'merge1', 'C1', 'D2', 'merge2', 'out'],
    ['in', 'A2', 'B1', 'merge1', 'C2', 'D1', 'merge2', 'out'],
    ['in', 'A1', 'B1', 'merge1', 'C2', 'D1', 'merge2', 'out'],
  ]),
];
