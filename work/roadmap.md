# Roadmap

This project works under a three-track framework (see
`docs/decisions/0002-adopt-three-track-research-framework.md`) and deliberately does not maintain a
long-range roadmap. Epics are chosen outcome-dependent: each epic's
scope is decided after the previous epic wraps, informed by library
needs, product needs, experiment follow-ups, and current intuition.

## What lives here

A snapshot of the current epic, or "no active epic" during transitions.
Historical epic specs live under `work/done/`. Active work lives under
`work/epics/`.

## Current state

Active epic as of 2026-04-20: **E-BASELINE-instruments-and-fixtures**
(in-progress; see `work/epics/E-BASELINE-instruments-and-fixtures/epic.md`).
Goal: build the measurement and rendering instruments that let dag-map
be evaluated honestly on a defined fixture set and frozen as the v0
reference point every future EXP compares against. Nine milestones
(M-00 added after M-01 was paused to change repo topology first),
no layout intervention, no GA. The operating frame is recorded in
`docs/decisions/0002-adopt-three-track-research-framework.md`. The
hypothesis pool is a curated menu, not a commitment; specific
hypotheses get promoted to EXPs when the moment is right.

Active milestone: **M-BASELINE-01 — fixture loader + invariant checker**
(draft; paused pending resumption on its own branch). M-BASELINE-00
(absorb dag-map via git subtree) is **complete** — subtree import at
upstream `f9e4fa2`, vendoring documentation committed, wrapper scripts
in place, commit-discipline hook wired in, 304/304 dag-map tests pass,
byte-identical verification against a fresh upstream clone. Awaiting
merge of the M-00 branch into `epic/E-BASELINE-instruments-and-fixtures`,
then M-01 resumes.
