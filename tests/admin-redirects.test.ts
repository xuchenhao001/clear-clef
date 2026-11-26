import { describe, expect, it } from "vitest";
import { safeAdminNextPath } from "@/lib/admin/redirects";

describe("admin redirects", () => {
  it("keeps admin paths and query strings", () => {
    expect(safeAdminNextPath("/admin/scores?import=abc")).toBe(
      "/admin/scores?import=abc",
    );
    expect(safeAdminNextPath("/admin")).toBe("/admin");
  });

  it("rejects external, protocol-relative, and non-admin paths", () => {
    expect(safeAdminNextPath(undefined)).toBe("/admin");
    expect(safeAdminNextPath("https://example.com")).toBe("/admin");
    expect(safeAdminNextPath("//example.com/admin")).toBe("/admin");
    expect(safeAdminNextPath("/scores/untitled")).toBe("/admin");
    expect(safeAdminNextPath("/administrator")).toBe("/admin");
    expect(safeAdminNextPath("/admin\\..\\evil")).toBe("/admin");
  });
});
