import type { Score } from "@/lib/db/schema";

export type ScoreFormat = "musicxml" | "abc" | "mnx";

export type ScoreFile = {
  format: ScoreFormat;
  /** R2 key for viewer / download preferred blob */
  r2Key: string;
  /** R2 key for MusicXML 4.x partwise when format === "musicxml" */
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

export function scoreFileContentType(scoreFile: ScoreFile): string {
  return scoreFile.r2Key.endsWith(".mxl")
    ? "application/vnd.recordare.musicxml+xml"
    : "application/vnd.recordare.musicxml";
}
