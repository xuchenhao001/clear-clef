"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFormInputClassName, adminFormLabelClassName } from "@/components/admin/admin-form-styles";
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid w-full gap-4 sm:max-w-md">
        <div className="space-y-2">
          <label htmlFor="admin-score-search" className={adminFormLabelClassName}>
            Search
          </label>
          <input
            id="admin-score-search"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Title or composer"
            className={adminFormInputClassName}
          />
        </div>
      </div>
      <div className="flex w-full flex-wrap items-end gap-4 sm:w-auto">
        <EditionSelect
          name="visibility"
          label="Visibility"
          value={visibility}
          triggerVariant="boxed"
          labelVariant="form"
          placeholder="All"
          items={[
            { label: "All", value: "" },
            { label: "Public", value: "public" },
            { label: "Unlisted", value: "unlisted" },
            { label: "Private", value: "private" },
          ]}
          onValueChange={setVisibility}
        />
        {hasFilters ? (
          <button
            type="button"
            className={cn(
              "type-nav-link pb-2 hover:text-edition-ink",
              "edition-interactive-transition",
            )}
            onClick={() => {
              setQ("");
              setVisibility("");
              router.push("/admin/scores");
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
