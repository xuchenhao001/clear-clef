/**
 * Apply local D1 migrations only when pending (same persist path as `pnpm dev`).
 * Use after clone or `git pull` when `drizzle/*.sql` changed — not on every dev start.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { D1_DATABASE_ID, LOCAL_PERSIST_TO } from "../worker-bindings.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const pnpmShell = process.platform === "win32";

const databaseId = D1_DATABASE_ID;
const persistTo = LOCAL_PERSIST_TO;
const cfArgs = (subcommand, extra = []) =>
  [
    "exec",
    "cf",
    "d1",
    "migrations",
    subcommand,
    databaseId,
    "--local",
    "--dir",
    "drizzle",
    "--persist-to",
    persistTo,
    ...extra,
  ];

const listJson = execFileSync(pnpm, cfArgs("list", ["-q"]), {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
  shell: pnpmShell,
});

let pending;
try {
  pending = JSON.parse(listJson.trim() || "[]");
} catch {
  console.error("Could not parse `cf d1 migrations list` output.");
  process.exit(1);
}

if (pending.length === 0) {
  process.exit(0);
}

console.log(
  `Applying ${pending.length} local D1 migration(s) to ${persistTo}…`,
);
execFileSync(pnpm, cfArgs("apply", ["-q"]), {
  cwd: root,
  stdio: "inherit",
  shell: pnpmShell,
});
