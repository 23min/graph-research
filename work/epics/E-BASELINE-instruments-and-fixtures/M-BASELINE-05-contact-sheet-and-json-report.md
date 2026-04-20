---
id: M-BASELINE-05-contact-sheet-and-json-report
epic: E-BASELINE-instruments-and-fixtures
status: draft
depends_on: [M-BASELINE-02, M-BASELINE-03, M-BASELINE-04]
---

# Milestone: HTML contact sheet + per-fixture JSON report

**ID:** M-BASELINE-05
**Epic:** E-BASELINE-instruments-and-fixtures
**Status:** draft

## Goal

Produce the primary baseline artefact: an HTML page that renders every fixture across every engine in a matrix, with the five metric scores displayed per cell, plus a machine-readable JSON side-output capturing the same data. This is the surface a human uses to decide where dag-map is weak today.

## Context

After M-01–M-04, the repo can load fixtures, lay them out with four engines (`layoutMetro`, `layoutFlow`, dagre, ELK), reject invalid layouts, and score valid ones. Those capabilities produce nothing visible on their own. M-05 is the moment where the baseline becomes inspectable.

The contact sheet is multi-engine by design — single-engine gallery tooling already exists in `dag-map/test/generate-gallery.mjs`. That file is not extended; the new tool is built fresh because it has a different purpose (cross-engine comparison, not single-engine regression snapshot).

## Acceptance Criteria

1. **HTML contact sheet.**
   - Matrix layout: rows = fixtures, columns = engines (`layoutMetro`, `layoutFlow`, dagre, ELK)
   - Each cell contains the rendered SVG and a small metric panel listing all five scores with 2-digit precision
   - Fixture name, size (node count, edge count, route count) visible per row
   - A legend explains the metrics (names, what each means, lower-is-better-or-higher)
   - Served by `node bench/contact-sheet/serve.mjs` on a fixed port; loads instantly when opened in a browser
   - Rendered as a single self-contained HTML file (SVGs inline); usable offline once generated

2. **Per-fixture JSON report.**
   - `bench/contact-sheet/report.json` (written alongside the HTML) contains an array of entries, one per (fixture, engine) pair: `{ fixture_id, engine, scores: {...}, invariant_status, layout_digest }`
   - `layout_digest` is a SHA-256 of a canonicalised serialisation of the layout object — cheap tamper detection for reproducibility audits
   - Header block records seed, config path, code SHA, and a placeholder for the split version hash (M-07 will supply this)

3. **Render orchestrator.**
   - One script builds both artefacts in one pass: loads fixtures, runs engines, scores outputs, renders SVGs, emits HTML and JSON
   - Deterministic — running it twice produces byte-identical outputs (modulo the code SHA header)
   - Engines that fail on a fixture report the failure in-cell rather than crashing the whole run

4. **Tests.**
   - Integration test: run the orchestrator against a small fixture subset (3 fixtures × 4 engines = 12 cells), assert the HTML and JSON have the expected structure
   - Determinism: two runs produce byte-identical outputs on the same inputs
   - Error propagation: an engine failure on one cell does not prevent the other 11 cells from rendering

5. **Performance.**
   - Full run across all 30 fixtures × 4 engines completes in under 60 seconds on a developer machine
   - If any single cell exceeds 5 seconds, a warning is emitted (not a test failure — a diagnostic)

## Technical Notes

- The orchestrator is an `.mjs` script, not a framework. One file, one pipeline.
- SVG rendering for dag-map engines uses the existing `renderSVG` path. For dagre and ELK outputs, a minimal renderer (draw nodes as circles, edges as polylines by the `points` array) is built here — not a full rendering harness, just enough to visualise.
- The JSON report format is deliberately flat so scripts downstream of M-07 and M-08 can consume it without schema gymnastics.
- `npm run contact-sheet` is the ergonomic entry point; it builds and serves.

## Out of Scope

- A2 PDF output — that's M-06
- Interactive controls (filters, sorts, zoom) — the sheet is static
- Diff views between two runs — future concern
- Calibrating the metric panel's visual design for publication — baseline renders the numbers; polish later
- Hasse — not in the engine set, per epic scope
- Uploading / hosting the contact sheet — local only

## Dependencies

- M-BASELINE-02 complete (scoring)
- M-BASELINE-03 complete (dagre)
- M-BASELINE-04 complete (ELK)

## Deliverables

- `bench/contact-sheet/orchestrator.mjs`
- `bench/contact-sheet/render-minimal.mjs` — shared SVG renderer for external engines
- `bench/contact-sheet/serve.mjs` — static server entry
- `bench/contact-sheet/__tests__/orchestrator.test.mjs`
- `bench/package.json` script entries: `contact-sheet`, `contact-sheet:build`
- Example artefacts committed under `bench/contact-sheet/examples/` (not the canonical baseline v0 — that's M-08)
