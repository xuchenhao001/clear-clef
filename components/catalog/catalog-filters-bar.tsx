import { Link } from "@tanstack/react-router";
import { buildCatalogFilterSearch } from "@/lib/catalog/filter-url";
import type { CatalogFilterField } from "@/lib/catalog/types";
import { cn } from "cn";

type CatalogFiltersBarProps = {
  fields: CatalogFilterField[];
  hasFilters: boolean;
};

/**
 * The pause-menu column: each filter is a list of entries on the ground, and
 * the current entry is gilt. Nothing here is a dropdown.
 */
export function CatalogFiltersBar({ fields, hasFilters }: CatalogFiltersBarProps) {
  const visible = fields.filter((field) => field.values.length > 0);

  return (
    <nav aria-label="Catalogue index" className="lg:sticky lg:top-20">
      <p className="type-running-head">Index</p>
      <ul className="mt-3 border-t border-edition-hairline">
        <li className="border-b border-edition-hairline-soft">
          <Link
            to="/"
            className={cn(
              "type-nav-link inline-flex py-2.5 edition-interactive-transition hover:text-edition-ink",
              !hasFilters && "nav-current",
            )}
            aria-current={!hasFilters ? "page" : undefined}
          >
            All works
          </Link>
        </li>
      </ul>

      {visible.map((field) => (
        <div key={field.name} className="mt-7">
          <p className="type-running-head">{field.label}</p>
          <ul className="mt-2 border-t border-edition-hairline">
            {field.values.map((value) => {
              const label =
                field.labels?.find((tag) => tag.slug === value)?.label ?? value;
              const active = field.current === value;
              return (
                <li
                  key={value}
                  className="border-b border-edition-hairline-soft"
                >
                  <Link
                    to="/"
                    search={buildCatalogFilterSearch(fields, {
                      [field.name]: active ? "" : value,
                    })}
                    className={cn(
                      "type-nav-link inline-flex py-2.5 normal-case tracking-[0.04em] edition-interactive-transition hover:text-edition-ink",
                      active && "nav-current",
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
