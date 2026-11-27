import { eq, inArray, sql } from "drizzle-orm";
import type { CatalogDb } from "@/lib/scores/queries";
import { composers, scores } from "@/lib/db/schema";
import { canonicalComposer } from "@/lib/catalog/composers";
import { normalizeText } from "@/lib/catalog/normalize";

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
  composer: composers.displayName,
  composerId: scores.composerId,
  contentHash: scores.contentHash,
};

function toScoreMatch(row: {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
}): ScoreMatch {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    composer: row.composer,
  };
}

export async function findScoreByContentHash(
  db: CatalogDb,
  contentHash: string,
): Promise<ScoreMatch | null> {
  const row = await db
    .select(matchFields)
    .from(scores)
    .leftJoin(composers, eq(composers.id, scores.composerId))
    .where(eq(scores.contentHash, contentHash))
    .get();

  return row ? toScoreMatch(row) : null;
}

export type PreflightMatchInput = {
  contentHash: string;
  title: string;
  composer?: string | null;
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
  composerId: string | null;
  contentHash: string | null;
};

function chunksOf<T>(values: T[], size = 80): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function loadComposerKeys(
  db: CatalogDb,
): Promise<Map<string, Set<string>>> {
  const rows = await db
    .select({
      id: composers.id,
      displayName: composers.displayName,
      aliases: composers.aliases,
    })
    .from(composers);
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const keys = new Set<string>();
    keys.add(normalizeText(row.displayName));
    try {
      const aliases = JSON.parse(row.aliases);
      if (Array.isArray(aliases)) {
        for (const alias of aliases) {
          if (typeof alias === "string" && alias.trim()) {
            keys.add(normalizeText(alias));
          }
        }
      }
    } catch {
      // A malformed legacy alias list only loses suggestions, not exact matches.
    }
    map.set(row.id, keys);
  }
  return map;
}

function itemComposerKeys(composer: string | null | undefined): Set<string> {
  const keys = new Set<string>();
  const trimmed = composer?.trim();
  if (!trimmed) return keys;
  const canonical = canonicalComposer(trimmed);
  if (canonical) keys.add(normalizeText(canonical.displayName));
  keys.add(normalizeText(trimmed));
  return keys;
}

/**
 * Catalog lookups for the client-side batch preflight. One query for exact
 * hashes and one for normalized titles, rather than 2 queries per file.
 * Similar matches also compare composer keys so two different settings of the
 * same title are not offered as possible duplicates.
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

  const [hashRows, titleRows, composerKeys] = await Promise.all([
    Promise.all(
      chunksOf(hashes).map((chunk) =>
        db
          .select(matchFields)
          .from(scores)
          .leftJoin(composers, eq(composers.id, scores.composerId))
          .where(inArray(scores.contentHash, chunk))
          .limit(1000),
      ),
    ).then((groups) => groups.flat()),
    Promise.all(
      chunksOf(titles).map((chunk) =>
        db
          .select(matchFields)
          .from(scores)
          .leftJoin(composers, eq(composers.id, scores.composerId))
          .where(inArray(sql`lower(trim(${scores.title}))`, chunk))
          .limit(1000),
      ),
    ).then((groups) => groups.flat()),
    loadComposerKeys(db),
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
    const wantedComposer = itemComposerKeys(item.composer);
    const normalizedTitle = item.title.trim().toLowerCase();
    const similarMatches = (rowsByTitle.get(normalizedTitle) ?? [])
      .filter((row) => {
        if (row.id === exactMatch?.id || row.contentHash === item.contentHash) {
          return false;
        }
        if (wantedComposer.size === 0) {
          return true;
        }
        const rowKeys = row.composerId
          ? (composerKeys.get(row.composerId) ?? new Set<string>())
          : new Set<string>();
        if (rowKeys.size === 0 && row.composer) {
          rowKeys.add(normalizeText(row.composer));
        }
        return [...wantedComposer].some((key) => rowKeys.has(key));
      })
      .slice(0, 5)
      .map((row) => toScoreMatch(row));

    return { exactMatch, similarMatches };
  });
}
