#!/usr/bin/env node
// compare-flow.mjs — Mode 2 comparison page.
// Process flow layout variants vs Metro (Mode 1) reference.

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dagMap } from '../../dag-map/src/index.js';
import { layoutFlow } from '../../dag-map/src/layout-flow.js';
import { layoutProcess } from '../../dag-map/src/layout-process.js';
import { renderProcess } from '../../dag-map/src/render-process.js';
import { renderSVG } from '../../dag-map/src/render.js';
import { createStationRenderer, createEdgeRenderer } from '../../dag-map/src/render-flow-station.js';
import { evolveProcessLayout } from '../direct/process-ga.mjs';
import { loadExperimentFixtures } from './fixtures.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const VERSIONS = {
  'metro-ref': {
    label: 'Metro (Mode 1)',
    engine: 'metro',
    opts: {
      strategies: { orderNodes: 'hybrid', reduceCrossings: 'none', assignLanes: 'ordered', positionX: 'compact' },
      mainSpacing: 26, subSpacing: 40,
    },
  },
  'process-ltr': {
    label: 'Process LTR',
    engine: 'process',
    opts: { direction: 'ltr', scale: 1.5 },
  },
  'process-ttb': {
    label: 'Process TTB',
    engine: 'process',
    opts: { direction: 'ttb', scale: 1.5 },
  },
  'process-bundled': {
    label: 'Process Bundled',
    engine: 'process',
    opts: { direction: 'ltr', scale: 1.5, bundling: true },
  },
  'flow-legacy': {
    label: 'Flow Legacy',
    engine: 'flow-legacy',
    opts: { direction: 'ltr', scale: 1.0 },
  },
};

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = join(__dirname, 'results', 'flow-' + timestamp);
  await mkdir(outDir, { recursive: true });

  const allFixtures = await loadExperimentFixtures();
  const fixtures = allFixtures.filter(f => f.routes && f.routes.length > 0);

  const versionNames = Object.keys(VERSIONS);

  console.log(`Comparing ${versionNames.length} versions × ${fixtures.length} fixtures`);

  const results = [];

  for (const f of fixtures) {
    const entry = { id: f.id, source: f.source, nodes: f.dag.nodes.length, edges: f.dag.edges.length, routes: f.routes.length, versions: {} };

    // Run GA to find optimal route ordering for this fixture
    let optimizedRoutes = f.routes;
    if (f.routes.length > 1 && f.routes.length <= 10) {
      const ga = evolveProcessLayout(f.dag, f.routes, {
        populationSize: 20,
        generations: 40,
        direction: 'ltr',
      });
      if (ga.bestFitness.crossings < 999) {
        optimizedRoutes = ga.bestPermutation.map(i => f.routes[i]);
        const defaultX = ga.history.length > 0 ? ga.history[0] : null;
        if (ga.bestFitness.crossings === 0) {
          console.log(`  GA: ${f.id} → 0 crossings [${ga.bestPermutation}]`);
        } else if (defaultX && ga.bestFitness.crossings < defaultX.crossings) {
          console.log(`  GA: ${f.id} → ${ga.bestFitness.crossings} crossings (was more) [${ga.bestPermutation}]`);
        }
      }
    }

    for (const [vName, version] of Object.entries(VERSIONS)) {
      try {
        // Process versions use GA-optimized routes, others use original
        const useRoutes = version.engine === 'process' ? optimizedRoutes : f.routes;
        const baseOpts = { theme: f.theme || 'cream', ...(f.opts || {}), routes: useRoutes };
        const mergedOpts = { ...baseOpts, ...version.opts };
        if (version.opts?.strategies) mergedOpts.strategies = { ...version.opts.strategies };

        let svg;
        if (version.engine === 'flow-legacy') {
          const layout = layoutFlow(f.dag, { ...mergedOpts, routes: f.routes, labelSize: 1.2 });
          const renderNode = createStationRenderer(layout, f.routes);
          const renderEdge = createEdgeRenderer(layout);
          svg = renderSVG(f.dag, layout, { ...mergedOpts, routes: f.routes, labelSize: 1.2, renderNode, renderEdge });
        } else if (version.engine === 'process') {
          const layout = layoutProcess(f.dag, mergedOpts);
          svg = renderProcess(f.dag, layout, mergedOpts);
        } else {
          svg = dagMap(f.dag, mergedOpts).svg;
        }
        // Keep original for modal zoom, strip width/height for grid cell
        const svgFull = svg;
        svg = svg.replace(/(<svg[^>]*?)\s+width="[^"]*"/, '$1');
        svg = svg.replace(/(<svg[^>]*?)\s+height="[^"]*"/, '$1');
        svg = svg.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');
        entry.versions[vName] = { svg, svgFull, label: version.label };
      } catch (err) {
        console.error(`  ✗ ${f.id} / ${vName}:`, err.message);
        entry.versions[vName] = { svg: `<svg width="200" height="60"><text x="10" y="30" fill="red">${err.message.slice(0, 80)}</text></svg>`, label: version.label };
      }
    }

    console.log('✓', f.id, `(${f.routes.length} routes)`);
    results.push(entry);
  }

  // Build HTML
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Process Flow Comparison ${timestamp}</title>
<style>
body { font-family: -apple-system, sans-serif; margin: 0; padding: 16px; background: #f0f0f0; }
h1 { font-size: 20px; margin-bottom: 4px; }
.meta { font-size: 12px; color: #666; margin-bottom: 16px; }
.fixture { background: white; margin-bottom: 24px; padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.fixture h2 { font-size: 14px; color: #333; margin: 0 0 2px; }
.fixture .info { font-size: 11px; color: #999; margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: repeat(${versionNames.length}, 1fr); gap: 8px; }
.cell { border: 1px solid #e0e0e0; border-radius: 4px; padding: 6px; overflow: hidden; cursor: pointer; }
.cell:hover { border-color: #4a90d9; }
.cell h3 { font-size: 11px; color: #666; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.svg-wrap img { max-width: 100%; max-height: 450px; display: block; }
.modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; cursor: pointer; overflow: auto; }
.modal.open { display: flex; align-items: flex-start; justify-content: center; padding: 20px; }
.modal-content { background: white; border-radius: 8px; padding: 16px; overflow: auto; max-width: 95vw; max-height: 95vh; }
.modal-content h3 { margin: 0 0 8px; font-size: 14px; color: #333; }
.modal-content svg { display: block; max-width: none; width: auto; height: auto; }
.modal-content img { display: block; max-width: 90vw; max-height: 85vh; }
.tooltip { position: fixed; background: #333; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 2000; display: none; }
</style></head><body>

<div class="modal" id="modal" onclick="this.classList.remove('open')">
  <div class="modal-content" onclick="event.stopPropagation()">
    <h3 id="modal-title"></h3>
    <div id="modal-svg"></div>
  </div>
</div>
<div class="tooltip" id="tooltip"></div>

<script>
function showModal(cell) {
  const title = cell.querySelector('h3')?.textContent || '';
  const fixture = cell.closest('.fixture')?.querySelector('h2')?.textContent || '';
  document.getElementById('modal-title').textContent = fixture + ' — ' + title;
  const img = cell.querySelector('img');
  const fullSrc = img?.getAttribute('data-full') || '';
  if (fullSrc) {
    // Decode base64 SVG (UTF-8 safe) and insert inline for tooltip support
    const b64 = fullSrc.replace('data:image/svg+xml;base64,', '');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const svgText = new TextDecoder().decode(bytes);
    document.getElementById('modal-svg').innerHTML = svgText;
  } else {
    document.getElementById('modal-svg').innerHTML = '';
  }
  document.getElementById('modal').classList.add('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('modal').classList.remove('open'); });
const tip = document.getElementById('tooltip');
document.addEventListener('mouseover', e => {
  const node = e.target.closest('[data-node-id]');
  if (node) {
    const label = node.querySelector('text')?.textContent || node.getAttribute('data-node-id');
    tip.textContent = label;
    tip.style.display = 'block';
  }
});
document.addEventListener('mousemove', e => { if (tip.style.display === 'block') { tip.style.left = (e.clientX+12)+'px'; tip.style.top = (e.clientY-8)+'px'; } });
document.addEventListener('mouseout', e => { if (e.target.closest('[data-node-id]')) tip.style.display = 'none'; });
</script>

<h1>Mode 2: Process Flow Comparison</h1>
<div class="meta">${versionNames.length} versions × ${fixtures.length} fixtures | Sugiyama card-centric layout vs Metro and Flow Legacy</div>`;

  for (const r of results) {
    html += `<div class="fixture"><h2>${r.id}</h2><div class="info">${r.source} — ${r.nodes} nodes, ${r.edges} edges, ${r.routes} routes</div><div class="grid">`;
    for (const vName of versionNames) {
      const v = r.versions[vName];
      if (!v) continue;
      const b64 = Buffer.from(v.svg).toString('base64');
      const b64Full = Buffer.from(v.svgFull).toString('base64');
      html += `<div class="cell" onclick="showModal(this)"><h3>${v.label || vName}</h3><div class="svg-wrap"><img src="data:image/svg+xml;base64,${b64}" data-full="data:image/svg+xml;base64,${b64Full}"></div></div>`;
    }
    html += `</div></div>`;
  }

  html += `</body></html>`;
  await writeFile(join(outDir, 'comparison.html'), html);
  console.log(`\nResults: ${outDir}/comparison.html`);
}

main().catch(e => { console.error(e); process.exit(1); });
