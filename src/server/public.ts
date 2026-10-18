import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { CatalogFilters } from "@/lib/scores/queries";
import {
  getPublicScoreBySlug,
  listFilterOptions,
  listPublicScores,
} from "@/lib/scores/queries";

export const loadCatalogPage = createServerFn({ method: "GET" })
  .validator((filters: CatalogFilters) => filters)
  .handler(async ({ data: filters }) => {
    const [catalog, filterOptions] = await Promise.all([
      listPublicScores(filters),
      listFilterOptions(),
    ]);
    return { catalog, filterOptions };
  });

export const loadPublicScore = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const score = await getPublicScoreBySlug(slug);
    if (!score) {
      throw notFound();
    }
    return score;
  });
