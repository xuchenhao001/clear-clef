import type { ScoreMatch } from "@/lib/scores/duplicates";

export class DuplicateScoreError extends Error {
  existing: ScoreMatch;

  constructor(existing: ScoreMatch) {
    super("This file is already in the catalog");
    this.name = "DuplicateScoreError";
    this.existing = existing;
  }
}
