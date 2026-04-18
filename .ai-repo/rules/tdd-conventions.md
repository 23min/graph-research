# TDD Conventions — graph-research

The bench harness and supporting scripts are Node.js (ESM, `.mjs`). Tests use `node:test` from the Node standard library unless a milestone spec calls out a different runner.

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
