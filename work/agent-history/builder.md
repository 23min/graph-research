# Builder — accumulated learnings

Operational lore carried across sessions. Append new entries when a
milestone wraps, or any time you want to preserve something a future
fresh session would otherwise have to rediscover.

**Scope**: patterns that worked, pitfalls that bit, conventions that
held up, gotchas in build / test / tooling. *Not* decisions (those go
to ADRs under `docs/decisions/`). *Not* in-progress work (that goes
to tracking docs or a plan). *Not* user preferences (those go to
`CLAUDE.md` or `.ai-repo/rules/`).

**Adopted**: 2026-04-21, during the M-BASELINE-01 audit. No backfill —
entries start from this date forward.

## Entries

<!-- Append entries in reverse-chronological order. Format suggestion:
### YYYY-MM-DD — <one-line title>

Context: <what was happening>
Learning: <what you want future-you to remember>
-->

### 2026-04-22 — Bench workspace wires dag-map via npm workspace symlink

Context: M-BASELINE-01. Needed bench to consume dag-map (Apache-licensed, vendored via `git subtree` at `dag-map/`) without duplicating source.

Learning:
- Root `package.json` declares `"workspaces": ["bench", "dag-map"]` and `npm install` creates `node_modules/dag-map -> ../dag-map` as a symlink. No publish, no rebuild — edits to `dag-map/src/` are live on the next `node --test` run. Single root `node_modules/` is hoisted; bench has no separate `node_modules/`.
- `import { layoutMetro } from 'dag-map'` resolves through dag-map's `exports` map. Subpaths like `test/models.js` are NOT in that map; resolve them as filesystem paths from the repo root (e.g., `new URL(source, REPO_ROOT)`) rather than adding subpaths to dag-map's package.json, which would count as mutating the vendored upstream.

### 2026-04-22 — `checkInvariants` layer input is optional, Kahn's-default

Context: M-BASELINE-01 invariant checker. `layoutMetro` doesn't export per-node layer ranks; only `maxLayer`. Per-node x position encodes layer (x = margin + layer × spacing) but that's brittle to invert.

Learning:
- `checkInvariants({ dag, positions, layers })` accepts `layers` as an optional caller override. When omitted, a Kahn's-algorithm longest-path rank over `dag` is used. This means Rule 1 (forward-only layers) is *vacuous* for the default case (Kahn's always produces monotone ranks on edges) but *meaningful* when a caller supplies a custom layer assignment, e.g., a layout engine whose own ranker has bugs. Both modes share the rules-2-and-3 checks.
- Hand-crafted broken layouts (used in unit tests) go in through the `layers` override. Example: `{ dag: {a→b}, positions, layers: Map([a→2, b→1]) }` triggers forward-only-layers rejection.

### 2026-04-22 — Bench test layout: `__tests__/` sibling directories, `node:test` directly

Context: M-BASELINE-01. First tests in the new `bench/` workspace.

Learning:
- Tests live in `<module>/__tests__/<name>.test.mjs` (matches the TDD convention in `CLAUDE.md`). `bench/package.json` `test` script globs those two directories: `node --test "fixtures/__tests__/*.test.mjs" "invariants/__tests__/*.test.mjs"`. Add new directories to the glob list when new bench modules land.
- No ESLint/Prettier yet — not wired in M-BASELINE-01 (deferred). Validation pipeline for this milestone is `npm test --workspaces --if-present` at the repo root.

### 2026-04-22 — Branch coverage is cheaper when validation is a boundary check, not scattered

Context: First pass of the invariant checker had defensive `undefined` checks inside the rule loops (`if (lu === undefined || lv === undefined)`, `if (!pu || !pv)`, etc.). Branch audit found several of these paths untested, and each needed its own contrived input to hit.

Learning: Collapse structural validation into one block at the top of the function. After that, the rule loops can trust the input — fewer defensive branches = fewer audit-only test cases. Pattern applied:
```js
for (const n of dag.nodes) {
  if (!layerMap.has(n.id)) throw ...;
  if (!positions.has(n.id)) throw ...;
}
// rule loops below trust every n.id has layer + position
```
Two boundary throws, two boundary tests, done. Previously: six defensive throws scattered across the rule loops, each needing a bespoke test.
