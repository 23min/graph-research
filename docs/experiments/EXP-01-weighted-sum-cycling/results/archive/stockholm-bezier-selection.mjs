// stockholm-bezier-selection.mjs — single-tile showcase of Stockholm
// rendered in Process Bezier (Mode 2.5). Used for the solo spotlight PDF.

export default {
  title: "Stockholm — Process Bezier (Mode 2.5)",
  mode: "matrix",
  variants: ["process-bezier"],
  fixtures: [
    {
      id: "stockholm",
      source: "metro",
      label: "Stockholm",
      // A2 print at native SVG scale makes default 4.5pt labels ~3pt.
      // Bump labelSize (and scale) so cards and text are readable.
      opts: { labelSize: 18, scale: 2.2 },
    },
  ],
};
