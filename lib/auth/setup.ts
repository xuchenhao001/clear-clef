import { eq } from "drizzle-orm";
import type { AuthEnvConfig } from "@/lib/env";
import { user } from "@/lib/db/auth-schema";
import { createAuth, type AuthDatabase } from "@/lib/auth/create-auth";

export class AdminSetupError extends Error {
  constructor(
    message: string,
    readonly code: "ADMIN_EXISTS" | "SIGN_UP_FAILED",
  ) {
    super(message);
    this.name = "AdminSetupError";
  }
}

export type CreateFirstAdminInput = {
  email: string;
  password: string;
  name: string;
};

export async function hasAdminUser(db: AuthDatabase): Promise<boolean> {
  const admins = await db
    .select()
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1);

  return admins.length > 0;
}

export async function createFirstAdmin(
  db: AuthDatabase,
  authEnv: AuthEnvConfig,
  input: CreateFirstAdminInput,
) {
  if (await hasAdminUser(db)) {
    throw new AdminSetupError("An admin account already exists", "ADMIN_EXISTS");
  }

  const setupAuth = createAuth(db, { allowSignUp: true }, authEnv);
  const result = await setupAuth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
    },
  });

  if (!result?.user) {
    throw new AdminSetupError("Failed to create admin account", "SIGN_UP_FAILED");
  }

  await db
    .update(user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(user.id, result.user.id));

  return result.user;
}
