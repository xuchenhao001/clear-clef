import { cache } from "react";
import { and, desc, eq, type SQL } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { scoreTags, scores, tags } from "@/lib/db/schema";
import {
  attachTagsToRows,
  fetchTagsForScore,
} from "@/lib/scores/tag-attachments";

export type CatalogDb = DrizzleD1Database<typeof schema>;
export type CatalogFilters = {
  key?: string;
  difficulty?: string;
  license?: string;
  tag?: string;
};

function catalogFiltersCacheKey(filters: CatalogFilters): string {
  return JSON.stringify({
    key: filters.key ?? null,
    difficulty: filters.difficulty ?? null,
    license: filters.license ?? null,
    tag: filters.tag ?? null,
  });
}

export type PublicCatalogScore = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  catalogNumber: string | null;
  key: string | null;
  timeSignature: string | null;
  difficulty: string | null;
  previewR2Key: string | null;
  createdAt: Date;
  tags: { slug: string; label: string }[];
};

const listPublicScoresCached = cache(async function listPublicScoresCached(
  filtersKey: string,
  db?: CatalogDb,
): Promise<PublicCatalogScore[]> {
  const filters = JSON.parse(filtersKey) as CatalogFilters;
  const database = db ?? getDb();
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

  const selectFields = {
    id: scores.id,
    slug: scores.slug,
    title: scores.title,
    composer: scores.composer,
    catalogNumber: scores.catalogNumber,
    key: scores.key,
    timeSignature: scores.timeSignature,
    difficulty: scores.difficulty,
    previewR2Key: scores.previewR2Key,
    createdAt: scores.createdAt,
  };

  const rows = filters.tag
    ? await database
        .select(selectFields)
        .from(scores)
        .innerJoin(scoreTags, eq(scoreTags.scoreId, scores.id))
        .innerJoin(tags, eq(tags.id, scoreTags.tagId))
        .where(and(...conditions, eq(tags.slug, filters.tag)))
        .orderBy(desc(scores.createdAt))
    : await database
        .select(selectFields)
        .from(scores)
        .where(and(...conditions))
        .orderBy(desc(scores.createdAt));

  return attachTagsToRows(database, rows);
});

export async function listPublicScores(
  filters: CatalogFilters = {},
  db?: CatalogDb,
): Promise<PublicCatalogScore[]> {
  return listPublicScoresCached(catalogFiltersCacheKey(filters), db);
}

export type PublicScoreDetail = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  catalogNumber: string | null;
  lyricist: string | null;
  sourceUrl: string | null;
  license: string;
  key: string | null;
  timeSignature: string | null;
  difficulty: string | null;
  r2Key: string | null;
  tags: { slug: string; label: string }[];
};

export const getPublicScoreBySlug = cache(async function getPublicScoreBySlug(
  slug: string,
  db?: CatalogDb,
): Promise<PublicScoreDetail | null> {
  const database = db ?? getDb();
  const score = await database
    .select({
      id: scores.id,
      slug: scores.slug,
      title: scores.title,
      composer: scores.composer,
      catalogNumber: scores.catalogNumber,
      lyricist: scores.lyricist,
      sourceUrl: scores.sourceUrl,
      license: scores.license,
      key: scores.key,
      timeSignature: scores.timeSignature,
      difficulty: scores.difficulty,
      r2Key: scores.r2Key,
    })
    .from(scores)
    .where(and(eq(scores.slug, slug), eq(scores.visibility, "public")))
    .get();

  if (!score) {
    return null;
  }

  const scoreTagRows = await fetchTagsForScore(database, score.id);

  return { ...score, tags: scoreTagRows };
});

export async function getScoreById(id: string, db?: CatalogDb) {
  const database = db ?? getDb();
  return database.select().from(scores).where(eq(scores.id, id)).get();
}

export const listFilterOptions = cache(async function listFilterOptions(
  db?: CatalogDb,
) {
  const database = db ?? getDb();
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
});

export async function slugExists(slug: string, db?: CatalogDb) {
  const database = db ?? getDb();
  const existing = await database
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.slug, slug))
    .get();
  return Boolean(existing);
}
