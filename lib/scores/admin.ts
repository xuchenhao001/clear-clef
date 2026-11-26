import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scores, type Score } from "@/lib/db/schema";
import { IngestValidationError } from "@/lib/ingest/errors";
import type { ScoreVisibility } from "@/lib/ingest/admin-form";
import type { CatalogDb } from "@/lib/scores/queries";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { deleteScoreObjects } from "@/lib/scores/r2";
import {
  attachTagsToRows,
  fetchTagsForScore,
  type ScoreTagSummary,
} from "@/lib/scores/tag-attachments";
import { replaceTagsForScore } from "@/lib/scores/tags";

export type AdminCatalogScore = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  catalogNumber: string | null;
  license: string;
  visibility: string;
  previewR2Key: string | null;
  importId: string | null;
  createdAt: Date;
  tags: ScoreTagSummary[];
};

export async function listAdminScores(db?: CatalogDb): Promise<AdminCatalogScore[]> {
  const database = db ?? getDb();
  const rows = await database
    .select({
      id: scores.id,
      slug: scores.slug,
      title: scores.title,
      composer: scores.composer,
      catalogNumber: scores.catalogNumber,
      license: scores.license,
      visibility: scores.visibility,
      previewR2Key: scores.previewR2Key,
      importId: scores.importId,
      createdAt: scores.createdAt,
    })
    .from(scores)
    .orderBy(desc(scores.createdAt));

  return attachTagsToRows(database, rows);
}

export type AdminScoreDetail = Score & {
  tags: ScoreTagSummary[];
};

export async function getAdminScoreById(
  id: string,
  db?: CatalogDb,
): Promise<AdminScoreDetail | null> {
  const database = db ?? getDb();
  const score = await database.select().from(scores).where(eq(scores.id, id)).get();

  if (!score) {
    return null;
  }

  const scoreTags = await fetchTagsForScore(database, score.id);
  return { ...score, tags: scoreTags };
}

export type UpdateScoreMetadataInput = {
  title: string;
  composer?: string | null;
  lyricist?: string | null;
  catalogNumber?: string | null;
  license: string;
  key?: string | null;
  timeSignature?: string | null;
  difficulty?: string | null;
  visibility: ScoreVisibility;
  sourceUrl?: string | null;
  tagList: string[];
  defaultVisibleParts?: string | null;
};

export async function updateScoreMetadata(
  scoreId: string,
  input: UpdateScoreMetadataInput,
  db?: CatalogDb,
): Promise<{ slug: string }> {
  if (!input.license.trim()) {
    throw new IngestValidationError("License is required");
  }
  if (!input.title.trim()) {
    throw new IngestValidationError("Title is required");
  }

  const database = db ?? getDb();
  const existing = await database
    .select()
    .from(scores)
    .where(eq(scores.id, scoreId))
    .get();
  if (!existing) {
    throw new IngestValidationError("Score not found");
  }

  const set: Partial<typeof scores.$inferInsert> = {
    title: input.title.trim(),
    composer: input.composer?.trim() || null,
    lyricist: input.lyricist?.trim() || null,
    catalogNumber: input.catalogNumber?.trim() || null,
    license: input.license.trim(),
    key: input.key?.trim() || null,
    timeSignature: input.timeSignature?.trim() || null,
    difficulty: input.difficulty?.trim() || null,
    visibility: input.visibility,
    sourceUrl: input.sourceUrl?.trim() || null,
  };

  if (input.defaultVisibleParts !== undefined) {
    set.defaultVisibleParts = input.defaultVisibleParts;
  }

  await database.update(scores).set(set).where(eq(scores.id, scoreId));
  await replaceTagsForScore(scoreId, input.tagList, database);

  await purgePublicScore(existing.slug);

  return { slug: existing.slug };
}

export async function deleteScore(
  scoreId: string,
  db?: CatalogDb,
): Promise<{ slug: string } | null> {
  const database = db ?? getDb();
  const existing = await database
    .select()
    .from(scores)
    .where(eq(scores.id, scoreId))
    .get();
  if (!existing) {
    return null;
  }

  await deleteScoreObjects(scoreId);
  await database.delete(scores).where(eq(scores.id, scoreId));

  await purgePublicScore(existing.slug);

  return { slug: existing.slug };
}
