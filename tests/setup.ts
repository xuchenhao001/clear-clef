process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ??
  "test-secret-with-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

if (process.env.WRANGLER_D1_REMOTE === "true") {
  throw new Error("Refusing to run tests against remote D1");
}
