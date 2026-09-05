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
