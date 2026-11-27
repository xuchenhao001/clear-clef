import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rawAll, rawRun } from "@/lib/db/raw";
import { composers, scoreCreditEvents, scores } from "@/lib/db/schema";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { refreshSearchDocument, refreshSearchDocuments } from "@/lib/search";
import { escapeLike, truncateUtf8 } from "@/lib/search/query";
import { getUncreditedComposer } from "@/lib/scores/composers";
import type { CatalogDb } from "@/lib/scores/queries";

export const UNASSIGNED_PAGE_SIZE = 25;

export type UnassignedScore = {
  id: string;
  slug: string;
  title: string;
  composerRaw: string | null;
  sourceFilename: string | null;
  catalogNumber: string | null;
  key: string | null;
  timeSignature: string | null;
  difficulty: string | null;
  license: string;
  visibility: string;
  importId: string | null;
  previewUrl: string | null;
  createdAt: Date;
};

export type UnassignedFilters = {
  q?: string;
  import?: string;
  visibility?: string;
  page?: number;
};

export type UnassignedPage = {
  items: UnassignedScore[];
  total: number;
  page: number;
  pageCount: number;
};

export type ComposerCreditStats = {
  unassigned: number;
  uncredited: number;
};

export type UnassignedImport = {
  importId: string;
  count: number;
  latest: Date;
};

export async function listUnassignedImports(
  db?: CatalogDb,
): Promise<UnassignedImport[]> {
  const database = db ?? getDb();
  const rows = await rawAll<{ import_id: string; count: number; latest: number }>(
    database,
    `SELECT import_id, COUNT(*) AS count, MAX(created_at) AS latest
     FROM scores
     WHERE composer_id IS NULL AND import_id IS NOT NULL
     GROUP BY import_id
     ORDER BY latest DESC`,
  );
  return rows.map((row) => ({
    importId: row.import_id,
    count: Number(row.count),
    latest: new Date(Number(row.latest)),
  }));
}

function unassignedWhere(filters: UnassignedFilters): {
  where: string;
  values: unknown[];
} {
  const where = ["s.composer_id IS NULL"];
  const values: unknown[] = [];

  if (filters.visibility) {
    where.push("s.visibility = ?");
    values.push(filters.visibility);
  }
  if (filters.import) {
    where.push("s.import_id = ?");
    values.push(filters.import);
  }
  const q = truncateUtf8(filters.q?.trim() ?? "", 36);
  if (q) {
    const pattern = `%${escapeLike(q.toLowerCase())}%`;
    where.push(`(
      lower(s.title) LIKE ? ESCAPE '\\'
      OR lower(coalesce(s.composer_raw, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(s.source_filename, '')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(s.catalog_number, '')) LIKE ? ESCAPE '\\'
      OR lower(s.slug) LIKE ? ESCAPE '\\'
    )`);
    values.push(pattern, pattern, pattern, pattern, pattern);
  }

  return { where: where.join(" AND "), values };
}

export async function listUnassignedScores(
  filters: UnassignedFilters = {},
  db?: CatalogDb,
): Promise<UnassignedPage> {
  const database = db ?? getDb();
  const { where, values } = unassignedWhere(filters);
  const countRows = await rawAll<{ count: number }>(
    database,
    `SELECT COUNT(*) AS count FROM scores s WHERE ${where}`,
    values,
  );
  const total = Number(countRows[0]?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / UNASSIGNED_PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);

  const rows = await rawAll<Record<string, unknown>>(
    database,
    `SELECT
       s.id, s.slug, s.title, s.composer_raw, s.source_filename,
       s.catalog_number, s.key, s.time_signature, s.difficulty,
       s.license, s.visibility, s.import_id, s.preview_r2_key,
       s.preview_thumb_r2_key, s.preview_version, s.content_hash,
       s.updated_at, s.created_at
     FROM scores s
     WHERE ${where}
     ORDER BY s.created_at DESC, s.id
     LIMIT ? OFFSET ?`,
    [...values, UNASSIGNED_PAGE_SIZE, (page - 1) * UNASSIGNED_PAGE_SIZE],
  );

  return {
    items: rows.map((row) => {
      const hasPreview = Boolean(row.preview_r2_key);
      const version = String(
        row.preview_version ?? row.content_hash ?? row.updated_at ?? row.created_at ?? "1",
      );
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title),
        composerRaw: (row.composer_raw as string | null) ?? null,
        sourceFilename: (row.source_filename as string | null) ?? null,
        catalogNumber: (row.catalog_number as string | null) ?? null,
        key: (row.key as string | null) ?? null,
        timeSignature: (row.time_signature as string | null) ?? null,
        difficulty: (row.difficulty as string | null) ?? null,
        license: String(row.license),
        visibility: String(row.visibility),
        importId: (row.import_id as string | null) ?? null,
        previewUrl: hasPreview
          ? `/api/admin/scores/${String(row.id)}/preview?cache=${encodeURIComponent(
              version,
            )}${row.preview_thumb_r2_key ? "&thumb=1" : ""}`
          : null,
        createdAt: new Date(Number(row.created_at)),
      };
    }),
    total,
    page,
    pageCount,
  };
}

export async function listUnassignedScoreIds(
  filters: UnassignedFilters = {},
  limit = 500,
  db?: CatalogDb,
): Promise<{ ids: string[]; total: number }> {
  const database = db ?? getDb();
  const { where, values } = unassignedWhere(filters);
  const [countRows, rows] = await Promise.all([
    rawAll<{ count: number }>(
      database,
      `SELECT COUNT(*) AS count FROM scores s WHERE ${where}`,
      values,
    ),
    rawAll<{ id: string }>(
      database,
      `SELECT s.id FROM scores s WHERE ${where}
       ORDER BY s.created_at DESC, s.id
       LIMIT ?`,
      [...values, Math.min(Math.max(1, limit), 500)],
    ),
  ]);
  return {
    ids: rows.map((row) => String(row.id)),
    total: Number(countRows[0]?.count ?? 0),
  };
}

export async function getComposerCreditStats(
  db?: CatalogDb,
): Promise<ComposerCreditStats> {
  const database = db ?? getDb();
  const [row] = await rawAll<{ unassigned: number; uncredited: number }>(
    database,
    `SELECT
       (SELECT COUNT(*) FROM scores WHERE composer_id IS NULL) AS unassigned,
       (SELECT COUNT(*) FROM scores s
        JOIN composers c ON c.id = s.composer_id
        WHERE c.display_name = 'Uncredited') AS uncredited`,
  );
  return {
    unassigned: Number(row?.unassigned ?? 0),
    uncredited: Number(row?.uncredited ?? 0),
  };
}

export type AssignComposerInput = {
  scoreIds: string[];
  composerId: string;
  actorId?: string | null;
  action?: "assign" | "keep_uncredited";
};

export type AssignComposerResult = {
  assigned: number;
  target: { id: string; displayName: string };
};

function uniqueScoreIds(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function assignComposerToScores(
  input: AssignComposerInput,
  db?: CatalogDb,
): Promise<AssignComposerResult> {
  const database = db ?? getDb();
  const scoreIds = uniqueScoreIds(input.scoreIds);
  if (scoreIds.length === 0) {
    throw new Error("Select at least one work");
  }
  if (scoreIds.length > 500) {
    throw new Error("Assign at most 500 works at once");
  }

  const target = await database
    .select()
    .from(composers)
    .where(eq(composers.id, input.composerId))
    .get();
  if (!target) {
    throw new Error("Composer not found");
  }

  const affected: Array<{
    id: string;
    slug: string;
    previousComposerId: string | null;
  }> = [];
  for (let offset = 0; offset < scoreIds.length; offset += 40) {
    const chunk = scoreIds.slice(offset, offset + 40);
    const rows = await database
      .select({
        id: scores.id,
        slug: scores.slug,
        composerId: scores.composerId,
      })
      .from(scores)
      .where(inArray(scores.id, chunk));
    for (const row of rows) {
      affected.push({
        id: row.id,
        slug: row.slug,
        previousComposerId: row.composerId,
      });
    }
  }

  if (affected.length === 0) {
    throw new Error("No matching works found");
  }

  const now = new Date();
  for (let offset = 0; offset < affected.length; offset += 40) {
    const chunk = affected.slice(offset, offset + 40);
    const ids = chunk.map((row) => row.id);
    await rawRun(
      database,
      `UPDATE scores
       SET composer_id = ?, updated_at = ?,
           work_key = lower(trim(title)) || '|' || lower(?)
       WHERE id IN (${ids.map(() => "?").join(", ")})`,
      [target.id, now.getTime(), target.displayName, ...ids],
    );

    // Six columns per audit row; ten rows stays well below D1's bound
    // parameter ceiling while keeping the write count small.
    for (let eventOffset = 0; eventOffset < chunk.length; eventOffset += 10) {
      const eventChunk = chunk.slice(eventOffset, eventOffset + 10);
      await database.insert(scoreCreditEvents).values(
        eventChunk.map((row) => ({
          id: crypto.randomUUID(),
          scoreId: row.id,
          previousComposerId: row.previousComposerId,
          newComposerId: target.id,
          action: input.action ?? "assign",
          actorId: input.actorId ?? null,
          createdAt: now,
        })),
      );
    }
  }

  await refreshSearchDocuments(
    affected.map((row) => row.id),
    database,
    { composerDisplay: target.displayName },
  );
  await Promise.allSettled(affected.map((row) => purgePublicScore(row.slug)));

  return {
    assigned: affected.length,
    target: { id: target.id, displayName: target.displayName },
  };
}

export async function keepScoresUncredited(
  scoreIds: string[],
  actorId?: string | null,
  db?: CatalogDb,
): Promise<AssignComposerResult> {
  const database = db ?? getDb();
  const uncredited = await getUncreditedComposer(database);
  return assignComposerToScores(
    {
      scoreIds,
      composerId: uncredited.id,
      actorId,
      action: "keep_uncredited",
    },
    database,
  );
}

export type CreditEvent = {
  id: string;
  scoreId: string;
  scoreTitle: string;
  previousComposer: string | null;
  newComposer: string | null;
  action: string;
  createdAt: Date;
};

export async function listRecentCreditEvents(
  limit = 8,
  db?: CatalogDb,
): Promise<CreditEvent[]> {
  const database = db ?? getDb();
  const rows = await rawAll<Record<string, unknown>>(
    database,
    `SELECT e.id, e.score_id, e.action, e.created_at,
            s.title AS score_title,
            previous.display_name AS previous_composer,
            next.display_name AS new_composer
     FROM score_credit_events e
     JOIN scores s ON s.id = e.score_id
     LEFT JOIN composers previous ON previous.id = e.previous_composer_id
     LEFT JOIN composers next ON next.id = e.new_composer_id
     ORDER BY e.created_at DESC, e.id
     LIMIT ?`,
    [Math.min(Math.max(1, limit), 50)],
  );
  return rows.map((row) => ({
    id: String(row.id),
    scoreId: String(row.score_id),
    scoreTitle: String(row.score_title),
    previousComposer: (row.previous_composer as string | null) ?? null,
    newComposer: (row.new_composer as string | null) ?? null,
    action: String(row.action),
    createdAt: new Date(Number(row.created_at)),
  }));
}

export async function updateScoreCreditEvidence(
  scoreId: string,
  input: { composerRaw?: string | null; sourceFilename?: string | null },
  db?: CatalogDb,
): Promise<void> {
  const database = db ?? getDb();
  const existing = await database
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.id, scoreId))
    .get();
  if (!existing) {
    throw new Error("Score not found");
  }

  const set: Partial<typeof scores.$inferInsert> = { updatedAt: new Date() };
  if (input.composerRaw !== undefined) {
    set.composerRaw = input.composerRaw?.trim() || null;
  }
  if (input.sourceFilename !== undefined) {
    set.sourceFilename = input.sourceFilename?.trim() || null;
  }
  await database.update(scores).set(set).where(eq(scores.id, scoreId));
  await refreshSearchDocument(scoreId, database);
}


