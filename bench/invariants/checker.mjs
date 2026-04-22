export function checkInvariants({ dag, positions, layers } = {}) {
  if (!dag || !Array.isArray(dag.edges) || !Array.isArray(dag.nodes)) {
    throw new TypeError('checkInvariants: dag with nodes and edges arrays is required');
  }
  if (!positions || typeof positions.get !== 'function') {
    throw new TypeError('checkInvariants: positions (Map) is required');
  }
  const layerMap = layers ?? computeLayers(dag);
  for (const n of dag.nodes) {
    if (!layerMap.has(n.id)) {
      throw new TypeError(`checkInvariants: layer missing for node "${n.id}"`);
    }
    if (!positions.has(n.id)) {
      throw new TypeError(`checkInvariants: position missing for node "${n.id}"`);
    }
  }

  for (const [u, v] of dag.edges) {
    const lu = layerMap.get(u);
    const lv = layerMap.get(v);
    if (!(lu < lv)) {
      return { rejected: true, rule: 'forward-only-layers', detail: { edge: [u, v], layers: { [u]: lu, [v]: lv } } };
    }
  }

  for (const [u, v] of dag.edges) {
    const xu = positions.get(u).x;
    const xv = positions.get(v).x;
    if (!(xu < xv)) {
      return { rejected: true, rule: 'forward-only-x', detail: { edge: [u, v], x: { [u]: xu, [v]: xv } } };
    }
  }

  const ids = dag.nodes.map(n => n.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const la = layerMap.get(a), lb = layerMap.get(b);
      if (la === lb) continue;
      const [earlier, later, xE, xL, lE, lL] = la < lb
        ? [a, b, positions.get(a).x, positions.get(b).x, la, lb]
        : [b, a, positions.get(b).x, positions.get(a).x, lb, la];
      if (!(xE < xL)) {
        return {
          rejected: true,
          rule: 'topological-x',
          detail: { pair: [earlier, later], layers: { [earlier]: lE, [later]: lL }, x: { [earlier]: xE, [later]: xL } },
        };
      }
    }
  }

  return null;
}

export function checkDeterminism(a, b) {
  const sA = canonicalJson(renderSubset(a));
  const sB = canonicalJson(renderSubset(b));
  if (sA === sB) return null;
  return { rejected: true, rule: 'determinism', detail: { bytesA: sA.length, bytesB: sB.length } };
}

function renderSubset(layout) {
  return {
    positions: layout.positions,
    routePaths: layout.routePaths,
    extraEdges: layout.extraEdges,
  };
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (value instanceof Map) {
    const entries = [...value.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)));
    return Object.fromEntries(entries.map(([k, v]) => [k, canonicalize(v)]));
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) out[k] = canonicalize(value[k]);
    return out;
  }
  return value;
}

function computeLayers(dag) {
  const inDeg = new Map();
  const children = new Map();
  for (const n of dag.nodes) {
    inDeg.set(n.id, 0);
    children.set(n.id, []);
  }
  for (const [u, v] of dag.edges) {
    inDeg.set(v, inDeg.get(v) + 1);
    children.get(u).push(v);
  }
  const rank = new Map();
  const queue = [];
  for (const n of dag.nodes) {
    if (inDeg.get(n.id) === 0) {
      rank.set(n.id, 0);
      queue.push(n.id);
    }
  }
  while (queue.length) {
    const u = queue.shift();
    for (const v of children.get(u)) {
      rank.set(v, Math.max(rank.get(v) ?? 0, rank.get(u) + 1));
      inDeg.set(v, inDeg.get(v) - 1);
      if (inDeg.get(v) === 0) queue.push(v);
    }
  }
  return rank;
}
