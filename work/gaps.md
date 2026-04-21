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
