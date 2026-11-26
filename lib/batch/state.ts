import type {
  BatchFilter,
  BatchRow,
  BatchRowStatus,
  BatchSettings,
  BatchCounts,
} from "@/lib/batch/types";
import { humanizeFilename, workKey } from "@/lib/ingest/suggestions";

export const DEFAULT_BATCH_SETTINGS: BatchSettings = {
  license: "",
  visibility: "private",
  tags: "",
  sourceUrl: "",
};

export function newBatchRow(file: File, path: string): BatchRow {
  return {
    key: crypto.randomUUID(),
    path: path || file.name,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    status: "new",
    error: null,
    contentHash: null,
    metadata: null,
    suggestedTitle: humanizeFilename(file.name),
    suggestedComposer: null,
    titleSource: "filename",
    titleCheck: false,
    exactMatch: null,
    similarMatches: [],
    includedAnyway: false,
    overrides: {},
    score: null,
  };
}

export function effectiveTitle(row: BatchRow): string {
  return row.overrides.title ?? row.suggestedTitle;
}

export function effectiveComposer(row: BatchRow): string {
  return row.overrides.composer ?? row.suggestedComposer ?? "";
}

export function effectiveCatalogNumber(row: BatchRow): string {
  return (
    row.overrides.catalogNumber ??
    row.metadata?.catalogNumber ??
    ""
  );
}

export function effectiveLicense(row: BatchRow, settings: BatchSettings): string {
  return row.overrides.license ?? settings.license;
}

export function effectiveVisibility(
  row: BatchRow,
  settings: BatchSettings,
) {
  return row.overrides.visibility ?? settings.visibility;
}

export function effectiveTags(row: BatchRow, settings: BatchSettings): string {
  return row.overrides.tags ?? settings.tags;
}

export function effectiveSourceUrl(
  row: BatchRow,
  settings: BatchSettings,
): string {
  return (
    row.overrides.sourceUrl ??
    row.metadata?.sourceUrl ??
    settings.sourceUrl
  );
}

export function hasTitle(row: BatchRow): boolean {
  return effectiveTitle(row).trim().length > 0;
}

export function isUploadedStatus(status: BatchRowStatus): boolean {
  return (
    status === "uploaded" ||
    status === "previewing" ||
    status === "done" ||
    status === "preview-failed"
  );
}

export function isIncluded(row: BatchRow): boolean {
  return row.status === "ready" && hasTitle(row);
}

export function countBatch(rows: BatchRow[]): BatchCounts {
  let ready = 0;
  let attention = 0;
  let skipped = 0;
  let uploaded = 0;
  let failed = 0;
  let active = 0;

  for (const row of rows) {
    if (row.status === "ready") {
      if (hasTitle(row)) {
        ready += 1;
      } else {
        attention += 1;
      }
      continue;
    }
    if (row.status === "queued" || row.status === "uploading" || row.status === "previewing") {
      active += 1;
      continue;
    }
    if (row.status === "invalid") {
      attention += 1;
      continue;
    }
    if (row.status === "duplicate" || row.status === "excluded") {
      skipped += 1;
      continue;
    }
    if (row.status === "preview-failed") {
      uploaded += 1;
      attention += 1;
      continue;
    }
    if (isUploadedStatus(row.status)) {
      uploaded += 1;
      continue;
    }
    if (row.status === "failed") {
      failed += 1;
      attention += 1;
    }
  }

  return {
    total: rows.length,
    ready,
    attention,
    skipped,
    uploaded,
    failed,
    active,
  };
}

export function displayStatus(
  row: BatchRow,
  settings: BatchSettings,
): { label: string; tone: "ok" | "warn" | "bad" | "muted" } {
  switch (row.status) {
    case "new":
      return { label: "Waiting", tone: "muted" };
    case "reading":
      return { label: "Reading…", tone: "warn" };
    case "ready":
      if (!hasTitle(row)) return { label: "Needs a title", tone: "bad" };
      if (row.titleCheck) return { label: "Check credits", tone: "warn" };
      if (!effectiveLicense(row, settings).trim()) {
        return { label: "License not set", tone: "warn" };
      }
      return { label: "Ready", tone: "ok" };
    case "invalid":
      return { label: "Couldn’t read", tone: "bad" };
    case "duplicate":
      return {
        label: row.exactMatch?.kind === "batch" ? "Identical file" : "In catalog",
        tone: "muted",
      };
    case "excluded":
      return { label: "Skipped", tone: "muted" };
    case "queued":
      return { label: "Waiting", tone: "muted" };
    case "uploading":
      return { label: "Uploading…", tone: "warn" };
    case "uploaded":
      return { label: "Preview pending", tone: "warn" };
    case "previewing":
      return { label: "Drawing preview…", tone: "warn" };
    case "done":
      return { label: "Uploaded", tone: "ok" };
    case "preview-failed":
      return { label: "No preview", tone: "bad" };
    case "failed":
      return { label: "Failed", tone: "bad" };
    default:
      return { label: "Waiting", tone: "muted" };
  }
}

export function rowMatchesFilter(
  row: BatchRow,
  filter: BatchFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "ready") {
    return isIncluded(row);
  }
  if (filter === "composer") {
    return row.status === "ready" && !effectiveComposer(row).trim();
  }
  if (filter === "skipped") {
    return row.status === "duplicate" || row.status === "excluded";
  }
  return needsAttention(row);
}

export function needsAttention(row: BatchRow): boolean {
  if (row.status === "invalid" || row.status === "failed") return true;
  if (row.status === "preview-failed") return true;
  if (row.status === "ready" && !hasTitle(row)) return true;
  return false;
}

export function markBatchDuplicates(rows: BatchRow[]): BatchRow[] {
  const firstByHash = new Map<string, BatchRow>();

  return rows.map((row) => {
    if (!row.contentHash || row.status === "invalid" || row.status === "excluded") {
      return row;
    }

    const first = firstByHash.get(row.contentHash);
    if (first && row.status === "ready" && !row.includedAnyway) {
      return {
        ...row,
        status: "duplicate",
        exactMatch: {
          kind: "batch",
          rowKey: first.key,
          title: effectiveTitle(first),
          composer: effectiveComposer(first) || null,
        },
      };
    }

    if (!first) {
      firstByHash.set(row.contentHash, row);
    }
    return row;
  });
}

export function variantNote(row: BatchRow, rows: BatchRow[]): string | null {
  const title = effectiveTitle(row).trim();
  if (!title) return null;
  const key = workKey(title, effectiveComposer(row) || null);

  const others = rows.filter(
    (candidate) =>
      candidate.key !== row.key &&
      candidate.status === "ready" &&
      candidate.contentHash !== row.contentHash &&
      workKey(
        effectiveTitle(candidate),
        effectiveComposer(candidate) || null,
      ) === key,
  );

  if (others.length === 0) return null;
  const names = others.slice(0, 2).map((candidate) => candidate.name);
  return `Same work as ${names.join(", ")}${
    others.length > 2 ? ` and ${others.length - 2} more` : ""
  }`;
}
