// showcase-selection.mjs — curated fixture selection for the M-EVOLVE-01
// print-PDF showcase.
//
// Two modes are supported:
//
//   mode: "matrix"  → variants × fixtures comparison page. One cell per
//                     (variant, fixture) pair, with column headers for
//                     variants and row labels for fixtures.
//   mode: "grid"    → legacy single-variant grid page. Categories group
//                     tiles; each tile is one fixture rendered with a
//                     single engine (Metro Mode 1).
//
// If `mode` is omitted, the driver infers: `categories` → grid,
// `variants` → matrix.
//
// Fixture ids are matched leniently: { id: 'stockholm', source: 'metro' }
// matches a fixture whose id equals 'stockholm' OR contains 'stockholm'
// (so 'metro-stockholm' also works).

export default {
  title: "M-EVOLVE-01 Showcase — Mode Comparison",
  mode: "matrix",
  variants: [
    "metro-ref",
    "process-default",
    "process-ga",
    "process-bezier",
    "flow-legacy",
  ],
  fixtures: [
    { id: "stockholm",         source: "metro",    label: "Stockholm" },
    { id: "o2c_full",          source: "internal", label: "Order-to-Cash" },
    { id: "proc-incident",     source: "random",   label: "Incident Process" },
    { id: "dense-interchange", source: "mlcm",     label: "Dense Interchange" },
    { id: "proc-parallel-many", source: "random",  label: "Parallel Processes" },
  ],
};
