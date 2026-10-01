// A wanted line the model quotes is the signed words, at the place the model says
// it was taken from: its rdf:value equals the signed file's text between
// oa:start and oa:end. The model's wanted lines are written in one fixed shape,
// read here by it.
// usage: node check-quotes.mjs <wanted.ttl>
import { readFileSync } from "node:fs";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });

const [file] = process.argv.slice(2);
if (!file) { console.error("usage: node check-quotes.mjs <wanted.ttl>"); process.exit(2); }
const base = "https://drift-king.org/";
let text;
try { text = readFileSync(file, "utf8"); } catch (error) { console.error(`${file} cannot be read`); process.exit(2); }
const shape = /rdf:value\s+"((?:[^"\\]|\\.)*)"[^]*?oa:hasSource\s+<([^>]+)>\s*;\s*oa:hasSelector\s*\[[^\]]*oa:start\s+(\d+)\s*;\s*oa:end\s+(\d+)/g;
const unescape = (quoted) => quoted.replace(/\\(["\\])/g, "$1");
const problems = [];
let count = 0;
for (const match of text.matchAll(shape)) {
  count++;
  const [, quoted, source, start, end] = match;
  if (!source.startsWith(base)) { problems.push(`${source} is not a file of this repository`); continue; }
  let signedText;
  try { signedText = readFileSync(source.slice(base.length), "utf8"); } catch (error) { console.error(`${source} cannot be read`); process.exit(2); }
  const signed = Array.from(signedText).slice(Number(start), Number(end)).join("");
  if (unescape(quoted) !== signed) problems.push(`${source} at ${start}-${end} says "${signed}", the model quotes "${unescape(quoted)}"`);
}
if (count === 0) problems.push(`${file} quotes nothing`);
for (const problem of problems) console.error(problem);
if (problems.length) process.exit(1);
console.log(`${file}: ${count} quoted lines, each the signed words at the place named`);
