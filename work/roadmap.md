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

M-BASELINE-00 (absorb dag-map via git subtree) and M-BASELINE-01
(fixture loader + invariant checker) are complete and merged into
`epic/E-BASELINE-instruments-and-fixtures`. M-01 delivered the
deterministic fixture loader + invariant checker in a new `bench/`
workspace, consuming dag-map through an npm-workspace symlink; 35
bench tests cover the loader and the three hard invariants.

Next milestone: **M-BASELINE-02 — scoring metrics** (visible crossings,
bend, stretch, clearance). Not started.
