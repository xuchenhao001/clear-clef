import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { createAuth } from "@/lib/auth/create-auth";
import * as authSchema from "@/lib/db/auth-schema";
import * as catalogSchema from "@/lib/db/schema";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupAuthUsers } from "@/tests/helpers/cleanup";

const schema = { ...catalogSchema, ...authSchema };

describe("auth", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  afterEach(async () => {
    await cleanupAuthUsers(db, ["test-admin@clearclef.local", "test-user@clearclef.local"]);
    destroyTestDb(sqlite);
  });

  it("rejects public sign-up when disabled", async () => {
    ({ sqlite, db } = createTestDb(schema));
    applyMigrations(sqlite);
    const auth = createAuth(db);

    const result = await auth.api.signUpEmail({
      body: {
        email: "test-user@clearclef.local",
        password: "password-123",
        name: "Test User",
      },
    }).catch((error: unknown) => ({ error }));

    expect(result).toHaveProperty("error");
  });

  it("allows sign-in for seeded admin and rejects invalid password", async () => {
    ({ sqlite, db } = createTestDb(schema));
    applyMigrations(sqlite);

    const seedAuth = createAuth(db, { allowSignUp: true });
    await seedAuth.api.signUpEmail({
      body: {
        email: "test-admin@clearclef.local",
        password: "password-123",
        name: "Test Admin",
      },
    });

    await db
      .update(authSchema.user)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(authSchema.user.email, "test-admin@clearclef.local"));

    const auth = createAuth(db);
    const success = await auth.api.signInEmail({
      body: {
        email: "test-admin@clearclef.local",
        password: "password-123",
      },
    });

    expect(success.user.role).toBe("admin");

    const badSignIn = await auth.api
      .signInEmail({
        body: {
          email: "test-admin@clearclef.local",
          password: "wrong-password",
        },
      })
      .catch((error: unknown) => ({ error }));

    expect(badSignIn).toHaveProperty("error");
  });
});
