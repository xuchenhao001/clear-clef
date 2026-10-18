import Link from "next/link";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { ContentsList } from "@/components/catalog/contents-list";
import { MarbledPanel } from "@/components/catalog/marbled-panel";
import { buttonVariants } from "@/components/ui/button";
import { hasCatalogFilters, readCatalogFilters } from "@/lib/catalog/search-params";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/public-pages";
import { listPublicScores } from "@/lib/scores/queries";
import { cn } from "cn";

// Filtered views pass searchParams → dynamic render; ISR still bounds unfiltered catalog.
export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters = readCatalogFilters(params);
  const filtered = hasCatalogFilters(filters);
  const catalog = await listPublicScores(filters);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-6 py-10 md:py-16">
      <div className="flex flex-col gap-8">
        <CatalogHero />
        <CatalogFilters current={filters} />
      </div>

      {catalog.length === 0 ? (
        <MarbledPanel
          className={cn(
            "mx-auto w-full max-w-2xl rounded-lg border border-edition-hairline p-5 shadow-leaf sm:p-8",
            filtered ? "mt-8" : "mt-10",
          )}
        >
          <div className="surface-leaf shadow-leaf flex flex-col items-center gap-3 rounded-md px-6 py-10 text-center">
            <p className="type-imprint">ClearClef</p>
            <p className="type-page-h1 text-balance">
              {filtered ? "No scores match these filters" : "No public scores yet"}
            </p>
            <p className="type-body-sm max-w-[46ch] text-edition-body">
              {filtered
                ? "Try clearing filters or choosing different values."
                : "Upload a score from the admin area to seed the catalog."}
            </p>
            {filtered ? (
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-2 inline-flex",
                )}
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </MarbledPanel>
      ) : (
        <ContentsList scores={catalog} />
      )}
    </div>
  );
}
