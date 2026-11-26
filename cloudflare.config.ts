import { bindings, defineConfig } from "cf/config";
import {
  betterAuthUrlForMode,
  D1_DATABASE_ID,
  WORKER_NAME,
} from "./worker-bindings.mjs";

/**
 * Worker configuration for `cf` and `@cloudflare/vite-plugin`.
 * Modes: `development` (`cf dev`), `production` (`pnpm deploy` / `cf build`).
 * D1: `cf d1 migrations apply <id> --local --dir drizzle --persist-to .cloudflare/state`
 * Secrets: `bindings.secret()` + `.dev.vars` locally; `cf deploy --secrets-file` or dashboard in deploy.
 */
export default defineConfig((ctx) => ({
  worker: {
    name: WORKER_NAME,
    compatibilityDate: "2026-09-05",
    compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
    entrypoint: "@tanstack/react-start/server-entry",
    observability: {
      enabled: true,
      headSamplingRate: 1,
    },
    env: {
      BETTER_AUTH_URL: bindings.text(betterAuthUrlForMode(ctx.mode)),
      DB: bindings.d1({
        name: "clear-clef",
        id: D1_DATABASE_ID,
      }),
      SCORES_BUCKET: bindings.r2({
        name: "clear-clef",
      }),
      BETTER_AUTH_SECRET: bindings.secret(),
    },
  },
}));
