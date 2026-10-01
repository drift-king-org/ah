// Expands the home page's x-* markup to plain HTML with the package's static entry
// point. The site domain and the site's words are the settings file's; nothing
// is decided here. Run from site/expander by the model's expand step.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { expandStatic } from "./x-components/static.mjs";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [markupPath, settingsPath, outputPath] = process.argv.slice(2);
if (!markupPath || !settingsPath || !outputPath) {
  console.error("usage: node expand-home.mjs <markup.html> <settings.json> <output.html>");
  process.exit(2);
}
const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
const html = expandStatic(readFileSync(markupPath, "utf8"), settings);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
console.log(`expanded ${markupPath} to ${outputPath}`);
