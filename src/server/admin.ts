import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getAdminCatalogStats } from "@/lib/admin/catalog-stats";
import {
  filterAdminScores,
  type AdminScoreListFilters,
} from "@/lib/admin/filters";
import {
  getAdminScoreById,
  listAdminScores,
} from "@/lib/scores/admin";

export const loadAdminOverview = createServerFn({ method: "GET" }).handler(
  async () => {
    const scores = await listAdminScores();
    return { scores, stats: getAdminCatalogStats(scores) };
  },
);

export const loadAdminScoresPage = createServerFn({ method: "GET" })
  .validator((filters: AdminScoreListFilters) => filters)
  .handler(async ({ data: filters }) => {
    const allScores = await listAdminScores();
    return {
      allScores,
      scores: filterAdminScores(allScores, filters),
      filters,
    };
  });

export const loadAdminScoreEdit = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const score = await getAdminScoreById(id);
    if (!score) {
      throw notFound();
    }
    return score;
  });
