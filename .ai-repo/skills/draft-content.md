---
description: Draft a Track 3 content post (Proliminal / LinkedIn / Medium) from a closed-positive or closed-negative EXP. Writes only to docs/private/content/. Enforces the public/private boundary.
name: draft-content
when_to_use: |
  - When an EXP has closed (positive or instructive negative) and is flagged post-worthy in its discussion
  - When the user says "draft a post for EXP-NN"
  - When preparing Track 3 output for an epic wrap
responsibilities:
  - Create the private content workspace at docs/private/content/<milestone-id>-track3/<post-slug>/
  - Populate three post-type templates as scaffolding (deep-dive, takeaway, negative-result candor)
  - Track post status: draft / in-review / published / abandoned
  - NEVER write to any path outside docs/private/content/
  - At publication, migrate only (URL + date + EXP reference) to docs/results/published-content.md
output:
  - docs/private/content/<milestone-id>-track3/<post-slug>/
    - draft-deepdive.md — long-form Medium/Proliminal template
    - draft-takeaway.md — short-form LinkedIn template
    - draft-negative.md — negative-result candor template (if applicable)
    - status.md — tracking state, title options, notes, rejected framings
    - assets/ — hero images, alternate visuals, pulled from EXP contact sheet
  - At publication only: append to docs/results/published-content.md
invoked_by:
  - wrap-epic (when Track 3 is active for a closing milestone)
  - user-initiated when an EXP closes with post-worthy signal
---

# Skill: Draft Content

Writes only to `docs/private/content/`. The public repo sees nothing from this skill until a post actually publishes, and then only a URL + date + EXP reference.

## Input

- EXP-NN identifier (must be closed per the experiments index).
- Milestone ID of the current epic (for folder naming).
- Post-type preference (if any) — deep-dive, takeaway, negative-result, or all three.

## Pre-run checks

- [ ] EXP is `closed-positive`, `closed-negative` (if post is about honest negative result), or `inconclusive` (if the negative-result post specifically addresses the grey zone).
- [ ] EXP's `discussion.md` has a Track 3 recommendation populated.
- [ ] Milestone tracking doc exists at `work/milestones/tracking/<epic>/<milestone-id>-tracking.md`.

## Step 1 — Create the private workspace

```
docs/private/content/<milestone-id>-track3/<post-slug>/
├── status.md
├── draft-deepdive.md       (if deep-dive recommended)
├── draft-takeaway.md       (if takeaway recommended)
├── draft-negative.md       (if negative-result recommended)
└── assets/
    ├── hero.png            (copy from EXP's contact sheet or a diff plate)
    └── supporting/
```

Post slug: short kebab-case, descriptive, non-final. Title can change.

## Step 2 — Populate status.md

```markdown
# Post status

- **Post slug:** <slug>
- **Derived from:** EXP-NN-<slug> (<outcome>)
- **Milestone:** <milestone-id>
- **Status:** draft
- **Created:** YYYY-MM-DD
- **Target channels:**
  - [ ] Medium
  - [ ] Proliminal
  - [ ] LinkedIn
- **Title options:**
  - <option 1>
  - <option 2>
  - <option 3>
- **Notes / rejected angles:**
  - <anything private that shapes the drafting>

## Publication log

(populate on publish: URL, date, channel)
```

## Step 3 — Populate templates

### Deep-dive template (draft-deepdive.md)

Target: 1500-2500 words. Medium or Proliminal long-form.

```markdown
---
title: <working title>
target-channel: Medium / Proliminal
target-length: ~2000 words
draft-status: in-progress
---

# <working title>

## Hook

<One paragraph that states the surprising finding and why it matters.
Not an abstract. A hook.>

## The setup

<One or two paragraphs of context: what dag-map is, what problem this
post is about, why the reader should care. Assume a reader who has
never heard of dag-map.>

## What we tried

<Intervention described in plain language. Include 1-2 images from the
EXP's contact sheet or diff plates.>

## The data

<Headline result with effect size and CI. One image showing the
comparison. Optional: small table.>

## Why it works (or doesn't)

<Mechanism paragraph. This is where the post differentiates from a raw
result — the reader wants to know *why*.>

## Caveats

<Brief honest section on scope limits, confounds, what the result
does not say.>

## What's next

<The follow-up question opened by this result.>

## Cited work

<Bibliography entries used, rendered as informal citations with URLs.
Never link to docs/private/ paths.>
```

### Takeaway template (draft-takeaway.md)

Target: 200-400 words. LinkedIn post.

```markdown
---
target-channel: LinkedIn
target-length: ~300 words
draft-status: in-progress
---

<One-sentence hook>

<One-paragraph context (2-3 sentences max)>

<The finding in one striking image — attach.>

<One-paragraph takeaway — what this means, what changes.>

<Call-to-action or link to the deep-dive version.>
```

### Negative-result template (draft-negative.md)

Target: 800-1500 words. Medium or Proliminal. Distinctive genre — emphasizes honesty.

```markdown
---
title: "I tried X and it didn't work" — <more specific title>
target-channel: Medium / Proliminal
target-length: ~1200 words
draft-status: in-progress
---

# I tried X and it didn't work

## The hypothesis I had

<What I expected and why. Be direct about the reasoning.>

## What I tried

<Intervention. With an image.>

## What actually happened

<Result. With data.>

## Why I think it didn't work

<Mechanism. Even more important for a negative post than a positive one.>

## What I'm doing next

<The pivot or the shelving.>

## Why I'm publishing this

<Short section on the value of negative results in a field that rarely
publishes them.>
```

## Step 4 — Update the tracking doc's Track 3 section (public shell only)

In `work/milestones/tracking/<epic>/<milestone-id>-tracking.md`, locate or create the `## Track 3 — Content` section:

```markdown
## Track 3 — Content

- Post candidates identified this milestone: <count>
- Draft workspace: docs/private/content/<milestone-id>-track3/
- Editorial decisions:
  - <post-slug>: <status> (derived from EXP-NN)
- Published this milestone: <count>
```

**Never name titles-in-progress, never quote draft prose, never describe rejected angles in the tracking doc.** Only the neutral process summary.

## Step 5 — Publication migration (when a post publishes)

This step runs **only when a post actually publishes** — not when it's drafted, not when it's approved.

Triggered externally when the principal publishes the post to its channel. Update:

1. `docs/private/content/.../status.md` — status becomes `published`, publication log filled with URL + date + channel.

2. `docs/results/published-content.md` — append:
```markdown
- YYYY-MM-DD — "<Final Title>" — <Channel> — derived from EXP-NN — <URL>
```

Create `docs/results/published-content.md` if it doesn't exist, with a brief header:

```markdown
# Published content

Track 3 output: external posts derived from experiment results. The
private drafting workspace is gitignored under docs/private/content/.
Only URL + date + EXP cross-reference crosses to public.

## Posts

- (entries appended over time)
```

3. `work/milestones/tracking/<epic>/<milestone-id>-tracking.md` — update the Track 3 section's "Published this milestone" list.

**Nothing else crosses.** Not titles, not excerpts, not alternate versions, not editorial notes.

## Step 6 — Abandonment path

If a post is abandoned (shelved, rejected, made obsolete by a superseding result):

1. `status.md` — status becomes `abandoned`, note the reason briefly.
2. Tracking doc — list as `abandoned` with one-line reason if strategically relevant.
3. No migration to public index.
4. Leave the draft in the private archive (do not delete) for potential future revival.

## Boundary rules (hard)

- **Never** write to any path outside `docs/private/content/` during drafting or review. The only exceptions are the two public-side migrations in Steps 4 and 5, and those are strictly the neutral process summary or the URL-only entry.
- **Never** commit a draft file. `docs/private/` is gitignored.
- **Never** include a draft's prose or title in a public tracking doc, ADR, EXP folder, or commit message.
- **Always** include the EXP cross-reference in the published-content index so lineage is preserved.

## Invocation pattern

> Draft content for EXP-NN.

Produces: private workspace with templates and status. Updates tracking doc with neutral process summary. Does not publish.

> Mark post <slug> as published at <URL> on <date>.

Triggers the migration step: status update + public index append + tracking doc update.

## What this skill does NOT do

- Decide whether a post should exist. That decision lives in the EXP's `discussion.md` Track 3 recommendation, approved by the principal.
- Edit an EXP. Changes to experiments go through `design-experiment` or `run-experiment`.
- Publish to external channels. Publication is a principal-executed step in the real world; this skill only tracks the event.
