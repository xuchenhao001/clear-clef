import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import * as schema from "./schema";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
});

/** Use on static / ISR routes that need async Cloudflare context. */
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
});
