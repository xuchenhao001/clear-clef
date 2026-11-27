import type { ExtractedScoreMetadata } from "@/lib/ingest/metadata";
import type { ScoreMatch } from "@/lib/scores/duplicates";

export type ScoreVisibility = "public" | "unlisted" | "private";

export type BatchSettings = {
  license: string;
  visibility: ScoreVisibility;
  tags: string;
  sourceUrl: string;
};

export type BatchPhase = "empty" | "review" | "running" | "done";

export type BatchRowStatus =
  | "new"
  | "reading"
  | "ready"
  | "invalid"
  | "duplicate"
  | "excluded"
  | "queued"
  | "uploading"
  | "uploaded"
  | "previewing"
  | "done"
  | "preview-failed"
  | "failed";

export type DuplicateMatch =
  | (ScoreMatch & { kind: "catalog" })
  | {
      kind: "batch";
      rowKey: string;
      title: string;
      composer: string | null;
    };

export type BatchRow = {
  key: string;
  path: string;
  name: string;
  size: number;
  lastModified: number;
  status: BatchRowStatus;
  error: string | null;
  contentHash: string | null;
  metadata: ExtractedScoreMetadata | null;
  suggestedTitle: string;
  suggestedComposer: string | null;
  titleSource: "file" | "filename";
  titleCheck: boolean;
  exactMatch: DuplicateMatch | null;
  similarMatches: ScoreMatch[];
  includedAnyway: boolean;
  overrides: {
    title?: string;
    composer?: string;
    catalogNumber?: string;
    license?: string;
    visibility?: ScoreVisibility;
    tags?: string;
    sourceUrl?: string;
  };
  score: { id: string; slug: string; title: string } | null;
};

export type BatchCounts = {
  total: number;
  ready: number;
  attention: number;
  skipped: number;
  uploaded: number;
  failed: number;
  active: number;
};

export type BatchFilter = "all" | "attention" | "ready" | "composer" | "skipped";

export type PreflightLookupItem = {
  key: string;
  filename: string;
  size: number;
  contentHash: string;
  title: string;
  composer?: string | null;
};

export type PreflightLookupResult = {
  key: string;
  exactMatch: ScoreMatch | null;
  similarMatches: ScoreMatch[];
};
