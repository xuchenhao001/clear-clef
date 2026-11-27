import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rawAll } from "@/lib/db/raw";
import { scoreSlugAliases, scores, type Score } from "@/lib/db/schema";
import { IngestValidationError } from "@/lib/ingest/errors";
import type { ScoreVisibility } from "@/lib/ingest/admin-form";
import type { AdminScoreListFilters } from "@/lib/admin/filters";
import { splitComposerAndArranger } from "@/lib/catalog/composers";
import { sortTitle, workKey } from "@/lib/catalog/normalize";
import {
  canonicalDifficulty,
  canonicalKey,
  canonicalLicense,
} from "@/lib/catalog/vocab";
import type { CatalogDb } from "@/lib/scores/queries";
import { slugExists } from "@/lib/scores/queries";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { getOrCreateComposer } from "@/lib/scores/composers";
import { deleteScoreObjects } from "@/lib/scores/r2";
import { slugifyTitle } from "@/lib/scores/slug";
import { normalizeSourceUrl } from "@/lib/scores/source-url";
import { refreshSearchDocument } from "@/lib/search";
import { truncateUtf8 } from "@/lib/search/query";
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

export type AdminCatalogStats = {
  total: number;
  public: number;
  unlisted: number;
  private: number;
};

export const ADMIN_PAGE_SIZE = 50;

export type AdminCatalogPage = {
  items: AdminCatalogScore[];
  total: number;
  page: number;
  pageCount: number;
  stats: AdminCatalogStats;
};

export async function searchAdminScores(
  filters: AdminScoreListFilters,
  db?: CatalogDb,
): Promise<AdminCatalogPage> {
  const database = db ?? getDb();
  const where = ["1 = 1"];
  const values: unknown[] = [];

  if (filters.visibility) {
    where.push("visibility = ?");
    values.push(filters.visibility);
  }
  if (filters.import) {
    where.push("import_id = ?");
    values.push(filters.import);
  }
  const q = truncateUtf8(filters.q?.trim() ?? "", 40);
  if (q) {
    where.push("search_text LIKE ? ESCAPE '\\'");
    values.push(`%${q.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
  }

  const whereSql = where.join(" AND ");
  const [countRows, statsRows, allCountRows] = await Promise.all([
    rawAll<{ count: number }>(
      database,
      `SELECT COUNT(*) AS count FROM scores WHERE ${whereSql}`,
      values,
    ),
    rawAll<{ visibility: string; count: number }>(
      database,
      "SELECT visibility, COUNT(*) AS count FROM scores GROUP BY visibility",
    ),
    rawAll<{ count: number }>(database, "SELECT COUNT(*) AS count FROM scores"),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  const rows = await rawAll<Record<string, unknown>>(
    database,
    `SELECT id, slug, title, composer, catalog_number, license, visibility,
            preview_r2_key, import_id, created_at
     FROM scores
     WHERE ${whereSql}
     ORDER BY created_at DESC, id
     LIMIT ? OFFSET ?`,
    [...values, ADMIN_PAGE_SIZE, (page - 1) * ADMIN_PAGE_SIZE],
  );

  const mapped = rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    composer: (row.composer as string | null) ?? null,
    catalogNumber: (row.catalog_number as string | null) ?? null,
    license: String(row.license),
    visibility: String(row.visibility),
    previewR2Key: (row.preview_r2_key as string | null) ?? null,
    importId: (row.import_id as string | null) ?? null,
    createdAt: new Date(Number(row.created_at)),
  }));

  const items = await attachTagsToRows(database, mapped);
  const byVisibility = new Map(
    statsRows.map((row) => [row.visibility, Number(row.count)]),
  );

  return {
    items,
    total,
    page,
    pageCount,
    stats: {
      total: Number(allCountRows[0]?.count ?? 0),
      public: byVisibility.get("public") ?? 0,
      unlisted: byVisibility.get("unlisted") ?? 0,
      private: byVisibility.get("private") ?? 0,
    },
  };
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
  arranger?: string | null;
  editionLabel?: string | null;
  workKey?: string | null;
  slug?: string | null;
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

function normalizedRequestedSlug(
  value: string | null | undefined,
  title: string,
  scoreId: string,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!slug) {
    throw new IngestValidationError("URL slug is invalid");
  }
  return slug || slugifyTitle(title, scoreId);
}

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

  const split = splitComposerAndArranger(input.composer);
  const composerName = split.composer;
  const arranger = input.arranger?.trim() || split.arranger;
  const composerRecord = await getOrCreateComposer(database, composerName);
  const composerDisplay = composerRecord?.displayName ?? composerName;
  const title = input.title.trim();
  const requestedSlug = normalizedRequestedSlug(input.slug, title, scoreId);
  let nextSlug = existing.slug;

  if (requestedSlug && requestedSlug !== existing.slug) {
    if (await slugExists(requestedSlug, database)) {
      throw new IngestValidationError("That URL slug is already in use");
    }
    nextSlug = requestedSlug;
  }

  const set: Partial<typeof scores.$inferInsert> = {
    title,
    slug: nextSlug,
    composer: composerDisplay,
    composerId: composerRecord?.id ?? null,
    arranger,
    editionLabel: input.editionLabel?.trim() || null,
    workKey: input.workKey?.trim() || workKey(title, composerDisplay),
    titleSort: sortTitle(title),
    lyricist: input.lyricist?.trim() || null,
    catalogNumber: input.catalogNumber?.trim() || null,
    license: canonicalLicense(input.license) ?? input.license.trim(),
    key: canonicalKey(input.key) ?? (input.key?.trim() || null),
    timeSignature: input.timeSignature?.trim() || null,
    difficulty: canonicalDifficulty(input.difficulty),
    visibility: input.visibility,
    sourceUrl: normalizeSourceUrl(input.sourceUrl),
    updatedAt: new Date(),
  };

  if (input.defaultVisibleParts !== undefined) {
    set.defaultVisibleParts = input.defaultVisibleParts;
  }

  await database.update(scores).set(set).where(eq(scores.id, scoreId));

  if (nextSlug !== existing.slug) {
    await database
      .insert(scoreSlugAliases)
      .values({
        slug: existing.slug,
        scoreId,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  await replaceTagsForScore(scoreId, input.tagList, database);
  await refreshSearchDocument(scoreId, database);

  await purgePublicScore(existing.slug);
  if (nextSlug !== existing.slug) {
    await purgePublicScore(nextSlug);
  }

  return { slug: nextSlug };
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

  try {
    await refreshSearchDocument(scoreId, database);
  } catch {
    // The score is gone; a stale index row is harmless and can be rebuilt.
  }

  await purgePublicScore(existing.slug);

  return { slug: existing.slug };
}
