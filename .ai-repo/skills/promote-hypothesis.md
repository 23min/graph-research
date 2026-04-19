---
description: Promote a hypothesis from the private pool (docs/private/04-hypotheses/) to an EXP-NN experiment. Re-operationalizes for objective metrics if needed, selects fixtures and baselines, and triggers design-experiment.
name: promote-hypothesis
when_to_use: |
  - When a hypothesis from the pool has been selected for investigation in the current epic
  - When a product need (FlowTime/Liminara) surfaces a question that matches a pool hypothesis
  - When the user says "promote HN" or "let's run H11"
responsibilities:
  - Re-operationalize the hypothesis for the current posture (objective metrics by default; human study only with explicit approval)
  - Select fixtures from the available corpora relevant to the hypothesis
  - Select baselines from existing tooling (dag-map defaults, LOOM, dagre, prior EXPs)
  - Check ADR trigger (does this hypothesis involve a decision worth an ADR?)
  - Invoke design-experiment to create the EXP-NN folder
  - Annotate the pool entry with "promoted to EXP-NN on {date}"
output:
  - A new EXP-NN-slug folder (via design-experiment)
  - Pool annotation in docs/private/04-hypotheses/README.md
  - A brief promotion memo at the top of the EXP folder if re-operationalization changed substantially
invoked_by:
  - planner agent during epic framing
  - any agent when the user explicitly promotes a hypothesis
---

# Skill: Promote Hypothesis

Move a hypothesis from the private pool to an EXP backlog with appropriate re-operationalization.

## Inputs

- Hypothesis ID from the pool (e.g. `H11`, `H07`, `H03`).
- Current epic (the EXP will be scoped to fixtures and baselines relevant to that epic).
- Human-study posture decision: default is objective-metric-only.

## Step 1 — Read the pool entry

Locate `docs/private/04-hypotheses/README.md` and/or `docs/private/04-hypotheses/HNN-<slug>.md` (if the hypothesis has an expanded plan).

Extract:
- Canonical statement.
- Target effect size δ.
- Originally-planned baselines and fixtures (may be different from what's available/appropriate now).
- Human-study assumption (many hypotheses assume Prolific studies).

## Step 2 — Re-operationalize for current posture

**Default: objective-metric-only.** Re-operationalize the hypothesis if the pool entry assumed a human study.

For a hypothesis originally scoped as "task-time reduced by 15% in Prolific study":
- Replace primary metric with an objective proxy from the vector fitness (e.g. crossings, curvature integral, route straightness).
- State the proxy explicitly: "as measured by <metric> on <fixtures>."
- Note that the original human-study formulation is deferred; add a line to the hypothesis.md: "Human-study version deferred; re-evaluate at epic wrap."

**If human study is warranted** (cheap 2AFC; specifically-aesthetic question; principal has approved):
- Keep the original formulation.
- Add a protocol section: ~20 participants, Prolific, 2AFC, pre-registered.
- Budget: ~$100-150.
- This must have explicit principal approval before the EXP folder is created.

## Step 3 — Select fixtures

From available corpora, pick the subset relevant to the hypothesis:

- **FlowTime fixtures** — execution DAGs with weighted edges. Relevant for most route-based hypotheses (H11, H7 via FlowTime stimuli).
- **Liminara fixtures** — reasoning-trace DAGs, streaming. Relevant for stability hypotheses (H13, H15, H17).
- **Metro fixtures** — transit networks. Relevant for LOOM-comparison hypotheses.
- **MLCM fixtures** — from the MLCM literature. Relevant for rule-set ablation (R1-R10).
- **Synthetic fixtures** — generated DAGs with controlled structure. Relevant for hypotheses needing specific topology (H3 phyllotaxis fork-degree, H14 cyclic subcomponents).

Default posture: **FlowTime and Liminara fixtures first.** Add synthetic/metro/MLCM only if the hypothesis specifically needs them.

## Step 4 — Select baselines

At minimum:
- The current dag-map default (`main` branch, default options).

Add as appropriate to the hypothesis:
- **Prior EXP** — if this hypothesis extends a previous experiment, compare against the prior's best config.
- **LOOM** — if the fixtures include transit networks.
- **dagre** — only if the hypothesis is specifically about general-DAG layout or a Sugiyama claim.
- **OGDF / Nöllenburg-Wolff MIP** — usually not. Only if the hypothesis claims something about MIP-optimal metro layouts.

Avoid baseline bloat. Three baselines is usually enough; five is usually too many.

## Step 5 — Check ADR trigger

Will the result of this experiment drive a decision the principal would regret forgetting the reasoning for? Examples:

- Changing a default parameter value → maybe ADR if the parameter is user-facing.
- Adding a new strategy option → ADR for the naming and scope.
- Switching from longest-path to frequency-driven route discovery → definitely ADR.
- Running an ablation study for rules already implemented → usually no ADR.

If ADR is likely: note it in `hypothesis.md` under "Cross-references" with a placeholder number.

## Step 6 — Invoke design-experiment

Produce the EXP-NN-slug folder via the `design-experiment` skill. Pass in:

- EXP-NN number (next sequential)
- Slug
- Hypothesis statement (possibly re-operationalized)
- Fixtures selected in step 3
- Baselines selected in step 4
- Metrics (vector fitness + any hypothesis-specific)
- Budget estimate
- ADR placeholder if applicable

## Step 7 — Annotate the pool

In `docs/private/04-hypotheses/README.md`, find the hypothesis entry and append:

```
promoted to EXP-NN-slug on YYYY-MM-DD
```

If there is a matching expanded plan (e.g. `H11-routes-as-input.md`), append to the bottom of that file:

```
---
Promoted to EXP-NN on YYYY-MM-DD. Re-operationalization notes:
- <summary of what changed from the pool plan to the EXP plan>
```

Do not delete the pool entry. The pool retains all hypotheses ever proposed as an intellectual record.

## Step 8 — Promotion memo (if substantial re-operationalization)

If the EXP's operationalization diverges materially from the pool plan (e.g. human study → objective-only, different fixtures, narrower scope), write a brief memo at the top of the EXP's `hypothesis.md`:

```markdown
## Promotion note

This EXP is the current-posture version of H11 from the hypothesis pool.
Divergences from the pool plan:
- Primary metric: Prolific path-tracing task time → objective metric
  (crossings + route straightness composite) on FT/Liminara fixtures.
- Study sample: 50 Prolific participants → deferred; may add 2AFC pilot
  at epic wrap if objective signal is inconclusive.
- Baselines: dagre + ELK + TRACY reimplementation → dagre only plus
  current dag-map default. ELK and TRACY deferred as out-of-scope for
  this epic.

The pool entry at docs/private/04-hypotheses/H11-routes-as-input.md
remains the long-form plan for a future human-study version.
```

This memo goes *before* the canonical hypothesis statement in the EXP folder.

## Anti-patterns

- Don't promote a hypothesis to an EXP "just to try it" — there should be a specific reason this epic.
- Don't stack three hypotheses into one EXP. One hypothesis per experiment.
- Don't change the hypothesis to match expected results mid-flight. Pre-commit, then test.
- Don't promote and run the same day. There should be a gap — even half a day — to let the scope and fixture selection settle.

## Invocation pattern

> Promote H11 for E-BENCH-experiment-harness, objective-metric posture.

Produces: EXP-NN folder, pool annotation, optional promotion memo.
