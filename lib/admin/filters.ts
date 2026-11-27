import type { ScoreVisibility } from "@/lib/ingest/admin-form";

export type AdminScoreListFilters = {
  visibility?: ScoreVisibility | "";
  q?: string;
  import?: string;
  page?: number;
};

export function normalizeAdminVisibilityFilter(
  value: string,
): ScoreVisibility | "" {
  if (value === "public" || value === "unlisted" || value === "private") {
    return value;
  }
  return "";
}

/** Path + query for `/admin/scores` (e.g. `/admin/scores?q=bach`). */
export function formatAdminScoresSearchPath(filters: AdminScoreListFilters): string {
  const params = new URLSearchParams();
  const visibility = normalizeAdminVisibilityFilter(filters.visibility ?? "");
  if (visibility) {
    params.set("visibility", visibility);
  }
  const q = filters.q?.trim();
  if (q) {
    params.set("q", q);
  }
  const importId = filters.import?.trim();
  if (importId) {
    params.set("import", importId);
  }
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  const query = params.toString();
  return query ? `/admin/scores?${query}` : "/admin/scores";
}

export function parseAdminScoreListFilters(
  params: Record<string, string | string[] | undefined>,
): AdminScoreListFilters {
  const visibilityRaw = typeof params.visibility === "string" ? params.visibility : "";
  const visibility = normalizeAdminVisibilityFilter(visibilityRaw);

  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const importRaw = typeof params.import === "string" ? params.import.trim() : "";
  const importId =
    /^[a-zA-Z0-9-]{8,64}$/.test(importRaw) ? importRaw : undefined;
  const rawPage =
    typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page =
    Number.isFinite(rawPage) && rawPage > 1
      ? Math.min(Math.floor(rawPage), 9999)
      : undefined;

  const filters: AdminScoreListFilters = {};
  if (visibility) filters.visibility = visibility;
  if (q) filters.q = q;
  if (importId) filters.import = importId;
  if (page) filters.page = page;
  return filters;
}
