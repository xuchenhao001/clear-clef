import { describe, expect, it } from "vitest";
import type { Score } from "@/lib/db/schema";
import {
  scoreFileContentType,
  toScoreFile,
} from "@/lib/score-file";

describe("toScoreFile", () => {
  it("maps a score row to ScoreFile", () => {
    const score: Pick<
      Score,
      "format" | "r2Key" | "canonicalR2Key" | "previewR2Key"
    > = {
      format: "musicxml",
      r2Key: "scores/test/original.mxl",
      canonicalR2Key: "scores/test/canonical.musicxml",
      previewR2Key: "scores/test/preview.svg",
    };

    const file = toScoreFile(score);
    expect(file).toEqual({
      format: "musicxml",
      r2Key: "scores/test/original.mxl",
      canonicalR2Key: "scores/test/canonical.musicxml",
      previewR2Key: "scores/test/preview.svg",
    });
    expect(scoreFileContentType(file!)).toBe(
      "application/vnd.recordare.musicxml+xml",
    );
  });

  it("returns null when r2Key is missing", () => {
    expect(
      toScoreFile({
        format: "musicxml",
        r2Key: null,
        canonicalR2Key: null,
        previewR2Key: null,
      }),
    ).toBeNull();
  });
});
