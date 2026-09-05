import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import { authDrizzleSchema } from "@/lib/auth/create-auth";

export const getAuthDb = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema: authDrizzleSchema });

  return { db, env };
});
