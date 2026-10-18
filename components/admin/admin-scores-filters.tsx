"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EditionSelect } from "@/components/ui/edition-select";
import {
  formatAdminScoresSearchPath,
  normalizeAdminVisibilityFilter,
  type AdminScoreListFilters,
} from "@/lib/admin/filters";
import { cn } from "cn";

type AdminScoresFiltersProps = {
  current: AdminScoreListFilters;
};

/**
 * Search and visibility for the register. A live value keeps the rubric rule.
 * Auto-submits on change.
 */
export function AdminScoresFilters({ current }: AdminScoresFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(current.q ?? "");
  const [visibility, setVisibility] = useState<string>(current.visibility ?? "");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextPath = formatAdminScoresSearchPath({
        visibility: normalizeAdminVisibilityFilter(visibility),
        q,
      });
      const existingPath = formatAdminScoresSearchPath({
        visibility: normalizeAdminVisibilityFilter(
          searchParams.get("visibility") ?? "",
        ),
        q: searchParams.get("q") ?? "",
      });
      if (nextPath !== existingPath) {
        router.push(nextPath);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [q, visibility, router, searchParams]);

  const hasFilters = Boolean(visibility || q.trim());
  const searchLive = q.trim().length > 0;

  return (
    <form
      className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-edition-hairline pb-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex min-w-[7rem] flex-1 flex-col gap-1 sm:max-w-[20rem]">
        <label htmlFor="admin-score-search" className="type-label">
          Search
        </label>
        <div
          className={cn(
            "relative border-b border-edition-field-border",
            searchLive && "seal-live border-b-edition-rubric",
          )}
        >
          <input
            id="admin-score-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Title or composer"
            className="min-h-11 w-full border-0 bg-transparent px-0 py-2 text-[0.9375rem] text-edition-ink edition-interactive-transition outline-none placeholder:text-edition-placeholder focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
          />
        </div>
      </div>
      <div className="flex items-end gap-4">
        <EditionSelect
          name="visibility"
          label="Visibility"
          value={visibility}
          triggerVariant="hairline"
          labelVariant="filter"
          placeholder="All"
          items={[
            { label: "All", value: "" },
            { label: "Public", value: "public" },
            { label: "Unlisted", value: "unlisted" },
            { label: "Private", value: "private" },
          ]}
          onValueChange={setVisibility}
        />
      </div>
      {hasFilters ? (
        <div className="flex items-center pb-0.5">
          <button
            type="button"
            className="type-hint hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
            onClick={() => {
              setQ("");
              setVisibility("");
              router.push("/admin/scores");
            }}
          >
            Clear
          </button>
        </div>
      ) : null}
    </form>
  );
}
