// The console's query works status out right. Its canaries are built when this runs, in a scratch
// folder, and removed after; nothing is committed that stands in for the model.
//
// Four small graphs, each with what the query must say of it:
//   unfulfilled   an agreement with nothing that fulfils it comes back open
//   failed        an agreement whose check is earl:failed comes back open
//   closed-gap    a gap a signing invalidated is not an open gap, and one it did not is
//   fulfilled     an agreement whose check passes comes back done (the control)
//
// With --canaries, each expectation is run against a deliberately broken query (one that calls every
// agreement done, one that calls every gap open, one that calls every agreement open), and the check
// exits 1 only if every broken query was caught, and 0 if one got through. Run on its own it runs the
// real query on the four graphs, and on the whole model: its open gaps must be exactly the gaps
// known-gap.rq returns. It exits 1 if anything is wrong.
// usage: node intents.mjs [--canaries] <the-builder> <catalog> <intents.rq> <known-gap.rq>
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const args = process.argv.slice(2);
const canaries = args.includes("--canaries");
const [builder, catalog, intents, knownGap] = args.filter((a) => !a.startsWith("--"));
if (!builder || !catalog || !intents || !knownGap) { console.error("usage: node intents.mjs [--canaries] <the-builder> <catalog> <intents.rq> <known-gap.rq>"); process.exit(2); }

const T = "https://drift-king.org/";
const header = `@prefix ah: <${T}ah/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix earl: <http://www.w3.org/ns/earl#> .
@prefix oa: <http://www.w3.org/ns/oa#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
`;
const agreement = `<${T}c/doc> a ah:Agreement ; dcterms:title "A" ; ah:asks <${T}c/ask> .
<${T}c/ask> oa:hasTarget [ oa:hasSource <${T}c/doc> ; oa:hasSelector [ oa:start 0 ; oa:end 5 ] ] ;
`;
const signed = `<${T}c/signing> a prov:Activity ; prov:endedAtTime "2026-01-01T00:00:00Z"^^xsd:dateTime ; prov:used [ prov:specializationOf <${T}c/doc> ] .
`;
const check = (outcome) => `<${T}c/check> a earl:TestCriterion .
[ a earl:Assertion ; earl:test <${T}c/check> ; earl:subject <${T}ah.ttl> ; earl:result [ earl:outcome earl:${outcome} ] ] .
`;
const gap = (name, extra) => `<${T}c/${name}> a earl:Assertion ; earl:test <${T}c/check> ; earl:result [ earl:outcome earl:failed ] ;
  oa:hasTarget [ oa:hasSource <${T}c/letter> ; oa:hasSelector [ oa:start 3 ; oa:end 9 ] ] ${extra} .
<${T}c/${name}-signing> a prov:Activity ; prov:endedAtTime "2026-01-02T00:00:00Z"^^xsd:dateTime ; prov:used <${T}c/${name}> .
`;

const graphs = {
  unfulfilled: header + agreement + `  a oa:Annotation .\n` + signed,
  failed: header + agreement + `  ah:fulfilledBy <${T}c/check> .\n` + signed + check("failed"),
  "closed-gap": header + gap("closed", `; prov:wasInvalidatedBy <${T}c/closing>`) + gap("open", ""),
  fulfilled: header + agreement + `  ah:fulfilledBy <${T}c/check> .\n` + signed + check("passed"),
};
const expectations = {
  unfulfilled: (rows) => rows.length === 1 && rows[0].open === "true" && rows[0].done === "false" && rows[0].asksMet === "0",
  failed: (rows) => rows.length === 1 && rows[0].open === "true" && rows[0].done === "false",
  "closed-gap": (rows) => rows.filter((r) => r.isGap === "true").length === 1 && rows.some((r) => r.gap === `${T}c/open`) && !rows.some((r) => r.gap === `${T}c/closed`),
  fulfilled: (rows) => rows.length === 1 && rows[0].done === "true" && rows[0].open === "false",
};
const broken = {
  unfulfilled: "done", failed: "done", "closed-gap": "gaps", fulfilled: "open",
};
const preface = `PREFIX ah: <${T}ah/>
PREFIX earl: <http://www.w3.org/ns/earl#>
`;
const mutants = {
  done: preface + 'SELECT ?isGap ?agreement ?done ?open ?asksMet WHERE { BIND (false AS ?isGap) BIND (true AS ?done) BIND (false AS ?open) BIND (1 AS ?asksMet) ?agreement a ah:Agreement }',
  open: preface + 'SELECT ?isGap ?agreement ?done ?open ?asksMet WHERE { BIND (false AS ?isGap) BIND (false AS ?done) BIND (true AS ?open) BIND (0 AS ?asksMet) ?agreement a ah:Agreement }',
  gaps: preface + 'SELECT ?isGap ?gap WHERE { BIND (true AS ?isGap) ?gap a earl:Assertion ; earl:result [ earl:outcome earl:failed ] }',
};

const scratch = mkdtempSync(join(tmpdir(), "intents-canary-"));
const rowsOf = (queryFile, graphFile) => JSON.parse(execFileSync(builder, ["--rows", queryFile, ...(graphFile ? ["--graph", graphFile] : ["--catalog", catalog])], { maxBuffer: 1 << 28 }).toString());
try {
  const files = {};
  for (const [name, text] of Object.entries(graphs)) { files[name] = join(scratch, `${name}.ttl`); writeFileSync(files[name], text); }
  const mutantFiles = {};
  for (const [name, text] of Object.entries(mutants)) { mutantFiles[name] = join(scratch, `broken-${name}.rq`); writeFileSync(mutantFiles[name], text); }

  if (canaries) {
    let slipped = 0;
    for (const name of Object.keys(graphs)) {
      const caught = !expectations[name](rowsOf(mutantFiles[broken[name]], files[name]));
      console.log(`${name}: a query that is wrong in this way ${caught ? "was caught, as it must be" : "was NOT caught, so the check is blind"}`);
      if (!caught) slipped++;
    }
    process.exitCode = slipped ? 0 : 1;
  } else {
    const problems = [];
    for (const name of Object.keys(graphs)) {
      const good = expectations[name](rowsOf(intents, files[name]));
      console.log(`${name}: the query ${good ? "says what it must" : "does NOT say what it must"}`);
      if (!good) problems.push(name);
    }
    const open = new Set(rowsOf(intents).filter((r) => r.isGap === "true").map((r) => r.gap));
    const known = new Set(rowsOf(knownGap).map((r) => r.gap));
    const same = open.size === known.size && [...open].every((g) => known.has(g));
    console.log(`the model: ${open.size} open gaps from the console's query, ${known.size} from known-gap.rq, ${same ? "the same" : "NOT the same"}`);
    if (!same) problems.push("gaps");
    process.exitCode = problems.length ? 1 : 0;
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
