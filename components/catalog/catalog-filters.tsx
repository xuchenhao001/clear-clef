import { hasCatalogFilters } from "@/lib/catalog/search-params";
import { listFilterOptions, type CatalogFilters } from "@/lib/scores/queries";
import { CatalogFiltersBar } from "@/components/catalog/catalog-filters-bar";

type CatalogFiltersProps = {
  current?: CatalogFilters;
};

export async function CatalogFilters({ current }: CatalogFiltersProps) {
  const options = await listFilterOptions();

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
