import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  getPublicScoreBySlug,
  resolveSlugAlias,
  searchPublicCatalog,
  type CatalogFilters,
} from "@/lib/scores/queries";

export const loadCatalogPage = createServerFn({ method: "GET" })
  .validator((filters: CatalogFilters) => filters)
  .handler(async ({ data: filters }) => {
    return searchPublicCatalog(filters);
  });

export const loadPublicScore = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const score = await getPublicScoreBySlug(slug);
    if (!score) {
      const alias = await resolveSlugAlias(slug);
      if (alias) {
        throw redirect({
          to: "/scores/$slug",
          params: { slug: alias },
          statusCode: 301,
        });
      }
      throw notFound();
    }
    return score;
  });
