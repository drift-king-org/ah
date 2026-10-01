// The headers file has only literal rules, no more than the platform allows, a rule
// for each file the manifest says needs one, each with the Content-Type and the
// Cache-Control the model names, and no rule for a file the manifest does not list.
// A wildcard (or a placeholder) is a finding: a rule with one applies to an address that
// is not published, and answers the 404 page in that file's type.
// usage: node check-headers.mjs <_headers> <served.tsv>
import { readFileSync } from "node:fs";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const LIMIT = 100;
const [headersFile, manifestFile] = process.argv.slice(2);
if (!headersFile || !manifestFile) { console.error("usage: node check-headers.mjs <_headers> <served.tsv>"); process.exit(2); }

const rules = [];
for (const line of readFileSync(headersFile, "utf8").split("\n")) {
  if (!line.trim()) continue;
  if (!/^\s/.test(line)) { rules.push({ path: line.trim(), headers: {} }); continue; }
  const [name, ...rest] = line.trim().split(":");
  if (!rules.length) throw new Error("a header before any path");
  rules[rules.length - 1].headers[name.trim().toLowerCase()] = rest.join(":").trim();
}
const manifest = readFileSync(manifestFile, "utf8").split("\n").filter(Boolean).map((line) => {
  const [path, contentType, how, cacheControl] = line.split("\t");
  return { path, contentType, how, cacheControl: cacheControl || "" };
});
if (!manifest.length) throw new Error("the manifest lists nothing");

const problems = [];
if (rules.length > LIMIT) problems.push(`${rules.length} rules, and the platform takes ${LIMIT}`);
const byPath = new Map();
for (const rule of rules) {
  if (/[*:]/.test(rule.path)) problems.push(`${rule.path} is not a literal path: a wildcard or a placeholder reaches addresses that are not published`);
  if (byPath.has(rule.path)) problems.push(`${rule.path} has two rules`);
  byPath.set(rule.path, rule);
}
const known = new Set(manifest.map((row) => "/" + row.path));
for (const rule of rules) if (!/[*:]/.test(rule.path) && !known.has(rule.path)) problems.push(`${rule.path} is a rule for a file the model does not publish`);
for (const row of manifest) {
  const rule = byPath.get("/" + row.path);
  if (row.how === "rule" && !rule) { problems.push(`${row.path} needs a rule and has none`); continue; }
  if (!rule) continue;
  if (rule.headers["content-type"] !== row.contentType) problems.push(`${row.path} is given ${rule.headers["content-type"]}, the model names ${row.contentType}`);
  if ((rule.headers["cache-control"] || "") !== row.cacheControl) problems.push(`${row.path} has Cache-Control "${rule.headers["cache-control"] || ""}", the model names "${row.cacheControl}"`);
}
for (const problem of problems) console.error(problem);
if (problems.length) process.exit(1);
console.log(`${headersFile}: ${rules.length} literal rules for ${manifest.length} published files, each the type and the cache control the model names`);
