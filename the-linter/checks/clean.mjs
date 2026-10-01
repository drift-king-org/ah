// The repository is clean. The rules are the model's. A format rule has a pattern and the
// parts its canary is built from. The rule for the private values has neither: it reads the values
// at run time from the file the named setting points at, and refuses to run if the setting is
// missing or the file is not the one the model holds the sha256 of. Nothing that names a private
// value, or looks like a secret, is written down in order to look for it.
// Run on its own it scans every tracked file, every file the site publishes, and every commit's
// message, author and committer, and exits 1 if any rule finds anything. With --canaries it builds
// each rule's canary in a scratch folder, scans it, removes it, and exits 1 only if every rule found
// its canary, and 0 if a rule is blind. A finding names the rule and the place, never the text.
// usage: node clean.mjs [--canaries] <clean-rules.tsv>
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 1 means found, 2 means it could not run. A crash is never a 1.
process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const args = process.argv.slice(2);
const canaries = args.includes("--canaries");
const rulesFile = args.find((a) => !a.startsWith("--"));
if (!rulesFile) { console.error("usage: node clean.mjs [--canaries] <clean-rules.tsv>"); process.exit(2); }

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rules = readFileSync(rulesFile, "utf8").split("\n").filter(Boolean).map((line) => {
  const [name, pattern, example, setting, sha256] = line.split("\t");
  if (pattern) return { name, regex: new RegExp(pattern, "i"), canary: () => example.split("||").join("") };
  // The private values: read now, from the file the setting names, never from the model.
  const path = process.env[setting];
  if (!path) throw new Error(`the setting ${setting} is not set, so the rule ${name} cannot run`);
  const bytes = readFileSync(path);
  if (createHash("sha256").update(bytes).digest("hex") !== sha256) throw new Error(`the file ${setting} names is not the one the model holds the sha256 of`);
  const values = bytes.toString("utf8").split("\n").map((v) => v.trim()).filter(Boolean);
  if (!values.length) throw new Error("the file of private values is empty");
  return { name, regex: new RegExp(values.map(escape).join("|"), "i"), canary: () => `A line that names ${values[0]}.` };
});
if (!rules.length) throw new Error("the model names no clean rule");
const isText = (buffer) => !buffer.subarray(0, 8192).includes(0);
const hits = (text, regex) => text.split("\n").flatMap((line, i) => (regex.test(line) ? [i + 1] : []));

if (canaries) {
  const scratch = mkdtempSync(join(tmpdir(), "clean-canary-"));
  let blind = 0;
  try {
    for (const rule of rules) {
      const file = join(scratch, `${rule.name}.txt`);
      writeFileSync(file, rule.canary() + "\n");
      const found = hits(readFileSync(file, "utf8"), rule.regex).length > 0;
      console.log(`${rule.name}: its canary, built just now, ${found ? "was found, as it must be" : "was NOT found, so the rule is blind"}`);
      if (!found) blind++;
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  process.exit(blind ? 0 : 1);
}

const tracked = execFileSync("git", ["ls-files", "-z"], { maxBuffer: 1 << 28 }).toString().split("\0").filter(Boolean);
const published = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    statSync(path).isDirectory() ? walk(path) : published.push(path.split("\\").join("/"));
  }
})("site/public");
const files = [...new Set([...tracked, ...published])];

const findings = [];
for (const file of files) {
  let buffer;
  try { buffer = readFileSync(file); } catch { continue; }
  if (!isText(buffer)) continue;
  const text = buffer.toString("utf8");
  for (const rule of rules) for (const line of hits(text, rule.regex)) findings.push(`${rule.name}: ${file}:${line}`);
}
const log = execFileSync("git", ["log", "--format=%H%x1f%an%x1f%ae%x1f%cn%x1f%ce%x1f%B%x1e"], { maxBuffer: 1 << 28 }).toString();
for (const entry of log.split("\x1e").filter((e) => e.trim())) {
  const [hash, ...fields] = entry.trim().split("\x1f");
  for (const rule of rules) if (rule.regex.test(fields.join("\n"))) findings.push(`${rule.name}: commit ${hash.slice(0, 12)}`);
}
for (const finding of findings) console.error(finding);
if (findings.length) process.exit(1);
console.log(`${files.length} files and ${log.split("\x1e").filter((e) => e.trim()).length} commits, ${rules.length} rules: nothing found`);
