// The site styles only classes the pinned version emits: every class in a
// selector of the stylesheet is in some component's emitted classes.
// usage: node check-styles.mjs <style.css> <component-attributes.generated.mjs>
import { read, pinned, lineOf, finish } from "./lib.mjs";

const [file, attributesPath] = process.argv.slice(2);
if (!file || !attributesPath) { console.error("usage: node check-styles.mjs <style.css> <attributes.mjs>"); process.exit(2); }
const { COMPONENT_EMITS_CLASSES } = await pinned(attributesPath);
const emitted = new Set(Object.values(COMPONENT_EMITS_CLASSES).flat());
// Selectors are what comes before a "{". Comments are blanked, at-rules
// (@font-face, @keyframes, @media) are skipped, and so are declarations.
const css = read(file).replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
const problems = [];
const seen = new Set();
for (const match of css.matchAll(/([^{}]+)\{/g)) {
  const selector = match[1];
  if (/^\s*@/.test(selector)) continue;
  for (const cls of selector.matchAll(/\.(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g)) {
    if (!emitted.has(cls[1]) && !seen.has(cls[1])) {
      seen.add(cls[1]);
      problems.push(`${file}:${lineOf(css, match.index + cls.index)}: .${cls[1]} is not a class any component emits`);
    }
  }
}
finish(problems);
console.log(`${file}: every class it styles is one the pinned version emits`);
