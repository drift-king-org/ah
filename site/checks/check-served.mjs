// What a running site answers, against what the model says. For every path prefix the
// site publishes under, an address that is not published returns the 404 page, as
// text/html. For every published file, the Content-Type is the one the model names. A source
// file is not served from here: its address answers with a 303 to the file on GitHub, and the
// list of source files, when it is given, says where.
// usage: node check-served.mjs <base url> <served.tsv> [<source.tsv>]
import { readFileSync } from "node:fs";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [base, manifestFile, sourceFile] = process.argv.slice(2);
if (!base || !manifestFile) { console.error("usage: node check-served.mjs <base url> <served.tsv> [<source.tsv>]"); process.exit(2); }
const rows = (file) => readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => line.split("\t"));
const manifest = rows(manifestFile).map(([path, contentType, how]) => ({ path, contentType, how }));
const sources = sourceFile ? rows(sourceFile).map(([path, target]) => ({ path, target })) : [];
if (!manifest.length) throw new Error("the manifest lists nothing");

const get = async (path) => {
  const response = await fetch(new URL(path, base), { redirect: "follow" });
  return { status: response.status, type: response.headers.get("content-type"), body: Buffer.from(await response.arrayBuffer()) };
};
const problems = [];

// Every folder the site publishes under, the root included.
const folders = new Set([""]);
for (const { path } of manifest) {
  const parts = path.split("/");
  for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join("/") + "/");
}
const notFound = await get("/404");
for (const folder of [...folders].sort()) {
  const missing = await get(`/${folder}this-address-is-not-published`);
  if (missing.status !== 404) problems.push(`/${folder}this-address-is-not-published answers ${missing.status}, not 404`);
  else if (!(missing.type || "").startsWith("text/html")) problems.push(`/${folder}this-address-is-not-published is a 404 served as ${missing.type}, not text/html`);
  else if (!missing.body.equals(notFound.body)) problems.push(`/${folder}this-address-is-not-published does not answer the 404 page`);
}
for (const { path, contentType, how } of manifest) {
  if (how === "source") continue;
  const answer = await get("/" + path);
  if (answer.status !== 200) problems.push(`/${path} answers ${answer.status}`);
  else if (answer.type !== contentType) problems.push(`/${path} is served as ${answer.type}, the model names ${contentType}`);
}
for (const { path, target } of sources) {
  const response = await fetch(new URL("/" + path, base), { redirect: "manual" });
  await response.arrayBuffer();
  if (response.status !== 303) problems.push(`/${path} answers ${response.status}, not a 303 to GitHub`);
  else if (response.headers.get("location") !== target) problems.push(`/${path} is sent to ${response.headers.get("location")}, not to ${target}`);
}
for (const problem of problems) console.error(problem);
// Leave by the exit code and let the open connections close: exiting at once, on
// Windows, can end the process with a crash code that is neither 1 nor 0.
if (problems.length) process.exitCode = 1;
else console.log(`${base}: ${folders.size} folders answer a missing address with the 404 page as text/html; ${manifest.filter((m) => m.how !== "source").length} files are served as the model names, and ${sources.length} source addresses are sent to GitHub`);
