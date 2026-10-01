# @apricotter/x-components

A registry of `x-*` markup tags, expanded server-side, plus the OWL/SHACL
ontology that is the source of truth for what each tag takes.

```html
<x-card as="form">
  <x-field label="Business name" name="business"></x-field>
  <x-button label="Submit" type="submit"></x-button>
</x-card>
```

Write markup like that in plain HTML, run it through this package's
registry, get real HTML back.

## What's in the package

- **`component.ttl`** — the ontology. Every registered tag, its output
  element, its ARIA role, its attributes (which are required), and which
  child tag a wrapper expects. This is the authority; `expand.mjs` is
  checked against it, not the other way round. Imports `wai-aria.ttl`.
- **`wai-aria.ttl`** — the WAI-ARIA role vocabulary `component.ttl`'s
  `cmp:hasAriaRole` facts point into: role characteristics quoted from the
  W3C WAI-ARIA 1.2 Recommendation. Shipped alongside `component.ttl` so the
  import actually resolves to something in the package, not an external URL.
- **`component-attributes.generated.mjs`** — `COMPONENT_OWN_ATTRIBUTES`,
  `COMPONENT_REQUIRED_ATTRIBUTES` and `ALLOWED_ELEMENT_NAMES`, generated
  from `component.ttl`. `expand.mjs` reads this at runtime; nothing in
  either file is hand-copied from the other.
- **`expand.mjs`** — the registry itself: `LEAF_COMPONENTS`,
  `WRAPPER_COMPONENTS`, `ALL_TAGS`.

## Two kinds of tag

A **leaf** takes a flat object of string attributes and returns one
complete string of markup:

```js
import { LEAF_COMPONENTS } from "@apricotter/x-components";

LEAF_COMPONENTS["x-button"]({ label: "Submit", type: "submit" }, { siteDomain: "example.com" });
// -> '<button type="submit" class="btn btn--primary">Submit</button>'
```

A **wrapper** takes the same attributes and returns `[openTagHtml,
closeTagHtml]`; its children are ordinary markup and are not this
package's concern — whatever's between the two strings you write back in
is untouched:

```js
import { WRAPPER_COMPONENTS } from "@apricotter/x-components";

const [open, close] = WRAPPER_COMPONENTS["x-card"]({ compact: "true" }, { siteDomain: "example.com" });
```

Every entry is `(attrs, ctx) => …`. `attrs` is a plain object — HTML
attribute names in, lowercased, values as strings. `ctx` carries
per-call settings; today that's just `siteDomain`.

## `siteDomain` is required

Any tag that renders an anchor decides whether the link leaves the
site by comparing its host against `ctx.siteDomain`. There is no
default — a call with no `ctx.siteDomain` throws, rather than silently
treating every link on the page as external (or as internal). Pass the
zone your own site is deployed under:

```js
LEAF_COMPONENTS["x-link"](
  { href: "https://example.com/about", label: "About" },
  { siteDomain: "example.com" }
);
```

## Wiring it into a real request

This package doesn't ship a runtime — no `HTMLRewriter`, no DOM, no
bundler assumptions. Wire `LEAF_COMPONENTS`/`WRAPPER_COMPONENTS` into
whatever's rewriting your HTML: walk each `<x-*>` element, call the
matching entry with its attributes and `{ siteDomain }`, and replace
the element (leaf) or its open/close tags (wrapper) with the result.

## Adding a tag

`component.ttl` is the authority. A new tag is modeled there first —
`cmp:LeafComponent` or `cmp:WrapperComponent`, its `cmp:tagName`,
`cmp:outputElement`, `cmp:hasAriaRole`, `cmp:hasAttribute` facts, and
`cmp:ownsComponent` if it's a wrapper that expects a particular child —
then `component-attributes.generated.mjs` is regenerated from it, then
`expand.mjs` is written to match. Never the reverse, and never a tag
that exists only in `expand.mjs`.

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
