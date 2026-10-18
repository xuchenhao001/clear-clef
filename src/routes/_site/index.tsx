import { Link, createFileRoute } from "@tanstack/react-router";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { ContentsList } from "@/components/catalog/contents-list";
import {
  hasCatalogFilters,
  readCatalogFilters,
} from "@/lib/catalog/search-params";
import {
  publicPageCacheControl,
} from "@/lib/cache/public-pages";
import { loadCatalogPage } from "@/src/server/public";

export const Route = createFileRoute("/_site/")({
  validateSearch: (search) =>
    readCatalogFilters(
      search as Record<string, string | string[] | undefined>,
    ),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadCatalogPage({ data: deps }),
  headers: () => ({
    "Cache-Control": publicPageCacheControl,
  }),
  component: HomePage,
});

function HomePage() {
  const filters = Route.useSearch();
  const { catalog, filterOptions } = Route.useLoaderData();
  const filtered = hasCatalogFilters(filters);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-6 py-10 md:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <CatalogFilters current={filters} options={filterOptions} />

        <div>
          <CatalogHero />
          {catalog.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <p className="type-page-h1 text-balance">
                {filtered ? "No scores match" : "No public scores yet"}
              </p>
              <p className="type-body-sm max-w-[46ch] text-edition-body">
                {filtered
                  ? "Choose another entry in the index, or return to every work."
                  : "Upload a score from the register to seed the catalog."}
              </p>
              {filtered ? (
                <Link to="/" className="type-hint mt-2 hover:text-edition-gilt">
                  All works
                </Link>
              ) : null}
            </div>
          ) : (
            <ContentsList scores={catalog} />
          )}
        </div>
      </div>
    </div>
  );
}
