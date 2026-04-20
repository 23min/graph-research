# Hypothesis pool — policy

How research claims get from a private brainstorm surface to a public, measurable experiment. This document describes *how the pool works*, not what is in it. The pool's contents are deliberately private (see §4).

The pool is one of the three operating surfaces of the research framework alongside experiments (`docs/experiments/`) and content (`docs/results/published-content.md`). It feeds experiments; experiments feed content. The decision record for this framing is [ADR 0002](../decisions/0002-adopt-three-track-research-framework.md).

## 1. What the pool is

A curated menu of research claims that the project might one day test. Each entry is a hypothesis in the scientific sense — a claim that could be shown wrong — not a plan, a feature, or an intuition. The pool is always larger than the project's capacity to test. That is the point.

The pool is *curated*, not *exhaustive*. Entries are added when they are genuinely worth keeping. Entries are removed when they no longer are. Gardening happens at every epic wrap (see §6).

## 2. What a hypothesis looks like

The canonical form:

> *For graphs with property P, applying intervention X will change metric M by at least δ compared to baseline B, because of mechanism R.*

Five tests a hypothesis must pass before it earns a slot in the pool:

| Test | What it means |
|---|---|
| **Falsifiable** | States something that could be shown wrong. "Curves look nicer" fails; "curvature integral predicts task time at r ≥ 0.6" passes. |
| **Specific** | Names the population, intervention, metric, effect size, and reference point. Without all five, the entry is a question, not a hypothesis. |
| **Implementation-independent** | Says *what* is expected, not *how* to build it. "X improves Y" not "here is how we build X". Conflating them turns the experiment into an engineering project in disguise. |
| **Mechanistic** | You can articulate *why* you expect the effect. The mechanism is what makes the result generalise beyond the test. |
| **Test-scoped** | Evaluable with foreseeable infrastructure. A hypothesis that needs six milestones to set up is a research programme, not a pool entry. |

Entries that fail one or more tests are kept anyway if they are clearly worth remembering — but flagged so their nature is explicit (e.g. *aspirational*, *needs reshaping*, *engineering idea in disguise*). The pool is honest about its own quality distribution.

## 3. Pool, experiment, content — the three surfaces

```
  private pool                 public experiment            public content
  (brainstorm)                 (measurement)                (communication)
  ─────────────                ───────────────              ───────────────
  many hypotheses    promote   one EXP-NN-<slug>   publish  blog / paper / post
  of varying ────────────────> per promoted ───────────────> when a closed EXP
  quality                      hypothesis                   justifies it

  (private mount)              docs/experiments/            docs/results/
  hypothesis pool              EXP-NN-<slug>/               published-content.md
```

- **Pool (private).** Curated menu. Items mutate freely. No commitment to run any of them. Contents are out of band per rule 9 of `.ai-repo/rules/research.md` (private-source isolation).
- **Experiment (public).** One promoted hypothesis per EXP folder, with `hypothesis.md`, `setup.md`, `results/`, `discussion.md`. Reproducibility protocol required. See `three-track-workflow.md` §Phase 3.
- **Content (public, URL-only).** Blog, LinkedIn, paper. Drafts live privately. The public repo carries only URL + date + EXP cross-reference, migrated on actual publication.

A hypothesis is private until it is promoted. A promoted hypothesis is public as an EXP. Public content is downstream of a closed EXP, never of a private hypothesis.

## 4. Why the pool is private

Four reasons the boundary is load-bearing, not incidental:

1. **Brainstorm latitude.** Hypotheses drafted in private can be wrong, half-formed, or obviously aspirational without cost. Publishing them imposes the cost of revising a committed artefact every time the phrasing shifts.
2. **Curation is the signal.** The act of promoting a hypothesis to an EXP is the statement "this one is ready to measure". Publishing the full pool drowns that signal — readers cannot tell which claims the project endorses and which are backlog.
3. **Quality distribution is honest.** A pool of 30 hypotheses contains obvious winners, speculative probes, and ideas the author already half-suspects are wrong. That distribution is appropriate for a brainstorm surface and inappropriate for a public-facing research statement.
4. **Rule 9 applies both ways.** The private-source isolation rule says committed content does not cite, paraphrase, or link to private notes. A pool entry that is about to become public must therefore be *rewritten from first principles in public language*, not copied. This is a feature: it forces the reshaping that distinguishes a brainstorm entry from a committable experiment.

## 5. Promotion — from pool to experiment

A hypothesis is promoted when an epic is being framed that would benefit from running it. Promotion is never speculative: if no epic needs the answer, the hypothesis stays in the pool.

The promotion procedure is codified in the `promote-hypothesis` skill (`.ai-repo/skills/promote-hypothesis.md`). In outline:

1. **Reshape** the claim for the current research posture (objective-metric default; pairwise-preference pilot when warranted; full task-based user study only at publication preparation).
2. **Rewrite from first principles in public language** — do not copy the pool text. This satisfies rule 9 and produces an EXP folder that reads standalone.
3. **Select fixtures and baselines** using the held-out split discipline (`bench/fixtures/splits.json`).
4. **Check whether an ADR is warranted** — a hypothesis that changes methodology (new metric, new baseline class, new corpus) usually needs one.
5. **Invoke `design-experiment`** to create `docs/experiments/EXP-NN-<slug>/` with the four required files.

Promoted hypotheses retain a private cross-reference for the author's benefit but the public EXP does not refer back to the pool. The EXP is self-contained.

## 6. Gardening — pruning and refinement

The pool is gardened at every epic wrap, as part of `wrap-epic` (`.ai-repo/skills/wrap-epic.md`). Gardening decisions for each entry:

| Decision | When | Effect |
|---|---|---|
| **Keep** | The hypothesis remains a plausible future experiment | No change |
| **Refine** | The phrasing has drifted or the mechanism has sharpened | Rewrite the entry in-place |
| **Promote** | An epic is about to run it | Draft public EXP per §5; retain private pointer |
| **Retire** | The hypothesis has been answered (positively or negatively) by an EXP | Move to a "closed" section with a one-line reference to the EXP; do not delete |
| **Withdraw** | The hypothesis is no longer plausible or interesting | Remove with a one-line note in the pool's change log explaining why |

Retirement is not deletion. A retired entry is kept so later reviewers can see the lineage. Withdrawal is deletion with a receipt.

## 7. Relationship to engineering ideas

Some entries look like hypotheses but are really engineering proposals ("implement algorithm X", "add feature Y"). They are not pool material. They live in a sibling engineering-ideas pool (also private). The promotion flow for engineering ideas mirrors hypothesis promotion but targets an epic spec rather than an EXP folder; when an engineering idea's value is empirical (does implementing X improve metric Y?), it can be promoted as an EXP instead, since the question is measurable.

The same five tests from §2 are a useful filter for engineering ideas too: an engineering proposal without a *measurable outcome* is a wish; with one, it is a candidate experiment.

## 8. What this document is not

- Not a list of the hypotheses. Those are private.
- Not a research plan. Epics are the unit of focused work; the pool feeds epic framing, not the other way round.
- Not immutable. When the promotion flow materially changes, update this doc and, if the change is methodological, supersede the governing ADR.

## 9. Cross-references

- [ADR 0002](../decisions/0002-adopt-three-track-research-framework.md) — three-track research framework
- [three-track-workflow.md](three-track-workflow.md) — operational detail
- `.ai-repo/skills/promote-hypothesis.md` — promotion procedure
- `.ai-repo/skills/design-experiment.md` — EXP creation
- `.ai-repo/skills/wrap-epic.md` — gardening at epic wrap
- `.ai-repo/rules/research.md` — rule 9 (private-source isolation)
