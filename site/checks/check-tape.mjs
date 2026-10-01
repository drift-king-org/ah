// The tape, in a real browser. Four checks, each run first on a canary page whose
// tape ignores its control, which must fail it, and then on the page at the URL.
//   space     the space bar on the control pauses both bands, and plays them again
//   glyph     the control says Pause while the bands move and Play while they are paused
//   reduced   with reduced motion asked for, nothing moves
//   focus     a focused link in a band pauses the bands, and shows an outline
// usage: node check-tape.mjs <url> <playwright folder>
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [url, playwrightFolder] = process.argv.slice(2);
if (!url || !playwrightFolder) { console.error("usage: node check-tape.mjs <url> <playwright folder>"); process.exit(2); }
const { chromium } = await import(pathToFileURL(resolve(playwrightFolder, "index.mjs")).href);

// A tape whose control does nothing: both words showing, the rows always running, a link that changes nothing.
const canary = `<!doctype html><html><head><style>
@keyframes roll { to { transform: translateX(-100%); } }
.tape { display: flex; overflow: hidden; width: 600px; }
.tape__row { display: flex; flex: none; gap: 40px; margin: 0; padding: 0; list-style: none; animation: roll 30s linear infinite; }
</style></head><body><div class="tape-pair">
<label class="tape-control"><input type="checkbox" class="tape-control__input" checked><span class="tape-control__pause">Pause</span><span class="tape-control__play">Play</span></label>
<div class="tape"><ul class="tape__row"><li class="tape__item"><a href="#a">alpha</a></li><li>beta beta beta beta beta beta</li></ul></div>
<div class="tape"><ul class="tape__row"><li>gamma gamma gamma gamma gamma gamma</li><li>delta</li></ul></div>
</div></body></html>`;

const rows = (page) => page.$$(".tape__row");
const positions = (page) => page.$$eval(".tape .tape__row:first-child", (els) => els.map((el) => el.getBoundingClientRect().x));
const playStates = (page) => page.$$eval(".tape__row", (els) => els.map((el) => getComputedStyle(el).animationPlayState));
const names = (page) => page.$$eval(".tape__row", (els) => els.map((el) => getComputedStyle(el).animationName));
async function moved(page) {
  const before = await positions(page);
  await page.waitForTimeout(500);
  const after = await positions(page);
  return before.length > 0 && before.every((x, i) => Math.abs(x - after[i]) > 1);
}
// A pause takes a frame or two to show in the layout, so let it settle first.
async function still(page) {
  await page.waitForTimeout(200);
  const before = await positions(page);
  await page.waitForTimeout(500);
  const after = await positions(page);
  return before.length > 0 && before.every((x, i) => Math.abs(x - after[i]) < 0.5);
}
const visible = async (page, selector) => (await page.$(selector)) ? page.isVisible(selector) : false;

const checks = {
  async space(page) {
    const problems = [];
    if (!(await moved(page))) problems.push("the bands are not moving to begin with");
    await page.focus(".tape-control__input");
    await page.keyboard.press("Space");
    if (!(await still(page))) problems.push("the space bar did not stop both bands");
    if ((await playStates(page)).some((s) => s !== "paused")) problems.push("a row is not paused after the space bar");
    await page.keyboard.press("Space");
    if (!(await moved(page))) problems.push("the space bar did not play both bands again");
    return problems;
  },
  async glyph(page) {
    const problems = [];
    await page.focus(".tape-control__input");
    if (!(await visible(page, ".tape-control__pause")) || (await visible(page, ".tape-control__play"))) problems.push("while moving, the control does not show Pause alone");
    await page.keyboard.press("Space");
    if (!(await visible(page, ".tape-control__play")) || (await visible(page, ".tape-control__pause"))) problems.push("while paused, the control does not show Play alone");
    await page.keyboard.press("Space");
    return problems;
  },
  async reduced(page) {
    const problems = [];
    if ((await rows(page)).length === 0) problems.push("no rows");
    if (!(await still(page))) problems.push("with reduced motion, something moves");
    if ((await names(page)).some((n) => n !== "none")) problems.push("with reduced motion, a row still has an animation");
    return problems;
  },
  async focus(page) {
    const problems = [];
    let focused = false;
    for (let i = 0; i < 40 && !focused; i++) {
      await page.keyboard.press("Tab");
      focused = await page.evaluate(() => !!document.activeElement && !!document.activeElement.closest(".tape") && document.activeElement.tagName === "A");
    }
    if (!focused) return ["no link in a band takes focus"];
    if (!(await still(page))) problems.push("a focused link in a band did not pause the bands");
    const outline = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
    if (outline.style === "none" || outline.width < 2) problems.push("a focused link in a band shows no clear outline");
    await page.evaluate(() => document.activeElement.blur());
    if (!(await moved(page))) problems.push("the bands did not play again when the link lost focus");
    return problems;
  },
};

const browser = await chromium.launch();
let failed = false;
try {
  for (const [name, check] of Object.entries(checks)) {
    const options = name === "reduced" ? { reducedMotion: "reduce" } : { reducedMotion: "no-preference" };
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
    const page = await context.newPage();
    await page.setContent(canary);
    const onCanary = await check(page);
    await page.goto(url);
    const onPage = await check(page);
    await context.close();
    const canaryFailed = onCanary.length > 0;
    const passed = onPage.length === 0;
    console.log(`${name}: canary ${canaryFailed ? "failed, as it must" : "PASSED, so the check is blind"} (${onCanary[0] ?? "nothing wrong found"}); page ${passed ? "passed" : "FAILED: " + onPage.join("; ")}`);
    if (!canaryFailed || !passed) failed = true;
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
