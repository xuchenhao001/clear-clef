import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { authDrizzleSchema } from "@/lib/auth/create-auth";

export function getAuthDb() {
  const db = drizzle(env.DB, { schema: authDrizzleSchema });
  return { db, env };
}
