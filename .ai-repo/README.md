# .ai-repo — project-specific framework overrides

This directory holds graph-research-specific rules, configuration, and skills that override or supplement the shared `.ai/` framework.

- `config/artifact-layout.json` — canonical artifact layout (roadmap, epics, milestones, tracking, completed)
- `rules/research.md` — research discipline rules (experiment IDs, bibliography, ADRs, reproducibility)
- `rules/tdd-conventions.md` — TDD conventions adapted for this repo's Node/JS codebase
- `skills/` — project-specific skill workflows (none yet)

Changes here are propagated to generated assistant surfaces (`.claude/`, `.github/`) by `bash .ai/sync.sh`. Do not hand-edit the generated files.
