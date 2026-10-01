// Canary: a copied model value (not-ah/rustc's sd:hasVersionId), not a
// name. sd:hasVersionId is not among the naming properties the check
// exempts (rdfs:label, dcterms:title, sd:name, skos:prefLabel), so a
// literal copy of it must still be caught.
fn canary() {
    let _x = "1.98.1";
}
