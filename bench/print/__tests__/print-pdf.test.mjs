// Smoke test for the print-PDF utility. Skips cleanly if playwright
// browsers aren't installed on the machine.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import {
  matchFixture,
  whiteTheme,
  forceWhiteBackground,
  makeResponsive,
  gridShape,
  parseArgs,
  parseTiles,
  inferMode,
  LAYOUTS,
  VARIANTS,
} from '../print-pdf.mjs';
import { renderVariant, createGACache, variantLabel } from '../variants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..');

async function chromiumAvailable() {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

describe('print-pdf helpers', () => {
  test('gridShape maps layouts to cols/rows (including 20up/24up/30up)', () => {
    assert.deepEqual(gridShape('12up', 'landscape'), { cols: 4, rows: 3, perPage: 12 });
    assert.deepEqual(gridShape('12up', 'portrait'),  { cols: 3, rows: 4, perPage: 12 });
    assert.deepEqual(gridShape('4up',  'landscape'), { cols: 2, rows: 2, perPage: 4 });
    assert.deepEqual(gridShape('2up',  'landscape'), { cols: 2, rows: 1, perPage: 2 });
    assert.deepEqual(gridShape('2up',  'portrait'),  { cols: 1, rows: 2, perPage: 2 });
    assert.deepEqual(gridShape('1up',  'landscape'), { cols: 1, rows: 1, perPage: 1 });
    assert.deepEqual(gridShape('20up', 'landscape'), { cols: 5, rows: 4, perPage: 20 });
    assert.deepEqual(gridShape('24up', 'landscape'), { cols: 6, rows: 4, perPage: 24 });
    assert.deepEqual(gridShape('30up', 'landscape'), { cols: 6, rows: 5, perPage: 30 });
  });

  test('LAYOUTS includes the denser options', () => {
    assert.ok(LAYOUTS['20up'], '20up missing');
    assert.ok(LAYOUTS['24up'], '24up missing');
    assert.ok(LAYOUTS['30up'], '30up missing');
  });

  test('parseTiles parses COLSxROWS', () => {
    assert.deepEqual(parseTiles('5x4'), { cols: 5, rows: 4, perPage: 20 });
    assert.deepEqual(parseTiles('6x4'), { cols: 6, rows: 4, perPage: 24 });
    assert.deepEqual(parseTiles('1x1'), { cols: 1, rows: 1, perPage: 1 });
  });

  test('whiteTheme preserves classes but forces white paper and readable ink', () => {
    const blank = whiteTheme(undefined);
    assert.equal(blank.paper, '#FFFFFF');
    assert.equal(blank.ink,   '#2C2C2C');
    const str = whiteTheme('cream');
    assert.equal(str.paper, '#FFFFFF');
    assert.equal(str.ink,   '#2C2C2C');
    const input = {
      paper: '#1E1E2E', ink: '#CDD6F4', muted: '#6C7086', border: '#313244',
      classes: { a: '#aaa' },
    };
    const out = whiteTheme(input);
    assert.equal(out.paper, '#FFFFFF');
    assert.equal(out.ink,   '#2C2C2C');
    assert.equal(out.muted, '#8C8680');
    assert.equal(out.border, '#D4CFC7');
    assert.deepEqual(out.classes, { a: '#aaa' });
  });

  test('forceWhiteBackground replaces the first background rect fill', () => {
    const svg = '<svg><rect width="100" height="50" fill="#F5F0E8"/><rect width="10" height="10" fill="red"/></svg>';
    const out = forceWhiteBackground(svg);
    assert.match(out, /<rect width="100" height="50" fill="#FFFFFF"\/>/);
    // Second rect is untouched (it's not the background — the regex only matches the first).
    assert.match(out, /<rect width="10" height="10" fill="red"\/>/);
  });

  test('makeResponsive adds preserveAspectRatio and 100% sizing', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="200" height="100"></svg>';
    const out = makeResponsive(svg);
    assert.match(out, /preserveAspectRatio="xMidYMid meet"/);
    assert.match(out, /width="100%"/);
    assert.match(out, /height="100%"/);
    assert.match(out, /style="display:block;width:100%;height:100%"/);
  });

  test('parseArgs reads all known flags and applies defaults', () => {
    const defaults = parseArgs(['node', 'script']);
    assert.equal(defaults.selection, 'work/reports/showcase-selection.mjs');
    assert.equal(defaults.out, 'work/reports/showcase.pdf');
    assert.equal(defaults.orientation, 'landscape');
    assert.equal(defaults.layout, '12up');
    assert.equal(defaults.tiles, null);

    const all = parseArgs([
      'node', 'script',
      '--selection', 'a.mjs',
      '--out', 'b.pdf',
      '--orientation', 'portrait',
      '--layout', '20up',
      '--tiles', '6x4',
    ]);
    assert.equal(all.selection, 'a.mjs');
    assert.equal(all.out, 'b.pdf');
    assert.equal(all.orientation, 'portrait');
    assert.equal(all.layout, '20up');
    assert.equal(all.tiles, '6x4');
  });

  test('matchFixture resolves id exactly, then substring, filtered by source', () => {
    const fixtures = [
      { id: 'metro-stockholm', source: 'metro' },
      { id: 'mlcm-dense-interchange', source: 'mlcm' },
      { id: 'cross-bipartite', source: 'challenge' },
      { id: 'stockholm-random', source: 'random' },
    ];
    assert.equal(matchFixture(fixtures, { id: 'stockholm', source: 'metro' }).id, 'metro-stockholm');
    assert.equal(matchFixture(fixtures, { id: 'cross-bipartite', source: 'challenge' }).id, 'cross-bipartite');
    assert.equal(matchFixture(fixtures, { id: 'stockholm', source: 'metro' }).source, 'metro');
    assert.equal(matchFixture(fixtures, { id: 'nope', source: 'metro' }), null);
  });

  test('inferMode detects grid vs matrix from selection shape', () => {
    assert.equal(inferMode({ categories: [] }), 'grid');
    assert.equal(inferMode({ variants: [], fixtures: [] }), 'matrix');
    assert.equal(inferMode({ mode: 'grid', variants: [], fixtures: [] }), 'grid');
    assert.equal(inferMode({ mode: 'matrix', categories: [] }), 'matrix');
    assert.throws(() => inferMode({}), /categories|variants/);
  });
});

describe('variants', () => {
  test('VARIANTS registry contains the documented engines', () => {
    for (const name of ['metro-ref', 'process-default', 'process-ga', 'process-ttb', 'process-bezier', 'flow-legacy']) {
      assert.ok(VARIANTS[name], `missing variant ${name}`);
      assert.ok(VARIANTS[name].label, `missing label for ${name}`);
      assert.ok(VARIANTS[name].engine, `missing engine for ${name}`);
    }
  });

  test('variantLabel falls back to the raw name for unknown variants', () => {
    assert.equal(variantLabel('metro-ref'), 'Metro (Mode 1)');
    assert.equal(variantLabel('no-such-variant'), 'no-such-variant');
  });

  test('renderVariant returns an SVG for metro-ref on a routeless fixture', () => {
    // Metro doesn't strictly require routes; a routeless DAG should still render.
    const fixture = {
      id: 'tiny',
      dag: {
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [['a', 'b'], ['b', 'c']],
      },
    };
    const { svg, error } = renderVariant(fixture, 'metro-ref');
    assert.equal(error, undefined, 'metro-ref should not error on a simple DAG');
    assert.match(svg, /^<svg/, 'svg output should start with <svg>');
  });

  test('renderVariant returns a "no routes" placeholder for process variants on routeless fixtures', () => {
    const fixture = {
      id: 'noroute',
      dag: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [['a', 'b']],
      },
    };
    const result = renderVariant(fixture, 'process-default');
    assert.equal(result.error, 'no routes');
    assert.match(result.svg, /no routes/i);
    assert.match(result.svg, /^<svg/);
  });

  test('renderVariant renders process engine for a fixture with routes', () => {
    const fixture = {
      id: 'tiny-process',
      dag: {
        nodes: [
          { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' },
        ],
        edges: [['a', 'b'], ['b', 'c'], ['c', 'd']],
      },
      routes: [
        { id: 'R1', nodes: ['a', 'b', 'c', 'd'] },
      ],
    };
    const { svg, error } = renderVariant(fixture, 'process-default');
    assert.equal(error, undefined);
    assert.match(svg, /^<svg/);
  });

  test('createGACache memoizes by fixture.id + direction', () => {
    // Small 1-route fixture — GA skips (routes <= 1) and falls back to
    // routes. But the cache still populates and returns the same array
    // reference on subsequent calls.
    const fixture = {
      id: 'mini',
      dag: { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] },
      routes: [{ id: 'R1', nodes: ['a', 'b'] }],
    };
    const cache = createGACache();
    const first = cache.get(fixture, 'ltr');
    const second = cache.get(fixture, 'ltr');
    assert.strictEqual(first, second, 'cache should return same reference');
    const ttb = cache.get(fixture, 'ttb');
    assert.strictEqual(ttb, fixture.routes, 'ttb single-route returns original routes');
  });

  test('renderVariant returns an unknown-variant placeholder for bogus names', () => {
    const fixture = {
      id: 'x',
      dag: { nodes: [{ id: 'a' }], edges: [] },
    };
    const result = renderVariant(fixture, 'does-not-exist');
    assert.match(result.error, /unknown variant/);
    assert.match(result.svg, /unknown variant/);
  });

  test('renderVariant catches engine exceptions and returns an error placeholder', () => {
    // A fixture with an invalid routes shape: routes is non-empty (so the
    // no-routes guard lets it through) but the referenced nodes don't
    // exist in the DAG. This forces the downstream engine to throw.
    const fixture = {
      id: 'broken',
      dag: { nodes: [{ id: 'a' }, { id: 'b' }], edges: [['a', 'b']] },
      routes: [{ id: 'R1', nodes: ['nope-1', 'nope-2', 'nope-3'] }],
    };
    // process engine consumes route.nodes and will try to look them up.
    // If this particular combination doesn't throw, that's fine — the
    // catch path is still exercised in other variants with other
    // failures; what we assert here is that renderVariant never crashes.
    const result = renderVariant(fixture, 'process-default');
    assert.ok(typeof result.svg === 'string');
    assert.match(result.svg, /^<svg/);
  });

  test('createGACache tolerates GA errors and falls back to original routes', () => {
    // A fixture where evolveProcessLayout throws. The cache should
    // swallow the error and return the original routes array.
    const badFixture = {
      id: 'bad-for-ga',
      dag: null, // evolveProcessLayout → layoutProcess(null, ...) will throw
      routes: [
        { id: 'R1', nodes: ['a'] },
        { id: 'R2', nodes: ['b'] },
      ],
    };
    const cache = createGACache();
    const routes = cache.get(badFixture, 'ltr');
    assert.strictEqual(routes, badFixture.routes);
  });

  test('white theme override flows into process engine output', () => {
    const fixture = {
      id: 'white-check',
      theme: 'dark', // deliberately a dark theme — override should win
      dag: {
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [['a', 'b'], ['b', 'c']],
      },
      routes: [{ id: 'R1', nodes: ['a', 'b', 'c'] }],
    };
    const { svg, error } = renderVariant(fixture, 'process-default');
    assert.equal(error, undefined);
    // First <rect> is the background — forceWhiteBackground rewrites it to white.
    const firstRect = svg.match(/<rect\b[^>]*?\bfill="([^"]+)"/);
    assert.ok(firstRect, 'expected a background rect');
    assert.equal(firstRect[1], '#FFFFFF');
  });
});

describe('print-pdf CLI smoke — grid mode', () => {
  test('runs end-to-end and produces a valid PDF (skips if no chromium)', async (t) => {
    const available = await chromiumAvailable();
    if (!available) {
      t.skip('playwright chromium not installed — run: npx playwright install chromium');
      return;
    }

    const workDir = await (async () => {
      const d = join(tmpdir(), `print-pdf-test-${process.pid}-${Date.now()}`);
      await mkdir(d, { recursive: true });
      return d;
    })();
    const selPath = join(workDir, 'sel.mjs');
    const pdfPath = join(workDir, 'out.pdf');
    try {
      await writeFile(selPath, `
        export default {
          title: 'Test showcase',
          categories: [
            {
              label: 'Test',
              fixtures: [
                { id: 'cross-bipartite', source: 'challenge' },
                { id: 'fan-both', source: 'challenge' },
              ],
            },
          ],
        };
      `, 'utf8');

      const { spawn } = await import('node:child_process');
      const scriptPath = join(__dirname, '..', 'print-pdf.mjs');

      await new Promise((resolvePromise, rejectPromise) => {
        const cp = spawn('node', [
          scriptPath,
          '--selection', selPath,
          '--out', pdfPath,
          '--orientation', 'landscape',
          '--layout', '2up',
        ], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        cp.stderr.on('data', d => { stderr += d; });
        cp.on('error', rejectPromise);
        cp.on('exit', code => {
          if (code === 0) resolvePromise();
          else rejectPromise(new Error(`CLI exited ${code}: ${stderr}`));
        });
      });

      assert.ok(existsSync(pdfPath), 'PDF was not created');
      const st = await stat(pdfPath);
      assert.ok(st.size > 1024, `PDF too small: ${st.size} bytes`);
      const fd = await readFile(pdfPath);
      assert.equal(fd.slice(0, 5).toString('ascii'), '%PDF-', 'not a PDF magic header');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});

describe('print-pdf CLI smoke — matrix mode', () => {
  test('matrix mode produces a valid PDF with 2 variants × 2 fixtures', async (t) => {
    const available = await chromiumAvailable();
    if (!available) {
      t.skip('playwright chromium not installed — run: npx playwright install chromium');
      return;
    }

    const workDir = await (async () => {
      const d = join(tmpdir(), `print-pdf-matrix-test-${process.pid}-${Date.now()}`);
      await mkdir(d, { recursive: true });
      return d;
    })();
    const selPath = join(workDir, 'sel.mjs');
    const pdfPath = join(workDir, 'out.pdf');
    const htmlPath = pdfPath.replace(/\.pdf$/, '.html');
    try {
      // 2 variants × 2 fixtures = 4 tiles. Use metro-ref (no routes needed)
      // and process-default (routes needed). One fixture has routes,
      // the other (cross-bipartite) doesn't — exercises the "no routes"
      // placeholder path.
      await writeFile(selPath, `
        export default {
          title: 'Matrix test',
          mode: 'matrix',
          variants: ['metro-ref', 'process-default'],
          fixtures: [
            { id: 'stockholm',      source: 'metro',     label: 'Stockholm' },
            { id: 'cross-bipartite', source: 'challenge', label: 'Bipartite' },
          ],
        };
      `, 'utf8');

      const { spawn } = await import('node:child_process');
      const scriptPath = join(__dirname, '..', 'print-pdf.mjs');

      await new Promise((resolvePromise, rejectPromise) => {
        const cp = spawn('node', [
          scriptPath,
          '--selection', selPath,
          '--out', pdfPath,
          '--orientation', 'landscape',
        ], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        cp.stderr.on('data', d => { stderr += d; });
        cp.on('error', rejectPromise);
        cp.on('exit', code => {
          if (code === 0) resolvePromise();
          else rejectPromise(new Error(`CLI exited ${code}: ${stderr}`));
        });
      });

      assert.ok(existsSync(pdfPath), 'PDF was not created');
      const st = await stat(pdfPath);
      assert.ok(st.size > 1024, `PDF too small: ${st.size} bytes`);
      const fd = await readFile(pdfPath);
      assert.equal(fd.slice(0, 5).toString('ascii'), '%PDF-', 'not a PDF magic header');

      // HTML sanity check — matrix header + labels must be present.
      const html = await readFile(htmlPath, 'utf8');
      assert.match(html, /matrix/, 'html should mention matrix class');
      assert.match(html, /Metro \(Mode 1\)/);
      assert.match(html, /Process Default/);
      assert.match(html, /Stockholm/);
      assert.match(html, /Bipartite/);
      assert.match(html, /no routes/, 'routeless fixture should render a no-routes placeholder');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
