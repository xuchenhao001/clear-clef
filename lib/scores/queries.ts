import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rawAll } from "@/lib/db/raw";
import * as schema from "@/lib/db/schema";
import { composers, scores, tags } from "@/lib/db/schema";
import { isMxlR2Key } from "@/lib/score-file";
import {
  canonicalDifficulty,
  canonicalKey,
  canonicalLicense,
  DIFFICULTY_BY_VALUE,
  DIFFICULTY_BY_SLUG,
  difficultyLabel,
  KEY_BY_VALUE,
  keyFromSlug,
  keyLabel,
  keyRank,
  LICENSE_BY_VALUE,
  LICENSE_BY_SLUG,
  licenseFromSlug,
  licenseLabel,
} from "@/lib/catalog/vocab";
import { buildSearchTokens, escapeLike } from "@/lib/search/query";
import {
  scoreFileVersion,
  scorePreviewVersion,
} from "@/lib/scores/versions";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export type CatalogDb = DrizzleD1Database<typeof schema>;

export type CatalogSort = "composer" | "relevance" | "title" | "newest";

export type CatalogFilters = {
  q?: string;
  composer?: string[];
  key?: string[];
  difficulty?: string[];
  license?: string[];
  tag?: string[];
  sort?: CatalogSort;
  page?: number;
};

export type PublicCatalogScore = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  composerSlug: string | null;
  catalogNumber: string | null;
  key: string | null;
  keyLabel: string;
  timeSignature: string | null;
  difficulty: string | null;
  difficultyLabel: string;
  arranger: string | null;
  editionLabel: string | null;
  workKey: string | null;
  hasPreview: boolean;
  previewUrl: string | null;
};

export type PublicCatalogFacetValue = {
  value: string;
  label: string;
  slug: string;
  count: number;
};

export type PublicCatalogFacet = {
  name: "key" | "difficulty" | "license" | "tag";
  label: string;
  values: PublicCatalogFacetValue[];
};

export type PublicCatalogPage = {
  items: PublicCatalogScore[];
  total: number;
  totalPublic: number;
  page: number;
  pageCount: number;
  pageSize: number;
  sort: CatalogSort;
  q: string;
  facets: PublicCatalogFacet[];
};

export type RelatedScore = {
  id: string;
  slug: string;
  title: string;
  key: string | null;
  keyLabel: string;
  difficulty: string | null;
  difficultyLabel: string;
};

export type PublicScoreDetail = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  composerSlug: string | null;
  composerDates: string | null;
  catalogNumber: string | null;
  lyricist: string | null;
  sourceUrl: string | null;
  license: string;
  key: string | null;
  keyLabel: string;
  timeSignature: string | null;
  difficulty: string | null;
  difficultyLabel: string;
  arranger: string | null;
  editionLabel: string | null;
  workKey: string | null;
  fileUrl: string;
  previewUrl: string | null;
  compressed: boolean;
  tags: { slug: string; label: string }[];
  related: RelatedScore[];
};

export const CATALOG_PAGE_SIZE = 30;

export function scorePreviewUrl(id: string, version: string): string {
  return `/api/scores/${id}/preview?v=${encodeURIComponent(version)}`;
}

export function scoreFileUrl(id: string, version: string): string {
  return `/api/scores/${id}/file?v=${encodeURIComponent(version)}`;
}

type QueryPart = {
  joins: string;
  where: string;
  values: unknown[];
};

function placeholders(values: unknown[]): string {
  return values.map(() => "?").join(", ");
}

function buildCatalogQuery(
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
  exclude?: "key" | "difficulty" | "license" | "tag",
): QueryPart {
  const joins: string[] = [];
  const where: string[] = ["s.visibility = 'public'"];
  const values: unknown[] = [];

  const tokens = filters.q ? buildSearchTokens(filters.q) : null;
  if (tokens?.fts && searchMode === "fts") {
    joins.push("JOIN catalog_search ON catalog_search.score_id = s.id");
    where.push("catalog_search MATCH ?");
    values.push(tokens.fts);
  } else if (tokens?.fallback && searchMode === "like") {
    where.push("s.search_text LIKE ? ESCAPE '\\'");
    values.push(`%${escapeLike(tokens.fallback)}%`);
  }

  if (filters.composer?.length) {
    where.push(`c.slug IN (${placeholders(filters.composer)})`);
    values.push(...filters.composer);
  }

  if (exclude !== "key" && filters.key?.length) {
    const keys = filters.key
      .map((value) => canonicalKey(value) ?? keyFromSlug(value) ?? value)
      .filter(Boolean);
    if (keys.length) {
      where.push(`s.key IN (${placeholders(keys)})`);
      values.push(...keys);
    }
  }

  if (exclude !== "difficulty" && filters.difficulty?.length) {
    const difficulties = filters.difficulty
      .map(
        (value) =>
          canonicalDifficulty(value) ??
          DIFFICULTY_BY_SLUG.get(value)?.value ??
          value,
      )
      .filter(Boolean);
    if (difficulties.length) {
      where.push(`s.difficulty IN (${placeholders(difficulties)})`);
      values.push(...difficulties);
    }
  }

  if (exclude !== "license" && filters.license?.length) {
    const licenses = filters.license
      .map(
        (value) =>
          canonicalLicense(value) ??
          licenseFromSlug(value) ??
          LICENSE_BY_SLUG.get(value)?.value ??
          value,
      )
      .filter(Boolean);
    if (licenses.length) {
      where.push(`s.license IN (${placeholders(licenses)})`);
      values.push(...licenses);
    }
  }

  if (exclude !== "tag" && filters.tag?.length) {
    where.push(
      `EXISTS (
        SELECT 1 FROM score_tags stf
        JOIN tags tf ON tf.id = stf.tag_id
        WHERE stf.score_id = s.id AND tf.slug IN (${placeholders(filters.tag)})
      )`,
    );
    values.push(...filters.tag);
  }

  return { joins: joins.join(" "), where: where.join(" AND "), values };
}

function mapCatalogRow(row: Record<string, unknown>): PublicCatalogScore {
  const key = canonicalKey(String(row.key ?? "")) ?? (row.key as string | null);
  const difficulty =
    canonicalDifficulty(String(row.difficulty ?? "")) ??
    (row.difficulty as string | null);
  const hasPreview = Number(row.has_preview) === 1;
  const version = String(
    row.preview_version ?? row.content_hash ?? row.updated_at ?? row.created_at ?? "1",
  );
  const previewUrl =
    hasPreview && row.preview_thumb_r2_key
      ? `${scorePreviewUrl(String(row.id), version)}&thumb=1`
      : hasPreview
        ? scorePreviewUrl(String(row.id), version)
        : null;

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    composer: (row.composer as string | null) ?? null,
    composerSlug: (row.composer_slug as string | null) ?? null,
    catalogNumber: (row.catalog_number as string | null) ?? null,
    key,
    keyLabel: keyLabel(key),
    timeSignature: (row.time_signature as string | null) ?? null,
    difficulty,
    difficultyLabel: difficultyLabel(difficulty),
    arranger: (row.arranger as string | null) ?? null,
    editionLabel: (row.edition_label as string | null) ?? null,
    workKey: (row.work_key as string | null) ?? null,
    hasPreview,
    previewUrl,
  };
}

async function queryCount(
  database: CatalogDb,
  part: QueryPart,
): Promise<number> {
  const rows = await rawAll<{ count: number }>(
    database,
    `SELECT COUNT(*) AS count
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id
     ${part.joins}
     WHERE ${part.where}`,
    part.values,
  );
  return Number(rows[0]?.count ?? 0);
}

async function queryCatalogPage(
  database: CatalogDb,
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
  page: number,
  pageSize: number,
): Promise<PublicCatalogScore[]> {
  const part = buildCatalogQuery(filters, searchMode);
  const sort: CatalogSort =
    filters.sort ?? (filters.q?.trim() ? "relevance" : "composer");
  const order =
    sort === "title"
      ? "s.title_sort COLLATE NOCASE, COALESCE(c.sort_name, s.composer) COLLATE NOCASE, s.id"
      : sort === "newest"
        ? "s.created_at DESC, s.id"
        : sort === "relevance" && searchMode === "fts" && part.joins
          ? "bm25(catalog_search), COALESCE(c.sort_name, s.composer) COLLATE NOCASE, s.title_sort COLLATE NOCASE, s.id"
          : "COALESCE(c.sort_name, s.composer) COLLATE NOCASE, s.title_sort COLLATE NOCASE, s.id";

  const rows = await rawAll<Record<string, unknown>>(
    database,
    `SELECT
       s.id, s.slug, s.title,
       COALESCE(c.display_name, s.composer) AS composer,
       c.slug AS composer_slug,
       s.catalog_number, s.key, s.time_signature, s.difficulty,
       s.arranger, s.edition_label, s.work_key,
       CASE WHEN s.preview_r2_key IS NULL THEN 0 ELSE 1 END AS has_preview,
       s.preview_thumb_r2_key,
       s.preview_version, s.content_hash, s.updated_at, s.created_at
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id
     ${part.joins}
     WHERE ${part.where}
     ORDER BY ${order}
     LIMIT ? OFFSET ?`,
    [...part.values, pageSize, (page - 1) * pageSize],
  );

  return rows.map(mapCatalogRow);
}

async function keyFacet(
  database: CatalogDb,
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
): Promise<PublicCatalogFacetValue[]> {
  const part = buildCatalogQuery(filters, searchMode, "key");
  const rows = await rawAll<{ value: string; count: number }>(
    database,
    `SELECT s.key AS value, COUNT(*) AS count
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id
     ${part.joins}
     WHERE ${part.where} AND s.key IS NOT NULL AND s.key <> ''
     GROUP BY s.key`,
    part.values,
  );

  return rows
    .map((row) => {
      const key = canonicalKey(row.value) ?? row.value;
      const option = KEY_BY_VALUE.get(key);
      return {
        value: key,
        label: option?.label ?? key,
        slug: option?.slug ?? key.toLowerCase().replace(/\s+/g, "-"),
        count: Number(row.count),
        rank: keyRank(key),
      };
    })
    .filter((value) => value.count > 0)
    .sort((left, right) => left.rank - right.rank || left.label.localeCompare(right.label))
    .map((value) => ({
      value: value.value,
      label: value.label,
      slug: value.slug,
      count: value.count,
    }));
}

async function difficultyFacet(
  database: CatalogDb,
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
): Promise<PublicCatalogFacetValue[]> {
  const part = buildCatalogQuery(filters, searchMode, "difficulty");
  const rows = await rawAll<{ value: string; count: number }>(
    database,
    `SELECT s.difficulty AS value, COUNT(*) AS count
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id
     ${part.joins}
     WHERE ${part.where} AND s.difficulty IS NOT NULL AND s.difficulty <> ''
     GROUP BY s.difficulty`,
    part.values,
  );

  return rows
    .map((row) => {
      const value = canonicalDifficulty(row.value) ?? row.value;
      const option = DIFFICULTY_BY_VALUE.get(value);
      return {
        value,
        label: option?.label ?? value,
        slug: option?.slug ?? value,
        count: Number(row.count),
        rank: option?.rank ?? 999,
      };
    })
    .filter((value) => value.count > 0)
    .sort((left, right) => left.rank - right.rank)
    .map((value) => ({
      value: value.value,
      label: value.label,
      slug: value.slug,
      count: value.count,
    }));
}

async function licenseFacet(
  database: CatalogDb,
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
): Promise<PublicCatalogFacetValue[]> {
  const part = buildCatalogQuery(filters, searchMode, "license");
  const rows = await rawAll<{ value: string; count: number }>(
    database,
    `SELECT s.license AS value, COUNT(*) AS count
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id
     ${part.joins}
     WHERE ${part.where} AND s.license IS NOT NULL AND s.license <> ''
     GROUP BY s.license`,
    part.values,
  );

  return rows
    .map((row) => {
      const value = canonicalLicense(row.value) ?? row.value;
      const option = LICENSE_BY_VALUE.get(value);
      return {
        value,
        label: option?.label ?? licenseLabel(value),
        slug: option?.slug ?? value.toLowerCase().replace(/\s+/g, "-"),
        count: Number(row.count),
        rank: option?.rank ?? 999,
      };
    })
    .filter((value) => value.count > 0)
    .sort((left, right) => left.rank - right.rank)
    .map((value) => ({
      value: value.value,
      label: value.label,
      slug: value.slug,
      count: value.count,
    }));
}

async function tagFacet(
  database: CatalogDb,
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
): Promise<PublicCatalogFacetValue[]> {
  const part = buildCatalogQuery(filters, searchMode, "tag");
  const rows = await rawAll<{ value: string; label: string; count: number }>(
    database,
    `SELECT t.slug AS value, t.label AS label, COUNT(*) AS count
     FROM scores s
     LEFT JOIN composers c ON c.id = s.composer_id
     JOIN score_tags st ON st.score_id = s.id
     JOIN tags t ON t.id = st.tag_id
     ${part.joins}
     WHERE ${part.where}
     GROUP BY t.slug, t.label`,
    part.values,
  );

  return rows
    .map((row) => ({
      value: row.value,
      label: row.label,
      slug: row.value,
      count: Number(row.count),
    }))
    .filter((value) => value.count > 0)
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function buildFacets(
  database: CatalogDb,
  filters: CatalogFilters,
  searchMode: "none" | "fts" | "like",
): Promise<PublicCatalogFacet[]> {
  const [keys, difficulties, licenses, tagValues] = await Promise.all([
    keyFacet(database, filters, searchMode),
    difficultyFacet(database, filters, searchMode),
    licenseFacet(database, filters, searchMode),
    tagFacet(database, filters, searchMode),
  ]);

  return [
    { name: "key", label: "Key", values: keys },
    { name: "difficulty", label: "Difficulty", values: difficulties },
    { name: "license", label: "License", values: licenses },
    { name: "tag", label: "Tag", values: tagValues },
  ];
}

async function countPublicScores(database: CatalogDb): Promise<number> {
  const rows = await rawAll<{ count: number }>(
    database,
    "SELECT COUNT(*) AS count FROM scores WHERE visibility = 'public'",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function searchPublicCatalog(
  filters: CatalogFilters = {},
  db?: CatalogDb,
): Promise<PublicCatalogPage> {
  const database = db ?? getDb();
  const q = filters.q?.trim().slice(0, 100) ?? "";
  const tokens = q ? buildSearchTokens(q) : null;
  const searchQ = tokens?.fts || tokens?.fallback ? q : "";
  const normalized = { ...filters, q: searchQ || undefined };
  const requestedPage = Math.max(1, Math.floor(filters.page ?? 1));

  let total: number;
  let mode: "none" | "fts" | "like" = searchQ ? "fts" : "none";
  try {
    total = await queryCount(
      database,
      buildCatalogQuery(normalized, searchQ ? "fts" : "none"),
    );
  } catch {
    mode = "like";
    total = await queryCount(database, buildCatalogQuery(normalized, "like"));
  }

  if (searchQ && total === 0 && mode === "fts") {
    if (tokens?.fallback) {
      mode = "like";
      total = await queryCount(database, buildCatalogQuery(normalized, "like"));
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const sort: CatalogSort =
    filters.sort === "relevance" && !searchQ
      ? "composer"
      : (filters.sort ?? (searchQ ? "relevance" : "composer"));

  const [items, facets, totalPublic] = await Promise.all([
    total > 0
      ? queryCatalogPage(
          database,
          { ...normalized, sort },
          mode,
          page,
          CATALOG_PAGE_SIZE,
        )
      : Promise.resolve([]),
    buildFacets(database, normalized, mode),
    countPublicScores(database),
  ]);

  return {
    items,
    total,
    totalPublic,
    page,
    pageCount,
    pageSize: CATALOG_PAGE_SIZE,
    sort,
    q,
    facets,
  };
}

export async function getPublicScoreBySlug(
  slug: string,
  db?: CatalogDb,
): Promise<PublicScoreDetail | null> {
  const database = db ?? getDb();
  const row = await database
    .select({
      id: scores.id,
      slug: scores.slug,
      title: scores.title,
      composer: scores.composer,
      composerSlug: composers.slug,
      composerDisplay: composers.displayName,
      birthYear: composers.birthYear,
      deathYear: composers.deathYear,
      catalogNumber: scores.catalogNumber,
      lyricist: scores.lyricist,
      sourceUrl: scores.sourceUrl,
      license: scores.license,
      key: scores.key,
      timeSignature: scores.timeSignature,
      difficulty: scores.difficulty,
      arranger: scores.arranger,
      editionLabel: scores.editionLabel,
      workKey: scores.workKey,
      r2Key: scores.r2Key,
      previewR2Key: scores.previewR2Key,
      previewVersion: scores.previewVersion,
      contentHash: scores.contentHash,
      createdAt: scores.createdAt,
      updatedAt: scores.updatedAt,
      visibility: scores.visibility,
    })
    .from(scores)
    .leftJoin(composers, eq(composers.id, scores.composerId))
    .where(and(eq(scores.slug, slug), eq(scores.visibility, "public")))
    .get();

  if (!row) {
    return null;
  }

  const tagRows = await database
    .select({ slug: tags.slug, label: tags.label })
    .from(schema.scoreTags)
    .innerJoin(tags, eq(tags.id, schema.scoreTags.tagId))
    .where(eq(schema.scoreTags.scoreId, row.id));

  const previewVersion = scorePreviewVersion(row);
  const fileVersion = scoreFileVersion(row);
  const key = canonicalKey(row.key) ?? row.key;
  const difficulty =
    canonicalDifficulty(row.difficulty) ?? row.difficulty;
  const related = await getRelatedPublicScores(
    row.id,
    row.composerDisplay ?? row.composer,
    database,
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    composer: row.composerDisplay ?? row.composer,
    composerSlug: row.composerSlug,
    composerDates:
      row.birthYear && row.deathYear
        ? `${row.birthYear}–${row.deathYear}`
        : null,
    catalogNumber: row.catalogNumber,
    lyricist: row.lyricist,
    sourceUrl: row.sourceUrl,
    license: row.license,
    key,
    keyLabel: keyLabel(key),
    timeSignature: row.timeSignature,
    difficulty,
    difficultyLabel: difficultyLabel(difficulty),
    arranger: row.arranger,
    editionLabel: row.editionLabel,
    workKey: row.workKey,
    fileUrl: scoreFileUrl(row.id, fileVersion),
    previewUrl: row.previewR2Key ? scorePreviewUrl(row.id, previewVersion) : null,
    compressed: row.r2Key ? isMxlR2Key(row.r2Key) : false,
    tags: tagRows,
    related,
  };
}

async function getRelatedPublicScores(
  scoreId: string,
  composer: string | null,
  database: CatalogDb,
): Promise<RelatedScore[]> {
  if (!composer) {
    return [];
  }

  const rows = await database
    .select({
      id: scores.id,
      slug: scores.slug,
      title: scores.title,
      key: scores.key,
      difficulty: scores.difficulty,
    })
    .from(scores)
    .where(
      and(
        eq(scores.visibility, "public"),
        eq(scores.composer, composer),
      ),
    )
    .orderBy(asc(scores.title))
    .limit(8);

  return rows
    .filter((row) => row.id !== scoreId)
    .slice(0, 4)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      key: row.key,
      keyLabel: keyLabel(row.key),
      difficulty: row.difficulty,
      difficultyLabel: difficultyLabel(row.difficulty),
    }));
}

export async function getScoreById(id: string, db?: CatalogDb) {
  const database = db ?? getDb();
  return database.select().from(scores).where(eq(scores.id, id)).get();
}

export async function listPublicSlugs(db?: CatalogDb): Promise<
  { slug: string; updatedAt: Date | null }[]
> {
  const database = db ?? getDb();
  const rows = await database
    .select({ slug: scores.slug, updatedAt: scores.updatedAt })
    .from(scores)
    .where(eq(scores.visibility, "public"))
    .orderBy(desc(scores.updatedAt));
  return rows;
}

export async function resolveSlugAlias(
  slug: string,
  db?: CatalogDb,
): Promise<string | null> {
  const database = db ?? getDb();
  const row = await database
    .select({ scoreId: schema.scoreSlugAliases.scoreId })
    .from(schema.scoreSlugAliases)
    .where(eq(schema.scoreSlugAliases.slug, slug))
    .get();
  if (!row) {
    return null;
  }
  const score = await database
    .select({ slug: scores.slug })
    .from(scores)
    .where(eq(scores.id, row.scoreId))
    .get();
  return score?.slug ?? null;
}

export async function slugExists(slug: string, db?: CatalogDb) {
  const database = db ?? getDb();
  const existing = await database
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.slug, slug))
    .get();
  return Boolean(existing);
}
