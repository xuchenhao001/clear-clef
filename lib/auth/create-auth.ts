import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { AuthEnvConfig } from "@/lib/env";
import { resolveAuthEnv } from "@/lib/env";
import * as authSchema from "@/lib/db/auth-schema";
import * as catalogSchema from "@/lib/db/schema";

const schema = { ...catalogSchema, ...authSchema };

export type AuthDatabase =
  | DrizzleD1Database<typeof schema>
  | BetterSQLite3Database<typeof schema>;

type CreateAuthOptions = {
  allowSignUp?: boolean;
};

// `next dev` silently moves to another port when the default one is busy, so a
// stale BETTER_AUTH_URL in `.dev.vars` would otherwise fail every sign-in with
// "Invalid origin". Only loopback base URLs get the extra dev ports; deployed
// environments keep Better Auth's strict single-origin check.
const LOOPBACK_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

export function trustedOriginsFor(baseURL: string): string[] {
  let url: URL;
  try {
    url = new URL(baseURL);
  } catch {
    return [];
  }

  const isLoopback =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLoopback) {
    return [];
  }

  return [...new Set([url.origin, ...LOOPBACK_DEV_ORIGINS])];
}

export function createAuth(
  db: AuthDatabase,
  options: CreateAuthOptions = {},
  authEnv?: AuthEnvConfig,
) {
  const { secret, baseURL } = authEnv ?? resolveAuthEnv();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    secret,
    baseURL,
    trustedOrigins: trustedOriginsFor(baseURL),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.allowSignUp,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
    plugins: [admin(), nextCookies()],
  });
}

export { schema as authDrizzleSchema };
