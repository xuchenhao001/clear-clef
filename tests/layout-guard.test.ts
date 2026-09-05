import { describe, expect, it } from "vitest";
import { shouldReflowLayout } from "@/lib/viewer/layout-guard";

describe("shouldReflowLayout", () => {
  it("always reflows when there is no previous size", () => {
    expect(shouldReflowLayout(null, { width: 800, height: 600 }, "embedded")).toBe(
      true,
    );
  });

  it("embedded mode reflows only on width change", () => {
    const prev = { width: 800, height: 0 };
    expect(shouldReflowLayout(prev, { width: 800, height: 9999 }, "embedded")).toBe(
      false,
    );
    expect(shouldReflowLayout(prev, { width: 700, height: 0 }, "embedded")).toBe(
      true,
    );
  });

  it("practice mode reflows on width or height change", () => {
    const prev = { width: 800, height: 600 };
    expect(shouldReflowLayout(prev, { width: 800, height: 600 }, "practice")).toBe(
      false,
    );
    expect(shouldReflowLayout(prev, { width: 800, height: 500 }, "practice")).toBe(
      true,
    );
    expect(shouldReflowLayout(prev, { width: 700, height: 600 }, "practice")).toBe(
      true,
    );
  });

  it("ignores sub-pixel jitter", () => {
    const prev = { width: 800, height: 600 };
    expect(shouldReflowLayout(prev, { width: 800.5, height: 600.5 }, "practice")).toBe(
      false,
    );
  });
});
