# bench — baseline measurement harness

Research instruments for evaluating dag-map layouts: fixture loader, invariant
checker, metrics, external-baseline adapters. Consumed by every `EXP-NN`
experiment in this repo.

This is an npm workspace. `dag-map` is resolved as a sibling workspace
(`node_modules/dag-map` is a symlink into `../dag-map/`), so edits to dag-map
source are picked up on the next test run. See `docs/dag-map-vendored.md` for
the subtree-vendored workflow.

## Layout

- `fixtures/` — catalogue index, loader, fixture adapters
- `invariants/` — hard-invariant checker and determinism comparator
- `__tests__/` sibling directories — `node:test` specs

## Tests

```sh
cd bench && node --test
```

The validation pipeline (lint, format, `node --test`) must pass before any
milestone commit. See `CLAUDE.md` for project rules and TDD conventions.
