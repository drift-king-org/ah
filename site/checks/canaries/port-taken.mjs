// The canary for serve-stop: a port something else holds. serve-stop is given a PID file that names a
// process that has already exited, so it stops nothing, and must say the port is still taken.
// Exit 1: serve-stop said so (caught, as it must). Exit 0: it said the port was free (blind). Exit 2: this
// could not run.
// usage: node port-taken.mjs <port>
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const port = Number(process.argv[2]);
if (!Number.isInteger(port)) { console.error("usage: node port-taken.mjs <port>"); process.exit(2); }

const dead = spawnSync(process.execPath, ["-e", ""]);
const scratch = mkdtempSync(join(tmpdir(), "serve-stop-canary-"));
const holder = net.createServer();
await new Promise((resolve, reject) => { holder.once("error", reject); holder.listen(port, "127.0.0.1", resolve); });
let status = 2;
try {
  const pidFile = join(scratch, "pids");
  writeFileSync(pidFile, `${dead.pid}\n`);
  const stop = spawnSync(process.execPath, [join(import.meta.dirname, "..", "serve-stop.mjs"), pidFile, String(port)], { stdio: "inherit" });
  status = stop.status;
  console.log(status === 1 ? "serve-stop said the port was still taken, as it must" : "serve-stop did NOT say the port was taken, so the check is blind");
} finally {
  holder.close();
  rmSync(scratch, { recursive: true, force: true });
}
process.exit(status === 1 ? 1 : status === 0 ? 0 : 2);
