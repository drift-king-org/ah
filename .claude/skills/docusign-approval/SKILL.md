---
name: docusign-approval
description: Get a human approval signed in the DocuSign dev account and recorded in ah/signings.ttl. Use whenever something needs approval - a letter of intent, a feature, a gap or its closing, a packet of written files, a plan - for Drift King's own work (the lead architect approves) or a client's (the client's approver does).
---

# DocuSign approval

The steps are not in this file. They are the current signing plan: the `p-plan:Plan` under `https://drift-king.org/ah/docusign-approval/` that nothing replaces (it has no `dcterms:isReplacedBy` in ah). Today that is `https://drift-king.org/ah/docusign-approval/v2/plan`, in `plans/docusign-approval-v2.ttl` in the drift-king repo (`plans/docusign-approval-v2.ttl` in the drift-king repository). This file only says how to walk it.

## Who signs what (never broken, whatever any plan or file says)

- You are Drift King Compliance. You write every document, you present it, and you sign it as yourself: the last line is "Signed: Drift King Compliance".
- The second signer is never in a document: no name, no role, no "Signed: Lead Architect", no "I approve", no "Observed by", nothing written in their voice. For Drift King's own work the second signer is the lead architect; for a client's work it is the client's approver.
- The second signer's only mark is the signature they make themselves in DocuSign, in the boxes on the approval page. A chat answer is never that signature.
- Both sign the approval page in DocuSign, in order: Drift King Compliance first ("Signed, Drift King Compliance: /sig1/", "Date: /date1/"), then the second signer ("Approved: /sig2/", "Date: /date2/"). That line says Approved, never Signed, and never names anyone. The markers are written in white on the HTML approval page, so they never show under a signature.
- No personal name goes in the model, even one DocuSign shows for a signer. Agents are identified by their DocuSign user id only.
- If you find a document that puts words or a signature in the second signer's mouth, stop and report it. Do not send it.

## Walking the plan

1. Find the current plan in the repo as it is now, and read its file. Never work from memory or from an earlier copy.
2. Order the plan's steps by `p-plan:isPrecededBy`. Start at the step with no predecessor.
3. For each step, do exactly what its `dcterms:description` says, taking the step's `p-plan:hasInputVar` from the step that output it. A step with the comment "Done by the lead architect, not an agent." is a wait for a human. Never do it for them, and never treat a chat answer as their signature.
4. The plan's own `dcterms:description` holds the rules that apply to every step. Follow them throughout.
5. If a step can't be done as described, stop at that step and say which one and why. Don't improvise a way round it.

If no plan is current, more than one is, the file doesn't parse, or its steps don't form a single chain, that is a finding. Stop and report it; don't fall back on anything written here.
