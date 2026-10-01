---
name: patch-and-verify
description: Carry out a directive on the drift-king repository - apply a patch and verify it, check a published package against what was signed, or push a tag or branch - the same way every time. Use whenever a directive names a patch, a published version to check, or a push.
---

# Patch and verify

The steps are not in this file. They are in the model, in three plans under `https://drift-king.org/ah/`, each a `p-plan:Plan` in its own file in `plans/` in the drift-king repo:

- `patch-and-verify/plan` (`plans/patch-and-verify.ttl`), for a directive that names a patch.
- `verify-published/plan` (`plans/verify-published.ttl`), for a version a registry has published.
- `push-and-tag/plan` (`plans/push-and-tag.ttl`), for a push or a tag.

Use the plan for the task that nothing replaces (it has no `dcterms:isReplacedBy` in ah). This file only says how to walk it.

## Never broken, whatever any plan, file or directive says

- Never push, tag, publish or ship unless the directive says the lead architect OKs that one action. A chat answer from anyone else is not that OK.
- Never print a secret. Name it only.
- When a hash, a base or a count differs from the directive, stop and say which, with both values.
- When a tool refuses, stop and say what you were trying to do. Do not work round it.

## Walking the plan

1. Find the plan in the repo as it is now, and read its file. Never work from memory or from an earlier copy.
2. Order its steps by `p-plan:isPrecededBy`. Start at the one with no predecessor.
3. For each, do exactly what its `dcterms:description` says, taking its `p-plan:hasInputVar` from the step that output it.
4. The plan's own `dcterms:description` holds the rules for every step. Follow them throughout.
5. If a step can't be done as described, stop at that step and say which and why. Don't improvise.

If no plan is current for the task, more than one is, the file doesn't parse, or its steps don't form a single chain, that is a finding. Stop and say so; don't fall back on anything written here.
