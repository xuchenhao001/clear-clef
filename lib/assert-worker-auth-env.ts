import type { RuntimeEnvSource } from "@/lib/env";
import {
  BETTER_AUTH_URL_DEVELOPMENT,
  publicSiteOrigins,
} from "@/lib/worker-bindings";

const DOCS = "docs/local-dev.md";

/**
 * Fail fast in dev when Worker auth bindings are misconfigured (before Better Auth's cryptic errors).
 */
export function assertWorkerAuthEnv(runtime: RuntimeEnvSource): void {
  const secret = runtime.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      `BETTER_AUTH_SECRET is missing or too short on Worker env. ` +
        `Declare bindings.secret() in cloudflare.config.ts and set the value in .dev.vars. ` +
        `See ${DOCS}.`,
    );
  }

  const baseURL = runtime.BETTER_AUTH_URL;
  if (!baseURL) {
    throw new Error(
      `BETTER_AUTH_URL is missing on Worker env. ` +
        `Set bindings.text() in cloudflare.config.ts (per ctx.mode). ` +
        `See ${DOCS}.`,
    );
  }

  const isDeployedPublicOrigin = publicSiteOrigins().some((origin) =>
    baseURL.startsWith(origin),
  );
  if (
    process.env.NODE_ENV === "development" &&
    !baseURL.startsWith(BETTER_AUTH_URL_DEVELOPMENT) &&
    isDeployedPublicOrigin
  ) {
    throw new Error(
      `BETTER_AUTH_URL is "${baseURL}" but pnpm dev expects a loopback URL ` +
        `(Vite mode "development" → ${BETTER_AUTH_URL_DEVELOPMENT}). ` +
        `Restart the dev server after cloudflare.config.ts changes. ` +
        `Do not put BETTER_AUTH_URL in .dev.vars — it does not override bindings.text(). ` +
        `See ${DOCS}.`,
    );
  }
}
