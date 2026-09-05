import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import { createAuth, authDrizzleSchema } from "@/lib/auth/create-auth";
import { resolveAuthEnv } from "@/lib/env";
import { user } from "@/lib/db/auth-schema";

function loadDevVars(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".dev.vars"), "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .reduce<Record<string, string>>((acc, line) => {
        const index = line.indexOf("=");
        if (index === -1) {
          return acc;
        }
        acc[line.slice(0, index)] = line.slice(index + 1);
        return acc;
      }, {});
  } catch {
    return {};
  }
}

function requireEnv(name: string, devVars: Record<string, string>): string {
  const value = process.env[name] ?? devVars[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  if (process.env.CI === "true" && process.env.ALLOW_REMOTE_SEED !== "true") {
    throw new Error("Refusing to seed admin in CI without ALLOW_REMOTE_SEED=true");
  }

  const devVars = loadDevVars();
  const email = requireEnv("ADMIN_EMAIL", devVars);
  const password = requireEnv("ADMIN_PASSWORD", devVars);
  const name = process.env.ADMIN_NAME ?? devVars.ADMIN_NAME ?? "Admin";

  const proxy = await getPlatformProxy<CloudflareEnv>();
  const db = drizzle(proxy.env.DB, { schema: authDrizzleSchema });
  const authEnv = resolveAuthEnv(proxy.env);

  const existing = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, email))
    .get();

  if (existing?.role === "admin") {
    console.log(`Admin already exists for ${email}`);
    await proxy.dispose();
    return;
  }

  if (existing) {
    await db
      .update(user)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(user.id, existing.id));
    console.log(`Promoted existing user ${email} to admin`);
    await proxy.dispose();
    return;
  }

  const seedAuth = createAuth(db, { allowSignUp: true }, authEnv);
  const result = await seedAuth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });

  if (!result?.user) {
    throw new Error("Failed to create admin user");
  }

  await db
    .update(user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(user.id, result.user.id));

  console.log(`Created admin user ${email}`);
  await proxy.dispose();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
