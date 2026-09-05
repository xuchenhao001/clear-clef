import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { headers } from "next/headers";
import { cache } from "react";
import { createAuth, authDrizzleSchema } from "@/lib/auth/create-auth";
import { resolveAuthEnv } from "@/lib/env";

function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export const getAuth = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema: authDrizzleSchema });
  return createAuth(db, {}, resolveAuthEnv(env));
});

export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.user.role)) {
    return null;
  }

  return session;
}
