import { like } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rawRun } from "@/lib/db/raw";
import { scoreSlugAliases, scores } from "@/lib/db/schema";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { rebuildSearchIndex } from "@/lib/search";
import { slugifyTitle } from "@/lib/scores/slug";
import type { CatalogDb } from "@/lib/scores/queries";

export type LegacySlugCleanupResult = {
  fixed: number;
  remaining: number;
};

/** One-time admin cleanup for rows created before the slug policy was added. */
export async function fixLegacySlugs(
  limit = 20,
  db?: CatalogDb,
): Promise<LegacySlugCleanupResult> {
  const database = db ?? getDb();
  const rows = await database
    .select({ id: scores.id, slug: scores.slug, title: scores.title })
    .from(scores)
    .where(like(scores.slug, "untitled%"))
    .limit(limit);

  const [existingRows, aliasRows] = await Promise.all([
    database.select({ slug: scores.slug }).from(scores),
    database.select({ slug: scoreSlugAliases.slug }).from(scoreSlugAliases),
  ]);
  const used = new Set([
    ...existingRows.map((row) => row.slug),
    ...aliasRows.map((row) => row.slug),
  ]);
  const now = Date.now();

  let fixed = 0;
  for (const row of rows) {
    const base = slugifyTitle(row.title, row.id);
    let nextSlug = base;
    let suffix = 2;
    while (used.has(nextSlug) && nextSlug !== row.slug) {
      nextSlug = `${base}-${suffix++}`;
    }
    if (nextSlug === row.slug) {
      continue;
    }

    await rawRun(
      database,
      "INSERT OR IGNORE INTO score_slug_aliases (slug, score_id, created_at) VALUES (?, ?, ?)",
      [row.slug, row.id, now],
    );
    await rawRun(
      database,
      "UPDATE scores SET slug = ?, updated_at = ? WHERE id = ?",
      [nextSlug, now, row.id],
    );
    used.delete(row.slug);
    used.add(nextSlug);
    fixed += 1;
    await Promise.allSettled([
      purgePublicScore(row.slug),
      purgePublicScore(nextSlug),
    ]);
  }

  if (fixed > 0) {
    await rebuildSearchIndex(database);
  }

  const remainingRows = await database
    .select({ id: scores.id })
    .from(scores)
    .where(like(scores.slug, "untitled%"))
    .limit(limit);
  return { fixed, remaining: remainingRows.length };
}
