# 0003 — LLM-assisted research methodology

## Status

active

## Context

This repo is visibly structured for LLM collaboration: the `.ai/`
framework, `.ai-repo/` skills, agent definitions, and the generated
`CLAUDE.md` / Copilot-instructions adapters are all infrastructure
for assistant-driven work. The method has been in use since the
repo's inception but has not been named in committed methodology or
decision artefacts.

Two problems follow from that silence.

1. A reader arriving at the repo can see the scaffolding but cannot
   tell whether it is actively used or is aspirational infrastructure.
   This ambiguity is incompatible with the project's stated
   transparency posture.
2. The reproducibility protocol (ADR 0002, rule 4) names four fields —
   seed, config path, code SHA, split version hash — that cover the
   *computation* producing a reported result. It does not cover the
   *authoring process* of the code or prose. Where LLM assistance
   shapes that authoring process, the protocol's scope needs to be
   stated explicitly: what it covers, what it does not, and why that
   boundary is the right one.

The goal of this ADR is not to debate whether to use LLM assistance.
That decision is already operative. The goal is to record *how* the
assistance is bounded so that claims made in this repo remain
defensible, and to make the boundary visible to readers.

## Decision

Record the LLM-assisted methodology in
`docs/methodology/llm-assisted-research.md`. The operative points, in
short:

- **Scope.** Assistance is used for coding, drafting, literature
  synthesis, skill execution, and dialogue. It is not used to
  generate numeric results, decide hypotheses, author conclusions,
  or deliver aesthetic judgments about layout quality.
- **Reproducibility.** The committed artefact — code, prose, diff —
  is the reproducible object. Session transcripts are not committed
  and are not citable. Rule 4's four fields cover the computation;
  authoring provenance lives in the diff.
- **Disclosure.** A blanket disclosure (the methodology doc plus
  this ADR) replaces per-sentence or per-commit provenance markers.
  Readers can assume most committed prose and code has been drafted
  or edited with LLM assistance, and that all committed material is
  reviewed and approved by the principal.
- **Private-source isolation.** Assistants inherit rule 9: no
  citation, paraphrase, or link to `docs/private/` or
  `docs/literature/pdfs/` in committed content, regardless of who or
  what is drafting it.

The `.ai/` framework and `.ai-repo/` skills are the executable form
of this decision. Changes to operational detail update the
methodology doc and the skills; changes to the decision itself
require a superseding ADR.

## Alternatives considered

- **Leave the method undocumented.** The status quo before this ADR.
  Produces the ambiguity described in Context: scaffolding visible,
  method unnamed. Rejected because it is incompatible with the
  project's transparency posture.
- **Annotate every commit or sentence with LLM-provenance markers.**
  Maximal disclosure. Rejected because it imposes high ongoing cost
  for low marginal information: the blanket disclosure captures the
  truth (most committed material has LLM assistance) more cheaply,
  and per-commit markers would invite false precision about which
  parts of a diff are "really" whose. Narrower disclosures remain
  available in-place where they are load-bearing.
- **Commit session transcripts as research artefacts.** Treats
  sessions as first-class reproducibility objects. Rejected because
  transcripts are not reproducible (the same prompt can produce
  different outputs across model versions, dates, and contexts),
  are not citable in the way code and prose are, and would balloon
  the repo without improving defensibility. The committed artefact
  is the reproducible unit; that is the standard the methodology
  doc codifies.
- **Forbid LLM assistance.** Returns the project to pre-assistant
  workflows. Rejected because the LLM-legible structure is part of
  the project's design and is well-matched to a solo public
  research log. The question is how to bound the assistance, not
  whether to use it.

## Consequences

- `docs/methodology/llm-assisted-research.md` is the public
  reference for the methodology. `README.md` carries a one-line
  pointer so readers arriving at the repo encounter the disclosure
  without digging.
- The reproducibility protocol's scope is explicitly named: four
  fields cover computation; authoring is covered by the committed
  artefact, not by a transcript.
- Rule 9 (private-source isolation) binds assistants on the output
  side. Read access to mounts is not restricted; committed content
  is.
- Decisions about what to test, what counts as falsification, and
  what the evidence means remain principal calls. This is already
  how the framework's skills are written; this ADR records the rule
  so the skills can be audited against it.
- Future changes to the operational detail of LLM assistance —
  e.g. new skills, changes to which surfaces are assisted — update
  the methodology doc and skills directly. A superseding ADR is
  required only when the scope or disclosure shape changes.
