import { createFileRoute, redirect } from "@tanstack/react-router";
import { CatalogActiveFilters } from "@/components/catalog/catalog-active-filters";
import { CatalogFacetNav } from "@/components/catalog/catalog-facets";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { ContentsList } from "@/components/catalog/contents-list";
import { publicPageCacheControl } from "@/lib/cache/public-pages";
import {
  catalogFilterValues,
  isDefaultBrowse,
  readCatalogSearch,
  type CatalogSearch,
} from "@/lib/catalog/url-state";
import { catalogHead } from "@/lib/seo/site";
import { loadCatalogPage } from "@/src/server/public";

export const Route = createFileRoute("/_site/")({
  validateSearch: (search) =>
    readCatalogSearch(search as Record<string, unknown>),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const page = await loadCatalogPage({ data: catalogFilterValues(deps) });
    if (deps.page && deps.page !== page.page) {
      throw redirect({
        to: "/",
        search: {
          ...deps,
          page: page.page > 1 ? page.page : undefined,
        },
        statusCode: 302,
      });
    }
    return { ...page, search: deps };
  },
  headers: ({ loaderData }) => ({
    "Cache-Control":
      loaderData && isDefaultBrowse(loaderData.search)
        ? publicPageCacheControl
        : "public, max-age=0, must-revalidate",
  }),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }
    return catalogHead({
      search: loaderData.search,
      totalPublic: loaderData.totalPublic,
      page: loaderData.page,
      pageCount: loaderData.pageCount,
    });
  },
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch() as CatalogSearch;
  const filtered = Boolean(
    data.q || search.key || search.difficulty || search.license || search.tag || search.composer,
  );

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-6 py-10 md:py-16">
      <CatalogHero search={search} totalPublic={data.totalPublic} />

      <div className="grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <CatalogFacetNav facets={data.facets} search={search} />
        </aside>

        <div className="min-w-0">
          <CatalogToolbar
            search={search}
            facets={data.facets}
            total={data.total}
            page={data.page}
            pageSize={data.pageSize}
            sort={data.sort}
          />

          <div className="mt-5">
            <CatalogActiveFilters
              search={search}
              facets={data.facets}
              items={data.items}
            />
          </div>

          {data.items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-10" role="status">
              <p className="type-page-h1 text-balance">
                {filtered ? "No works match" : "No public works yet"}
              </p>
              <p className="type-body-sm max-w-[46ch] text-edition-body">
                {filtered
                  ? "Try a different composer, key or catalogue number, or clear the filters."
                  : "Upload a score from the register to seed the catalogue."}
              </p>
              {filtered ? (
                <a
                  href="/"
                  className="type-hint mt-2 text-edition-gilt hover:text-edition-ink"
                >
                  Browse all works
                </a>
              ) : null}
            </div>
          ) : (
            <ContentsList
              scores={data.items}
              search={search}
              grouped={data.sort === "composer"}
            />
          )}

          <CatalogPagination
            search={search}
            page={data.page}
            pageCount={data.pageCount}
          />
        </div>
      </div>
    </div>
  );
}
