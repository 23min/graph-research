#!/usr/bin/env node
// print-pdf.mjs — render a curated selection of dag-map fixtures to an
// A2 PDF suitable for large-format printing (white background, vector).
//
// Two modes:
//   - grid   — single-variant layout, categorised tiles. Legacy shape.
//   - matrix — variants × fixtures comparison, one cell per pair.
//
// Usage:
//   node print/print-pdf.mjs [--selection <path>] [--out <path>]
//                            [--orientation landscape|portrait]
//                            [--layout 12up|4up|2up|1up|20up|24up|30up]
//                            [--tiles COLSxROWS]

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { dagMap } from '../../dag-map/src/index.js';
import { loadExperimentFixtures } from '../experiments/fixtures.mjs';
import { challengeGraphs } from '../fixtures/challenge/index.mjs';
import { models as internalModels } from '../../dag-map/test/models.js';
import {
  VARIANTS,
  variantLabel,
  renderVariant,
  createGACache,
} from './variants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

// ---- arg parsing -------------------------------------------------------

function parseArgs(argv) {
  const args = {
    selection: 'work/reports/showcase-selection.mjs',
    out: 'work/reports/showcase.pdf',
    orientation: 'landscape',
    layout: '12up',
    tiles: null, // overrides --layout if set
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--selection') args.selection = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--orientation') args.orientation = argv[++i];
    else if (a === '--layout') args.layout = argv[++i];
    else if (a === '--tiles') args.tiles = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node print/print-pdf.mjs [--selection <path>] [--out <path>] [--orientation landscape|portrait] [--layout 12up|4up|2up|1up|20up|24up|30up] [--tiles CxR]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  if (!['landscape', 'portrait'].includes(args.orientation)) {
    console.error(`Bad --orientation: ${args.orientation}`);
    process.exit(2);
  }
  if (!Object.prototype.hasOwnProperty.call(LAYOUTS, args.layout)) {
    console.error(`Bad --layout: ${args.layout}`);
    process.exit(2);
  }
  if (args.tiles !== null && !/^\d+x\d+$/i.test(args.tiles)) {
    console.error(`Bad --tiles: ${args.tiles} (expected COLSxROWS)`);
    process.exit(2);
  }
  return args;
}

function resolveMaybeRelative(p) {
  if (isAbsolute(p)) return p;
  return resolve(repoRoot, p);
}

// ---- selection & mode inference ---------------------------------------

// Match a selection entry against a loaded fixture. Source must match if
// provided. Id match is lenient: exact equality, or substring containment
// (so 'stockholm' matches 'metro-stockholm', 'dense-interchange' matches
// 'mlcm-dense-interchange', etc.).
function matchFixture(fixtures, entry) {
  const candidates = fixtures.filter(f => !entry.source || f.source === entry.source);
  const exact = candidates.find(f => f.id === entry.id);
  if (exact) return exact;
  const loose = candidates.find(f => typeof f.id === 'string' && f.id.includes(entry.id));
  return loose || null;
}

function inferMode(sel) {
  if (sel.mode) return sel.mode;
  if (Array.isArray(sel.variants) && Array.isArray(sel.fixtures)) return 'matrix';
  if (Array.isArray(sel.categories)) return 'grid';
  throw new Error('Selection has neither categories (grid) nor variants+fixtures (matrix).');
}

async function loadSelection(selectionPath) {
  const abs = resolveMaybeRelative(selectionPath);
  if (!existsSync(abs)) {
    throw new Error(`Selection file not found: ${abs}`);
  }
  const mod = await import(pathToFileURL(abs).href);
  const sel = mod.default;
  if (!sel) {
    throw new Error(`Selection module must default-export a selection object`);
  }
  const mode = inferMode(sel);
  if (mode === 'grid' && !Array.isArray(sel.categories)) {
    throw new Error(`Grid selection needs { categories: [...] }`);
  }
  if (mode === 'matrix' && (!Array.isArray(sel.variants) || !Array.isArray(sel.fixtures))) {
    throw new Error(`Matrix selection needs { variants: [...], fixtures: [...] }`);
  }
  return { ...sel, mode };
}

async function loadAllFixtures() {
  const base = await loadExperimentFixtures();
  // loadExperimentFixtures() doesn't include the challenge tier — pull it
  // in directly so the selection can reference it. Tag as 'challenge'.
  const already = new Set(base.map(f => f.id));
  const challenge = challengeGraphs
    .filter(g => !already.has(g.id))
    .map(g => ({ ...g, source: 'challenge' }));
  // loadExperimentFixtures() filters internal models to nodes.length >= 8,
  // which drops small-but-useful fixtures like `loan_approval` (6 nodes).
  // Re-add any internal model not already present.
  const extraInternal = internalModels
    .filter(m => !already.has(m.id))
    .map(m => ({ ...m, source: 'internal' }));
  return [...base, ...challenge, ...extraInternal];
}

// ---- white theme (grid mode, single-variant metro render) -------------
// Variants mode uses the equivalents in variants.mjs. Grid mode renders
// via dagMap() directly and keeps this local copy.
const LIGHT_SURFACES = {
  paper:  '#FFFFFF',
  ink:    '#2C2C2C',
  muted:  '#8C8680',
  border: '#D4CFC7',
};

function whiteTheme(fixtureTheme) {
  if (!fixtureTheme || typeof fixtureTheme === 'string') {
    return { ...LIGHT_SURFACES };
  }
  return { ...fixtureTheme, ...LIGHT_SURFACES };
}

function forceWhiteBackground(svg) {
  return svg.replace(
    /(<rect\b[^>]*?\bwidth="[^"]+"[^>]*?\bheight="[^"]+"[^>]*?\bfill=")[^"]+(")/,
    '$1#FFFFFF$2'
  );
}

function makeResponsive(svg) {
  let out = svg;
  if (!/preserveAspectRatio=/.test(out)) {
    out = out.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid meet"');
  }
  out = out.replace(/(<svg\b[^>]*?)\swidth="[^"]+"/, '$1 width="100%"');
  out = out.replace(/(<svg\b[^>]*?)\sheight="[^"]+"/, '$1 height="100%"');
  out = out.replace(
    /<svg\b/,
    '<svg style="display:block;width:100%;height:100%"'
  );
  return out;
}

function renderFixtureSvg(fixture) {
  const opts = {
    ...(fixture.opts || {}),
    theme: whiteTheme(fixture.theme),
    labelSize: 1.2,
  };
  if (fixture.routes) opts.routes = fixture.routes;
  const { svg } = dagMap(fixture.dag, opts);
  return makeResponsive(forceWhiteBackground(svg));
}

// ---- Layout shapes ----------------------------------------------------

// Layouts for --layout flag. Each entry maps orientation to [cols, rows].
// Matrix mode derives shape from variants × fixtures and ignores --layout
// unless --tiles is also specified.
const LAYOUTS = {
  '12up': { landscape: [4, 3], portrait: [3, 4] },
  '4up':  { landscape: [2, 2], portrait: [2, 2] },
  '2up':  { landscape: [2, 1], portrait: [1, 2] },
  '1up':  { landscape: [1, 1], portrait: [1, 1] },
  '20up': { landscape: [5, 4], portrait: [4, 5] },
  '24up': { landscape: [6, 4], portrait: [4, 6] },
  '30up': { landscape: [6, 5], portrait: [5, 6] },
};

function gridShape(layout, orientation) {
  const [cols, rows] = LAYOUTS[layout][orientation];
  return { cols, rows, perPage: cols * rows };
}

function parseTiles(tiles) {
  // 'CxR' → { cols, rows }. parseArgs has already validated the format.
  const [c, r] = tiles.toLowerCase().split('x').map(Number);
  return { cols: c, rows: r, perPage: c * r };
}

// ---- HTML generation --------------------------------------------------

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Grid mode — the legacy page shape. Categorised tiles, one variant.
function buildGridHtml(selection, tiles, { orientation, cols, rows, title }) {
  const pageSize = `A2 ${orientation}`;
  const perPage = cols * rows;
  const pages = [];
  for (let i = 0; i < tiles.length; i += perPage) {
    pages.push(tiles.slice(i, i + perPage));
  }

  const style = `
    @page { size: ${pageSize}; margin: 15mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; color: black;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .page { width: 100%; display: flex; flex-direction: column;
      page-break-after: always; height: 100vh; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
    h1 { margin: 0 0 3mm; font-size: 13pt; font-weight: 600;
      letter-spacing: 0.02em; flex: 0 0 auto; }
    h1 .sub { font-weight: 400; color: #555; font-size: 9pt; margin-left: 6mm; }
    .grid { display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      grid-template-rows: repeat(${rows}, 1fr);
      gap: 5mm; flex: 1 1 auto; min-height: 0; }
    .cell { border: 0.5px solid #bbb; padding: 3mm; display: flex;
      flex-direction: column; min-width: 0; min-height: 0; background: white;
      break-inside: avoid; overflow: hidden; }
    .cell .svg-wrap { flex: 1 1 auto; min-height: 0; display: flex;
      align-items: center; justify-content: center; overflow: hidden; }
    .cell .svg-wrap svg { display: block; max-width: 100%; max-height: 100%;
      width: 100%; height: 100%; background: white; }
    .caption { font-size: 8pt; margin-top: 2mm; color: #333; flex: 0 0 auto;
      display: flex; justify-content: space-between; gap: 4mm; }
    .caption .name { font-weight: 600; }
    .caption .cat { color: #888; font-size: 7pt; text-transform: uppercase;
      letter-spacing: 0.04em; }
    .caption .meta { color: #888; font-family: ui-monospace, monospace;
      font-size: 7pt; }
    .missing { color: #a00; font-size: 9pt; padding: 4mm; }
  `;

  const renderTile = (tile) => {
    if (tile.missing) {
      return `<div class="cell"><div class="svg-wrap"><div class="missing">Missing: ${escapeHtml(tile.entry.source || '')}/${escapeHtml(tile.entry.id)}</div></div>
        <div class="caption"><span class="name">${escapeHtml(tile.entry.id)}</span><span class="cat">${escapeHtml(tile.category)}</span></div></div>`;
    }
    const f = tile.fixture;
    const nCount = f.dag.nodes.length;
    const eCount = f.dag.edges.length;
    return `<div class="cell">
      <div class="svg-wrap">${tile.svg}</div>
      <div class="caption">
        <span class="name">${escapeHtml(f.id)} <span class="cat">${escapeHtml(tile.category)}</span></span>
        <span class="meta">${escapeHtml(f.source || '')} · n=${nCount} · e=${eCount}</span>
      </div>
    </div>`;
  };

  const pagesHtml = pages.map((pageTiles, idx) => `
    <section class="page">
      ${idx === 0 ? `<h1>${escapeHtml(title)}<span class="sub">A2 · ${escapeHtml(orientation)} · ${cols}×${rows}</span></h1>` : '<div></div>'}
      <div class="grid">${pageTiles.map(renderTile).join('\n')}</div>
    </section>
  `).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${style}</style></head>
<body>${pagesHtml}</body></html>`;
}

// Matrix mode — variants × fixtures. Column headers show variants,
// left-gutter shows fixture labels. One page per matrix (tiles array is
// row-major: fixtures outer, variants inner).
function buildMatrixHtml(selection, tiles, { orientation, cols, rows, title }) {
  const pageSize = `A2 ${orientation}`;

  // Header row height and gutter width in mm. Kept compact so the matrix
  // cells still dominate the page.
  const HEADER_MM = 18;
  const GUTTER_MM = 28;

  // Pull variant labels (col headers) and fixture labels (row labels) out
  // of the first row / first column. A tile carries `.variantLabel` and
  // `.fixtureLabel` set when the tiles array was built.
  const variantLabels = [];
  for (let c = 0; c < cols; c++) {
    variantLabels.push(tiles[c]?.variantLabel || '');
  }
  const fixtureLabels = [];
  for (let r = 0; r < rows; r++) {
    fixtureLabels.push(tiles[r * cols]?.fixtureLabel || '');
  }

  const style = `
    @page { size: ${pageSize}; margin: 15mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; color: black;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .page { width: 100%; height: 100vh; display: flex; flex-direction: column;
      page-break-after: auto; overflow: hidden; }
    h1 { margin: 0 0 3mm; font-size: 13pt; font-weight: 600;
      letter-spacing: 0.02em; flex: 0 0 auto; }
    h1 .sub { font-weight: 400; color: #555; font-size: 9pt; margin-left: 6mm; }
    .matrix {
      display: grid;
      grid-template-columns: ${GUTTER_MM}mm repeat(${cols}, 1fr);
      grid-template-rows: ${HEADER_MM}mm repeat(${rows}, 1fr);
      gap: 1mm;
      flex: 1 1 auto; min-height: 0;
    }
    .corner { /* top-left empty cell */ }
    .col-header {
      display: flex; align-items: center; justify-content: center;
      font-size: 11pt; font-weight: 600; text-align: center;
      border-bottom: 0.6px solid #666; background: white;
      padding: 2mm; line-height: 1.2;
    }
    .row-label {
      display: flex; align-items: center; justify-content: center;
      font-size: 9pt; font-weight: 600; text-align: center;
      border-right: 0.6px solid #666; background: white;
      padding: 2mm; line-height: 1.2;
    }
    .cell {
      border: 0.4px solid #ccc; background: white;
      display: flex; flex-direction: column;
      min-width: 0; min-height: 0; overflow: hidden;
    }
    .cell .svg-wrap {
      flex: 1 1 auto; min-height: 0;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; padding: 1mm;
    }
    .cell .svg-wrap svg {
      display: block; width: 100%; height: 100%;
      max-width: 100%; max-height: 100%; background: white;
    }
    .cell .error-note {
      color: #999; font-size: 9pt; padding: 3mm; text-align: center;
    }
    .cell .meta {
      font-size: 6.5pt; color: #888; padding: 0.5mm 2mm;
      font-family: ui-monospace, monospace;
      border-top: 0.3px solid #eee; flex: 0 0 auto;
    }
  `;

  const cellHtml = (tile) => {
    if (!tile) return '<div class="cell"></div>';
    if (tile.missing) {
      return `<div class="cell"><div class="svg-wrap"><div class="error-note">Missing fixture</div></div></div>`;
    }
    const f = tile.fixture;
    const n = f?.dag?.nodes?.length ?? 0;
    const e = f?.dag?.edges?.length ?? 0;
    const r = f?.routes?.length ?? 0;
    const meta = `n=${n} · e=${e} · r=${r}`;
    return `<div class="cell">
      <div class="svg-wrap">${tile.svg}</div>
      <div class="meta">${escapeHtml(meta)}</div>
    </div>`;
  };

  // Build matrix body in DOM order: row 0 is headers (corner + col-headers),
  // subsequent rows are (row-label + cells).
  const parts = [];
  parts.push('<div class="corner"></div>');
  for (const vLabel of variantLabels) {
    parts.push(`<div class="col-header">${escapeHtml(vLabel)}</div>`);
  }
  for (let r = 0; r < rows; r++) {
    parts.push(`<div class="row-label">${escapeHtml(fixtureLabels[r])}</div>`);
    for (let c = 0; c < cols; c++) {
      parts.push(cellHtml(tiles[r * cols + c]));
    }
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${style}</style></head>
<body>
  <section class="page">
    <h1>${escapeHtml(title)}<span class="sub">A2 · ${escapeHtml(orientation)} · ${cols}×${rows} matrix</span></h1>
    <div class="matrix">${parts.join('\n')}</div>
  </section>
</body></html>`;
}

// ---- Tile building per mode -------------------------------------------

function buildGridTiles(selection, fixtures) {
  const tiles = [];
  for (const category of selection.categories) {
    for (const entry of category.fixtures) {
      const fixture = matchFixture(fixtures, entry);
      if (!fixture) {
        console.warn(`! Missing fixture: ${entry.source || '?'}/${entry.id}`);
        tiles.push({ missing: true, entry, category: category.label });
        continue;
      }
      try {
        const svg = renderFixtureSvg(fixture);
        tiles.push({ fixture, svg, category: category.label, entry });
        console.log(`  ${fixture.source}/${fixture.id}`);
      } catch (err) {
        console.warn(`! Render failed for ${fixture.id}: ${err.message}`);
        tiles.push({ missing: true, entry: { ...entry, id: `${entry.id} (error)` }, category: category.label });
      }
    }
  }
  return tiles;
}

function buildMatrixTiles(selection, fixtures) {
  const variants = selection.variants;
  const entries = selection.fixtures;
  const gaCache = createGACache();

  // Tiles are row-major: fixtures are rows, variants are columns.
  const tiles = [];
  for (const entry of entries) {
    const fixture = matchFixture(fixtures, entry);
    if (!fixture) {
      console.warn(`! Missing fixture: ${entry.source || '?'}/${entry.id}`);
      for (const variantName of variants) {
        tiles.push({
          missing: true,
          entry,
          variantName,
          variantLabel: variantLabel(variantName),
          fixtureLabel: entry.label || entry.id,
        });
      }
      continue;
    }
    const fixtureLabel = entry.label || fixture.id;
    // Merge selection-entry opts onto the fixture so per-fixture tuning
    // (e.g. labelSize, scale) flows through renderVariant.
    const tunedFixture = entry.opts
      ? { ...fixture, opts: { ...(fixture.opts || {}), ...entry.opts } }
      : fixture;
    for (const variantName of variants) {
      const { svg, error } = renderVariant(tunedFixture, variantName, { gaCache });
      tiles.push({
        fixture,
        svg,
        error: error || null,
        variantName,
        variantLabel: variantLabel(variantName),
        fixtureLabel,
      });
      const marker = error ? `! ${error.slice(0, 40)}` : '';
      console.log(`  ${fixture.source}/${fixture.id} × ${variantName}${marker ? ' — ' + marker : ''}`);
    }
  }
  return tiles;
}

// ---- main --------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const selection = await loadSelection(args.selection);
  const fixtures = await loadAllFixtures();

  let tiles, shape;
  if (selection.mode === 'matrix') {
    tiles = buildMatrixTiles(selection, fixtures);
    // Matrix shape is derived from the selection; --tiles overrides.
    if (args.tiles) {
      shape = parseTiles(args.tiles);
    } else {
      shape = {
        cols: selection.variants.length,
        rows: selection.fixtures.length,
        perPage: selection.variants.length * selection.fixtures.length,
      };
    }
  } else {
    tiles = buildGridTiles(selection, fixtures);
    shape = args.tiles ? parseTiles(args.tiles) : gridShape(args.layout, args.orientation);
  }

  const title = selection.title || 'dag-map showcase';
  const html = selection.mode === 'matrix'
    ? buildMatrixHtml(selection, tiles, { orientation: args.orientation, cols: shape.cols, rows: shape.rows, title })
    : buildGridHtml(selection, tiles, { orientation: args.orientation, cols: shape.cols, rows: shape.rows, title });

  const outAbs = resolveMaybeRelative(args.out);
  await mkdir(dirname(outAbs), { recursive: true });

  // Write HTML alongside the PDF for debugging / inspection.
  const htmlAbs = outAbs.replace(/\.pdf$/i, '.html');
  await writeFile(htmlAbs, html, 'utf8');

  // Render to PDF via Playwright.
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('playwright is not available. Run: cd bench && npm install');
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error('Failed to launch chromium. If browsers are missing, run:');
    console.error('  cd bench && npx playwright install chromium');
    console.error(`Underlying error: ${err.message}`);
    process.exit(1);
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    // A2: 420 × 594 mm. Landscape swaps. preferCSSPageSize=true lets the
    // CSS @page rule drive size and margins; width/height below are the
    // fallback if no @page rule is present.
    const width = args.orientation === 'landscape' ? '594mm' : '420mm';
    const height = args.orientation === 'landscape' ? '420mm' : '594mm';
    await page.pdf({
      path: outAbs,
      width,
      height,
      printBackground: false,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }

  const missingCount = tiles.filter(t => t.missing).length;
  const errorCount = tiles.filter(t => t.error).length;
  console.log(`\nMode: ${selection.mode}`);
  console.log(`Shape: ${shape.cols}×${shape.rows} (${tiles.length} tiles)`);
  console.log(`PDF: ${outAbs}`);
  console.log(`HTML: ${htmlAbs}`);
  console.log(`Missing fixtures: ${missingCount}`);
  console.log(`Render errors: ${errorCount}`);
}

// Run only when invoked directly.
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch(e => { console.error(e); process.exit(1); });
}

export {
  main,
  parseArgs,
  matchFixture,
  loadAllFixtures,
  whiteTheme,
  forceWhiteBackground,
  makeResponsive,
  gridShape,
  parseTiles,
  inferMode,
  buildGridTiles,
  buildMatrixTiles,
  buildGridHtml,
  buildMatrixHtml,
  LAYOUTS,
  VARIANTS,
};
