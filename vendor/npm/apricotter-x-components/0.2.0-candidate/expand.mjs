
import {
  COMPONENT_OWN_ATTRIBUTES,
  COMPONENT_ATTRIBUTE_PATTERNS,
  ALLOWED_ELEMENT_NAMES,
} from "./component-attributes.generated.mjs";

const LEAF_COMPONENTS_DEF = {
  "x-button": (a, ctx) => {
    const cls = classes("btn", `btn--${form("variant", a.variant) || "primary"}`, "full" in a && "btn--full");
    return a.href
      ? `<a class="${cls}" href="${escUrl(a.href)}"${externalAttrs(a.href, ctx?.siteDomain)}${passThrough(
          a
        )}>${escText(a.label ?? "")}${externalMark(a.href, ctx)}</a>`
      : `<button type="${esc(a.type || "button")}" class="${cls}"${boolAttr(
          a,
          "disabled"
        )}${passThrough(a)}>${escText(a.label ?? "")}</button>`;
  },

  "x-hex": (a, ctx) => {
    const x = esc(a.x ?? "0");
    const y = esc(a.y ?? "0");
    const label = escText(a.label ?? "");
    const count = a.count == null || a.count === "" ? null : escText(a.count);
    const open = a.href
      ? `<a href="${escUrl(a.href)}" class="hex__link"${externalAttrs(a.href, ctx?.siteDomain)}>`
      : "";
    const close = a.href ? "</a>" : "";
    return `<g class="${classes(
      "hex",
      "castle" in a && a.castle !== "false" && "hex--castle",
      a.kind === "ours" && "hex--ours",
      a.kind === "borrowed" && "hex--borrowed",
      a.kind === "island" && "hex--island",
      a.kind === "catalog" && "hex--catalog",
      a.kind === "zone" && "hex--zone",
      a.kind === "point" && "hex--point",
      "unspecified" in a && a.unspecified !== "false" && "hex--zone-unspecified",
      form("hue", a.hue) && `hex--hue-${a.hue}`
    )}"${passThrough(a)}>${open}${a.title ? `<title>${escText(a.title)}</title>` : ""}<polygon class="hex__cell" points="${esc(
      a.points ?? ""
    )}"></polygon>${
      a.innerpoints
        ? `<polygon class="hex__inner" points="${esc(a.innerpoints)}"></polygon>`
        : ""
    }<text class="hex__label" x="${x}" y="${y}" text-anchor="middle">${label}</text>${
      count === null
        ? ""
        : `<text class="hex__count" x="${x}" y="${y}" text-anchor="middle" dy="1.35em">${count}</text>`
    }${close}</g>`;
  },

  "x-postcard-row": (a, ctx) => {
    const value = escText(a.value ?? "");
    return `<div class="postcard__row"${passThrough(a)}><span class="postcard__label">${escText(
      a.label ?? ""
    )}</span><p class="postcard__value">${
      a.href
        ? `<a href="${escUrl(a.href)}"${externalAttrs(a.href, ctx?.siteDomain)}>${value}${externalMark(a.href, ctx)}</a>`
        : value
    }</p></div>`;
  },

  "x-map-route": (a) =>
    `<line class="map__route" x1="${esc(a.x1 ?? "0")}" y1="${esc(a.y1 ?? "0")}" x2="${esc(
      a.x2 ?? "0"
    )}" y2="${esc(a.y2 ?? "0")}" aria-hidden="true"${passThrough(a)}></line>`,

  "x-table-head-cell": (a) =>
    `<th scope="col" class="${classes(
      "table__head-cell",
      a.align === "end" && "table__cell--end",
      "sticky" in a && a.sticky !== "false" && "table__cell--sticky-x"
    )}"${passThrough(a)}>${escText(a.label ?? "")}</th>`,

  "x-table-row-header": (a, ctx) =>
    `<th scope="row" class="${classes(
      "table__row-header",
      a.href && "table__row-header--link",
      "sticky" in a && a.sticky !== "false" && "table__cell--sticky-x"
    )}"${passThrough(a)}>${
      a.href
        ? `<a class="table__row-link" href="${escUrl(a.href)}"${externalAttrs(
            a.href, ctx?.siteDomain
          )}>${escText(a.label ?? "")}${externalMark(a.href, ctx)}</a>`
        : escText(a.label ?? "")
    }</th>`,

  "x-table-cell": (a, ctx) => {
    const missing = a.value === undefined || a.value === null;
    const empty = a.value === "";
    const cls = classes(
      "table__cell",
      a.align === "end" && "table__cell--end",
      "mono" in a && a.mono !== "false" && "table__cell--mono",
      a.emphasis === "muted" && "table__cell--muted",
      (missing || empty) && "table__cell--null",
      empty && "table__cell--empty"
    );
    const text = missing ? escText(word(ctx, "noValue")) : empty ? escText(word(ctx, "empty")) : escText(a.value);
    const body = a.href && !missing && !empty
      ? `<a class="table__row-link" href="${escUrl(a.href)}"${externalAttrs(
          a.href, ctx?.siteDomain
        )}>${text}${externalMark(a.href, ctx)}</a>`
      : text;
    return `<td class="${classes(cls, a.href && !missing && !empty && "table__cell--link")}"${passThrough(a)}>${body}</td>`;
  },

  "x-side-nav-item": (a, ctx) => {
    const current = "current" in a && a.current !== "false";
    const count =
      a.count === undefined || a.count === null || a.count === ""
        ? ""
        : `<span class="nav__item-count">${escText(a.count)}</span>`;
    return (
      `<a class="nav__item" href="${escUrl(a.href ?? "")}"${externalAttrs(a.href, ctx?.siteDomain)}${
        current ? ' aria-current="page"' : ""
      }${passThrough(a)}>` +
      `<span class="nav__item-label">${escText(a.label ?? "")}</span>${count}</a>`
    );
  },

  "x-field": (a) => {
    const name = esc(a.name ?? "");
    const hintId = a.hint ? `${name}-hint` : "";
    const describedBy = hintId ? ` aria-describedby="${hintId}"` : "";
    const hint = a.hint ? `<span class="field__hint" id="${hintId}">${escText(a.hint)}</span>` : "";
    const control =
      "multiline" in a && a.multiline !== "false"
        ? `<textarea class="field__input field__input--multiline" name="${name}" rows="${esc(
            a.rows || "3"
          )}"${boolAttr(a, "required")}${describedBy}${passThrough(a)}>${escText(a.value ?? "")}</textarea>`
        : `<input class="field__input" type="${esc(a.type || "text")}" name="${name}"${boolAttr(
            a,
            "required"
          )}${a.value ? ` value="${escText(a.value)}"` : ""}${describedBy}${passThrough(a)}>`;
    return `<label class="field"><span class="field__label">${escText(
      a.label ?? ""
    )}</span>${hint}${control}</label>`;
  },

  "x-serp-mock": (a) => {
    const query = escText(a.query ?? "");
    const row = (name, rating, modifier = "") =>
      `<li class="serp-mock__row${modifier}">` +
      `<span class="serp-mock__row-dot"></span>` +
      `<span class="serp-mock__row-name">${escText(name ?? "")}</span>` +
      (rating ? `<span class="serp-mock__row-rating">${escText(rating)}</span>` : "") +
      `</li>`;
    return (
      `<figure class="serp-mock"${passThrough(a)}>` +
      `<div class="serp-mock__panel">` +
      `<div class="serp-mock__searchbar">` +
      `<svg class="serp-mock__searchbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.6" cy="10.6" r="6.4"></circle><path d="M15.4 15.4 20.5 20.5"></path></svg>` +
      `<span class="serp-mock__searchbar-text">${query}</span>` +
      `</div>` +
      `<div class="serp-mock__map">` +
      `<svg class="serp-mock__map-roads" viewBox="0 0 320 96" preserveAspectRatio="none" aria-hidden="true">` +
      `<g fill="none" stroke-linecap="round">` +
      `<path d="M-10 62h150l40-46h150"></path>` +
      `<path d="M84 -10v40l52 32v44"></path>` +
      `<path d="M236 20v86"></path>` +
      `</g></svg>` +
      `<span class="serp-mock__pin serp-mock__pin--you"><span class="serp-mock__pin-dot"></span></span>` +
      `<span class="serp-mock__pin serp-mock__pin--1"></span>` +
      `<span class="serp-mock__pin serp-mock__pin--2"></span>` +
      `<span class="serp-mock__pin serp-mock__pin--3"></span>` +
      `</div>` +
      `<ul class="serp-mock__list">` +
      row(a.you, a["you-rating"], " serp-mock__row--you") +
      row(a["near-1"], a["near-1-rating"]) +
      row(a["near-2"], a["near-2-rating"]) +
      row(a["near-3"], a["near-3-rating"]) +
      `</ul></div>` +
      (a.caption ? `<figcaption class="serp-mock__caption">${escText(a.caption)}</figcaption>` : "") +
      `</figure>`
    );
  },

  "x-price": (a) => `<span class="price-tag"${passThrough(a)}>${escText(a.amount ?? "")}</span>`,

  "x-consent": (a) =>
    `<label class="consent"><input class="consent__input" type="checkbox" name="${esc(
      a.name ?? ""
    )}"${boolAttr(a, "checked")}${boolAttr(a, "disabled")}${passThrough(a)}><span>${escText(
      a.label ?? ""
    )}</span></label>`,

  "x-chip": (a) => `<span class="chip"${passThrough(a)}>${escText(a.label ?? "")}</span>`,

  "x-tag": (a) => `<span class="tag"${passThrough(a)}>${escText(a.label ?? "")}</span>`,

  "x-kicker": (a) =>
    `<div class="product-kicker"${passThrough(a)}>` +
    `<svg class="product-kicker__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12S4 4 12 4s11 8 11 8-3 8-11 8-11-8-11-8Z"></path><circle cx="12" cy="12" r="3"></circle></svg>` +
    `<span>${escText(a.label ?? "")}</span>` +
    `</div>`,

  "x-page-heading": (a) =>
    `<header class="page-heading"${passThrough(a)}>` +
    `<h1 class="page-heading__title">${escText(a.title ?? "")}</h1>` +
    (a.blurb ? `<p class="page-heading__blurb">${escText(a.blurb)}</p>` : "") +
    `</header>`,

  "x-contact-actions": (a) => contactActionsHtml(a, { withPassThrough: true }),

  "x-person": (a) => {
    const compact = "compact" in a && a.compact !== "false";
    const portrait = a.photo
      ?
        `<img class="person__img" src="${escUrl(a.photo)}" alt="${escText(a["photo-alt"] ?? a.name ?? "")}" width="72" height="72">`
      : `<span class="person__initials" aria-hidden="true">${escText(personInitials(a.name))}</span>`;
    return (
      `<div class="${classes("person", compact && "person--compact")}"${passThrough(a)}>` +
      `<div class="person__row">` +
      `<span class="person__photo">${portrait}</span>` +
      `<span class="person__identity">` +
      (a.role ? `<span class="person__role">${escText(a.role)}</span>` : "") +
      (a.name ? `<span class="person__name">${escText(a.name)}</span>` : "") +
      (compact && a.phone ? `<span class="person__phone">${escText(a.phone)}</span>` : "") +
      `</span>` +
      `</div>` +
      (compact ? contactActionsHtml(a) : "") +
      (!compact && a.bio ? `<p class="person__bio">${escText(a.bio)}</p>` : "") +
      `</div>`
    );
  },

  "x-card-link": (a, ctx) => {
    const tag = a.href ? "a" : "div";
    return (
      `<${tag} class="card-link"${
        a.href ? ` href="${escUrl(a.href)}"${externalAttrs(a.href, ctx?.siteDomain)}` : ""
      }${passThrough(a)}>` +
      (a.image
        ? `<img class="card-link__image" src="${escUrl(a.image)}" alt="${escText(a["image-alt"] ?? "")}">`
        : a["image-placeholder"]
          ? `<div class="media-placeholder media-placeholder--3-2">${escText(a["image-placeholder"])}</div>`
          : "") +
      `<span class="card-link__name">${escText(a.name ?? "")}</span>` +
      (a.blurb ? `<span class="card-link__blurb">${escText(a.blurb)}</span>` : "") +
      (a.accent ? `<span class="text-accent">${escText(a.accent)}</span>` : "") +
      `</${tag}>`
    );
  },

  "x-header": (a) => {
    if (a["contact-href"] && !a["contact-label"]) {
      throw new Error("x-header has contact-href, so it needs contact-label: pass the words of the contact link.");
    }
    if (boolAttr(a, "theme-toggle") && !a["theme-toggle-label"]) {
      throw new Error("x-header has theme-toggle, so it needs theme-toggle-label: pass the name of the toggle.");
    }
    return (
    `<header class="site-header"${passThrough(a)}>` +
    `<div class="site-header__brand">` +
    `<span class="site-header__wordmark">${escText(a.brand ?? "")}</span>` +
    `</div>` +
    (a.phone || a["contact-href"]
      ? `<div class="site-header__contact">` +
        (a.phone
          ? `<a class="nav__item site-header__phone" href="tel:${escUrl(a["phone-href"] || telDigits(a.phone))}">${escText(a.phone)}</a>`
          : "") +
        (a["contact-href"]
          ? `<a class="nav__item" href="${escUrl(a["contact-href"])}">${escText(a["contact-label"])}</a>`
          : "") +
        `</div>`
      : "") +
    (boolAttr(a, "theme-toggle") ? themeToggleHtml(a["theme-toggle-label"]) : "") +
    `</header>`
    );
  },

  "x-theme-toggle": (a) => {
    if (!a.label) throw new Error("x-theme-toggle needs label: pass the name of the toggle.");
    return themeToggleHtml(a.label);
  },

  "x-hero": (a) => {
    const tag = headingTag(a["heading-tag"]);
    const style = [
      a["door-image"] ? `--hero-door-img: url('${escCssUrl(a["door-image"])}')` : "",
      a.image ? `--hero-img: url('${escCssUrl(a.image)}')` : "",
    ]
      .filter(Boolean)
      .join("; ");
    return (
      `<section class="hero"${passThrough(a)}>` +
      `<div class="hero__box"${style ? ` style="${style}"` : ""}>` +
      `<div class="hero__door"></div>` +
      `<div class="hero__scene"></div>` +
      `<div class="hero__content">` +
      `<${tag} id="${esc(a["heading-id"] || "hero-h2")}" class="hero__heading">${escText(a.heading ?? "")}</${tag}>` +
      `<p id="${esc(a["pitch-id"] || "hero-pitch")}" class="hero__pitch">${escText(a.pitch ?? "")}</p>` +
      `</div>` +
      `</div>` +
      `</section>`
    );
  },

  "x-link": (a, ctx) =>
    `<a class="link" href="${escUrl(a.href ?? "")}"${externalAttrs(a.href, ctx?.siteDomain)}${passThrough(
      a
    )}>${escText(a.label ?? "")}${externalMark(a.href, ctx)}</a>`,

  "x-line": (a) => {
    if (!a.text) throw new Error("x-line needs text: pass the words of the line.");
    return (
      `<li class="${classes("line", a.mark && "line--marked")}"${passThrough(a)}>` +
      `<span class="line__text">${escText(a.text)}</span>` +
      (a.mark ? `<span class="line__mark">${escText(a.mark)}</span>` : "") +
      `</li>`
    );
  },

  "x-sticker": (a) => {
    if (!a.label) throw new Error("x-sticker needs label: pass the words of the sticker.");
    return `<span class="sticker"${passThrough(a)}>${escText(a.label)}</span>`;
  },

  "x-seal": (a) => {
    if (!a.line) throw new Error("x-seal needs line: pass the words of the seal.");
    return (
      `<div class="seal"${passThrough(a)}>` +
      `<span class="seal__line">${escText(a.line)}</span>` +
      (a.subline ? `<span class="seal__subline">${escText(a.subline)}</span>` : "") +
      `</div>`
    );
  },

  "x-tape-item": (a, ctx) => {
    const band = frames(ctx).at(-1);
    if (band?.kind !== "tape") return tapeItemHtml(a, null, ctx, false);
    band.items.push(a);
    return tapeItemHtml(a, band, ctx, false);
  },
};

const WRAPPER_COMPONENTS_DEF = {
  "x-footer": (a) => {
    if ((a.phone || a.email) && !a["reach-heading"]) {
      throw new Error("x-footer has a phone or an email, so it needs reach-heading: pass the heading of that column.");
    }
    const open =
      `<footer class="site-footer"${passThrough(a)}>` +
      `<div class="site-footer__grid">` +
      `<div class="site-footer__col">` +
      `<span class="site-footer__brand">${escText(a.brand ?? "")}</span>` +
      (a.blurb ? `<span class="site-footer__blurb">${escText(a.blurb)}</span>` : "") +
      `</div>` +
      `<div class="site-footer__col">` +
      (a["reach-heading"] ? `<span class="site-footer__label">${escText(a["reach-heading"])}</span>` : "") +
      (a.phone
        ? `<a class="site-footer__link" href="tel:${escUrl(a["phone-href"] || telDigits(a.phone))}">${escText(a.phone)}</a>`
        : "") +
      (a.email ? `<a class="site-footer__link" href="mailto:${escUrl(a.email)}">${escText(a.email)}</a>` : "") +
      `</div>` +
      `<div class="site-footer__col">` +
      (a["links-heading"] ? `<span class="site-footer__label">${escText(a["links-heading"])}</span>` : "");
    const close =
      `</div>` +
      `</div>` +
      (a.copyright
        ? `<div class="site-footer__bar"><p class="site-footer__copyright">${escText(a.copyright)}</p></div>`
        : "") +
      `</footer>`;
    return [open, close];
  },
  "x-card": (a) => [
    `<${tagName(a.as)} class="${classes("card", "compact" in a && "card--compact")}"${passThrough(a)}>`,
    `</${tagName(a.as)}>`,
  ],
  "x-facts": (a) => [`<ul class="fact-list"${passThrough(a)}>`, `</ul>`],
  "x-fact": (a) => [`<li class="fact-list__item"${passThrough(a)}>`, `</li>`],
  "x-steps": (a) => [`<ol class="step-list"${passThrough(a)}>`, `</ol>`],
  "x-step": (a) => [`<li class="step-list__item"${passThrough(a)}>`, `</li>`],
  "x-step-title": (a) => [`<h3 class="step-list__title"${passThrough(a)}>`, `</h3>`],
  "x-step-body": (a) => [`<p class="step-list__body"${passThrough(a)}>`, `</p>`],
  "x-terms": (a) => [`<dl class="card terms"${passThrough(a)}>`, `</dl>`],
  "x-term": (a) => [`<div class="terms__row"${passThrough(a)}>`, `</div>`],
  "x-term-name": (a) => [`<dt class="terms__term"${passThrough(a)}>`, `</dt>`],
  "x-term-body": (a) => [`<dd class="terms__body"${passThrough(a)}>`, `</dd>`],
  "x-shop-offers": (a) => [`<ul class="shop-offers"${passThrough(a)}>`, `</ul>`],
  "x-shop-offer": (a) => [`<li class="shop-offers__offer"${passThrough(a)}>`, `</li>`],
  "x-shop-offer-headline": (a) => [`<h3 class="shop-offers__headline"${passThrough(a)}>`, `</h3>`],
  "x-shop-offer-detail": (a) => [`<p class="shop-offers__detail"${passThrough(a)}>`, `</p>`],
  "x-shop-offer-claim": (a) => [`<p class="shop-offers__claim"${passThrough(a)}>`, `</p>`],
  "x-heading": (a) => [
    `<${headingLevel(a.level)} class="${classes(
      "section-heading",
      "compact" in a && a.compact !== "false" && "section-heading--compact"
    )}"${passThrough(a)}>`,
    `</${headingLevel(a.level)}>`,
  ],
  "x-prose": (a) => [`<p class="${"muted" in a ? "prose-muted" : "prose"}"${passThrough(a)}>`, `</p>`],
  "x-column": (a) => [
    `<${tagName(a.as)} class="${classes("column", "wide" in a && "column--wide")}"${passThrough(a)}>`,
    `</${tagName(a.as)}>`,
  ],
  "x-footnote": (a) => [`<p class="footnote"${passThrough(a)}>`, `</p>`],
  "x-section": (a) => [
    `<${tagName(a.as)} class="${classes("section-stack", "divider" in a && "section-divider", "media-split" in a && "media-split")}"${passThrough(a)}>`,
    `</${tagName(a.as)}>`,
  ],
  "x-rule-list": (a) => [`<ul class="rule-list"${passThrough(a)}>`, `</ul>`],
  "x-rule-list-item": (a) => [`<li class="rule-list__item"${passThrough(a)}>`, `</li>`],
  "x-statement-list": (a) => [`<ul class="statement-list"${passThrough(a)}>`, `</ul>`],
  "x-statement": (a) => [`<li class="statement-list__row"${passThrough(a)}>`, `</li>`],
  "x-statement-claim": (a) => [`<span class="statement-list__claim"${passThrough(a)}>`, `</span>`],
  "x-statement-support": (a) => [`<span class="statement-list__support"${passThrough(a)}>`, `</span>`],
  "x-statement-card": (a) => [`<div class="statement-card"${passThrough(a)}>`, `</div>`],
  "x-statement-card-text": (a) => [`<p class="statement-card__text"${passThrough(a)}>`, `</p>`],
  "x-statement-card-lead": (a) => [`<span class="statement-card__lead"${passThrough(a)}>`, `</span>`],
  "x-statement-card-follow": (a) => [`<span class="statement-card__follow"${passThrough(a)}>`, `</span>`],
  "x-cards-grid": (a) => [
    `<div class="${classes("cards-grid", "fit" in a && a.fit !== "false" && "cards-grid--fit")}"${passThrough(a)}>`,
    `</div>`,
  ],
  "x-postcard": (a) => [
    `<div class="card card--postcard"${passThrough(a)}>` +
      `<header class="postcard__head">` +
        `<span class="postcard__mark">` +
          `<span class="postcard__dot" aria-hidden="true"></span>` +
          `<span>${escText(a.mark ?? "")}</span>` +
        `</span>` +
        (a.eyebrow ? `<span class="postcard__eyebrow">${escText(a.eyebrow)}</span>` : "") +
      `</header>` +
      `<div class="postcard__body">` +
        `<h3 class="postcard__name">${escText(a.name ?? "")}</h3>` +
        `<div class="postcard__rows">`,
    `</div>` +
      (a["foot-label"] || a["foot-value"]
        ? `<div class="postcard__foot">` +
            `<span>${escText(a["foot-label"] ?? "")}</span>` +
            `<span>${
              a["foot-href"]
                ? `<a href="${escUrl(a["foot-href"])}">${escText(a["foot-value"] ?? "")}</a>`
                : escText(a["foot-value"] ?? "")
            }</span>` +
          `</div>`
        : "") +
      `</div></div>`,
  ],

  "x-chips": (a) => [`<div class="chips"${passThrough(a)}>`, `</div>`],
  "x-feature-grid": (a) => [`<ul class="feature-grid"${passThrough(a)}>`, `</ul>`],
  "x-feature-grid-item": (a) => [`<li class="feature-grid__item"${passThrough(a)}>`, `</li>`],
  "x-list": (a) => [`<ul class="list"${passThrough(a)}>`, `</ul>`],

  "x-table": (a) => [
    `<table class="${classes(
      "table",
      "interactive" in a && a.interactive !== "false" && "table--interactive",
      "mono-row-header" in a && a["mono-row-header"] !== "false" && "table--mono-row-header"
    )}"${passThrough(a)}>${a.caption ? `<caption class="table__caption">${escText(a.caption)}</caption>` : ""}`,
    `</table>`,
  ],

  "x-map": (a) => [
    `<svg class="map" viewBox="${esc(a.viewbox ?? "")}"${
      form("width", a.width) ? ` style="--map-width:${a.width}"` : ""
    } role="img" aria-label="${escText(
      a.label ?? ""
    )}" focusable="false" xmlns="http://www.w3.org/2000/svg"${passThrough(a)}>`,
    `</svg>`,
  ],

  "x-table-scroll": (a) => [
    `<div class="${classes("table-scroll", a.axis === "x" && "table-scroll--x", a.axis === "y" && "table-scroll--y")}"${passThrough(a)}>`,
    `</div>`,
  ],

  "x-table-head": (a) => [
    `<thead class="${classes("table__head", "sticky" in a && a.sticky !== "false" && "table__head--sticky")}"${passThrough(a)}>`,
    `</thead>`,
  ],
  "x-table-body": (a) => [`<tbody class="table__body"${passThrough(a)}>`, `</tbody>`],
  "x-table-row": (a) => [`<tr class="table__row"${passThrough(a)}>`, `</tr>`],

  "x-console": (a) => [
    `<${tagName(a.as)} class="${classes("console", "full" in a && a.full !== "false" && "console--full")}"${passThrough(a)}>`,
    `</${tagName(a.as)}>`,
  ],

  "x-side-nav-group": (a) => [
    `<div class="nav__group" role="group" aria-label="${escText(a.label ?? "")}"${passThrough(a)}>`,
    `</div>`,
  ],

  "x-side-nav": (a) => [
    `<nav class="${classes("nav", `nav--${a.orientation === "row" ? "row" : "column"}`)}" aria-label="${escText(
      a.label ?? ""
    )}"${passThrough(a)}>`,
    `</nav>`,
  ],

  "x-cta": (a) => [`<div class="section-cta"${passThrough(a)}>`, `</div>`],
  "x-cta-row": (a) => [`<div class="cta-row"${passThrough(a)}>`, `</div>`],
  "x-heading-row": (a) => [`<div class="heading-row"${passThrough(a)}>`, `</div>`],
  "x-note": (a) => [`<p class="text-muted-note"${passThrough(a)}>`, `</p>`],

  "x-live-region": (a) => [
    `<div class="live-region" role="${esc(a.role ?? "status")}"${passThrough(a)}>`,
    `</div>`,
  ],

  "x-line-panes": (a) => {
    if (!a.label) throw new Error("x-line-panes needs label: pass the words that name the pair.");
    return [`<div class="line-panes" role="group" aria-label="${escText(a.label)}"${passThrough(a)}>`, `</div>`];
  },
  "x-line-pane": (a) => {
    if (!a.heading) throw new Error("x-line-pane needs heading: pass the words of the pane's heading.");
    return [
      `<div class="line-pane"${passThrough(a)}>` +
        `<h3 class="line-pane__heading">${escText(a.heading)}</h3>` +
        `<ol class="line-pane__lines">`,
      `</ol>` + (a.stamp ? `<span class="line-pane__stamp">${escText(a.stamp)}</span>` : "") + `</div>`,
    ];
  },

  "x-tape-pair": (a, ctx) => {
    const pair = { kind: "pair", rolls: false };
    frames(ctx).push(pair);
    return [
      `<div class="tape-pair"${passThrough(a)}>`,
      closing(() => {
        leave(ctx, pair, "x-tape-pair");
        if (!pair.rolls) return `</div>`;
        for (const name of ["control-name", "pause-label", "play-label"]) {
          if (!a[name]) {
            throw new Error(`x-tape-pair has a band that rolls, so it needs ${name}: pass the words of the control.`);
          }
        }
        return (
          `<label class="tape-control">` +
          `<input class="tape-control__input" type="checkbox" checked>` +
          `<span class="tape-control__name">${escText(a["control-name"])}</span>` +
          `<span class="tape-control__glyph" aria-hidden="true"></span>` +
          `<span class="tape-control__pause" aria-hidden="true">${escText(a["pause-label"])}</span>` +
          `<span class="tape-control__play" aria-hidden="true">${escText(a["play-label"])}</span>` +
          `</label></div>`
        );
      }),
    ];
  },
  "x-tape": (a, ctx) => {
    if (!a.separator) {
      throw new Error("x-tape needs separator: pass the mark that goes between phrases.");
    }
    const roll = "roll" in a && a.roll !== "false";
    const parent = frames(ctx).at(-1);
    if (roll) {
      if (!parent || parent.kind !== "pair") {
        throw new Error("a band that rolls goes inside x-tape-pair, which holds the control that stops it.");
      }
      parent.rolls = true;
    }
    const band = { kind: "tape", sep: a.separator, items: [] };
    frames(ctx).push(band);
    return [
      `<div class="${classes("tape", roll && "tape--roll")}"${passThrough(a)}><ul class="tape__row">`,
      closing(() => {
        leave(ctx, band, "x-tape");
        let rows = `</ul>`;
        if (roll) {
          const repeat = band.items.map((item) => tapeItemHtml(item, band, ctx, true)).join("");
          rows += `<ul class="tape__row" aria-hidden="true">${repeat}</ul>`.repeat(TAPE_REPEATS);
        }
        return rows + `</div>`;
      }),
    ];
  },
};

let currentTag = null;
function withCurrentTag(tag, render) {
  return (a, ctx) => {
    currentTag = tag;
    try {
      return render(a, ctx);
    } finally {
      currentTag = null;
    }
  };
}

export const LEAF_COMPONENTS = Object.fromEntries(
  Object.entries(LEAF_COMPONENTS_DEF).map(([tag, render]) => [tag, withCurrentTag(tag, render)])
);
export const WRAPPER_COMPONENTS = Object.fromEntries(
  Object.entries(WRAPPER_COMPONENTS_DEF).map(([tag, render]) => [tag, withCurrentTag(tag, render)])
);

export const ALL_TAGS = [...Object.keys(LEAF_COMPONENTS_DEF), ...Object.keys(WRAPPER_COMPONENTS_DEF)];


function escText(value) {
  return esc(decodeEntities(value));
}

function decodeEntities(value) {
  return String(value ?? "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '\"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function isOwnHost(hostname, siteDomain) {
  if (!siteDomain) {
    throw new Error("siteDomain is required: pass the domain your site is served from.");
  }
  const host = String(hostname ?? "").toLowerCase();
  return host === siteDomain || host.endsWith(`.${siteDomain}`);
}

function isExternalHref(href, siteDomain) {
  const value = String(href ?? "");
  if (!/^https?:\/\//i.test(value)) return false;
  let hostname;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return false;
  }
  return !isOwnHost(hostname, siteDomain);
}

const EXTERNAL_ICON =
  '<svg class="external-link__icon" aria-hidden="true" focusable="false" ' +
  'viewBox="0 0 12 12" width="12" height="12">' +
  '<path d="M4.5 1.5h6v6M10.5 1.5 5 7M8 9.5v1.5H1V4h1.5" fill="none" ' +
  'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" ' +
  'stroke-linejoin="round"/></svg>';

function externalAttrs(href, siteDomain) {
  return isExternalHref(href, siteDomain) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function externalMark(href, ctx) {
  if (!isExternalHref(href, ctx?.siteDomain)) return "";
  return EXTERNAL_ICON + `<span class="visually-hidden"> ${escText(word(ctx, "newTab"))}</span>`;
}

function word(ctx, name) {
  const value = ctx?.words?.[name];
  if (!value) {
    throw new Error(`words.${name} is required: pass the words the site uses for it in the render context.`);
  }
  return value;
}

const ALLOWED_URL_SCHEMES = new Set(["https", "http", "mailto", "tel", "sms"]);

function escUrl(value) {
  const url = decodeEntities(value);
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.replace(/[\u0000-\u0020]/g, ""));
  if (scheme && !ALLOWED_URL_SCHEMES.has(scheme[1].toLowerCase())) return "";
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escCssUrl(value) {
  return escUrl(value)
    .replace(/[\\')]/g, "\\$&")
    .replace(/\r?\n|\r/g, "\\a ");
}

const ALLOWED_TAGS = new Set(ALLOWED_ELEMENT_NAMES);
function tagName(value) {
  return ALLOWED_TAGS.has(value) ? value : "div";
}

const ALLOWED_HEADING_TAGS = new Set(["h1", "h2"]);
function headingTag(value) {
  return ALLOWED_HEADING_TAGS.has(value) ? value : "h1";
}

const ALLOWED_HEADING_LEVELS = new Set(["h2", "h3"]);
function headingLevel(value) {
  return ALLOWED_HEADING_LEVELS.has(value) ? value : "h2";
}

class Closing {
  constructor(work) {
    this.work = work;
  }
  toString() {
    this.text ??= this.work();
    return this.text;
  }
}
function closing(work) {
  return new Closing(work);
}

function frames(ctx) {
  if (!ctx || typeof ctx !== "object") {
    throw new Error("the tape needs the render context ({ siteDomain }) to keep its place.");
  }
  return (ctx.frames ??= []);
}

function leave(ctx, frame, tag) {
  const stack = frames(ctx);
  if (stack.at(-1) !== frame) {
    throw new Error(`${tag} was closed out of order: its children are not all inside it.`);
  }
  stack.pop();
}

const TAPE_REPEATS = 3;

function tapeItemHtml(a, band, ctx, repeat) {
  const text = escText(a.text ?? "");
  const inner = a.href
    ? `<a href="${escUrl(a.href)}"${externalAttrs(a.href, ctx?.siteDomain)}${repeat ? ' tabindex="-1"' : ""}>${text}${externalMark(a.href, ctx)}</a>`
    : text;
  return (
    `<li class="tape__item"${repeat ? "" : passThrough(a)}>${inner}</li>` +
    (band ? `<li class="tape__sep" aria-hidden="true">${escText(band.sep)}</li>` : "")
  );
}

function classes(...values) {
  return values.filter(Boolean).join(" ");
}

const compiledForms = new Map();
function form(name, value) {
  const pattern = COMPONENT_ATTRIBUTE_PATTERNS[currentTag]?.[name];
  if (pattern === undefined) {
    throw new Error(`${currentTag} has no pattern for ${name}: the model gives the attribute none.`);
  }
  if (value === undefined || value === null) return "";
  if (!compiledForms.has(pattern)) compiledForms.set(pattern, new RegExp(pattern));
  return compiledForms.get(pattern).test(String(value)) ? String(value) : "";
}

function attrs(map) {
  const parts = [];
  for (const [key, value] of Object.entries(map)) {
    if (value === null || value === undefined || value === false) continue;
    if (value === true) {
      parts.push(esc(key));
      continue;
    }
    parts.push(esc(key) + '="' + esc(value) + '"');
  }
  return parts.length ? " " + parts.join(" ") : "";
}

function boolAttr(a, name) {
  return name in a && a[name] !== "false" ? ` ${name}` : "";
}

function contactActionsHtml(a, { withPassThrough = false } = {}) {
  const primary = a.primary || "text";
  const labelled = (key, kind) => {
    if (!a[key]) throw new Error(`a contact action for ${kind} needs ${key}: pass the words of the button.`);
    return escText(a[key]);
  };
  const items = [
    a.phone && ["text", labelled("text-label", "a phone"), `sms:${telDigits(a.phone)}`],
    a.email && ["email", labelled("email-label", "an email"), `mailto:${a.email}`],
    a.phone && ["call", labelled("call-label", "a phone"), `tel:${telDigits(a.phone)}`],
  ].filter(Boolean);

  if (!items.length) return "";

  return (
    `<div class="contact-actions"${withPassThrough ? passThrough(a) : ""}>` +
    items
      .map(
        ([kind, label, href]) =>
          `<a class="${classes(
            "btn",
            kind === primary ? "btn--primary" : "btn--secondary",
            "contact-actions__item"
          )}" href="${escUrl(href)}">${label}</a>`
      )
      .join("") +
    `</div>`
  );
}

function themeToggleHtml(label) {
  return (
    `<button type="button" id="theme-toggle" class="theme-toggle" aria-label="${escText(label)}" aria-pressed="false">` +
    `<span class="theme-toggle__stars" aria-hidden="true">` +
    `<span class="theme-toggle__star theme-toggle__star--1"></span>` +
    `<span class="theme-toggle__star theme-toggle__star--2"></span>` +
    `<span class="theme-toggle__star theme-toggle__star--3"></span>` +
    `</span>` +
    `<span class="theme-toggle__sky" aria-hidden="true">` +
    `<span class="theme-toggle__orb theme-toggle__orb--sun"><span class="theme-toggle__orb-icon">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">` +
    `<circle cx="12" cy="12" r="4.4"></circle>` +
    `<path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"></path>` +
    `</svg></span></span>` +
    `<span class="theme-toggle__orb theme-toggle__orb--moon"><span class="theme-toggle__orb-icon">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11Z"></path>` +
    `</svg></span></span>` +
    `</span>` +
    `</button>`
  );
}

function personInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function telDigits(value) {
  return String(value ?? "").replace(/[^0-9+]/g, "");
}

const PASS_PREFIXES = ["hx-", "aria-", "data-"];
const PASS_EXACT = ["id", "name", "autocomplete", "autocapitalize", "form", "role", "action", "method", "placeholder"];
const NO_OWN_ATTRIBUTES = [];
function passThrough(a) {
  const ownAttrs = COMPONENT_OWN_ATTRIBUTES[currentTag] || NO_OWN_ATTRIBUTES;
  const out = {};
  for (const [key, value] of Object.entries(a)) {
    if (ownAttrs.includes(key)) continue;
    if (PASS_PREFIXES.some((p) => key.startsWith(p)) || PASS_EXACT.includes(key)) {
      out[key] = value;
    }
  }
  return attrs(out);
}
