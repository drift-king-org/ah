// Writes .cargo/config.toml from its template: CHECKOUT is the folder this runs in, and
// USERPROFILE is the setting of that name. The remapped paths are what keeps a built file
// from carrying the paths of the machine that built it, so the paths themselves stay out
// of the repository, and the config this writes is never committed.
// 1 means found, 2 means it could not run. A crash is never a 1.
import { readFileSync, writeFileSync } from "node:fs";

process.on("uncaughtException", (error) => { console.error(error.message); process.exit(2); });

const profile = process.env.USERPROFILE;
if (!profile) { console.error("USERPROFILE is not set"); process.exit(2); }
const template = readFileSync("cloudflare-pid-rs/pid1/.cargo/config.template.toml", "utf8");
writeFileSync("cloudflare-pid-rs/pid1/.cargo/config.toml", template.split("CHECKOUT").join(process.cwd()).split("USERPROFILE").join(profile));
console.log("wrote cloudflare-pid-rs/pid1/.cargo/config.toml");
