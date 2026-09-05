"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export type CatalogFilterField = {
  name: string;
  label: string;
  values: string[];
  current?: string;
  labels?: { slug: string; label: string }[];
};

type CatalogFiltersBarProps = {
  fields: CatalogFilterField[];
  hasFilters: boolean;
};

const selectClassName =
  "w-full border-0 border-b border-edition-hairline bg-transparent px-0 py-2 text-sm text-edition-ink outline-none focus-visible:border-edition-hairline-strong focus-visible:ring-0";

export function CatalogFiltersBar({ fields, hasFilters }: CatalogFiltersBarProps) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-edition-hairline pb-6"
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) {
          event.currentTarget.requestSubmit();
        }
      }}
    >
      {fields.map((field) => (
        <label
          key={field.name}
          className="flex min-w-[7rem] flex-1 flex-col gap-1 text-sm sm:max-w-[10rem]"
        >
          <span className="type-caption-mono uppercase tracking-wide text-edition-muted">
            {field.label}
          </span>
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
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
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
