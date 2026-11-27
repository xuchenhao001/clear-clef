import { Link } from "@tanstack/react-router";
import { CatalogFilterSheet } from "@/components/catalog/catalog-facets";
import type { PublicCatalogFacet } from "@/lib/scores/queries";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { cn } from "cn";

type CatalogToolbarProps = {
  search: CatalogSearch;
  facets: PublicCatalogFacet[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
};

const SORTS = [
  { value: "composer", label: "Composer" },
  { value: "title", label: "Title" },
  { value: "newest", label: "Newest" },
] as const;

export function CatalogToolbar({
  search,
  facets,
  total,
  page,
  pageSize,
  sort,
}: CatalogToolbarProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const sortItems = search.q
    ? [{ value: "relevance", label: "Relevance" }, ...SORTS]
    : SORTS;

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-edition-hairline pb-3">
      <div className="flex items-baseline gap-4">
        <p className="type-extent" aria-live="polite">
          {total === 0 ? "No works" : `${from}–${to} of ${total}`}
        </p>
        <CatalogFilterSheet facets={facets} search={search} />
      </div>
      <nav aria-label="Sort works" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="type-running-head">Sort</span>
        {sortItems.map((item) => {
          const active = sort === item.value;
          const defaultSort = search.q ? "relevance" : "composer";
          return (
            <Link
              key={item.value}
              to="/"
              search={{
                ...search,
                sort:
                  item.value === defaultSort
                    ? undefined
                    : (item.value as CatalogSearch["sort"]),
                page: undefined,
              }}
              aria-current={active ? "true" : undefined}
              className={cn(
                "type-hint inline-flex min-h-9 items-center coarse:min-h-11",
                active
                  ? "text-edition-gilt"
                  : "text-edition-muted hover:text-edition-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
