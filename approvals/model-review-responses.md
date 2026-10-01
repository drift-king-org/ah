# Drift King: responses to a model review

The designer reviewed the model and named twenty points. The review is filed exactly as we received it:
https://drift-king.org/reviews/model-fixes

Each response below quotes the point it answers and links to that point, highlighted in the review.

Our signed intent says: "When anything disagrees with the model, it does not ship." So we make each change that brings the model into agreement. Each one closes when the build that makes it passes, with its check and the check's canaries.
https://drift-king.org/intent/letter-of-intent#:~:text=When%20anything%20disagrees%20with%20the%20model%2C%20it%20does%20not%20ship.

Our signed intent also says: "If the model does not need it, we do not add it." So we do not make a change the model does not need.
https://drift-king.org/intent/letter-of-intent#:~:text=If%20the%20model%20does%20not%20need%20it%2C%20we%20do%20not%20add%20it.

Point 1: "Define ah/agent/compliance as a prov:Person or prov:Organization, with an rdfs:label." Already true, in the signing plan, plans/docusign-approval.ttl, which ah.ttl imports. There it has the label Drift King Compliance, and it is typed as a software agent: the system's own account, not a person or an organization.
https://drift-king.org/reviews/model-fixes#:~:text=Define

Point 2: "Record code-strings-named on ah.ttl as earl:failed. Move the 'target' meaning to its own property." We make it. The gap already records failed. But the-linter's own entry for this check, in not-ah.ttl, records passed on ah.ttl, as a target, not as what happened. A result must say what happened. We move each check's target onto the check itself, and a result comes only from a run. The signed gap does not change.
https://drift-king.org/reviews/model-fixes#:~:text=Record%20code-strings-named%20on

Point 3: "Add a ShipStep class. Type the two crane push steps, the Worker deploy and the site deploy as ShipStep." We do not make it. The registry node from point 19 already marks a step that ships.
https://drift-king.org/reviews/model-fixes#:~:text=Type%20the%20two%20crane%20push%20steps

Point 4: "Add a heldBy link from each held step to the gap that holds it." We do not make it. Held is the state of one build. It belongs in that build's results.
https://drift-king.org/reviews/model-fixes#:~:text=from%20each%20held%20step%20to%20the%20gap

Point 5: "Model each canary case as its own node: mustBeCaught / mustStayClean, with a label." Already true. Each canary case is its own assertion, and its outcome says whether it must be caught or must stay clean.
https://drift-king.org/reviews/model-fixes#:~:text=Model%20each%20canary%20case%20as%20its%20own%20node

Point 6: "Add the missing canary cases for range-retypes and namespace-terms-defined." We make it for every check: each one gets a case it must catch and a case it must pass.
https://drift-king.org/reviews/model-fixes#:~:text=Add%20the%20missing%20canary%20cases

Point 7: "Type canary-isolation.rq as p-plan:Entity where it is defined, not later in the file." Already true. It is typed. Where in the file the type is written does not change the model.
https://drift-king.org/reviews/model-fixes#:~:text=where%20it%20is%20defined%2C%20not%20later%20in%20the%20file

Point 8: "Type namespace-terms-defined.rq as earl:TestCriterion in its first definition." Already true. It is typed. Where in the file the type is written does not change the model.
https://drift-king.org/reviews/model-fixes#:~:text=in%20its%20first%20definition

Point 9: "Give every check .rq file a dcterms:identifier sha256." We make it. The builder writes each one, and a mismatch fails the build.
https://drift-king.org/reviews/model-fixes#:~:text=Give%20every%20check

Point 10: "Give every file node a type (the 51 untyped: proof files, sources, configs, images)." We make it. We type every one with the vocabularies we already use, and a new check fails any file that has no type.
https://drift-king.org/reviews/model-fixes#:~:text=Give%20every%20file%20node%20a%20type

Point 11: "Remove counts from gap labels (for example '157 unnamed strings'). Leave the count to a query." We make it.
https://drift-king.org/reviews/model-fixes#:~:text=Remove%20counts%20from%20gap%20labels

Point 12: "Give each gap a dcterms:title for display, separate from rdfs:label." We make it. Each gap gets a title for its page.
https://drift-king.org/reviews/model-fixes#:~:text=Give%20each%20gap%20a

Point 13: "Link each gap to its letter sentence as its own node (quote plus the exact text fragment), not only through oa: targets." We make it. We add the quote itself beside its position in the letter, and a check that the quote is still at that position.
https://drift-king.org/reviews/model-fixes#:~:text=Link%20each%20gap%20to%20its%20letter%20sentence

Point 14: "Add a closesWhen property on each gap." We do not make it. A gap already closes when its test passes on its subject.
https://drift-king.org/reviews/model-fixes#:~:text=property%20on%20each%20gap

Point 15: "Add a Rekor log entry property to each signing, even if empty for now." We make it as a gap. A value cannot be empty, so we record the missing entry as a gap, until the entry exists.
https://drift-king.org/reviews/model-fixes#:~:text=Add%20a%20Rekor%20log%20entry%20property

Point 16: "Record signer routing order explicitly (for example prov:qualifiedAssociation with an order), not just a list of wasAssociatedWith values." We make it. Each signer gets their own signing activity, with the time it ended. The order comes from the times.
https://drift-king.org/reviews/model-fixes#:~:text=Record%20signer%20routing%20order%20explicitly

Point 17: "Mark the sandbox test with a type or flag, such as nonBinding, not only in a comment." This is open.
https://drift-king.org/reviews/model-fixes#:~:text=Mark%20the%20sandbox%20test

Point 18: "Give the second chain root (iri-names-not-values canary-step) an isPrecededBy, or record that two roots are intended." We make it. We give it one, so the checks have one first step.
https://drift-king.org/reviews/model-fixes#:~:text=Give%20the%20second%20chain%20root

Point 19: "Move the registry account id out of commands into one named node the commands refer to." We make it. We name it once, and the commands refer to it.
https://drift-king.org/reviews/model-fixes#:~:text=Move%20the%20registry%20account%20id

Point 20: "Add a query, or a builder output, that produces model.json for the site." We make it. A query and a render step make it, pinned like the other pages.
https://drift-king.org/reviews/model-fixes#:~:text=Add%20a%20query%2C%20or%20a%20builder%20output

We also saw one thing the review did not name: the site deploys before the checks run. We fix that first. The site deploy waits for every check.

What we do not do: we do not add to the model what the model does not need.

Signed: Drift King Compliance
