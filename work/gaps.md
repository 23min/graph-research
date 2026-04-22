# Gaps

Discovered work items deferred for later.

## Open

### ADR 0003 — priority-sweep ratification drift

**Discovered:** 2026-04-21 (workflow-audit on M-BASELINE-01 start; pre-existing condition also noted in M-BASELINE-00 tracking doc's outstanding follow-ups).

**What:** The epic spec `work/epics/E-BASELINE-instruments-and-fixtures/epic.md` references ADR 0003 as *"priority-sweep ratification of `docs/requirements/dag-map-consolidated.md`"* (Success Criteria line 61 and ADRs section line 90). The filesystem has `docs/decisions/0003-llm-assisted-research-methodology.md` instead — a different ADR on a different topic that landed before the epic-framing pass.

**Why deferred:** The priority-sweep ratification is not load-bearing for the next few milestones (M-01 fixture loader + invariant checker doesn't depend on it). The consolidated requirements doc has been guiding the epic's work without formal ratification for weeks already.

**Resolution path (JIT — address when the next milestone actually needs to cite the priority-sweep decisions, or at epic wrap, whichever is first):**

- Read `docs/requirements/dag-map-consolidated.md` §11.
- Judge whether the five decisions there are ADR-worthy. If yes → write ADR 0005 (next available number after 0004) as the priority-sweep ratification, then update the two epic-spec references from "ADR 0003" to "ADR 0005" and drop the reconciliation note. If no → delete the epic-spec references and treat the requirements doc as working doctrine (no ADR needed).
- Filesystem ADR 0003 (LLM-assisted research methodology) stays as-is — ADRs are monotonically numbered and are never renumbered in-place.

### ESLint + Prettier not configured in bench workspace

**Discovered:** 2026-04-22 (during M-BASELINE-01 implementation).

**What:** `bench/` was created as a new npm workspace in M-BASELINE-01 with only `node --test` wired as its validation pipeline. The TDD conventions block in `CLAUDE.md` states that the bench harness validation pipeline (ESLint, Prettier, `node --test`) "must pass before any commit" and that "specific commands land in `bench/package.json` when the bench is imported." M-BASELINE-01's AC5 deliverables list did not include lint/format tooling, so neither ESLint nor Prettier were wired.

**Why deferred:** Keeps M-BASELINE-01 minimal — the milestone's goal was fixture loader + invariant checker, not tooling. No shared style conventions have yet been established for bench code, so picking configs now would be guesswork. dag-map itself also has no lint/format config in its vendored subtree.

**Resolution path (address when a lint/format choice becomes load-bearing — e.g., first disagreement on style, or when adding CI):**

- Decide the config stack: ESLint flat config (eslint.config.js) with `@eslint/js` recommended + a prettier-compatible ruleset, Prettier with project defaults. Consider whether dag-map's vendored tree is in scope (currently not lint-gated) or excluded via `eslintIgnore`.
- Add to `bench/package.json` scripts: `lint` (eslint), `format` (prettier --write), `format:check` (prettier --check). Add devDependencies pinned to recent majors.
- Candidate milestones to bundle this into: metrics milestone (M-BASELINE-02 per the epic spec), an external-baseline milestone, or a dedicated `M-BASELINE-XX-bench-tooling` milestone if it warrants standalone treatment. The CI milestone, if any, is the latest-possible home.
- When wired, re-run the tools over existing bench code (loader.mjs, checker.mjs, and any then-current modules) so the baseline is clean from day one.
