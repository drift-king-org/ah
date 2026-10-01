// Source is not served from drift-king.org. Every source file's address is sent to the file on
// GitHub by a 303, and no published copy of a source file is deployed: each copy is left out by
// a literal line in the ignore file, so its address cannot answer here.
// usage: node check-source.mjs <source.tsv> <_redirects> <.assetsignore>
import { readFileSync } from "node:fs";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [sourceFile, redirectsFile, ignoreFile] = process.argv.slice(2);
if (!sourceFile || !redirectsFile || !ignoreFile) { console.error("usage: node check-source.mjs <source.tsv> <_redirects> <.assetsignore>"); process.exit(2); }

const rows = readFileSync(sourceFile, "utf8").split("\n").filter(Boolean).map((line) => {
  const [path, target, copied] = line.split("\t");
  return { path, target, copied: copied === "copied" };
});
if (!rows.length) throw new Error("the list of source files is empty");
const redirects = new Set(readFileSync(redirectsFile, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
const ignored = readFileSync(ignoreFile, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

const problems = [];
for (const line of ignored) if (/[*?\[]/.test(line)) problems.push(`${line} is not a literal path in the ignore file`);
const ignoredSet = new Set(ignored);
for (const { path, target, copied } of rows) {
  if (!target.startsWith("https://github.com/")) problems.push(`/${path} is sent to ${target}, which is not GitHub`);
  if (!redirects.has(`/${path} ${target} 303`)) problems.push(`/${path} is not sent to ${target} by a 303`);
  if (copied && !ignoredSet.has(`/${path}`)) problems.push(`/${path} has a published copy that the deploy does not leave out, so it would answer on drift-king.org`);
}
for (const problem of problems) console.error(problem);
if (problems.length) process.exitCode = 1;
else console.log(`${rows.length} source addresses are each sent to GitHub by a 303, and the ${rows.filter((r) => r.copied).length} published copies are left out of the deploy`);
