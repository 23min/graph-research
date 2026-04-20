# LLM-assisted research

How large language model (LLM) assistance is used in this project, and
where it stops. The decision record is
[ADR 0003](../decisions/0003-llm-assisted-research-methodology.md); this
document is the public reference for what the decision means in
practice.

## Why this is documented

Two reasons.

1. **Disclosure honesty.** The repo is visibly structured for LLM
   collaboration: the `.ai/` framework, `.ai-repo/` skills, agent
   definitions, and the generated `CLAUDE.md` / Copilot-instructions
   adapters are all infrastructure for assistant-driven work. Not
   naming the method leaves a reader either confused by the
   infrastructure or inferring that it is unused. For a public
   research log whose credibility rests on transparency, the method
   should be explicit.
2. **Methodological scope.** The reproducibility protocol (rule 4)
   names four fields — seed, config path, code SHA, split version
   hash — that cover the *computation* producing a reported result.
   It does not cover the *authoring process* of the code or prose.
   Where LLM assistance shapes that authoring process, the
   protocol's scope needs to be stated explicitly: what it covers,
   what it does not, and why that boundary is the right one.

## What LLM assistance is used for

| Surface | Examples | Notes |
|---|---|---|
| **Code** | Bench scripts, dag-map PRs, test harnesses, fixtures | Final form is reviewed by the principal; tests gate merge |
| **Drafting** | ADRs, methodology docs, experiment discussions, content posts (Track 3) | Structure and phrasing; the claims remain the principal's |
| **Literature synthesis** | Summarising papers, surfacing connections, drafting per-paper notes under `docs/literature/notes/` | Citations trace to `bibliography.bib`; paraphrases verified against sources |
| **Skill execution** | Running framework and repo-specific skills (`plan-epic`, `design-experiment`, `run-experiment`, `doc-gardening-research`, `wrap-epic`, …) | Skills encode the procedure; the assistant executes steps under principal review |
| **Dialogue** | Pushback on arguments, pressure-testing decisions, exploring alternatives | Treated as a peer-review partner, not an oracle |

## What LLM assistance is not used for

| Not this | Why |
|---|---|
| **Generating numeric results** | Numeric outputs in `docs/experiments/*/results/` and `docs/results/` are produced by committed scripts run against committed inputs. Assistants propose and review the scripts; they do not fabricate the numbers. |
| **Deciding hypotheses** | What the project chooses to test, and what would count as falsification, is a principal decision. Assistants help phrase hypotheses and pressure-test falsifiability, but promotion to an EXP is not a delegated call. |
| **Authoring conclusions** | `discussion.md` files and closed-epic wraps record the principal's reading of the evidence. Assistants draft and check; the claim is the author's. |
| **Aesthetic judgment** | Judgments about layout quality — the research's core subject matter — are not delegated. Assistants can surface candidates; the principal chooses. |
| **Citing from private sources** | Rule 9 bars committed content from quoting, paraphrasing, or linking to `docs/private/` or `docs/literature/pdfs/`. Assistants operating on this repo inherit that rule. |

## Relationship to the reproducibility protocol

The four reproducibility fields cover the *computation*: given those
four, the numeric result regenerates deterministically. They do not
cover the *process* by which the code or prose was produced.

This is by design.

- The committed artefact — code in a script, prose in an ADR — is the
  reproducible object. A different author (or a different assistant
  session) could arrive at the same artefact via a different path,
  and the computation would still produce the same result.
- Session transcripts are not artefacts. They are not committed, not
  citable, and not the subject of claims.
- Where an assistant proposes a change that alters a reported result,
  the change is reviewed on its merits through the normal commit
  process. Provenance is in the diff, not in the transcript.

## Disclosure shape

The project does not annotate individual sentences or commits with
"written by LLM" markers. The blanket disclosure is this document
plus ADR 0003. Readers can assume:

- Most committed prose has been drafted or edited with LLM assistance.
- Most committed code has been drafted or edited with LLM assistance.
- All committed material has been reviewed and approved by the
  principal before the commit.
- Numeric results, hypotheses, and conclusions are the principal's,
  produced under the constraints above.

Where a specific piece of work warrants a narrower disclosure — for
example, an experiment's discussion contains a claim the assistant
strongly pushed for and the principal wants to name that — the
narrower disclosure is recorded in that artefact's text.

## Relationship to the public/private boundary

Assistants operating on this repo have read access to `docs/private/`
and `docs/literature/pdfs/` through the devcontainer mounts. They are
bound by rule 9 on the output side: committed content must not cite,
paraphrase, or link to private sources, regardless of who or what is
drafting it. The `doc-gardening-research` skill enforces this with
grep checks at every epic wrap.

The implication for LLM sessions: an assistant may read a PDF or
private note to inform a committed artefact, but the committed
artefact must be independently defensible from public sources —
primarily `bibliography.bib` entries for papers, and first-principles
reasoning for private notes.

## What this document is not

- Not a tools list. Which specific LLM(s) are used is not
  load-bearing for the methodology and is not tracked here.
- Not a prompt log. Sessions are not committed.
- Not a claim that LLM assistance is neutral. Assistance shapes what
  gets drafted, which arguments get pressed, and which phrasings
  survive. The safeguards above — principal review, committed
  artefact as the reproducible object, rule 9 on private sources —
  address the safeguardable parts; the residual influence is
  acknowledged rather than denied.

## Cross-references

- [ADR 0003](../decisions/0003-llm-assisted-research-methodology.md) — LLM-assisted research methodology
- [three-track-workflow.md](three-track-workflow.md) — how tracks and skills compose
- [hypothesis-pool.md](hypothesis-pool.md) — private pool, public experiments
- `.ai-repo/rules/research.md` — rule 4 (reproducibility protocol), rule 9 (private-source isolation)
- `.ai/rules.md` — framework-level rules, including explicit commit approval
