import type { ScoreVisibility } from "@/lib/ingest/admin-form";
import type { AdminCatalogScore } from "@/lib/scores/admin";

export type AdminScoreListFilters = {
  visibility?: ScoreVisibility | "";
  q?: string;
  import?: string;
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
  const query = params.toString();
  return query ? `/admin/scores?${query}` : "/admin/scores";
}

export function filterAdminScores(
  scores: AdminCatalogScore[],
  filters: AdminScoreListFilters,
): AdminCatalogScore[] {
  const query = filters.q?.trim().toLowerCase();
  const visibility = filters.visibility;
  const importId = filters.import?.trim();

  return scores.filter((score) => {
    if (importId && score.importId !== importId) {
      return false;
    }
    if (visibility && score.visibility !== visibility) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = [score.title, score.composer ?? "", score.slug]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function parseAdminScoreListFilters(
  params: Record<string, string | string[] | undefined>,
): AdminScoreListFilters {
  const visibilityRaw = typeof params.visibility === "string" ? params.visibility : "";
  const visibility = normalizeAdminVisibilityFilter(visibilityRaw);

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const importRaw = typeof params.import === "string" ? params.import.trim() : "";
  const importId =
    /^[a-zA-Z0-9-]{8,64}$/.test(importRaw) ? importRaw : undefined;

  const filters: AdminScoreListFilters = {};
  if (visibility) filters.visibility = visibility;
  if (q) filters.q = q;
  if (importId) filters.import = importId;
  return filters;
}
