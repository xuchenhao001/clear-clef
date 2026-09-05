import Link from "next/link";
import { listFilterOptions } from "@/lib/scores/queries";

type CatalogFiltersProps = {
  current?: {
    key?: string;
    difficulty?: string;
    license?: string;
    tag?: string;
  };
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

  const hasFilters = Boolean(
    current?.key || current?.difficulty || current?.license || current?.tag,
  );

  return (
    <form method="get" className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-5">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{field.label}</span>
          <select
            name={field.name}
            defaultValue={field.current ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2"
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
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Apply
        </button>
        {hasFilters ? (
          <Link
            href="/"
            className="inline-flex rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
