import Link from "next/link";
import { hasCatalogFilters } from "@/lib/catalog/search-params";
import { listFilterOptions, type CatalogFilters } from "@/lib/scores/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type CatalogFiltersProps = {
  current?: CatalogFilters;
};

const selectClassName =
  "w-full rounded-md border border-edition-hairline-strong bg-edition-surface-card px-3 py-2 text-sm text-edition-ink outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50";

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

  const hasFilters = hasCatalogFilters(current ?? {});

  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-x-4 gap-y-4"
    >
      {fields.map((field) => (
        <label
          key={field.name}
          className="flex min-w-[8rem] flex-1 flex-col gap-2 text-sm"
        >
          <span className="font-medium text-edition-ink">{field.label}</span>
          <select
            name={field.name}
            defaultValue={field.current ?? ""}
            className={selectClassName}
          >
            <option value="">Any</option>
            {field.values.map((value) => {
              const label =
                field.labels?.find((tag) => tag.slug === value)?.label ?? value;
              return (
                <option key={value} value={value ?? ""}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      ))}
      <div className="flex items-center gap-2">
        <button type="submit" className={cn(buttonVariants())}>
          Apply
        </button>
        {hasFilters ? (
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
