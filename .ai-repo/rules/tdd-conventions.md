# TDD Conventions — graph-research

The bench harness and supporting scripts are Node.js (ESM, `.mjs`). Tests use `node:test` from the Node standard library unless a milestone spec calls out a different runner.

## Scope — what must be tested

**Required (TDD from RED phase):**
- All `dag-map/` source code (already covered — 304+ tests passing in the vendored tree).
- All `bench/` code that is reused across experiments: metrics, loaders, invariant checkers, fixture catalogues, split-loaders, external-baseline adapters (dagre, ELK), contact-sheet / report generators. If a future EXP could plausibly re-run it, it needs tests.

**Not required (smoke-testing sufficient, tests welcome if cheap):**
- Orchestration and maintenance scripts under `scripts/`: `dag-map-sync.mjs`, `dag-map-push.mjs`, `dag-map-status.mjs`, `check-dag-map-commit-discipline.mjs`, `fetch-pdfs.mjs`, `setup-private-mounts.sh`. These are single-operator CLIs that wrap `git` or fetch open-access PDFs; they fail loud, dry-run by default, and aren't reused across experiments.
- One-off EXP-specific scripts that execute a single experiment and won't be re-invoked. Reproducibility comes from committing the script + the code SHA; unit tests on throwaway scripts are over-engineering.

**Judgment-call zone:** if you're unsure whether a piece of bench code is "reused across experiments" or "experiment-specific throwaway," default to testing it. Undertesting research-core code is a research-integrity risk; overtesting a throwaway script is a minor waste.

## Test coverage guide (RED phase)

For each acceptance criterion, consider these categories. Not every category applies — use judgment.

**Always write:**
- **Happy path** — the criterion works with valid, typical inputs
- **Edge cases** — empty inputs, single items, boundary values
- **Error cases** — invalid inputs, missing files, corrupt data, wrong types

**Write when applicable:**
- **Round-trip** — write then read back, result is identical (hashes, split files, metric vectors)
- **Tamper detection** — modify stored data, verify integrity checks catch it (SHA-256 mismatch on fixture content)
- **Format compliance** — on-disk output matches spec exactly (splits.json schema, GraphML dialect, hash encoding)
- **Invariants** — properties that hold regardless of input (split totals == union == committed set; no category >90% in any bucket)
- **Isolation** — independent runs don't interfere (separate seeds produce separate artefacts)

## Implementation rules (GREEN phase)

- Write the **minimum code** to make tests pass. No features beyond what tests require.
- Do not modify test files unless they have a clear bug. If you must, explain why.
- Follow the existing code style. Read neighbouring files before writing new code.
- Prefer simple, direct code over clever abstractions. Three similar lines > premature helper.
- Do not add docstrings, comments, or type annotations beyond what's needed for clarity.
- Keep dependencies minimal. Do not add packages without human approval.

## Code review format (REVIEW phase)

Produce a structured review:

```
## Summary
One paragraph: overall assessment (approve / request changes).

## Issues
- [severity: high/medium/low] Description. File:line.

## Suggestions
- Non-blocking improvements worth considering.

## Checklist
- [ ] All acceptance criteria covered
- [ ] Tests verify spec compliance
- [ ] Validation pipeline passes (lint, format, test)
- [ ] Commit message follows Conventional Commits
- [ ] No unnecessary complexity
```

## Test framework conventions

- **JavaScript/Node**: `node --test` (or `node:test` imported explicitly), `tmp` dir via `node:os.tmpdir()` + `node:fs.mkdtempSync()` for filesystem ops, deterministic (no network at test time).
- Tests go in `__tests__/` directories next to the code they test, named `<module>.test.mjs`.
- Test names read as specifications, not implementation descriptions.
- The bench harness validation pipeline (ESLint, Prettier, `node --test`) must pass before any commit. Specific commands land in `bench/package.json` when the bench is imported.
