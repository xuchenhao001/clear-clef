
import { useNavigate, useRouterState } from "@tanstack/react-router";
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

export function AdminScoresFilters({ current }: AdminScoresFiltersProps) {
  const navigate = useNavigate();
  const searchStr = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const [q, setQ] = useState(current.q ?? "");
  const [visibility, setVisibility] = useState<string>(current.visibility ?? "");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextPath = formatAdminScoresSearchPath({
        visibility: normalizeAdminVisibilityFilter(visibility),
        q,
        import: current.import,
      });
      const existingPath = formatAdminScoresSearchPath({
        visibility: normalizeAdminVisibilityFilter(
          new URLSearchParams(searchStr).get("visibility") ?? "",
        ),
        q: new URLSearchParams(searchStr).get("q") ?? "",
        import: new URLSearchParams(searchStr).get("import") ?? "",
      });
      if (nextPath !== existingPath) {
        navigate({ href: nextPath });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [q, visibility, navigate, searchStr, current.import]);

  const hasFilters = Boolean(visibility || q.trim());
  const searchLive = q.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-4 border-b border-edition-hairline pb-6 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="admin-scores-q" className="type-label">
          Search
        </label>
        <input
          id="admin-scores-q"
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Title, composer, catalogue…"
          className={cn(
            "mt-1.5 w-full border-b border-edition-hairline bg-transparent py-2 type-body-sm text-edition-ink outline-none",
            "placeholder:text-edition-muted focus-visible:border-edition-gilt",
          )}
          aria-live={searchLive ? "polite" : undefined}
        />
      </div>
      <div className="w-full sm:w-auto sm:min-w-[10rem]">
        <EditionSelect
          label="Visibility"
          value={visibility}
          placeholder="All"
          items={[
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
              navigate({
                href: formatAdminScoresSearchPath({
                  import: current.import,
                }),
              });
            }}
          >
            Clear
          </button>
        </div>
      ) : null}
    </form>
  );
}
