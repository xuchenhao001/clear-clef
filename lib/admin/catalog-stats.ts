import type { AdminCatalogScore } from "@/lib/scores/admin";

export type AdminCatalogStats = {
  total: number;
  public: number;
  unlisted: number;
  private: number;
};

export function getAdminCatalogStats(scores: AdminCatalogScore[]): AdminCatalogStats {
  let publicCount = 0;
  let unlistedCount = 0;
  let privateCount = 0;

  for (const score of scores) {
    if (score.visibility === "public") {
      publicCount += 1;
    } else if (score.visibility === "unlisted") {
      unlistedCount += 1;
    } else if (score.visibility === "private") {
      privateCount += 1;
    }
  }

  return {
    total: scores.length,
    public: publicCount,
    unlisted: unlistedCount,
    private: privateCount,
  };
}
