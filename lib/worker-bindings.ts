/**
 * Worker binding constants for app code (bundled in the Worker).
 * `worker-bindings.mjs` at repo root mirrors this for `cloudflare.config.ts` and scripts — keep in sync (see tests/worker-bindings-sync.test.ts).
 */

export const D1_DATABASE_ID = "f5e030c1-90d1-48d9-bd98-5b986a78d745";

export const WORKER_NAME = "clear-clef";

export const BETTER_AUTH_URL_PRODUCTION =
  "https://clear-clef.xu-chenhao.workers.dev";
export const BETTER_AUTH_URL_DEVELOPMENT = "http://localhost:3000";

/** Local D1/R2 persist root (Vite `persistState` + `cf d1 migrations apply --persist-to`). */
export const LOCAL_PERSIST_TO = ".cloudflare/state";

export function workerNameForMode(_mode?: string): string {
  return WORKER_NAME;
}

export function betterAuthUrlForMode(mode?: string): string {
  if (mode === "development") {
    return BETTER_AUTH_URL_DEVELOPMENT;
  }
  return BETTER_AUTH_URL_PRODUCTION;
}
