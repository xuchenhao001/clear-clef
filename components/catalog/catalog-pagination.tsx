import { Link } from "@tanstack/react-router";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { cn } from "cn";

type CatalogPaginationProps = {
  search: CatalogSearch;
  page: number;
  pageCount: number;
};

function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (page >= pageCount - 2) {
    pages.add(pageCount - 1);
    pages.add(pageCount - 2);
  }
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((left, right) => left - right);

  const result: (number | "gap")[] = [];
  for (const value of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && value - previous > 1) {
      result.push("gap");
    }
    result.push(value);
  }
  return result;
}

export function CatalogPagination({
  search,
  page,
  pageCount,
}: CatalogPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Catalogue pages"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-edition-hairline pt-5"
    >
      {page > 1 ? (
        <Link
          to="/"
          search={{ ...search, page: page - 1 > 1 ? page - 1 : undefined }}
          rel="prev"
          className="type-hint inline-flex min-h-11 items-center text-edition-gilt hover:text-edition-ink"
        >
          Previous
        </Link>
      ) : (
        <span className="type-hint inline-flex min-h-11 items-center text-edition-muted-soft">
          Previous
        </span>
      )}

      <ol className="flex flex-wrap items-center gap-1">
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="type-shelf px-2 text-edition-muted-soft"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/"
                search={{ ...search, page: item > 1 ? item : undefined }}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "type-hint inline-flex min-h-11 min-w-11 items-center justify-center border px-2",
                  item === page
                    ? "border-edition-gilt text-edition-gilt"
                    : "border-transparent text-edition-muted hover:border-edition-hairline-strong hover:text-edition-ink",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < pageCount ? (
        <Link
          to="/"
          search={{ ...search, page: page + 1 }}
          rel="next"
          className="type-hint inline-flex min-h-11 items-center text-edition-gilt hover:text-edition-ink"
        >
          Next
        </Link>
      ) : (
        <span className="type-hint inline-flex min-h-11 items-center text-edition-muted-soft">
          Next
        </span>
      )}
    </nav>
  );
}
