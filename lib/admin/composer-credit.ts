import type { ScoreVisibility } from "@/lib/ingest/admin-form";

export type AdminComposerView = "unassigned" | "authority" | "maintenance";

export type AdminComposerCreditSearch = {
  view?: AdminComposerView;
  q?: string;
  import?: string;
  visibility?: ScoreVisibility | "";
  page?: number;
  composerQ?: string;
};

export function parseAdminComposerCreditSearch(
  params: Record<string, string | string[] | undefined>,
): AdminComposerCreditSearch {
  const viewRaw = typeof params.view === "string" ? params.view : "";
  const view: AdminComposerView =
    viewRaw === "authority" || viewRaw === "maintenance"
      ? viewRaw
      : "unassigned";

  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const importRaw = typeof params.import === "string" ? params.import.trim() : "";
  const importId =
    /^[a-zA-Z0-9-]{8,64}$/.test(importRaw) ? importRaw : undefined;
  const visibilityRaw =
    typeof params.visibility === "string" ? params.visibility : "";
  const visibility: ScoreVisibility | "" =
    visibilityRaw === "public" ||
    visibilityRaw === "unlisted" ||
    visibilityRaw === "private"
      ? visibilityRaw
      : "";
  const rawPage =
    typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page =
    Number.isFinite(rawPage) && rawPage > 1
      ? Math.min(Math.floor(rawPage), 9999)
      : undefined;
  const composerQ =
    typeof params.composerQ === "string"
      ? params.composerQ.trim().slice(0, 100)
      : "";

  const search: AdminComposerCreditSearch = { view };
  if (q) search.q = q;
  if (importId) search.import = importId;
  if (visibility) search.visibility = visibility;
  if (page) search.page = page;
  if (composerQ) search.composerQ = composerQ;
  return search;
}

export function formatAdminComposerCreditSearch(
  search: AdminComposerCreditSearch,
): string {
  const params = new URLSearchParams();
  if (search.view && search.view !== "unassigned") {
    params.set("view", search.view);
  }
  if (search.q?.trim()) params.set("q", search.q.trim());
  if (search.import?.trim()) params.set("import", search.import.trim());
  if (search.visibility) params.set("visibility", search.visibility);
  if (search.composerQ?.trim()) params.set("composerQ", search.composerQ.trim());
  if (search.page && search.page > 1) params.set("page", String(search.page));
  const query = params.toString();
  return query ? `/admin/composers?${query}` : "/admin/composers";
}
