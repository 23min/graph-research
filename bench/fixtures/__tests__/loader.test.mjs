import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFixture, listFixtures } from '../loader.mjs';

test('listFixtures returns all 32 fixture ids', () => {
  const ids = listFixtures();
  assert.ok(Array.isArray(ids), 'listFixtures returns an array');
  assert.equal(ids.length, 32, 'catalogue has 32 entries');
  assert.ok(ids.every(id => typeof id === 'string'), 'every entry is a string');
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
});

test('listFixtures includes the two dim variants', () => {
  const ids = listFixtures();
  assert.ok(ids.includes('mfg_dim'), 'mfg_dim is catalogued');
  assert.ok(ids.includes('pipeline_dim'), 'pipeline_dim is catalogued');
});

test('loadFixture returns the canonical shape for a known id', async () => {
  const fixture = await loadFixture('linear3');
  assert.equal(fixture.id, 'linear3');
  assert.equal(typeof fixture.name, 'string');
  assert.ok(fixture.name.length > 0, 'name is non-empty');
  assert.ok(fixture.dag && typeof fixture.dag === 'object', 'dag is present');
  assert.ok(Array.isArray(fixture.dag.nodes), 'dag.nodes is an array');
  assert.ok(Array.isArray(fixture.dag.edges), 'dag.edges is an array');
  assert.ok(Array.isArray(fixture.routes), 'routes is an array');
  assert.ok(fixture.theme && typeof fixture.theme === 'object', 'theme is present');
  assert.ok(fixture.opts && typeof fixture.opts === 'object', 'opts is present');
});

test('loadFixture carries the human-readable display label', async () => {
  const fixture = await loadFixture('linear3');
  assert.equal(fixture.name, '1 — Linear chain (3 nodes, 1 class)');
});

test('loadFixture returns only the canonical top-level keys', async () => {
  const fixture = await loadFixture('linear3');
  const expected = ['id', 'name', 'dag', 'routes', 'theme', 'opts'];
  assert.deepEqual(Object.keys(fixture).sort(), expected.slice().sort());
});

test('loadFixture is deterministic across calls (byte-identical JSON)', async () => {
  const a = await loadFixture('diamond');
  const b = await loadFixture('diamond');
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test('loadFixture returns independent copies (caller mutation does not leak)', async () => {
  const a = await loadFixture('linear3');
  a.dag.nodes.push({ id: 'injected', label: 'hacked' });
  const b = await loadFixture('linear3');
  assert.equal(b.dag.nodes.length, 3, 'second call is unaffected by mutation of the first');
});

test('loadFixture throws a clear error for an unknown id, listing available ids', async () => {
  await assert.rejects(
    () => loadFixture('no-such-fixture'),
    (err) => {
      assert.match(err.message, /no-such-fixture/, 'error mentions the unknown id');
      assert.match(err.message, /linear3/, 'error lists at least one available id');
      return true;
    },
  );
});

test('every catalogued id is loadable', async () => {
  const ids = listFixtures();
  for (const id of ids) {
    const fx = await loadFixture(id);
    assert.equal(fx.id, id, `fixture ${id} round-trips its id`);
    assert.ok(fx.dag.nodes.length > 0, `fixture ${id} has at least one node`);
  }
});

test('loadFixture handles a single-node fixture (single_node)', async () => {
  const fx = await loadFixture('single_node');
  assert.equal(fx.dag.nodes.length, 1);
  assert.equal(fx.dag.edges.length, 0);
});

test('loadFixture handles the minimal two-node fixture (two_node)', async () => {
  const fx = await loadFixture('two_node');
  assert.equal(fx.dag.nodes.length, 2);
  assert.equal(fx.dag.edges.length, 1);
});
