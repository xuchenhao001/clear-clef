import { describe, expect, it } from "vitest";
import { getAdminCatalogStats } from "@/lib/admin/catalog-stats";
import {
  filterAdminScores,
  formatAdminScoresSearchPath,
  parseAdminScoreListFilters,
} from "@/lib/admin/filters";
import type { AdminCatalogScore } from "@/lib/scores/admin";

const sample: AdminCatalogScore[] = [
  {
    id: "1",
    slug: "bach-prelude",
    title: "Prelude in C",
    composer: "Bach",
    catalogNumber: null,
    license: "Public Domain",
    visibility: "public",
    previewR2Key: null,
    importId: null,
    createdAt: new Date(),
    tags: [],
  },
  {
    id: "2",
    slug: "private-etude",
    title: "Hidden Etude",
    composer: "Chopin",
    catalogNumber: null,
    license: "CC0",
    visibility: "private",
    previewR2Key: null,
    importId: "import-123",
    createdAt: new Date(),
    tags: [],
  },
];

describe("filterAdminScores", () => {
  it("filters by visibility and search query", () => {
    expect(filterAdminScores(sample, { visibility: "public" })).toHaveLength(1);
    expect(filterAdminScores(sample, { q: "chopin" })).toHaveLength(1);
    expect(filterAdminScores(sample, { q: "prelude", visibility: "public" })).toHaveLength(1);
  });

  it("filters by batch import", () => {
    expect(filterAdminScores(sample, { import: "import-123" })).toHaveLength(1);
    expect(filterAdminScores(sample, { import: "other-import" })).toHaveLength(0);
  });
});

describe("parseAdminScoreListFilters", () => {
  it("normalizes visibility and q from search params", () => {
    expect(parseAdminScoreListFilters({})).toEqual({});
    expect(
      parseAdminScoreListFilters({ visibility: "public", q: "bach" }),
    ).toEqual({ visibility: "public", q: "bach" });
    expect(parseAdminScoreListFilters({ visibility: "invalid" })).toEqual({});
    expect(
      parseAdminScoreListFilters({
        visibility: "private",
        import: "6a5d4e3c-1234-4abc-9def-1234567890ab",
      }),
    ).toEqual({
      visibility: "private",
      import: "6a5d4e3c-1234-4abc-9def-1234567890ab",
    });
  });
});

describe("formatAdminScoresSearchPath", () => {
  it("builds stable admin scores URLs", () => {
    expect(formatAdminScoresSearchPath({})).toBe("/admin/scores");
    expect(formatAdminScoresSearchPath({ q: "  bach  " })).toBe(
      "/admin/scores?q=bach",
    );
    expect(
      formatAdminScoresSearchPath({ visibility: "private", q: "etude" }),
    ).toBe("/admin/scores?visibility=private&q=etude");
    expect(
      formatAdminScoresSearchPath({
        visibility: "private",
        q: "etude",
        import: "6a5d4e3c-1234-4abc-9def-1234567890ab",
      }),
    ).toBe(
      "/admin/scores?visibility=private&q=etude&import=6a5d4e3c-1234-4abc-9def-1234567890ab",
    );
  });
});

describe("getAdminCatalogStats", () => {
  it("counts visibility buckets", () => {
    expect(getAdminCatalogStats(sample)).toEqual({
      total: 2,
      public: 1,
      unlisted: 0,
      private: 1,
    });
  });
});
