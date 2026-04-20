---
id: M-BASELINE-06-a2-pdf-print
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-05]
---

# Milestone: A2 PDF print utility

**ID:** M-BASELINE-06
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Produce a vector PDF rendering of the contact sheet suitable for A2 landscape printing, so baseline review can happen off-screen at full physical scale. This is a separate rendering path from M-05's HTML — print has its own constraints (pagination, colour, legibility at 0.5m viewing distance) that warrant a dedicated milestone.

## Context

Physical review is a different cognitive mode from on-screen scrolling. The EVOLVE-01 archive — `work/reports/showcase-m-evolve-01.pdf` — established empirically that printed side-by-side review at A2 scale surfaces layout problems the browser does not. M-05's HTML is the working surface; M-06's PDF is the decision surface.

No code is imported from `reference/m-evolve-01`. The EVOLVE-01 print utility (`bench/print/`, commit `b6e3ead`) is a design reference for what worked; the new implementation is written fresh on `main`.

## Acceptance Criteria

1. **PDF output.**
   - `bench/print/print-pdf.mjs --out <path>` produces a vector PDF of the contact sheet
   - Default page size A2 landscape (594 × 420 mm); configurable via `--page-size` and `--orientation`
   - Vector SVG embedded in PDF (not rasterised); metric panels legible at 100% print scale

2. **Layout modes.**
   - Matrix mode (default): one page with all fixtures × all engines, tiled to fit
   - 1-up mode: one fixture × one engine per page; all pages in one PDF
   - Grid mode: configurable rows × cols per page; fixtures flow across pages

3. **Selection.**
   - `--selection <file.mjs>` accepts a committed selection file listing `{ fixture, engine, options }` entries to render
   - Default selection (no `--selection`): all fixtures, all engines, matrix mode

4. **Reproducibility.**
   - The PDF header metadata includes seed, config path, code SHA, and split version placeholder (same four fields as M-05's JSON)
   - Running the command twice with the same inputs produces a byte-identical PDF (PDF non-determinism sources — creation date, stream compression — are pinned)

5. **Tests.**
   - Integration test: generate a 3-fixture × 2-engine mini-PDF; assert it is a well-formed PDF with the expected number of pages
   - Determinism: two runs produce byte-identical output
   - CLI contract: `--page-size`, `--orientation`, `--layout`, `--selection`, `--out` are all honoured

6. **Dependency discipline.**
   - Uses `pdfkit` or equivalent pure-JS PDF library — no headless-browser dependency
   - Dependency added to `bench/package.json` only

## Technical Notes

- PDF library choice: `pdfkit` is the default candidate; it accepts SVG content via a companion package (`svg-to-pdfkit`), handles page layout, and is pure-JS. If `pdfkit` has limitations on SVG features dag-map uses (gradients, complex paths), evaluate `pdf-lib` as alternative.
- Headless-browser approaches (Playwright print-to-PDF) are rejected for the baseline because they add a multi-hundred-megabyte dependency for an essentially text-and-vector output problem. Revisit only if a pure-JS path cannot render dag-map SVGs faithfully.
- The matrix layout can reuse the same orchestrator from M-05 to produce the per-cell SVGs; the PDF utility consumes those and paginates.
- Print CSS concerns (font choice, background colour, gridline weight) are resolved in the selection file, not hardcoded — so a reviewer can adjust for a particular print run without editing the utility.

## Out of Scope

- Non-A-series page sizes beyond the configurable knob
- Interactive PDF features (bookmarks, annotations, form fields)
- Per-page per-cell captions or commentary overlays — baseline is just the geometry
- Colour profile management (ICC profiles, CMYK conversion) — sRGB is sufficient at baseline

## Dependencies

- M-BASELINE-05 complete (contact sheet orchestrator produces the SVGs the PDF utility embeds)

## Deliverables

- `bench/print/print-pdf.mjs`
- `bench/print/__tests__/print-pdf.test.mjs`
- `bench/print/examples/` — sample selection files (not the canonical baseline v0)
- `bench/package.json` script entry: `print`
- `bench/package.json` dependency on the chosen PDF library
