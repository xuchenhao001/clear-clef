import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { D1_DATABASE_ID, LOCAL_PERSIST_TO } from "../worker-bindings.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execFileSync(
  "pnpm",
  [
    "exec",
    "cf",
    "d1",
    "migrations",
    "apply",
    D1_DATABASE_ID,
    "--local",
    "--dir",
    "drizzle",
    "--persist-to",
    LOCAL_PERSIST_TO,
    ...process.argv.slice(2),
  ],
  { cwd: root, stdio: "inherit" },
);
