import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  type AdminScoreListFilters,
} from "@/lib/admin/filters";
import type { AdminComposerCreditSearch } from "@/lib/admin/composer-credit";
import { getDb } from "@/lib/db";
import { rawAll } from "@/lib/db/raw";
import {
  getAdminScoreById,
  searchAdminScores,
} from "@/lib/scores/admin";
import {
  findComposerById,
  listComposersWithCounts,
  type ComposerWithCount,
} from "@/lib/scores/composers";
import {
  getComposerCreditStats,
  listRecentCreditEvents,
  listUnassignedImports,
  listUnassignedScores,
} from "@/lib/scores/credit";

async function loadCatalogHealth() {
  const [row] = await rawAll<{
    missing_composer: number;
    uncredited: number;
    missing_key: number;
    missing_difficulty: number;
    missing_preview: number;
    duplicate_works: number;
    unused_tags: number;
    index_rows: number;
  }>(
    getDb(),
    `SELECT
       (SELECT COUNT(*) FROM scores WHERE visibility = 'public' AND composer_id IS NULL) AS missing_composer,
       (SELECT COUNT(*) FROM scores s JOIN composers c ON c.id = s.composer_id WHERE c.display_name = 'Uncredited') AS uncredited,
       (SELECT COUNT(*) FROM scores WHERE visibility = 'public' AND (key IS NULL OR key = '')) AS missing_key,
       (SELECT COUNT(*) FROM scores WHERE visibility = 'public' AND (difficulty IS NULL OR difficulty = '')) AS missing_difficulty,
       (SELECT COUNT(*) FROM scores WHERE visibility = 'public' AND preview_r2_key IS NULL) AS missing_preview,
       (SELECT COUNT(*) FROM (
          SELECT work_key FROM scores WHERE visibility = 'public' AND work_key IS NOT NULL
          GROUP BY work_key HAVING COUNT(*) > 1
        )) AS duplicate_works,
       (SELECT COUNT(*) FROM tags t
        LEFT JOIN score_tags st ON st.tag_id = t.id
        LEFT JOIN scores s ON s.id = st.score_id AND s.visibility = 'public'
        WHERE s.id IS NULL) AS unused_tags,
       (SELECT COUNT(*) FROM catalog_search) AS index_rows`,
  );
  return {
    missingComposer: Number(row?.missing_composer ?? 0),
    uncredited: Number(row?.uncredited ?? 0),
    missingKey: Number(row?.missing_key ?? 0),
    missingDifficulty: Number(row?.missing_difficulty ?? 0),
    missingPreview: Number(row?.missing_preview ?? 0),
    duplicateWorks: Number(row?.duplicate_works ?? 0),
    unusedTags: Number(row?.unused_tags ?? 0),
    indexRows: Number(row?.index_rows ?? 0),
  };
}

export const loadAdminOverview = createServerFn({ method: "GET" }).handler(
  async () => {
    const [page, health, creditStats] = await Promise.all([
      searchAdminScores({ page: 1 }),
      loadCatalogHealth(),
      getComposerCreditStats(),
    ]);
    return { scores: page.items, stats: page.stats, health, creditStats };
  },
);

export const loadAdminScoresPage = createServerFn({ method: "GET" })
  .validator((filters: AdminScoreListFilters) => filters)
  .handler(async ({ data: filters }) => {
    const [page, composer] = await Promise.all([
      searchAdminScores(filters),
      filters.composer
        ? findComposerById(getDb(), filters.composer)
        : Promise.resolve(null),
    ]);
    return {
      scores: page.items,
      stats: page.stats,
      total: page.total,
      page: page.page,
      pageCount: page.pageCount,
      filters,
      composer,
    };
  });

export const loadAdminScoreEdit = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [score, composers] = await Promise.all([
      getAdminScoreById(id),
      listComposersWithCounts(),
    ]);
    if (!score) {
      throw notFound();
    }
    return { score, composers };
  });

export const loadAdminComposerOptions = createServerFn({
  method: "GET",
}).handler(async (): Promise<ComposerWithCount[]> => listComposersWithCounts());

export const loadAdminComposerCredit = createServerFn({ method: "GET" })
  .validator((search: AdminComposerCreditSearch) => search)
  .handler(async ({ data: search }) => {
    const [unassigned, composers, stats, events, imports, health] =
      await Promise.all([
        listUnassignedScores({
          q: search.q,
          import: search.import,
          visibility: search.visibility,
          page: search.page,
        }),
        listComposersWithCounts(undefined, { query: search.composerQ }),
        getComposerCreditStats(),
        listRecentCreditEvents(6),
        listUnassignedImports(),
        loadCatalogHealth(),
      ]);
    return {
      unassigned,
      composers,
      stats,
      events,
      imports,
      health,
      search,
    };
  });
