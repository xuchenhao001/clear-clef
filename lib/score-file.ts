import type { Score } from "@/lib/db/schema";
import {
  MUSICXML_COMPRESSED_MIME,
  MUSICXML_UNCOMPRESSED_MIME,
} from "@/lib/ingest/constants";

export type ScoreFormat = "musicxml" | "abc" | "mnx";

export type ScoreFile = {
  format: ScoreFormat;
  /** R2 key for viewer / download preferred blob */
  r2Key: string;
  /** R2 key for sanitized uncompressed MusicXML */
  canonicalR2Key?: string;
  previewR2Key?: string;
};

type ScoreRow = Pick<
  Score,
  "format" | "r2Key" | "canonicalR2Key" | "previewR2Key"
>;

export function toScoreFile(score: ScoreRow): ScoreFile | null {
  if (!score.r2Key) {
    return null;
  }

  return {
    format: score.format as ScoreFormat,
    r2Key: score.r2Key,
    canonicalR2Key: score.canonicalR2Key ?? undefined,
    previewR2Key: score.previewR2Key ?? undefined,
  };
}

export function isMxlR2Key(r2Key: string): boolean {
  return r2Key.endsWith(".mxl");
}

export function isMxlBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function shouldLoadMxlBuffer(
  compressed: boolean,
  buffer: ArrayBuffer,
): boolean {
  return compressed || isMxlBuffer(buffer);
}

export function scoreFileContentType(scoreFile: ScoreFile): string {
  return isMxlR2Key(scoreFile.r2Key)
    ? MUSICXML_COMPRESSED_MIME
    : MUSICXML_UNCOMPRESSED_MIME;
}

export function originalDownloadFilename(slug: string, r2Key: string): string {
  return isMxlR2Key(r2Key) ? `${slug}.mxl` : `${slug}.musicxml`;
}
