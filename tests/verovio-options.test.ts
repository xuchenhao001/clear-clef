import { describe, expect, it } from "vitest";
import {
  embeddedLayoutOptions,
  pageSizeFromSlot,
  practiceLayoutOptions,
  VEROVIO_SCALE,
} from "@/lib/verovio/options";

describe("pageSizeFromSlot", () => {
  it("maps CSS pixels to Verovio page dimensions", () => {
    const { pageWidth, pageHeight, scale } = pageSizeFromSlot(800, 600);
    expect(scale).toBe(VEROVIO_SCALE);
    expect(pageWidth).toBe(Math.round((800 * 100) / VEROVIO_SCALE));
    expect(pageHeight).toBe(Math.round((600 * 100) / VEROVIO_SCALE));
  });

  it("enforces a minimum page size", () => {
    const { pageWidth, pageHeight } = pageSizeFromSlot(10, 10);
    expect(pageWidth).toBeGreaterThanOrEqual(100);
    expect(pageHeight).toBeGreaterThanOrEqual(100);
  });
});

describe("embeddedLayoutOptions", () => {
  it("sets pageWidth and adjustPageHeight without fixed pageHeight", () => {
    const options = embeddedLayoutOptions(800);
    expect(options.pageWidth).toBe(Math.round((800 * 100) / VEROVIO_SCALE));
    expect(options.adjustPageHeight).toBe(true);
    expect(options).not.toHaveProperty("pageHeight");
  });
});

describe("practiceLayoutOptions", () => {
  it("sets both pageWidth and pageHeight with adjustPageHeight false", () => {
    const options = practiceLayoutOptions(800, 600);
    expect(options.pageWidth).toBe(Math.round((800 * 100) / VEROVIO_SCALE));
    expect(options.pageHeight).toBe(Math.round((600 * 100) / VEROVIO_SCALE));
    expect(options.adjustPageHeight).toBe(false);
  });
});
