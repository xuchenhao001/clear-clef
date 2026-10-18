"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { EditionSelect } from "@/components/ui/edition-select";
import { buildCatalogFilterQuery } from "@/lib/catalog/filter-url";
import type { CatalogFilterField } from "@/lib/catalog/types";
import { cn } from "cn";

type CatalogFiltersBarProps = {
  fields: CatalogFilterField[];
  hasFilters: boolean;
};

function catalogFilterItems(field: CatalogFilterField) {
  return [
    { label: "Any", value: "" },
    ...field.values.map((value) => ({
      label:
        field.labels?.find((tag) => tag.slug === value)?.label ?? value,
      value,
    })),
  ];
}

export function CatalogFiltersBar({ fields, hasFilters }: CatalogFiltersBarProps) {
  const router = useRouter();

  function applyFilter(name: string, value: string) {
    const query = buildCatalogFilterQuery(fields, { [name]: value });
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <form
      className="archive-filter-strip surface-leaf shadow-leaf flex flex-wrap items-end gap-x-6 gap-y-4"
      onSubmit={(event) => event.preventDefault()}
    >
      {fields.map((field) => (
        <div
          key={field.name}
          className="min-w-[7rem] flex-1 text-sm sm:max-w-[10rem]"
        >
          <EditionSelect
            name={field.name}
            label={field.label}
            value={field.current ?? ""}
            items={catalogFilterItems(field)}
            placeholder="Any"
            onValueChange={(value) => {
              applyFilter(field.name, value);
            }}
          />
        </div>
      ))}
      {hasFilters ? (
        <div className="flex items-center pb-0.5">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Clear
          </Link>
        </div>
      ) : null}
    </form>
  );
}
