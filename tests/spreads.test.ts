import { describe, expect, it } from "vitest";
import {
  canStepNext,
  canStepPrev,
  formatPageLabel,
  layoutModeForWidth,
  pagesInView,
  spreadStartPage,
  stepPage,
} from "@/lib/viewer/spreads";

describe("layoutModeForWidth", () => {
  it("uses single below 1280px", () => {
    expect(layoutModeForWidth(1279)).toBe("single");
    expect(layoutModeForWidth(768)).toBe("single");
  });

  it("uses spread at 1280px and above", () => {
    expect(layoutModeForWidth(1280)).toBe("spread");
    expect(layoutModeForWidth(1920)).toBe("spread");
  });
});

describe("pagesInView", () => {
  it("returns one page in single mode", () => {
    expect(pagesInView(3, 10, "single")).toEqual([3]);
  });

  it("pairs consecutive pages in spread mode", () => {
    expect(pagesInView(1, 10, "spread")).toEqual([1, 2]);
    expect(pagesInView(2, 10, "spread")).toEqual([1, 2]);
    expect(pagesInView(3, 10, "spread")).toEqual([3, 4]);
  });

  it("handles odd last page in spread mode", () => {
    expect(pagesInView(5, 5, "spread")).toEqual([5]);
  });
});

describe("stepPage", () => {
  it("steps by one in single mode", () => {
    expect(stepPage(3, 10, "single", "next")).toBe(4);
    expect(stepPage(3, 10, "single", "prev")).toBe(2);
  });

  it("steps by two in spread mode", () => {
    expect(stepPage(2, 10, "spread", "next")).toBe(3);
    expect(stepPage(4, 10, "spread", "prev")).toBe(1);
  });

  it("clamps at bounds", () => {
    expect(stepPage(1, 10, "single", "prev")).toBe(1);
    expect(stepPage(10, 10, "single", "next")).toBe(10);
    expect(stepPage(9, 10, "spread", "next")).toBe(9);
  });
});

describe("spreadStartPage", () => {
  it("aligns to odd starts", () => {
    expect(spreadStartPage(1)).toBe(1);
    expect(spreadStartPage(2)).toBe(1);
    expect(spreadStartPage(3)).toBe(3);
  });
});

describe("formatPageLabel", () => {
  it("formats single and spread labels", () => {
    expect(formatPageLabel([3], 12)).toBe("3 / 12");
    expect(formatPageLabel([3, 4], 12)).toBe("3-4 / 12");
  });
});

describe("canStepPrev / canStepNext", () => {
  it("respects spread boundaries", () => {
    expect(canStepPrev(1, "spread")).toBe(false);
    expect(canStepPrev(3, "spread")).toBe(true);
    expect(canStepNext(4, 5, "spread")).toBe(true);
    expect(canStepNext(5, 5, "spread")).toBe(false);
  });
});
