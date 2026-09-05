import { describe, expect, it } from "vitest";
import { sanitizeVerovioSvg } from "@/lib/viewer/sanitize-svg";

describe("sanitizeVerovioSvg", () => {
  it("strips script nodes", () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect id="a"/></svg>';
    const clean = sanitizeVerovioSvg(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).toContain('id="a"');
  });

  it("strips foreignObject and on* handlers", () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><g onclick="evil()"><foreignObject>x</foreignObject></g></svg>';
    const clean = sanitizeVerovioSvg(dirty);
    expect(clean).not.toMatch(/foreignObject/i);
    expect(clean).not.toMatch(/onclick/i);
  });

  it("returns empty for invalid input", () => {
    expect(sanitizeVerovioSvg("")).toBe("");
    expect(sanitizeVerovioSvg("not svg")).toBe("");
  });
});
