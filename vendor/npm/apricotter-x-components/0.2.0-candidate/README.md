# @apricotter/x-components

A registry of `x-*` markup tags that your server expands into plain HTML, and the
OWL/SHACL ontology that says what each tag takes and what it writes.

```html
<x-card as="form">
  <x-field label="Business name" name="business"></x-field>
  <x-button label="Submit" type="submit"></x-button>
</x-card>
```

Write markup like that in an HTML file. Run it through this package's registry
and you get real HTML back.

## What is in the package

- **`component.ttl`** is the ontology. It lists every tag, the element it writes,
  its ARIA role, its attributes (and which are required), the classes it emits,
  and the child tag a wrapper expects. It is the authority: `expand.mjs` is checked
  against it, and never the other way round. It imports `wai-aria.ttl`.
- **`wai-aria.ttl`** is the WAI-ARIA role vocabulary that `component.ttl` points
  into, with the role characteristics quoted from the W3C WAI-ARIA 1.2
  Recommendation. It ships beside `component.ttl` so the import resolves to a file
  in the package.
- **`component-attributes.generated.mjs`** is generated from `component.ttl`. It
  exports `COMPONENT_OWN_ATTRIBUTES`, `COMPONENT_REQUIRED_ATTRIBUTES`,
  `COMPONENT_ATTRIBUTE_PATTERNS`, `COMPONENT_EMITS_CLASSES` and
  `ALLOWED_ELEMENT_NAMES`. `expand.mjs` reads it at runtime, so nothing in one file
  is copied by hand into the other.
- **`expand.mjs`** is the registry: `LEAF_COMPONENTS`, `WRAPPER_COMPONENTS` and
  `ALL_TAGS`.

## Two kinds of tag

A **leaf** takes a flat object of string attributes and returns one complete
string of markup:

```js
import { LEAF_COMPONENTS } from "@apricotter/x-components";

LEAF_COMPONENTS["x-button"]({ label: "Submit", type: "submit" }, { siteDomain: "example.com" });
// -> '<button type="submit" class="btn btn--primary">Submit</button>'
```

A **wrapper** takes the same attributes and returns `[open, close]`. Its children
are ordinary markup between the two, and this package does not touch them:

```js
import { WRAPPER_COMPONENTS } from "@apricotter/x-components";

const [open, close] = WRAPPER_COMPONENTS["x-card"]({ compact: "true" }, { siteDomain: "example.com" });
```

Every entry is `(attrs, ctx) => ...`. `attrs` is a plain object: HTML attribute
names in lowercase, values as strings. `ctx` holds the settings below.

## Settings

`ctx.siteDomain` is required. A tag that writes a link compares the link's host
with it to decide whether the link leaves your site. There is no default. A call
with an absolute link and no `siteDomain` throws, because a silent default would
call every link on the page external, or every one internal.

```js
LEAF_COMPONENTS["x-link"](
  { href: "https://example.com/about", label: "About" },
  { siteDomain: "example.com" }
);
```

`ctx.words` holds the few words that are the same on every page of a site:

- `newTab` is what a link that opens a new tab says to a screen reader.
- `noValue` is what a table cell says when it has no value.
- `empty` is what a table cell says when its value is an empty string.

```js
const ctx = {
  siteDomain: "example.com",
  words: { newTab: "(opens in a new tab)", noValue: "no value", empty: "empty" },
};
```

## No component says a word of its own

Every word a component shows comes from your site. Most words are attributes on
the tag: `label`, `heading`, `caption`, `contact-label` and so on. The rest are in
`ctx.words`. There are no defaults. When a component needs a word and does not have
it, it throws and names the missing attribute or setting. A heading that is only
written when you give it, such as a footer's `links-heading`, is left out when you
do not.

## The classes are the contract

The classes a component writes are named in `component.ttl` (`cmp:emitsClass`) and
listed in `COMPONENT_EMITS_CLASSES`. The code writes those classes and no others.
Your stylesheet targets them. Renaming or removing one is a new major version.

A site does not pass classes in. Where a class depends on a value, the value has
a fixed form (below), so the set of classes a tag can write is closed.

## Allowed forms

An attribute that becomes a class or a style has a form in the model
(`cmp:attributePattern`), also exported as `COMPONENT_ATTRIBUTE_PATTERNS`. The
expander checks the value against it and leaves it out when it does not match.

- `x-button`'s `variant` is `primary` or `secondary`. Anything else gives the
  default.
- `x-hex`'s `hue` is `1` to `10`, `apr`, `cmp` or `transcribed`. Anything else adds
  no hue class.
- `x-map`'s `width` is a length such as `40rem` or `320px`. Anything else writes no
  style.

## The tape

`x-tape-pair` holds one or more `x-tape` bands, and each band holds `x-tape-item`
phrases.

```html
<x-tape-pair control-name="Tape moving" pause-label="Pause" play-label="Play">
  <x-tape roll separator="·">
    <x-tape-item text="Hours"></x-tape-item>
    <x-tape-item text="Photos" href="/photos"></x-tape-item>
  </x-tape>
</x-tape-pair>
```

- A band is still unless it has `roll`. Motion is your stylesheet's job, keyed on
  `tape--roll`.
- A pair that rolls needs the control, and a pair that does not has none. The pair
  writes one native checkbox, checked while the bands move, so the space bar works
  with no script. `control-name` is its name for screen readers. `pause-label` and
  `play-label` are the words shown, both hidden from screen readers. The pair throws
  without any of the three when a band in it rolls.
- A band throws without `separator`. It writes the separator after every phrase.
- A band that rolls writes its phrases in one row that is read aloud, then three
  repeat rows that carry the motion. The repeats and every separator are
  `aria-hidden`. A link in a repeat leaves the tab order.

A band's closing half depends on its children, so the object `close` returns is
worked out when it is read, and it reads as a string. Call `String(close)` after the
children, as a rewriter does at the end tag, and expand in document order.

## Wiring it into a request

This package ships no runtime. Wire the registry into whatever rewrites your HTML.
Walk each `<x-*>` element in document order. Call the matching entry with its
attributes and your `ctx`. Replace a leaf with the result. For a wrapper, write
`open`, then the children, then `String(close)`. Give each request its own `ctx`,
because the tape keeps its place in it.

## Adding a tag

Model it first in `component.ttl`: `cmp:LeafComponent` or `cmp:WrapperComponent`,
then its `cmp:tagName`, `cmp:outputElement`, `cmp:hasAriaRole`, `cmp:hasAttribute`
facts and `cmp:emitsClass` facts, and `cmp:ownsComponent` for a wrapper that
expects a child. Regenerate `component-attributes.generated.mjs` from it. Then write
`expand.mjs` to match. A tag that exists only in `expand.mjs` fails the release
checks.

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
