// Every link on the home page opens, except the /console links: they wait for the
// gap that Compliance writes for signing, and are listed here, not opened.
// The canary is a link to a page that is not there, which must be found not to open.
// usage: node check-links.mjs <url> <playwright folder>
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [url, playwrightFolder] = process.argv.slice(2);
if (!url || !playwrightFolder) { console.error("usage: node check-links.mjs <url> <playwright folder>"); process.exit(2); }
const { chromium } = await import(pathToFileURL(resolve(playwrightFolder, "index.mjs")).href);

const browser = await chromium.launch();
let failed = false;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const opens = async (href) => {
    try {
      const response = await context.request.get(href, { maxRedirects: 5, timeout: 20000 });
      return { ok: response.status() < 400, status: response.status() };
    } catch (error) {
      return { ok: false, status: String(error.message).split("\n")[0] };
    }
  };

  const missing = await opens(new URL("/no-such-page-canary", url).href);
  console.log(`canary: a link to a page that is not there ${missing.ok ? "OPENED, so the check is blind" : `did not open (${missing.status}), as it must not`}`);
  if (missing.ok) failed = true;

  await page.goto(url);
  const hrefs = await page.$$eval("a[href]", (els) => els.map((el) => ({ text: el.textContent.trim().replace(/\s+/g, " "), href: el.href })));
  const skipped = [];
  const seen = new Set();
  for (const { text, href } of hrefs) {
    const target = new URL(href);
    if (target.origin === new URL(url).origin && target.pathname.replace(/\/$/, "") === "/console") { skipped.push(`${text} -> ${href}`); continue; }
    const key = href.split("#")[0];
    if (target.hash && key === url.split("#")[0]) {
      const there = await page.$(`[id="${decodeURIComponent(target.hash.slice(1))}"]`);
      console.log(`${there ? "opens" : "DOES NOT OPEN"}: ${text} -> ${href} (in-page anchor)`);
      if (!there) failed = true;
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    const result = await opens(key);
    console.log(`${result.ok ? "opens" : "DOES NOT OPEN"}: ${text} -> ${href} (${result.status})`);
    if (!result.ok) failed = true;
  }
  console.log(`not opened, by design: ${skipped.length} /console links`);
  for (const link of skipped) console.log(`  ${link}`);
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
