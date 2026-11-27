import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rawAll, rawRun } from "@/lib/db/raw";
import { composers, scoreTags, scores, tags } from "@/lib/db/schema";
import {
  cjkSpaced,
  normalizeText,
  searchTextForScore,
} from "@/lib/catalog/normalize";
import type { CatalogDb } from "@/lib/scores/queries";

type SearchRow = {
  id: string;
  slug: string;
  title: string;
  composerDisplay: string | null;
  composerRaw: string | null;
  composerSort: string | null;
  composerAliases: string | null;
  catalogNumber: string | null;
  lyricist: string | null;
  key: string | null;
  tagLabels: string;
};

async function loadSearchRows(
  database: CatalogDb,
  scoreIds?: string[],
): Promise<SearchRow[]> {
  const base = () =>
    database
      .select({
        id: scores.id,
        slug: scores.slug,
        title: scores.title,
        composerDisplay: composers.displayName,
        composerRaw: scores.composerRaw,
        composerSort: composers.sortName,
        composerAliases: composers.aliases,
        catalogNumber: scores.catalogNumber,
        lyricist: scores.lyricist,
        key: scores.key,
      })
      .from(scores)
      .leftJoin(composers, eq(composers.id, scores.composerId));

  const rows = scoreIds
    ? (
        await Promise.all(
          chunksOf(scoreIds, 80).map((chunk) =>
            base().where(inArray(scores.id, chunk)),
          ),
        )
      ).flat()
    : await base();

  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return [];
  }

  const tagsByScore = new Map<string, string[]>();
  for (let offset = 0; offset < ids.length; offset += 80) {
    const chunk = ids.slice(offset, offset + 80);
    const tagRows = await database
      .select({
        scoreId: scoreTags.scoreId,
        label: tags.label,
      })
      .from(scoreTags)
      .innerJoin(tags, eq(tags.id, scoreTags.tagId))
      .where(inArray(scoreTags.scoreId, chunk));

    for (const row of tagRows) {
      const list = tagsByScore.get(row.scoreId) ?? [];
      list.push(row.label);
      tagsByScore.set(row.scoreId, list);
    }
  }

  return rows.map((row) => ({
    ...row,
    tagLabels: (tagsByScore.get(row.id) ?? []).join(" "),
  }));
}

function aliasesOf(value: string | null): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

type SearchDocument = {
  composerDisplay: string | null;
  aliases: string[];
  searchText: string;
  values: unknown[];
};

function buildDocument(row: SearchRow): SearchDocument {
  const composerDisplay = row.composerDisplay;
  const aliases = aliasesOf(row.composerAliases);
  const searchText = searchTextForScore({
    title: row.title,
    composer: composerDisplay,
    composerRaw: row.composerRaw,
    composerSortName: row.composerSort,
    composerAliases: aliases,
    catalogNumber: row.catalogNumber,
    lyricist: row.lyricist,
    key: row.key,
    tags: row.tagLabels ? [row.tagLabels] : [],
    slug: row.slug,
  });

  return {
    composerDisplay,
    aliases,
    searchText,
    values: [
      row.id,
      cjkSpaced(row.title),
      cjkSpaced(
        [composerDisplay, row.composerRaw, row.composerSort, ...aliases]
          .filter(Boolean)
          .join(" "),
      ),
      cjkSpaced(row.catalogNumber ?? ""),
      cjkSpaced(row.lyricist ?? ""),
      cjkSpaced(row.key ?? ""),
      cjkSpaced(row.tagLabels),
      cjkSpaced(
        [searchText, row.slug, row.catalogNumber, row.key, row.tagLabels]
          .filter(Boolean)
          .join(" "),
      ),
    ],
  };
}

const INSERT_SQL = `INSERT INTO catalog_search
  (score_id, title, composer, catalog_number, lyricist, key, tags, all_text)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

function chunksOf<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export async function refreshSearchDocument(
  scoreId: string,
  db?: CatalogDb,
): Promise<void> {
  const database = db ?? getDb();
  const [row] = await loadSearchRows(database, [scoreId]);

  if (!row) {
    await rawRun(database, "DELETE FROM catalog_search WHERE score_id = ?", [
      scoreId,
    ]);
    return;
  }

  const document = buildDocument(row);
  await rawRun(database, "DELETE FROM catalog_search WHERE score_id = ?", [
    scoreId,
  ]);
  await rawRun(database, INSERT_SQL, document.values);
  await database
    .update(scores)
    .set({
      searchText: document.searchText,
      titleSort: normalizeText(row.title),
    })
    .where(eq(scores.id, scoreId));
}

/**
 * Refresh many documents at once for an admin bulk action. Each FTS insert
 * carries ten rows (80 bound values) and each score update forty ids, staying
 * under D1's 100-parameter ceiling without one request per score.
 */
export async function refreshSearchDocuments(
  scoreIds: string[],
  db?: CatalogDb,
  options: { composerDisplay?: string } = {},
): Promise<void> {
  const database = db ?? getDb();
  const ids = [...new Set(scoreIds.filter(Boolean))];
  if (ids.length === 0) return;

  const rows = await loadSearchRows(database, ids);
  const documents = rows.map((row) => buildDocument(row));

  for (const chunk of chunksOf(ids, 80)) {
    await rawRun(
      database,
      `DELETE FROM catalog_search WHERE score_id IN (${chunk
        .map(() => "?")
        .join(", ")})`,
      chunk,
    );
  }

  for (const chunk of chunksOf(documents, 10)) {
    const placeholders = chunk
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    await rawRun(
      database,
      `INSERT INTO catalog_search
        (score_id, title, composer, catalog_number, lyricist, key, tags, all_text)
       VALUES ${placeholders}`,
      chunk.flatMap((document) => document.values),
    );
  }

  for (const chunk of chunksOf(ids, 40)) {
    if (options.composerDisplay !== undefined) {
      await rawRun(
        database,
        `UPDATE scores SET
           title_sort = lower(trim(title)),
           search_text = lower(
             coalesce(title, '') || ' ' ||
             ? || ' ' ||
             coalesce(composer_raw, '') || ' ' ||
             coalesce(source_filename, '') || ' ' ||
             coalesce(catalog_number, '') || ' ' ||
             coalesce(lyricist, '') || ' ' ||
             coalesce(key, '')
           )
         WHERE id IN (${chunk.map(() => "?").join(", ")})`,
        [options.composerDisplay, ...chunk],
      );
    } else {
      const byId = new Map(
        documents.map((document) => [
          String(document.values[0]),
          document.searchText,
        ]),
      );
      for (const id of chunk) {
        await rawRun(
          database,
          "UPDATE scores SET title_sort = lower(trim(title)), search_text = ? WHERE id = ?",
          [byId.get(id) ?? "", id],
        );
      }
    }
  }
}

export async function rebuildSearchIndex(db?: CatalogDb): Promise<number> {
  const database = db ?? getDb();
  await rawRun(database, "DELETE FROM catalog_search");
  await rawRun(
    database,
    `INSERT INTO catalog_search
      (score_id, title, composer, catalog_number, lyricist, key, tags, all_text)
     SELECT
       s.id,
       s.title,
       coalesce(c.display_name, ''),
       coalesce(s.catalog_number, ''),
       coalesce(s.lyricist, ''),
       coalesce(s.key, ''),
       coalesce((
         SELECT group_concat(t.label, ' ')
         FROM score_tags st JOIN tags t ON t.id = st.tag_id
         WHERE st.score_id = s.id
       ), ''),
       lower(
         coalesce(s.title, '') || ' ' ||
         coalesce(c.display_name, '') || ' ' ||
         coalesce(s.composer_raw, '') || ' ' ||
         coalesce(s.source_filename, '') || ' ' ||
         coalesce(c.sort_name, '') || ' ' ||
         coalesce(c.aliases, '') || ' ' ||
         coalesce(s.catalog_number, '') || ' ' ||
         coalesce(s.lyricist, '') || ' ' ||
         coalesce(s.key, '') || ' ' ||
         coalesce(s.slug, '') || ' ' ||
         coalesce((
           SELECT group_concat(t.label, ' ')
           FROM score_tags st JOIN tags t ON t.id = st.tag_id
           WHERE st.score_id = s.id
         ), '')
       )
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id`,
  );
  await rawRun(
    database,
    `UPDATE scores SET
       title_sort = lower(trim(title)),
       search_text = lower(
         coalesce(title, '') || ' ' ||
         coalesce((SELECT display_name FROM composers WHERE id = scores.composer_id), '') || ' ' ||
         coalesce(composer_raw, '') || ' ' ||
         coalesce(source_filename, '') || ' ' ||
         coalesce(catalog_number, '') || ' ' ||
         coalesce(lyricist, '') || ' ' ||
         coalesce(key, '')
       )`,
  );
  const rows = await rawAll<{ count: number }>(
    database,
    "SELECT COUNT(*) AS count FROM catalog_search",
  );
  return Number(rows[0]?.count ?? 0);
}

