/** Vitest stub for the Workers `env` import. Tests inject SQLite via function args. */
export const env: Env = {
  DB: null as unknown as D1Database,
  SCORES_BUCKET: null as unknown as R2Bucket,
  BETTER_AUTH_URL: "https://clear-clef.xu-chenhao.workers.dev",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-32-characters",
};
