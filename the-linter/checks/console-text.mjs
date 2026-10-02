// The console shows the signed sentences. Every ask and answer on the rendered console shows exactly the text
// its selector points to in the signed file, linked to the page where that file is read with a text fragment
// on that sentence, and no row shows a bare character range.
//
// The text is cut here, in code of its own and not the builder's: selections.rq says which file, which
// characters and which sha256 the model pins for its published copy; this reads the copy, checks the hash
// (a copy that does not match is a finding, never a reason to fall back to numbers), and takes the characters
// from start to end, counted as Unicode code points. The rows are the console's own query's, in the order the
// page lists them.
//
// With --canaries it builds three broken cases when it runs, and each must fail it:
//   bare-range   a rendered row showing "Characters N to M" where the text should be
//   one-letter   a rendered row whose text differs from the selected text by one character
//   hash         a selector whose signed file's hash does not match the model's
// and exits 1 only if every one was caught, and 0 if one got through. Run on its own it checks the page and
// exits 1 if anything is wrong. Exit 2 means it could not run: a crash is never a 1.
// usage: node console-text.mjs [--canaries] <the-builder> <catalog> <selections.rq> <intents.rq> <rendered.html> <root> <base>
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const args = process.argv.slice(2);
const canaries = args.includes("--canaries");
const [builder, catalog, selectionsQuery, intentsQuery, page, root, base] = args.filter((a) => !a.startsWith("--"));
if (!builder || !catalog || !selectionsQuery || !intentsQuery || !page || !root || !base) {
  console.error("usage: node console-text.mjs [--canaries] <the-builder> <catalog> <selections.rq> <intents.rq> <rendered.html> <root> <base>");
  process.exit(2);
}
const cheerio = createRequire(resolve("site/expander/package.json"))("cheerio");

const rowsOf = (query, graph) => JSON.parse(execFileSync(builder, ["--rows", query, ...(graph ? ["--graph", graph] : ["--catalog", catalog])], { maxBuffer: 1 << 28 }).toString());

// A sentence as a text directive carries it: runs of white space are one space; everything but letters,
// digits and . _ ~ is percent-encoded.
const directive = (text) => encodeURIComponent(text.split(/\s+/).filter(Boolean).join(" ")).replace(/[-!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const key = (source, start, end) => `${source}|${start}|${end}`;

// What each selection says, cut from the signed file's published copy: { text, address } by key, and the
// problems met on the way, each with a kind.
function cutAll(selections, from) {
  const cuts = new Map();
  const problems = [];
  const files = new Map();
  for (const row of selections) {
    const where = `${row.source} ${row.start} to ${row.end}`;
    if (!row.copy || !row.sha256) { problems.push({ kind: "no-copy", message: `${where}: no published copy with a sha256` }); continue; }
    const path = join(from, row.copy.startsWith(base) ? row.copy.slice(base.length) : row.copy);
    if (!files.has(path)) {
      const bytes = readFileSync(path);
      files.set(path, createHash("sha256").update(bytes).digest("hex") === row.sha256 ? Array.from(bytes.toString("utf8")) : null);
    }
    const characters = files.get(path);
    if (!characters) { problems.push({ kind: "hash", message: `${where}: the copy's sha256 is not the one the model pins` }); continue; }
    const start = Number(row.start);
    const end = Number(row.end);
    if (!(start <= end && end <= characters.length)) { problems.push({ kind: "outside", message: `${where}: outside the file's ${characters.length} characters` }); continue; }
    const text = characters.slice(start, end).join("");
    cuts.set(key(row.source, row.start, row.end), { text, address: row.address ? `${row.address}#:~:text=${directive(text)}` : "" });
  }
  return { cuts, problems };
}

// The rendered page against the rows: card i is row i.
function checkPage(html, rows, cuts) {
  const problems = [];
  const $ = cheerio.load(html);
  const cards = $("article").toArray();
  if (cards.length !== rows.length) problems.push({ kind: "count", message: `${cards.length} cards for ${rows.length} rows` });
  rows.forEach((row, i) => {
    const gap = row.isGap === "true";
    const [source, start, end] = gap ? [row.letter, row.letterStart, row.letterEnd] : [row.askSource, row.askStart, row.askEnd];
    const card = cards[i];
    if (!card) return;
    const expected = cuts.get(key(source, start, end));
    if (!expected) { problems.push({ kind: "no-text", message: `row ${i + 1}: nothing cut for ${source} ${start} to ${end}` }); return; }
    const quotes = $(card).find("p").toArray();
    if (quotes.length !== 1) { problems.push({ kind: "text", message: `row ${i + 1}: ${quotes.length} quoted sentences, not one` }); return; }
    const shown = $(quotes[0]).text();
    if (shown !== expected.text) problems.push({ kind: "text", message: `row ${i + 1}: shows ${JSON.stringify(shown)}, not ${JSON.stringify(expected.text)}` });
    const rest = $(card).clone().find("p").remove().end().text();
    const token = (n) => new RegExp(`(?<![0-9A-Za-z])${n}(?![0-9A-Za-z])`).test(rest);
    if (token(start) && token(end)) problems.push({ kind: "bare-range", message: `row ${i + 1}: shows the range ${start} to ${end}` });
    const links = $(card).find("a").toArray().map((a) => $(a).attr("href"));
    if (!expected.address || !links.includes(expected.address)) problems.push({ kind: "link", message: `row ${i + 1}: no link to ${expected.address || "the page the file is read on"}` });
  });
  return problems;
}

const kinds = (problems) => new Set(problems.map((p) => p.kind));
const scratch = mkdtempSync(join(tmpdir(), "console-text-canary-"));
try {
  const selections = rowsOf(selectionsQuery);
  const rows = rowsOf(intentsQuery);
  const html = readFileSync(page, "utf8");
  const { cuts, problems: cutProblems } = cutAll(selections, root);

  if (canaries) {
    const first = rows[0];
    const [source, start, end] = first.isGap === "true" ? [first.letter, first.letterStart, first.letterEnd] : [first.askSource, first.askStart, first.askEnd];
    const text = cuts.get(key(source, start, end)).text;
    const withFirstQuote = (replacement) => {
      const $ = cheerio.load(html);
      $($("article").first().find("p").first()).text(replacement);
      return $.html();
    };
    const results = [];
    results.push(["bare-range: a row showing a character range in place of the text", kinds(checkPage(withFirstQuote(`Characters ${start} to ${end} of the signed file`), rows, cuts)).has("text")]);
    results.push(["one-letter: a row whose text differs by one character", kinds(checkPage(withFirstQuote(text.slice(0, -1) + (text.endsWith("x") ? "y" : "x")), rows, cuts)).has("text")]);

    // A signed file whose hash is not the one the model pins: a graph and a file made here.
    const header = `@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix oa: <http://www.w3.org/ns/oa#> .
@prefix p-plan: <http://purl.org/net/p-plan#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
`;
    const T = "https://drift-king.org/";
    const wrongBytes = "A sentence of the signed file.";
    const graph = header + `<${T}c/doc> a prov:Entity .
<${T}c/signing> prov:used [ prov:specializationOf <${T}c/doc> ] .
<${T}c/copy> prov:wasDerivedFrom <${T}c/doc> ; p-plan:correspondsToVariable <${T}ah/site/var/copies> ;
  dcterms:identifier "sha256:${createHash("sha256").update("not those bytes").digest("hex")}" .
<${T}c/ask> oa:hasTarget [ oa:hasSource <${T}c/doc> ; oa:hasSelector [ a oa:TextPositionSelector ; oa:start 2 ; oa:end 10 ] ] .
`;
    mkdirSync(join(scratch, "c"), { recursive: true });
    writeFileSync(join(scratch, "c", "copy"), wrongBytes);
    writeFileSync(join(scratch, "graph.ttl"), graph);
    const mismatched = rowsOf(selectionsQuery, join(scratch, "graph.ttl"));
    const found = kinds(cutAll(mismatched, scratch).problems).has("hash");
    // The builder's own cut must stop on the same graph, with exit 1.
    let builderStopped = false;
    try { execFileSync(resolve(builder), ["--cut", resolve(selectionsQuery), "--graph", join(scratch, "graph.ttl"), "--catalog", resolve(catalog)], { cwd: scratch, stdio: "ignore" }); } catch (error) { builderStopped = error.status === 1; }
    results.push(["hash: a selector whose signed file's hash does not match, found by this check", found]);
    results.push(["hash: the same selector, stopped by the builder's own cut with exit 1", builderStopped]);

    let slipped = 0;
    for (const [name, caught] of results) {
      console.log(`${name}: ${caught ? "caught, as it must be" : "NOT caught, so the check is blind"}`);
      if (!caught) slipped++;
    }
    process.exitCode = slipped ? 0 : 1;
  } else {
    const problems = [...cutProblems, ...checkPage(html, rows, cuts)];
    for (const problem of problems) console.error(problem.message);
    console.log(`${rows.length} rows: ${problems.length ? `${problems.length} problems` : "each shows exactly the text its selector points to, and links to the page it is read on"}`);
    process.exitCode = problems.length ? 1 : 0;
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
