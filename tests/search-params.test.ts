import { describe, expect, it } from "vitest";
import { hasCatalogFilters, readCatalogFilters } from "@/lib/catalog/search-params";

describe("catalog search params", () => {
  it("reads string filter params and ignores arrays", () => {
    expect(
      readCatalogFilters({
        key: "C major",
        difficulty: "intermediate",
        license: "CC0",
        tag: "prelude",
      }),
    ).toEqual({
      key: "C major",
      difficulty: "intermediate",
      license: "CC0",
      tag: "prelude",
    });

    expect(readCatalogFilters({ key: ["C major", "D minor"] })).toEqual({
      key: undefined,
    });
  });

  it("detects active filters", () => {
    expect(hasCatalogFilters({})).toBe(false);
    expect(hasCatalogFilters({ tag: "prelude" })).toBe(true);
  });
});
