import { describe, expect, it } from "vitest";
import {
  buildCatalogSearch,
  catalogSearchToQuery,
  hasCatalogRefinements,
  isDefaultBrowse,
  readCatalogSearch,
  setFacetValue,
  toggleFacetValue,
} from "@/lib/catalog/url-state";

describe("catalog URL state", () => {
  it("reads repeated and comma-separated facet values", () => {
    expect(
      readCatalogSearch({
        q: "  chopin  ",
        key: ["c-sharp-minor", "a-minor"],
        difficulty: "intermediate",
        tag: "nocturne,romantic",
        page: "2",
      }),
    ).toEqual({
      q: "chopin",
      key: ["c-sharp-minor", "a-minor"],
      difficulty: ["intermediate"],
      tag: ["nocturne", "romantic"],
      page: 2,
    });
  });

  it("normalizes legacy display values into URL slugs", () => {
    expect(readCatalogSearch({ key: "C# minor", license: "Public Domain" })).toEqual({
      key: ["c-sharp-minor"],
      license: ["public-domain"],
    });
  });

  it("serializes stable, shareable URLs", () => {
    expect(
      catalogSearchToQuery({
        q: "chopin",
        key: ["c-sharp-minor", "a-minor"],
        page: 2,
      }),
    ).toBe("q=chopin&key=c-sharp-minor&key=a-minor&page=2");
  });

  it("toggles facet values without touching the query", () => {
    expect(toggleFacetValue(["a-minor"], "c-major")).toEqual([
      "a-minor",
      "c-major",
    ]);
    expect(
      setFacetValue({ q: "nocturne", key: ["a-minor"], page: 2 }, "key", "c-major"),
    ).toEqual({ q: "nocturne", key: ["a-minor", "c-major"], page: undefined });
  });

  it("distinguishes default browse from search and filtered pages", () => {
    expect(isDefaultBrowse({})).toBe(true);
    expect(isDefaultBrowse({ sort: "title" })).toBe(false);
    expect(hasCatalogRefinements({ q: "bach" })).toBe(true);
    expect(hasCatalogRefinements({ tag: ["prelude"] })).toBe(true);
  });

  it("drops defaults from the built search object", () => {
    expect(buildCatalogSearch({ page: 1, q: "" })).toEqual({});
  });
});
