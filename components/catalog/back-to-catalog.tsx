import { Link } from "@tanstack/react-router";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { cn } from "cn";

type BackToCatalogProps = {
  className?: string;
  search?: CatalogSearch;
};

export function BackToCatalog({ className, search }: BackToCatalogProps) {
  return (
    <Link
      to="/"
      search={search ?? {}}
      className={cn(
        "type-hint edition-interactive-transition hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
        className,
      )}
    >
      {search && Object.keys(search).length > 0 ? "Back to results" : "Back"}
    </Link>
  );
}
