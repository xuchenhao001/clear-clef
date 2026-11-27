import { describe, expect, it } from "vitest";
import { scoreFileVersion, scorePreviewVersion } from "@/lib/scores/versions";

describe("score media versions", () => {
  it("prefers content hash for files and preview version for previews", () => {
    const score = {
      contentHash: "abc",
      previewVersion: "preview-1",
      updatedAt: new Date(1000),
      createdAt: new Date(1),
    };
    expect(scoreFileVersion(score)).toBe("abc");
    expect(scorePreviewVersion(score)).toBe("preview-1");
  });

  it("falls back through updatedAt, createdAt and a stable default", () => {
    expect(
      scoreFileVersion({ updatedAt: new Date(2000), createdAt: new Date(1000) }),
    ).toBe("2000");
    expect(scoreFileVersion({ createdAt: new Date(1000) })).toBe("1000");
    expect(scoreFileVersion({})).toBe("1");
  });
});
