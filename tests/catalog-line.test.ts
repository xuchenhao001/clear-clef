import { describe, expect, it } from "vitest";
import { formatCatalogLine } from "@/lib/scores/catalog-line";

describe("formatCatalogLine", () => {
  it("joins present metadata with middle dots", () => {
    expect(
      formatCatalogLine({
        catalogNumber: "BWV 846",
        key: "C major",
        timeSignature: "4/4",
      }),
    ).toBe("BWV 846 · C major · 4/4");
  });

  it("omits empty segments", () => {
    expect(
      formatCatalogLine({
        catalogNumber: null,
        key: "G major",
        timeSignature: null,
      }),
    ).toBe("G major");
  });

  it("returns empty string when nothing is present", () => {
    expect(formatCatalogLine({})).toBe("");
  });
});
