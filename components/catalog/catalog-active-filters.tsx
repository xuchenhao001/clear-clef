import { Link } from "@tanstack/react-router";
import type { PublicCatalogFacet, PublicCatalogScore } from "@/lib/scores/queries";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import {
  DIFFICULTY_BY_SLUG,
  KEY_BY_SLUG,
  LICENSE_BY_SLUG,
} from "@/lib/catalog/vocab";

type FacetKey = "composer" | "key" | "difficulty" | "license" | "tag";

type ActiveFiltersProps = {
  search: CatalogSearch;
  facets: PublicCatalogFacet[];
  items: PublicCatalogScore[];
};

function removeValue(search: CatalogSearch, name: FacetKey, value: string): CatalogSearch {
  const current = search[name] ?? [];
  return {
    ...search,
    [name]: current.filter((item) => item !== value),
    page: undefined,
  };
}

function fallbackLabel(name: FacetKey, slug: string): string {
  if (name === "key") return KEY_BY_SLUG.get(slug)?.label ?? slug;
  if (name === "difficulty") return DIFFICULTY_BY_SLUG.get(slug)?.label ?? slug;
  if (name === "license") return LICENSE_BY_SLUG.get(slug)?.label ?? slug;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CatalogActiveFilters({ search, facets, items }: ActiveFiltersProps) {
  const chips: { key: string; label: string; next: CatalogSearch }[] = [];

  for (const facet of facets) {
    for (const slug of search[facet.name] ?? []) {
      const value = facet.values.find((item) => item.slug === slug);
      chips.push({
        key: `${facet.name}-${slug}`,
        label: `${facet.label}: ${value?.label ?? fallbackLabel(facet.name, slug)}`,
        next: removeValue(search, facet.name, slug),
      });
    }
  }

  for (const slug of search.composer ?? []) {
    const item = items.find((score) => score.composerSlug === slug);
    chips.push({
      key: `composer-${slug}`,
      label: `Composer: ${item?.composer ?? slug}`,
      next: removeValue(search, "composer", slug),
    });
  }

  if (search.q) {
    chips.push({
      key: "q",
      label: `Search: ${search.q}`,
      next: { ...search, q: undefined, page: undefined },
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          to="/"
          search={chip.next}
          className="type-hint seal-live inline-flex min-h-9 items-center border border-edition-hairline-strong px-3 pr-5 text-edition-ink hover:border-edition-gilt hover:text-edition-gilt coarse:min-h-11"
          aria-label={`Remove ${chip.label}`}
        >
          {chip.label}
        </Link>
      ))}
      <Link
        to="/"
        search={{}}
        className="type-hint text-edition-gilt underline-offset-4 hover:text-edition-ink hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
