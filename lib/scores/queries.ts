import { and, desc, eq, type SQL } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { getDbAsync } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { scoreTags, scores, tags } from "@/lib/db/schema";

export type CatalogDb = DrizzleD1Database<typeof schema>;
export type CatalogFilters = {
  key?: string;
  difficulty?: string;
  license?: string;
  tag?: string;
};

export async function listPublicScores(
  filters: CatalogFilters = {},
  db?: CatalogDb,
) {
  const database = db ?? await getDbAsync();
  const conditions: SQL[] = [eq(scores.visibility, "public")];

  if (filters.key) {
    conditions.push(eq(scores.key, filters.key));
  }
  if (filters.difficulty) {
    conditions.push(eq(scores.difficulty, filters.difficulty));
  }
  if (filters.license) {
    conditions.push(eq(scores.license, filters.license));
  }

  const baseQuery = database
    .select({
      id: scores.id,
      slug: scores.slug,
      title: scores.title,
      composer: scores.composer,
      license: scores.license,
      key: scores.key,
      difficulty: scores.difficulty,
      previewR2Key: scores.previewR2Key,
      createdAt: scores.createdAt,
    })
    .from(scores)
    .where(and(...conditions))
    .orderBy(desc(scores.createdAt));

  if (!filters.tag) {
    return baseQuery;
  }

  return database
    .select({
      id: scores.id,
      slug: scores.slug,
      title: scores.title,
      composer: scores.composer,
      license: scores.license,
      key: scores.key,
      difficulty: scores.difficulty,
      previewR2Key: scores.previewR2Key,
      createdAt: scores.createdAt,
    })
    .from(scores)
    .innerJoin(scoreTags, eq(scoreTags.scoreId, scores.id))
    .innerJoin(tags, eq(tags.id, scoreTags.tagId))
    .where(and(...conditions, eq(tags.slug, filters.tag)))
    .orderBy(desc(scores.createdAt));
}

export async function getPublicScoreBySlug(slug: string, db?: CatalogDb) {
  const database = db ?? await getDbAsync();
  const score = await database
    .select()
    .from(scores)
    .where(and(eq(scores.slug, slug), eq(scores.visibility, "public")))
    .get();

  if (!score) {
    return null;
  }

  const scoreTagRows = await database
    .select({
      slug: tags.slug,
      label: tags.label,
    })
    .from(scoreTags)
    .innerJoin(tags, eq(tags.id, scoreTags.tagId))
    .where(eq(scoreTags.scoreId, score.id));

  return { ...score, tags: scoreTagRows };
}

export async function getScoreById(id: string, db?: CatalogDb) {
  const database = db ?? await getDbAsync();
  return database.select().from(scores).where(eq(scores.id, id)).get();
}

export async function listFilterOptions(db?: CatalogDb) {
  const database = db ?? await getDbAsync();
  const publicScores = await database
    .select({
      key: scores.key,
      difficulty: scores.difficulty,
      license: scores.license,
    })
    .from(scores)
    .where(eq(scores.visibility, "public"));

  const allTags = await database
    .select({
      slug: tags.slug,
      label: tags.label,
    })
    .from(tags)
    .orderBy(tags.label);

  const keys = [...new Set(publicScores.map((row) => row.key).filter((key): key is string => Boolean(key)))].sort();
  const difficulties = [
    ...new Set(publicScores.map((row) => row.difficulty).filter((value): value is string => Boolean(value))),
  ].sort();
  const licenses = [
    ...new Set(publicScores.map((row) => row.license).filter((value): value is string => Boolean(value))),
  ].sort();

  return { keys, difficulties, licenses, tags: allTags };
}

export async function slugExists(slug: string, db?: CatalogDb) {
  const database = db ?? await getDbAsync();
  const existing = await database
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.slug, slug))
    .get();
  return Boolean(existing);
}
