// variants.mjs — rendering-variant registry for the print-PDF matrix mode.
//
// Ports the 4 rendering paths used by bench/experiments/compare-flow.mjs:
//   - metro-ref        → dagMap(dag, opts).svg
//   - process-default  → layoutProcess + renderProcess, original routes
//   - process-ga       → layoutProcess + renderProcess, GA-optimized routes
//   - process-ttb      → layoutProcess + renderProcess, top-to-bottom, GA
//   - process-bezier   → layoutProcess + renderProcess, bezier routing, orig routes
//   - flow-legacy      → layoutFlow + renderSVG + station/edge renderers
//
// GA is cached per (fixture.id, direction) within a single print run.

import { dagMap } from '../../dag-map/src/index.js';
import { layoutFlow } from '../../dag-map/src/layout-flow.js';
import { layoutProcess } from '../../dag-map/src/layout-process.js';
import { renderProcess } from '../../dag-map/src/render-process.js';
import { renderSVG } from '../../dag-map/src/render.js';
import { createStationRenderer, createEdgeRenderer } from '../../dag-map/src/render-flow-station.js';
import { evolveProcessLayout } from '../direct/process-ga.mjs';

// Registry mirrors bench/experiments/compare-flow.mjs:VERSIONS verbatim.
// Nested `strategies`/`strategyConfig` are spread at use-time to avoid
// shared-object mutation hazards.
export const VARIANTS = {
  'metro-ref': {
    label: 'Metro (Mode 1)',
    engine: 'metro',
    opts: {
      strategies: { orderNodes: 'hybrid', reduceCrossings: 'none', assignLanes: 'ordered', positionX: 'compact' },
      mainSpacing: 26, subSpacing: 40,
    },
  },
  'process-default': {
    label: 'Process Default',
    engine: 'process',
    opts: { direction: 'ltr', scale: 1.5 },
    noGA: true,
  },
  'process-ga': {
    label: 'Process GA',
    engine: 'process',
    opts: { direction: 'ltr', scale: 1.5 },
  },
  'process-ttb': {
    label: 'Process TTB',
    engine: 'process',
    opts: { direction: 'ttb', scale: 1.5 },
  },
  'process-bezier': {
    label: 'Process Bezier',
    engine: 'process',
    opts: { direction: 'ltr', scale: 1.5, routing: 'bezier', stationStyle: 'metro' },
    noGA: true,
  },
  'flow-legacy': {
    label: 'Flow Legacy',
    engine: 'flow-legacy',
    opts: { direction: 'ltr', scale: 1.0 },
  },
};

export function variantLabel(variantName) {
  return VARIANTS[variantName]?.label || variantName;
}

// ---- theme/white-background helpers — identical semantics to print-pdf.mjs.
const LIGHT_SURFACES = {
  paper: '#FFFFFF',
  ink: '#2C2C2C',
  muted: '#8C8680',
  border: '#D4CFC7',
};

export function whiteTheme(fixtureTheme) {
  if (!fixtureTheme || typeof fixtureTheme === 'string') {
    return { ...LIGHT_SURFACES };
  }
  return { ...fixtureTheme, ...LIGHT_SURFACES };
}

// Some renderers (render-process.js) draw the background with `theme.paper`,
// which the theme override handles. As a safety net we also rewrite the first
// full-size <rect> fill to white — same approach as print-pdf.mjs.
export function forceWhiteBackground(svg) {
  return svg.replace(
    /(<rect\b[^>]*?\bwidth="[^"]+"[^>]*?\bheight="[^"]+"[^>]*?\bfill=")[^"]+(")/,
    '$1#FFFFFF$2'
  );
}

// Strip fixed dimensions and pin the SVG to fill its grid cell.
export function makeResponsive(svg) {
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

// ---- GA cache — per-(fixture × direction), per print run.

// Keyed by `${fixtureId}::${direction}`. Only populated on demand.
export function createGACache() {
  const cache = new Map();
  return {
    // Return optimized routes for a (fixture, direction) pair, running GA
    // on first request. Falls back to f.routes if skipping (few routes,
    // >10 routes) or if GA returns an error / crossings >= 999.
    get(fixture, direction) {
      const key = `${fixture.id}::${direction}`;
      if (cache.has(key)) return cache.get(key);

      const routes = fixture.routes || [];
      let optimized = routes;

      if (routes.length > 1 && routes.length <= 10) {
        try {
          const ga = evolveProcessLayout(fixture.dag, routes, {
            populationSize: 20,
            generations: 40,
            direction,
          });
          if (ga.bestFitness && ga.bestFitness.crossings < 999) {
            optimized = ga.bestPermutation.map(i => routes[i]);
          }
        } catch {
          optimized = routes;
        }
      }

      cache.set(key, optimized);
      return optimized;
    },
  };
}

// ---- Variant rendering -------------------------------------------------

// Render one variant of one fixture. Returns { svg } on success or
// { svg, error } where svg is a compact error placeholder on failure.
// If the fixture has no routes and the variant needs them, returns a
// polite placeholder rather than crashing.
//
// `gaCache` is optional; if omitted, a single-use cache is created — this
// means repeated calls for the same (fixture, direction) will re-run GA.
// The print-pdf driver passes a shared cache across all tiles.
export function renderVariant(fixture, variantName, { gaCache } = {}) {
  const variant = VARIANTS[variantName];
  if (!variant) {
    return {
      svg: noteSvg(`unknown variant: ${variantName}`),
      error: `unknown variant: ${variantName}`,
    };
  }

  const needsRoutes = variant.engine !== 'metro';
  const hasRoutes = Array.isArray(fixture.routes) && fixture.routes.length > 0;

  if (needsRoutes && !hasRoutes) {
    return { svg: noteSvg('no routes'), error: 'no routes' };
  }

  try {
    const direction = variant.opts?.direction || 'ltr';
    const useRoutes =
      variant.engine === 'process' && !variant.noGA && hasRoutes
        ? (gaCache ? gaCache.get(fixture, direction) : fixture.routes)
        : fixture.routes;

    // Merge order: variant defaults → fixture opts → enforced fields.
    // Fixture opts win over variant opts so a selection file can tune
    // labelSize/scale per fixture (e.g. Stockholm solo at large scale).
    const baseOpts = {
      ...(useRoutes ? { routes: useRoutes } : {}),
      ...(fixture.edgeWeights ? { edgeWeights: fixture.edgeWeights } : {}),
      labelSize: 1.2,
    };
    const mergedOpts = {
      ...baseOpts,
      ...variant.opts,
      ...(fixture.opts || {}),
    };
    if (variant.opts?.strategies) {
      mergedOpts.strategies = { ...variant.opts.strategies };
    }
    if (variant.opts?.strategyConfig) {
      mergedOpts.strategyConfig = { ...variant.opts.strategyConfig };
    }
    // Theme must always be the white-print palette — fixture.theme may be
    // dark, variant.opts never touches theme.
    mergedOpts.theme = whiteTheme(fixture.theme);

    let svg;
    if (variant.engine === 'flow-legacy') {
      // Flow legacy uses the original (non-GA) routes — matches compare-flow.mjs.
      const flowOpts = { ...mergedOpts, routes: fixture.routes };
      const layout = layoutFlow(fixture.dag, flowOpts);
      const renderNode = createStationRenderer(layout, fixture.routes);
      const renderEdge = createEdgeRenderer(layout);
      svg = renderSVG(fixture.dag, layout, { ...flowOpts, renderNode, renderEdge });
    } else if (variant.engine === 'process') {
      const layout = layoutProcess(fixture.dag, mergedOpts);
      svg = renderProcess(fixture.dag, layout, mergedOpts);
    } else {
      svg = dagMap(fixture.dag, mergedOpts).svg;
    }

    return { svg: makeResponsive(forceWhiteBackground(svg)) };
  } catch (err) {
    return {
      svg: noteSvg(`render error: ${err.message.slice(0, 80)}`),
      error: err.message,
    };
  }
}

// Minimal inline SVG for "no routes" / error states. Kept small so it
// scales cleanly inside a grid cell via preserveAspectRatio.
function noteSvg(text) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"' +
    ' preserveAspectRatio="xMidYMid meet"' +
    ' style="display:block;width:100%;height:100%">' +
    '<rect width="200" height="80" fill="#FFFFFF"/>' +
    `<text x="100" y="44" font-size="11" fill="#999999" text-anchor="middle"` +
    ` font-family="system-ui, sans-serif">${escText(text)}</text>` +
    '</svg>'
  );
}

function escText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
