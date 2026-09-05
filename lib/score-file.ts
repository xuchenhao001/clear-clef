export type ScoreFormat = "musicxml" | "abc" | "mnx";

export type ScoreFile = {
  format: ScoreFormat;
  /** R2 key for viewer / download preferred blob */
  r2Key: string;
  /** R2 key for MusicXML 4.x partwise when format === "musicxml" */
  canonicalR2Key?: string;
  previewR2Key?: string;
};
