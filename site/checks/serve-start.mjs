// Starts the local console server detached, writes its PIDs (one to a line), and waits until its address
// answers. The command is the one the model's step names; this file runs it and holds no command of its own.
// Exit 0: it answers. Exit 2: it could not start, or did not answer (the PIDs written are still in the file,
// so the stop step can stop what was started).
// usage: node serve-start.mjs <pid-file> <url> <cwd> <command>
import { execFileSync, spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [pidFile, url, cwd, command] = process.argv.slice(2);
if (!pidFile || !url || !cwd || !command) { console.error("usage: node serve-start.mjs <pid-file> <url> <cwd> <command>"); process.exit(2); }
const port = Number(new URL(url).port);

const answers = async () => {
  try { return (await fetch(url, { signal: AbortSignal.timeout(2000) })).status === 200; } catch { return false; }
};
const listeners = () => {
  if (process.platform !== "win32") return [];
  const rows = execFileSync("netstat", ["-ano", "-p", "tcp"]).toString().split(/\r?\n/);
  return rows.map((r) => r.trim().split(/\s+/)).filter((c) => c[3] === "LISTENING" && c[1].endsWith(`:${port}`)).map((c) => Number(c[4]));
};

if (await answers()) { console.error(`something already answers at ${url}`); process.exit(2); }
mkdirSync(dirname(pidFile), { recursive: true });
const log = openSync(join(dirname(pidFile), "serve-console.log"), "w");
const child = spawn(command, { shell: true, cwd, detached: true, windowsHide: true, stdio: ["ignore", log, log] });
child.unref();
closeSync(log);
const pids = new Set([child.pid]);
writeFileSync(pidFile, [...pids].join("\n") + "\n");

for (let waited = 0; waited < 90000; waited += 1000) {
  if (await answers()) {
    for (const pid of listeners()) pids.add(pid);
    writeFileSync(pidFile, [...pids].join("\n") + "\n");
    console.log(`answers at ${url}; PIDs ${[...pids].join(", ")} in ${pidFile}`);
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
for (const pid of listeners()) pids.add(pid);
writeFileSync(pidFile, [...pids].join("\n") + "\n");
console.error(`nothing answered at ${url} in 90 seconds; PIDs ${[...pids].join(", ")} are in ${pidFile}`);
process.exit(2);
