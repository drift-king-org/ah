// Stops the PIDs in a file, each with its children, and nothing by name. Then it reads the port: if
// something still listens there, exit 1 and nothing more is killed.
// Exit 0: the port is free. Exit 1: it is still taken. Exit 2: it could not run (no PID file, or a line
// that is not a PID).
// usage: node serve-stop.mjs <pid-file> <port>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";

process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });
process.on("unhandledRejection", (error) => { console.error(String(error && error.message || error)); process.exit(2); });

const [pidFile, portText] = process.argv.slice(2);
const port = Number(portText);
if (!pidFile || !Number.isInteger(port)) { console.error("usage: node serve-stop.mjs <pid-file> <port>"); process.exit(2); }

const pids = readFileSync(pidFile, "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => {
  if (!/^[0-9]+$/.test(l.trim())) throw new Error(`not a PID: ${l}`);
  return Number(l.trim());
});
if (!pids.length) { console.error(`no PID in ${pidFile}`); process.exit(2); }

for (const pid of pids) {
  try {
    if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    else process.kill(pid, "SIGTERM");
    console.log(`stopped PID ${pid}`);
  } catch { console.log(`PID ${pid} was not running`); }
}

const taken = () => new Promise((resolve) => {
  const socket = net.connect({ host: "127.0.0.1", port });
  socket.once("connect", () => { socket.destroy(); resolve(true); });
  socket.once("error", () => resolve(false));
});
let busy = await taken();
for (let waited = 0; busy && waited < 10000; waited += 500) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  busy = await taken();
}
console.log(busy ? `port ${port} is still taken` : `port ${port} is free`);
process.exit(busy ? 1 : 0);
