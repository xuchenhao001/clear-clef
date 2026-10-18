import { assertWorkerAuthEnv } from "@/lib/assert-worker-auth-env";

export type RuntimeEnvSource = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
};

export type AuthEnvConfig = {
  secret: string;
  baseURL: string;
};

/**
 * Worker `env` in dev/deploy (`cloudflare:workers`).
 * Secrets come from `bindings.secret()` + `.dev.vars` / `cf`.
 * `BETTER_AUTH_URL` comes from `bindings.text()` in `cloudflare.config.ts` (per Vite/cf mode).
 * `process.env` is only a Vitest / Node fallback.
 */
export function getRuntimeEnv(source?: RuntimeEnvSource): RuntimeEnvSource {
  return {
    BETTER_AUTH_SECRET:
      source?.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: source?.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL,
  };
}

export function resolveAuthEnv(source?: RuntimeEnvSource): AuthEnvConfig {
  const runtime = getRuntimeEnv(source);
  if (source) {
    assertWorkerAuthEnv(runtime);
  }

  const secret = runtime.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET must be at least 32 characters. " +
        "Declare bindings.secret() in cloudflare.config.ts and set the value in " +
        ".dev.vars locally (see .dev.vars.example) or via cf/dashboard in deploy.",
    );
  }

  return {
    secret,
    baseURL: runtime.BETTER_AUTH_URL ?? "http://localhost:3000",
  };
}
