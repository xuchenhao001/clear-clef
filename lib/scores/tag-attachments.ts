import { eq, inArray } from "drizzle-orm";
import { scoreTags, tags } from "@/lib/db/schema";
import type { CatalogDb } from "@/lib/scores/queries";

export type ScoreTagSummary = { slug: string; label: string };

export async function fetchTagsForScore(
  database: CatalogDb,
  scoreId: string,
): Promise<ScoreTagSummary[]> {
  return database
    .select({
      slug: tags.slug,
      label: tags.label,
    })
    .from(scoreTags)
    .innerJoin(tags, eq(tags.id, scoreTags.tagId))
    .where(eq(scoreTags.scoreId, scoreId));
}

export async function attachTagsToRows<T extends { id: string }>(
  database: CatalogDb,
  rows: T[],
): Promise<(T & { tags: ScoreTagSummary[] })[]> {
  if (rows.length === 0) {
    return [];
  }

  const scoreIds = rows.map((row) => row.id);
  const tagsByScore = new Map<string, ScoreTagSummary[]>();

  for (let offset = 0; offset < scoreIds.length; offset += 80) {
    const chunk = scoreIds.slice(offset, offset + 80);
    const tagRows = await database
      .select({
        scoreId: scoreTags.scoreId,
        slug: tags.slug,
        label: tags.label,
      })
      .from(scoreTags)
      .innerJoin(tags, eq(tags.id, scoreTags.tagId))
      .where(inArray(scoreTags.scoreId, chunk));

    for (const row of tagRows) {
      const existing = tagsByScore.get(row.scoreId) ?? [];
      existing.push({ slug: row.slug, label: row.label });
      tagsByScore.set(row.scoreId, existing);
    }
  }

  return rows.map((row) => ({
    ...row,
    tags: tagsByScore.get(row.id) ?? [],
  }));
}
