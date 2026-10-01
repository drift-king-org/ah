# Drift King model: improvements and fixes

1. Define `ah/agent/compliance` as a `prov:Person` or `prov:Organization`, with an `rdfs:label`.
2. Record code-strings-named on `ah.ttl` as `earl:failed`. Move the "target" meaning to its own property.
3. Add a `ShipStep` class. Type the two crane push steps, the Worker deploy and the site deploy as `ShipStep`.
4. Add a `heldBy` link from each held step to the gap that holds it.
5. Model each canary case as its own node: `mustBeCaught` / `mustStayClean`, with a label.
6. Add the missing canary cases for range-retypes and namespace-terms-defined.
7. Type canary-isolation.rq as `p-plan:Entity` where it is defined, not later in the file.
8. Type namespace-terms-defined.rq as `earl:TestCriterion` in its first definition.
9. Give every check `.rq` file a `dcterms:identifier` sha256.
10. Give every file node a type (the 51 untyped: proof files, sources, configs, images).
11. Remove counts from gap labels (for example "157 unnamed strings"). Leave the count to a query.
12. Give each gap a `dcterms:title` for display, separate from `rdfs:label`.
13. Link each gap to its letter sentence as its own node (quote plus the exact text fragment), not only through `oa:` targets.
14. Add a `closesWhen` property on each gap.
15. Add a Rekor log entry property to each signing, even if empty for now.
16. Record signer routing order explicitly (for example `prov:qualifiedAssociation` with an order), not just a list of `wasAssociatedWith` values.
17. Mark the sandbox test with a type or flag, such as `nonBinding`, not only in a comment.
18. Give the second chain root (iri-names-not-values canary-step) an `isPrecededBy`, or record that two roots are intended.
19. Move the registry account id out of commands into one named node the commands refer to.
20. Add a query, or a builder output, that produces `model.json` for the site.
