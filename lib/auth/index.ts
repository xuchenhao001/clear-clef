import { headers } from "next/headers";
import { cache } from "react";
import { createAuth } from "@/lib/auth/create-auth";
import { getAuthDb } from "@/lib/auth/db";
import { hasAdminUser } from "@/lib/auth/setup";
import { resolveAuthEnv } from "@/lib/env";

function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export const getAuth = cache(async () => {
  const { db, env } = await getAuthDb();
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

export async function needsAdminSetup(): Promise<boolean> {
  const { db } = await getAuthDb();
  return !(await hasAdminUser(db));
}
