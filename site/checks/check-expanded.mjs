// No published page still holds an x-* tag.
// usage: node check-expanded.mjs <page.html>...
import { read, startTags, lineOf, finish } from "./lib.mjs";

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node check-expanded.mjs <page.html>..."); process.exit(2); }
const problems = [];
for (const file of files) {
  const text = read(file);
  for (const { tag, at } of startTags(text)) {
    if (tag.startsWith("x-")) problems.push(`${file}:${lineOf(text, at)}: <${tag}> was never expanded`);
  }
}
finish(problems);
console.log(`${files.join(", ")}: no x-* tag left`);
