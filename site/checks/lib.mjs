// What the checks share: the tags in a file, and what the pinned version says.
// The tags and attributes are read from the files unpacked from the kept tarball
// (component-attributes.generated.mjs is generated from component.ttl, and its
// sha256 is pinned in the model beside it).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

export const read = (path) => readFileSync(path, "utf8");

export async function pinned(attributesPath) {
  return import(pathToFileURL(resolve(attributesPath)).href);
}

// Every start tag, with its attribute names, in document order.
export function startTags(html) {
  const found = [];
  const tag = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g;
  for (const match of html.matchAll(tag)) {
    const names = [...match[2].matchAll(/\s+([^\s=>\/]+)/g)].map((m) => m[1]);
    found.push({ tag: match[1].toLowerCase(), attributes: names, at: match.index });
  }
  return found;
}

export const lineOf = (text, at) => text.slice(0, at).split("\n").length;

export function finish(problems) {
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exit(1);
}
