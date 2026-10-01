// Every x-* tag in a template is a component the pinned version defines, and every
// attribute on it is one that component takes, or one every component passes
// through (id, name, role, aria-*, data-*, hx-*).
// The components are the ones component.ttl names (cmp:tagName); the attributes are
// the generated list's, which has no entry for a component that takes none.
// usage: node check-tags.mjs <template> <component.ttl> <component-attributes.generated.mjs>
import { read, pinned, startTags, lineOf, finish } from "./lib.mjs";

const [file, modelPath, attributesPath] = process.argv.slice(2);
if (!file || !modelPath || !attributesPath) { console.error("usage: node check-tags.mjs <template> <component.ttl> <attributes.mjs>"); process.exit(2); }
const defined = new Set([...read(modelPath).matchAll(/cmp:tagName\s+"(x-[a-z0-9-]+)"/g)].map((m) => m[1]));
const { COMPONENT_OWN_ATTRIBUTES: own } = await pinned(attributesPath);
const passes = (name) => ["id", "name", "role"].includes(name) || /^(aria|data|hx)-/.test(name);
const text = read(file);
const problems = [];
let count = 0;
for (const { tag, attributes, at } of startTags(text)) {
  if (!tag.startsWith("x-")) continue;
  count++;
  if (!defined.has(tag)) { problems.push(`${file}:${lineOf(text, at)}: <${tag}> is not a component the model defines`); continue; }
  for (const name of attributes) {
    if (!(own[tag] || []).includes(name) && !passes(name)) problems.push(`${file}:${lineOf(text, at)}: <${tag}> does not take "${name}"`);
  }
}
finish(problems);
console.log(`${file}: ${count} x-* tags, each a defined component, each attribute one it takes`);
