import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createAuth, trustedOriginsFor } from "@/lib/auth/create-auth";
import {
  createFirstAdmin,
  hasAdminUser,
} from "@/lib/auth/setup";
import * as authSchema from "@/lib/db/auth-schema";
import * as catalogSchema from "@/lib/db/schema";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupAuthUsers } from "@/tests/helpers/cleanup";

const schema = { ...catalogSchema, ...authSchema };

const testAuthEnv = {
  secret: "test-secret-with-at-least-32-characters",
  baseURL: "http://localhost:3000",
};

describe("auth", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  afterEach(async () => {
    await cleanupAuthUsers(db, [
      "test-admin@clearclef.local",
      "test-user@clearclef.local",
      "second-admin@clearclef.local",
    ]);
    destroyTestDb(sqlite);
  });

  it("rejects public sign-up when disabled", async () => {
    ({ sqlite, db } = createTestDb(schema));
    applyMigrations(sqlite);
    const auth = createAuth(db, {}, testAuthEnv);

    const result = await auth.api.signUpEmail({
      body: {
        email: "test-user@clearclef.local",
        password: "password-123",
        name: "Test User",
      },
    }).catch((error: unknown) => ({ error }));

    expect(result).toHaveProperty("error");
  });

  it("creates the first admin and allows sign-in", async () => {
    ({ sqlite, db } = createTestDb(schema));
    applyMigrations(sqlite);

    expect(await hasAdminUser(db)).toBe(false);

    await createFirstAdmin(db, testAuthEnv, {
      email: "test-admin@clearclef.local",
      password: "password-123",
      name: "Test Admin",
    });

    expect(await hasAdminUser(db)).toBe(true);

    const auth = createAuth(db, {}, testAuthEnv);
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

  it("rejects creating a second admin", async () => {
    ({ sqlite, db } = createTestDb(schema));
    applyMigrations(sqlite);

    await createFirstAdmin(db, testAuthEnv, {
      email: "test-admin@clearclef.local",
      password: "password-123",
      name: "Test Admin",
    });

    await expect(
      createFirstAdmin(db, testAuthEnv, {
        email: "second-admin@clearclef.local",
        password: "password-123",
        name: "Second Admin",
      }),
    ).rejects.toMatchObject({
      code: "ADMIN_EXISTS",
    });
  });

  it("keeps public sign-up disabled after bootstrap", async () => {
    ({ sqlite, db } = createTestDb(schema));
    applyMigrations(sqlite);

    await createFirstAdmin(db, testAuthEnv, {
      email: "test-admin@clearclef.local",
      password: "password-123",
      name: "Test Admin",
    });

    const auth = createAuth(db, {}, testAuthEnv);
    const result = await auth.api.signUpEmail({
      body: {
        email: "test-user@clearclef.local",
        password: "password-123",
        name: "Test User",
      },
    }).catch((error: unknown) => ({ error }));

    expect(result).toHaveProperty("error");
  });
});

// Better Auth skips origin validation under NODE_ENV=test, so the middleware
// itself cannot be exercised here; only the trusted-origin list is testable.
describe("trustedOriginsFor", () => {
  it("adds the loopback dev ports to a loopback base URL", () => {
    const origins = trustedOriginsFor("http://localhost:3001");

    expect(origins).toContain("http://localhost:3001");
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:3000");
  });

  it("trusts alternate public origins when base URL is the canonical domain", () => {
    expect(trustedOriginsFor("https://clearclef.dedog.top")).toEqual([
      "https://clear-clef.xu-chenhao.workers.dev",
    ]);
  });

  it("does not duplicate the primary origin in trustedOrigins", () => {
    expect(
      trustedOriginsFor("https://clear-clef.xu-chenhao.workers.dev"),
    ).toEqual(["https://clearclef.dedog.top"]);
  });

  it("returns no origins for an unparseable base URL", () => {
    expect(trustedOriginsFor("not a url")).toEqual([]);
  });
});
