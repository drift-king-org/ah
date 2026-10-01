// A page is made of components and nothing else: in the body, every element is an
// x-* tag. The document's own head is plain HTML.
// usage: node check-only-components.mjs <template>
import { read, startTags, lineOf, finish } from "./lib.mjs";

const [file] = process.argv.slice(2);
if (!file) { console.error("usage: node check-only-components.mjs <template>"); process.exit(2); }
const text = read(file);
const body = text.search(/<body[\s>]/i);
if (body < 0) { console.error(`${file}: no body`); process.exit(2); }
const end = text.search(/<\/body>/i);
const problems = [];
let count = 0;
for (const { tag, at } of startTags(text)) {
  if (at <= body || (end >= 0 && at >= end)) continue;
  count++;
  if (!tag.startsWith("x-")) problems.push(`${file}:${lineOf(text, at)}: <${tag}> in the body is not an x-* tag`);
}
finish(problems);
console.log(`${file}: ${count} elements in the body, every one an x-* tag`);
