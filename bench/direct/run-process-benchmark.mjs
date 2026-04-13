#!/usr/bin/env node
// run-process-benchmark.mjs — Run the process layout GA across all fixtures.
// Logs default vs evolved crossings, best permutations, and patterns
// for rule extraction.

import { runBenchmark } from './process-ga.mjs';
import { loadExperimentFixtures } from '../experiments/fixtures.mjs';

const direction = process.argv.includes('--ttb') ? 'ttb' : 'ltr';
const generations = parseInt(process.argv.find(a => a.startsWith('--gen='))?.split('=')[1] || '50');

console.log(`\n=== Process Layout GA Benchmark (${direction.toUpperCase()}, ${generations} generations) ===\n`);

const allFixtures = await loadExperimentFixtures();
const fixtures = allFixtures.filter(f => f.routes && f.routes.length > 1 && f.source !== 'metro');

const results = await runBenchmark(fixtures, { direction, generations });

// Summary
console.log('\n=== SUMMARY ===\n');
const totalDefaultX = results.reduce((s, r) => s + r.default.crossings, 0);
const totalEvolvedX = results.reduce((s, r) => s + r.evolved.crossings, 0);
const improved = results.filter(r => r.improved);

console.log(`Fixtures: ${results.length}`);
console.log(`Default crossings: ${totalDefaultX}`);
console.log(`Evolved crossings: ${totalEvolvedX}`);
console.log(`Improvement: ${totalDefaultX - totalEvolvedX} crossings eliminated`);
console.log(`Fixtures improved: ${improved.length}/${results.length}`);

if (improved.length > 0) {
  console.log('\n=== RULE EXTRACTION ===\n');
  console.log('Fixtures where GA found better ordering:\n');
  for (const r of improved) {
    console.log(`  ${r.id}: [${r.bestPerm}] → ${r.default.crossings}→${r.evolved.crossings} crossings`);
    // Analyze: what's different about the winning permutation?
    const defaultOrder = Array.from({ length: r.routes }, (_, i) => i);
    const changes = [];
    for (let i = 0; i < r.bestPerm.length; i++) {
      if (r.bestPerm[i] !== defaultOrder[i]) {
        changes.push(`R${defaultOrder[i]}→pos${i}`);
      }
    }
    if (changes.length > 0) console.log(`    Changes: ${changes.join(', ')}`);
  }
}

// Pattern analysis: do longer routes tend to be first in winning permutations?
console.log('\n=== PATTERN ANALYSIS ===\n');
for (const r of results) {
  if (!r.improved) continue;
  const routeLengths = r.bestPerm.map((ri, pos) => ({
    ri, pos, length: allFixtures.find(f => f.id === r.id).routes[ri].nodes.length,
  }));
  routeLengths.sort((a, b) => a.pos - b.pos);
  const firstIsLongest = routeLengths[0].length >= Math.max(...routeLengths.map(r => r.length));
  console.log(`  ${r.id}: first=${routeLengths[0].length} nodes, max=${Math.max(...routeLengths.map(r => r.length))} → ${firstIsLongest ? 'trunk-first ✓' : 'NOT trunk-first'}`);
}
