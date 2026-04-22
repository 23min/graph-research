import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutMetro } from 'dag-map';
import { loadFixture, listFixtures } from '../../fixtures/loader.mjs';
import { checkInvariants, checkDeterminism } from '../checker.mjs';

// ── Happy path: all 32 fixtures produce valid layouts ─────────────

test('checkInvariants accepts layouts produced by layoutMetro on every fixture', async () => {
  for (const id of listFixtures()) {
    const fx = await loadFixture(id);
    const layout = layoutMetro(fx.dag, fx.opts);
    const result = checkInvariants({ dag: fx.dag, positions: layout.positions });
    assert.equal(result, null, `fixture ${id} should pass all invariants`);
  }
});

test('checkInvariants accepts a single-node layout (no edges)', () => {
  const dag = { nodes: [{ id: 'a' }], edges: [] };
  const positions = new Map([['a', { x: 0, y: 0 }]]);
  assert.equal(checkInvariants({ dag, positions }), null);
});

test('checkInvariants accepts an empty DAG', () => {
  const dag = { nodes: [], edges: [] };
  const positions = new Map();
  assert.equal(checkInvariants({ dag, positions }), null);
});

// ── Rule 1: forward-only edges in layer order ─────────────────────

test('checkInvariants rejects a back-edge in custom layer assignment (rule 1)', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 0 }],
  ]);
  const layers = new Map([['a', 2], ['b', 1]]);
  const result = checkInvariants({ dag, positions, layers });
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'forward-only-layers');
  assert.ok(result.detail, 'detail is present');
});

test('checkInvariants rejects equal layers on an edge (rule 1)', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 0 }],
  ]);
  const layers = new Map([['a', 0], ['b', 0]]);
  const result = checkInvariants({ dag, positions, layers });
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'forward-only-layers');
});

// ── Rule 2: forward-only edges in rendered X ──────────────────────

test('checkInvariants rejects a back-edge in rendered X (rule 2)', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([
    ['a', { x: 10, y: 0 }],
    ['b', { x: 0, y: 0 }],
  ]);
  const layers = new Map([['a', 0], ['b', 1]]);
  const result = checkInvariants({ dag, positions, layers });
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'forward-only-x');
});

test('checkInvariants rejects equal X on an edge (rule 2)', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([
    ['a', { x: 5, y: 0 }],
    ['b', { x: 5, y: 0 }],
  ]);
  const layers = new Map([['a', 0], ['b', 1]]);
  const result = checkInvariants({ dag, positions, layers });
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'forward-only-x');
});

// ── Rule 3: topological X across any pair in different layers ─────

test('checkInvariants rejects non-edge pair whose X disagrees with layer order (rule 3)', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [] };
  const positions = new Map([
    ['a', { x: 20, y: 0 }],
    ['b', { x: 10, y: 0 }],
  ]);
  const layers = new Map([['a', 0], ['b', 1]]);
  const result = checkInvariants({ dag, positions, layers });
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'topological-x');
});

test('checkInvariants accepts same-layer nodes with any X ordering (rule 3 only fires across layers)', () => {
  const dag = {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    edges: [['a', 'c'], ['b', 'c']],
  };
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 10 }],
    ['c', { x: 20, y: 5 }],
  ]);
  const layers = new Map([['a', 0], ['b', 0], ['c', 1]]);
  assert.equal(checkInvariants({ dag, positions, layers }), null);
});

// ── Disconnected components ──────────────────────────────────────

test('checkInvariants accepts a disconnected layout with two components', () => {
  const dag = {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
    edges: [['a', 'b'], ['c', 'd']],
  };
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 0 }],
    ['c', { x: 0, y: 20 }],
    ['d', { x: 10, y: 20 }],
  ]);
  assert.equal(checkInvariants({ dag, positions }), null);
});

// ── Layers auto-derived from dag when omitted ─────────────────────

test('checkInvariants derives layers from dag when none supplied', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 0 }],
  ]);
  assert.equal(checkInvariants({ dag, positions }), null);
});

// ── Error cases: malformed input throws ───────────────────────────

test('checkInvariants throws when invoked with no argument', () => {
  assert.throws(() => checkInvariants(), /dag/);
});

test('checkInvariants throws when dag is missing', () => {
  const positions = new Map([['a', { x: 0, y: 0 }]]);
  assert.throws(() => checkInvariants({ positions }), /dag/);
});

test('checkInvariants throws when dag.edges is missing', () => {
  const dag = { nodes: [{ id: 'a' }] };
  const positions = new Map([['a', { x: 0, y: 0 }]]);
  assert.throws(() => checkInvariants({ dag, positions }), /edges/);
});

test('checkInvariants throws when dag.nodes is missing', () => {
  const dag = { edges: [] };
  const positions = new Map();
  assert.throws(() => checkInvariants({ dag, positions }), /nodes/);
});

test('checkInvariants throws when positions is missing', () => {
  const dag = { nodes: [{ id: 'a' }], edges: [] };
  assert.throws(() => checkInvariants({ dag }), /positions/);
});

test('checkInvariants throws when positions is not a Map-like object', () => {
  const dag = { nodes: [{ id: 'a' }], edges: [] };
  assert.throws(() => checkInvariants({ dag, positions: { a: { x: 0, y: 0 } } }), /positions/);
});

test('checkInvariants throws when positions lacks a node from dag.nodes', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([['a', { x: 0, y: 0 }]]);
  assert.throws(() => checkInvariants({ dag, positions }), /position/);
});

test('checkInvariants throws when custom layers map omits a node', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] };
  const positions = new Map([['a', { x: 0, y: 0 }], ['b', { x: 10, y: 0 }]]);
  const layers = new Map([['a', 0]]);
  assert.throws(() => checkInvariants({ dag, positions, layers }), /layer/);
});

test('checkInvariants exercises the la > lb pair branch (first-node-in-later-layer)', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [] };
  const positions = new Map([
    ['a', { x: 10, y: 0 }],
    ['b', { x: 0, y: 0 }],
  ]);
  const layers = new Map([['a', 1], ['b', 0]]);
  assert.equal(checkInvariants({ dag, positions, layers }), null);
});

test('checkInvariants rule-3 detail reports the pair in layer order regardless of node-index order', () => {
  const dag = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [] };
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 0 }],
  ]);
  const layers = new Map([['a', 1], ['b', 0]]);
  const result = checkInvariants({ dag, positions, layers });
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'topological-x');
  assert.deepEqual(result.detail.pair, ['b', 'a']);
});

// ── checkDeterminism ─────────────────────────────────────────────

test('checkDeterminism returns null for identical layouts', async () => {
  const fx = await loadFixture('linear3');
  const a = layoutMetro(fx.dag, fx.opts);
  const b = layoutMetro(fx.dag, fx.opts);
  assert.equal(checkDeterminism(a, b), null);
});

test('checkDeterminism rejects when positions differ', () => {
  const a = { positions: new Map([['x', { x: 0, y: 0 }]]), routePaths: [], extraEdges: [] };
  const b = { positions: new Map([['x', { x: 1, y: 0 }]]), routePaths: [], extraEdges: [] };
  const result = checkDeterminism(a, b);
  assert.equal(result.rejected, true);
  assert.equal(result.rule, 'determinism');
});

test('checkDeterminism round-trips across loadFixture + layoutMetro for every fixture', async () => {
  for (const id of listFixtures()) {
    const fxA = await loadFixture(id);
    const fxB = await loadFixture(id);
    const layoutA = layoutMetro(fxA.dag, fxA.opts);
    const layoutB = layoutMetro(fxB.dag, fxB.opts);
    assert.equal(checkDeterminism(layoutA, layoutB), null, `fixture ${id} should be deterministic`);
  }
});
