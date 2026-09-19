import type { ScoreVisibility } from "@/lib/ingest/admin-form";
import type { AdminCatalogScore } from "@/lib/scores/admin";

export type AdminScoreListFilters = {
  visibility?: ScoreVisibility | "";
  q?: string;
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
  const query = params.toString();
  return query ? `/admin/scores?${query}` : "/admin/scores";
}

export function filterAdminScores(
  scores: AdminCatalogScore[],
  filters: AdminScoreListFilters,
): AdminCatalogScore[] {
  const query = filters.q?.trim().toLowerCase();
  const visibility = filters.visibility;

  return scores.filter((score) => {
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

  const q = typeof params.q === "string" ? params.q : "";

  return { visibility, q };
}
