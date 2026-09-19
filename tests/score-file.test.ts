import { describe, expect, it } from "vitest";
import type { Score } from "@/lib/db/schema";
import {
  MUSICXML_COMPRESSED_MIME,
  MUSICXML_UNCOMPRESSED_MIME,
} from "@/lib/ingest/constants";
import {
  isMxlBuffer,
  isMxlR2Key,
  originalDownloadFilename,
  scoreFileContentType,
  shouldLoadMxlBuffer,
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
    expect(scoreFileContentType(file!)).toBe(MUSICXML_COMPRESSED_MIME);
  });

  it("returns uncompressed MusicXML content type for .musicxml originals", () => {
    const file = toScoreFile({
      format: "musicxml",
      r2Key: "scores/test/original.musicxml",
      canonicalR2Key: "scores/test/canonical.musicxml",
      previewR2Key: null,
    });

    expect(scoreFileContentType(file!)).toBe(MUSICXML_UNCOMPRESSED_MIME);
  });

  it("detects compressed score keys and zip buffers", () => {
    expect(isMxlR2Key("scores/test/original.mxl")).toBe(true);
    expect(isMxlR2Key("scores/test/original.musicxml")).toBe(false);
    expect(isMxlBuffer(new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer)).toBe(
      true,
    );
    expect(isMxlBuffer(new Uint8Array([0x3c, 0x3f, 0x78, 0x6d]).buffer)).toBe(
      false,
    );
    expect(
      shouldLoadMxlBuffer(
        false,
        new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer,
      ),
    ).toBe(true);
    expect(
      shouldLoadMxlBuffer(
        true,
        new Uint8Array([0x3c, 0x3f, 0x78, 0x6d]).buffer,
      ),
    ).toBe(true);
  });

  it("builds attachment filenames from slug and original key", () => {
    expect(
      originalDownloadFilename("my-work", "scores/id/original.mxl"),
    ).toBe("my-work.mxl");
    expect(
      originalDownloadFilename("my-work", "scores/id/original.musicxml"),
    ).toBe("my-work.musicxml");
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
