import { getRequestHeaders } from "@tanstack/react-start/server";
import { createAuth } from "@/lib/auth/create-auth";
import { getAuthDb } from "@/lib/auth/db";
import { hasAdminUser } from "@/lib/auth/setup";
import { resolveAuthEnv } from "@/lib/env";

function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export async function getAuth() {
  const { db, env } = getAuthDb();
  return createAuth(db, {}, resolveAuthEnv(env));
}

export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({
    headers: getRequestHeaders(),
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
  const { db } = getAuthDb();
  return !(await hasAdminUser(db));
}
