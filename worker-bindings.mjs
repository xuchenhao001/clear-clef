/**
 * Node-only mirror of `lib/worker-bindings.ts` for `cloudflare.config.ts` and `scripts/*`.
 * The Worker bundle must not import this file — use `lib/worker-bindings.ts` in app code.
 */

export const D1_DATABASE_ID = "f5e030c1-90d1-48d9-bd98-5b986a78d745";

export const WORKER_NAME = "clear-clef";

export const BETTER_AUTH_URL_PRODUCTION =
  "https://clear-clef.xu-chenhao.workers.dev";
export const BETTER_AUTH_URL_DEVELOPMENT = "http://localhost:3000";

export const LOCAL_PERSIST_TO = ".cloudflare/state";

export function workerNameForMode(_mode) {
  return WORKER_NAME;
}

export function betterAuthUrlForMode(mode) {
  if (mode === "development") {
    return BETTER_AUTH_URL_DEVELOPMENT;
  }
  return BETTER_AUTH_URL_PRODUCTION;
}
