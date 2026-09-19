import { and, eq } from "drizzle-orm";
import { getDbAsync } from "@/lib/db";
import { scoreTags, tags } from "@/lib/db/schema";
import type { CatalogDb } from "@/lib/scores/queries";

function slugifyTag(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function attachTagsToScore(
  scoreId: string,
  rawTags: string[],
  db?: CatalogDb,
) {
  const database = db ?? await getDbAsync();
  const unique = [...new Set(rawTags.map((tag) => slugifyTag(tag)).filter(Boolean))];

  for (const slug of unique) {
    const label = rawTags.find((tag) => slugifyTag(tag) === slug) ?? slug;
    const existing = await database
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, slug))
      .get();

    const tagId =
      existing?.id ??
      (
        await database
          .insert(tags)
          .values({
            id: crypto.randomUUID(),
            slug,
            label,
          })
          .returning({ id: tags.id })
          .get()
      )?.id;

    if (!tagId) {
      continue;
    }

    const join = await database
      .select({ scoreId: scoreTags.scoreId })
      .from(scoreTags)
      .where(and(eq(scoreTags.scoreId, scoreId), eq(scoreTags.tagId, tagId)))
      .get();

    if (!join) {
      await database.insert(scoreTags).values({ scoreId, tagId });
    }
  }
}

export async function replaceTagsForScore(
  scoreId: string,
  rawTags: string[],
  db?: CatalogDb,
) {
  const database = db ?? await getDbAsync();
  await database.delete(scoreTags).where(eq(scoreTags.scoreId, scoreId));
  if (rawTags.length > 0) {
    await attachTagsToScore(scoreId, rawTags, database);
  }
}
