import { CatalogFiltersBar } from "@/components/catalog/catalog-filters-bar";
import { hasCatalogFilters } from "@/lib/catalog/search-params";
import type { CatalogFilters } from "@/lib/scores/queries";
import type { listFilterOptions } from "@/lib/scores/queries";

export type CatalogFilterOptions = Awaited<
  ReturnType<typeof listFilterOptions>
>;

type CatalogFiltersProps = {
  current?: CatalogFilters;
  options: CatalogFilterOptions;
};

export function CatalogFilters({ current, options }: CatalogFiltersProps) {
  const fields = [
    {
      name: "key",
      label: "Key",
      values: options.keys,
      current: current?.key,
    },
    {
      name: "difficulty",
      label: "Difficulty",
      values: options.difficulties,
      current: current?.difficulty,
    },
    {
      name: "license",
      label: "License",
      values: options.licenses,
      current: current?.license,
    },
    {
      name: "tag",
      label: "Tag",
      values: options.tags.map((tag) => tag.slug),
      current: current?.tag,
      labels: options.tags,
    },
  ];

  return (
    <CatalogFiltersBar
      fields={fields}
      hasFilters={hasCatalogFilters(current ?? {})}
    />
  );
}
