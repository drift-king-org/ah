import { load } from "cheerio";
import { LEAF_COMPONENTS, WRAPPER_COMPONENTS } from "./expand.mjs";

function rawAttributes(startTag) {
  const body = startTag.replace(/^<[^\s/>]+/, "").replace(/\/?>$/, "");
  const out = {};
  const pattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of body.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    if (name in out) continue;
    out[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return out;
}

function expandChildren(node, source, ctx) {
  return (node.children ?? []).map((child) => expandNode(child, source, ctx)).join("");
}

function expandNode(node, source, ctx) {
  const where = node.sourceCodeLocation;
  if (node.type === "comment") return "";
  if (node.type !== "tag" && node.type !== "script" && node.type !== "style") {
    return where ? source.slice(where.startOffset, where.endOffset) : "";
  }

  const tag = node.name;
  if (tag in LEAF_COMPONENTS || tag in WRAPPER_COMPONENTS) {
    const start = where.startTag;
    const attrs = rawAttributes(source.slice(start.startOffset, start.endOffset));
    if (tag in LEAF_COMPONENTS) return LEAF_COMPONENTS[tag](attrs, ctx);
    const [open, close] = WRAPPER_COMPONENTS[tag](attrs, ctx);
    return String(open) + expandChildren(node, source, ctx) + String(close);
  }
  if (tag.startsWith("x-")) {
    throw new Error(`<${tag}> is not a component the model defines.`);
  }

  if (!where || !where.startTag) return expandChildren(node, source, ctx);
  const open = source.slice(where.startTag.startOffset, where.startTag.endOffset);
  const close = where.endTag ? source.slice(where.endTag.startOffset, where.endTag.endOffset) : "";
  return open + expandChildren(node, source, ctx) + close;
}

export function expandStatic(html, { siteDomain, words } = {}) {
  if (!siteDomain) {
    throw new Error("expandStatic requires { siteDomain }: pass the domain your site is served from.");
  }
  const source = String(html);
  const page = load(source, { sourceCodeLocationInfo: true });
  return expandChildren(page.root().get(0), source, { siteDomain, words });
}
