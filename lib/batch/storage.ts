import type {
  BatchPhase,
  BatchRow,
  BatchSettings,
} from "@/lib/batch/types";
import { DEFAULT_BATCH_SETTINGS } from "@/lib/batch/state";

const STORAGE_KEY = "clearclef.batch.v1";
const VERSION = 1;

export type BatchManifest = {
  version: number;
  importId: string;
  phase: BatchPhase;
  settings: BatchSettings;
  rows: BatchRow[];
};

export function deriveBatchPhase(
  rows: BatchRow[],
  fallback: BatchPhase,
): BatchPhase {
  if (rows.length === 0) return "empty";

  const unfinished = rows.some((row) =>
    ["new", "reading", "ready", "queued", "uploading", "uploaded", "previewing"].includes(
      row.status,
    ),
  );
  if (unfinished) return "review";
  if (fallback === "done") return "done";

  const hasUploaded = rows.some((row) =>
    ["done", "preview-failed", "failed"].includes(row.status),
  );
  return hasUploaded ? "done" : "review";
}

export function saveBatchManifest(manifest: BatchManifest): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manifest));
    return true;
  } catch {
    // A full quota must not break the upload session.
    return false;
  }
}

export function loadBatchManifest(): BatchManifest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BatchManifest>;
    if (
      parsed.version !== VERSION ||
      typeof parsed.importId !== "string" ||
      !Array.isArray(parsed.rows) ||
      parsed.rows.length === 0
    ) {
      return null;
    }

    const rows = parsed.rows.map((row) => {
      const status =
        row.status === "previewing"
          ? "uploaded"
          : ["uploaded", "done", "preview-failed", "excluded", "duplicate"].includes(
                row.status,
              )
            ? row.status
            : "new";
      return { ...row, status } as BatchRow;
    });

    const settings: BatchSettings = {
      ...DEFAULT_BATCH_SETTINGS,
      ...(parsed.settings ?? {}),
    };
    const phase = deriveBatchPhase(
      rows,
      parsed.phase === "running" ? "review" : (parsed.phase ?? "review"),
    );

    return {
      version: VERSION,
      importId: parsed.importId,
      phase,
      settings,
      rows,
    };
  } catch {
    return null;
  }
}

export function clearBatchManifest(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
