import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  return drizzle(env.DB, { schema });
}

/** @deprecated Use `getDb()` — kept for call-site compatibility during migration. */
export const getDbAsync = async () => getDb();
