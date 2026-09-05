import { and, eq } from "drizzle-orm";
import { getDbAsync } from "@/lib/db";
import { scoreTags, tags } from "@/lib/db/schema";

function slugifyTag(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function attachTagsToScore(scoreId: string, rawTags: string[]) {
  const db = await getDbAsync();
  const unique = [...new Set(rawTags.map((tag) => slugifyTag(tag)).filter(Boolean))];

  for (const slug of unique) {
    const label = rawTags.find((tag) => slugifyTag(tag) === slug) ?? slug;
    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, slug))
      .get();

    const tagId =
      existing?.id ??
      (
        await db
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

    const join = await db
      .select({ scoreId: scoreTags.scoreId })
      .from(scoreTags)
      .where(and(eq(scoreTags.scoreId, scoreId), eq(scoreTags.tagId, tagId)))
      .get();

    if (!join) {
      await db.insert(scoreTags).values({ scoreId, tagId });
    }
  }
}
