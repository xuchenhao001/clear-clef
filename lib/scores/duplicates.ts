import { eq, inArray, sql } from "drizzle-orm";
import type { CatalogDb } from "@/lib/scores/queries";
import { scores } from "@/lib/db/schema";

export type ScoreMatch = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
};

const matchFields = {
  id: scores.id,
  slug: scores.slug,
  title: scores.title,
  composer: scores.composer,
  contentHash: scores.contentHash,
};

export async function findScoreByContentHash(
  db: CatalogDb,
  contentHash: string,
): Promise<ScoreMatch | null> {
  const row = await db
    .select(matchFields)
    .from(scores)
    .where(eq(scores.contentHash, contentHash))
    .get();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    composer: row.composer,
  };
}

export type PreflightMatchInput = {
  contentHash: string;
  title: string;
};

export type PreflightMatches = {
  exactMatch: ScoreMatch | null;
  similarMatches: ScoreMatch[];
};

type MatchRow = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  contentHash: string | null;
};

function toScoreMatch(row: MatchRow): ScoreMatch {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    composer: row.composer,
  };
}

/**
 * Catalog lookups for the client-side batch preflight. One query for exact
 * hashes and one for normalized titles, rather than 2 queries per file.
 */
export async function findPreflightMatches(
  db: CatalogDb,
  items: PreflightMatchInput[],
): Promise<PreflightMatches[]> {
  if (items.length === 0) {
    return [];
  }

  const hashes = [
    ...new Set(items.map((item) => item.contentHash).filter(Boolean)),
  ];
  const titles = [
    ...new Set(
      items
        .map((item) => item.title.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  const chunksOf = <T,>(values: T[], size = 80): T[][] => {
    const chunks: T[][] = [];
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size));
    }
    return chunks;
  };

  const [hashRows, titleRows] = await Promise.all([
    Promise.all(
      chunksOf(hashes).map((chunk) =>
        db
          .select(matchFields)
          .from(scores)
          .where(inArray(scores.contentHash, chunk))
          .limit(1000),
      ),
    ).then((groups) => groups.flat()),
    Promise.all(
      chunksOf(titles).map((chunk) =>
        db
          .select(matchFields)
          .from(scores)
          .where(inArray(sql`lower(trim(${scores.title}))`, chunk))
          .limit(1000),
      ),
    ).then((groups) => groups.flat()),
  ]);

  const rowsById = new Map<string, MatchRow>();
  for (const row of [...hashRows, ...titleRows]) {
    rowsById.set(row.id, row);
  }

  const exactByHash = new Map<string, ScoreMatch>();
  const rowsByTitle = new Map<string, MatchRow[]>();
  for (const row of rowsById.values()) {
    if (row.contentHash && !exactByHash.has(row.contentHash)) {
      exactByHash.set(row.contentHash, toScoreMatch(row));
    }
    const normalizedTitle = row.title.trim().toLowerCase();
    const list = rowsByTitle.get(normalizedTitle) ?? [];
    list.push(row);
    rowsByTitle.set(normalizedTitle, list);
  }

  return items.map((item) => {
    const exactMatch = exactByHash.get(item.contentHash) ?? null;
    const normalizedTitle = item.title.trim().toLowerCase();
    const similarMatches = (rowsByTitle.get(normalizedTitle) ?? [])
      .filter(
        (row) =>
          row.id !== exactMatch?.id &&
          row.contentHash !== item.contentHash,
      )
      .slice(0, 3)
      .map(toScoreMatch);

    return { exactMatch, similarMatches };
  });
}
