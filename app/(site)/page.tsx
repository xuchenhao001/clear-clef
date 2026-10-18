import Link from "next/link";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { ContentsList } from "@/components/catalog/contents-list";
import { hasCatalogFilters, readCatalogFilters } from "@/lib/catalog/search-params";
import { listPublicScores } from "@/lib/scores/queries";

// Literal on purpose: Next only accepts a statically analyzable segment config.
// Keep in step with PUBLIC_PAGE_REVALIDATE_SECONDS.
export const revalidate = 60;

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
      <div className="grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <CatalogFilters current={filters} />

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
              <Link href="/" className="type-hint mt-2 hover:text-edition-gilt">
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
