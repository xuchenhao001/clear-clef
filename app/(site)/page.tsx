import Link from "next/link";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { ContentsList } from "@/components/catalog/contents-list";
import { buttonVariants } from "@/components/ui/button";
import { hasCatalogFilters, readCatalogFilters } from "@/lib/catalog/search-params";
import { listPublicScores } from "@/lib/scores/queries";
import { cn } from "cn";

export const dynamic = "force-dynamic";

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
        <div className={`space-y-3 text-center ${filtered ? "py-10" : "py-16"}`}>
          <p className="type-page-h1">
            {filtered ? "No scores match these filters" : "No public scores yet"}
          </p>
          <p className="type-body-sm text-edition-muted">
            {filtered
              ? "Try clearing filters or choosing different values."
              : "Upload a score from the admin area to seed the catalog."}
          </p>
          {filtered ? (
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 inline-flex",
              )}
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      ) : (
        <ContentsList scores={catalog} />
      )}
    </div>
  );
}
