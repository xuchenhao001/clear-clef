/**
 * Worker `env` keys the app reads via `cloudflare:workers`.
 * When adding a binding, update `cloudflare.config.ts`, `.dev.vars.example`, and tests.
 */
export const WORKER_ENV_KEYS = {
  /** `bindings.text()` per Vite/cf `mode` — not loaded from `.dev.vars` */
  BETTER_AUTH_URL: "BETTER_AUTH_URL",
  /** `bindings.secret()` — local value from `.dev.vars` only */
  BETTER_AUTH_SECRET: "BETTER_AUTH_SECRET",
  DB: "DB",
  SCORES_BUCKET: "SCORES_BUCKET",
} as const;

export type WorkerEnvKey = (typeof WORKER_ENV_KEYS)[keyof typeof WORKER_ENV_KEYS];
