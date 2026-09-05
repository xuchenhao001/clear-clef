import { describe, expect, it } from "vitest";
import { buildCatalogFilterQuery } from "@/lib/catalog/filter-url";

const fields = [
  { name: "key", label: "Key", values: ["C", "G"], current: "C" },
  { name: "difficulty", label: "Difficulty", values: ["easy"], current: "" },
  { name: "license", label: "License", values: ["cc0"], current: "" },
  { name: "tag", label: "Tag", values: ["piano"], current: "" },
];

describe("buildCatalogFilterQuery", () => {
  it("keeps active filters and omits empty values", () => {
    expect(buildCatalogFilterQuery(fields)).toBe("key=C");
  });

  it("applies a single-field update", () => {
    expect(buildCatalogFilterQuery(fields, { difficulty: "easy" })).toBe(
      "key=C&difficulty=easy",
    );
  });

  it("clears a field when updated to empty", () => {
    expect(buildCatalogFilterQuery(fields, { key: "" })).toBe("");
  });
});
