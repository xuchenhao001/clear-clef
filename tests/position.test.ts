import { describe, expect, it } from "vitest";
import { extractFirstXmlId, restorePageFromElement } from "@/lib/viewer/position";

describe("extractFirstXmlId", () => {
  it("returns the first id attribute", () => {
    const svg = '<svg><g id="note-1"/><g id="note-2"/></svg>';
    expect(extractFirstXmlId(svg)).toBe("note-1");
  });

  it("returns null when no id", () => {
    expect(extractFirstXmlId("<svg><rect/></svg>")).toBeNull();
  });
});

describe("restorePageFromElement", () => {
  it("uses getPageWithElement when id is found", () => {
    const toolkit = {
      getPageWithElement: (id: string) => (id === "m1" ? 4 : 0),
    };
    expect(restorePageFromElement(toolkit, "m1", 1)).toBe(4);
  });

  it("falls back when id is missing or lookup fails", () => {
    const toolkit = { getPageWithElement: () => 0 };
    expect(restorePageFromElement(toolkit, null, 1)).toBe(1);
    expect(restorePageFromElement(toolkit, "missing", 2)).toBe(2);
  });
});
