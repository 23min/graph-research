# Decisions (ADRs)

Numbered, sequential, durable records of methodological and architectural decisions. Each ADR has a stable 4-digit ID.

## Index

| ID | Title | Status |
|----|-------|--------|
| [0001](0001-pivot-from-weighted-sum-single-corpus-ga-to-multi-objective-methodology.md) | Pivot from weighted-sum single-corpus GA to multi-objective methodology | active |

## Template

```markdown
# NNNN — Short title

## Status
proposed | active | superseded by NNNN | deprecated

## Context
What is the situation, what forces are at play, what constraints apply.

## Decision
What was decided, stated affirmatively.

## Alternatives considered
What else was weighed and why it was set aside.

## Consequences
Positive and negative implications. Known trade-offs.
```

## Conventions

- Filename: `NNNN-slug.md`, where NNNN is a zero-padded sequential integer.
- Superseded ADRs are not deleted. Mark `status: superseded by NNNN` and link forward.
- An ADR's scope should be specific enough to be actionable and narrow enough that a single page of reasoning suffices. Multi-decision bundles should be split.
