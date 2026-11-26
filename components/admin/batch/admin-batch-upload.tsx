import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { BatchActionBar } from "@/components/admin/batch/batch-action-bar";
import { BatchFileDrawer } from "@/components/admin/batch/batch-file-drawer";
import { BatchPicker, type PickedFile } from "@/components/admin/batch/batch-picker";
import { BatchQueue } from "@/components/admin/batch/batch-queue";
import { BatchSettingsPanel } from "@/components/admin/batch/batch-settings-panel";
import type {
  BatchFilter,
  BatchPhase,
  BatchRow,
  BatchSettings,
  PreflightLookupItem,
  PreflightLookupResult,
  ScoreVisibility,
} from "@/lib/batch/types";
import {
  BatchApiError,
  fetchScorePreviewInput,
  lookupPreflight,
  publishImport,
  putScorePreview,
  uploadBatchFile,
} from "@/lib/batch/api";
import { runPool } from "@/lib/batch/pool";
import {
  DEFAULT_BATCH_SETTINGS,
  countBatch,
  effectiveCatalogNumber,
  effectiveComposer,
  effectiveLicense,
  effectiveSourceUrl,
  effectiveTags,
  effectiveTitle,
  effectiveVisibility,
  hasTitle,
  isIncluded,
  isUploadedStatus,
  markBatchDuplicates,
  newBatchRow,
} from "@/lib/batch/state";
import {
  clearBatchManifest,
  loadBatchManifest,
  saveBatchManifest,
  type BatchManifest,
} from "@/lib/batch/storage";
import { MAX_UPLOAD_BYTES } from "@/lib/ingest/constants";
import type { InspectedScoreSummary } from "@/lib/ingest/inspect";
import {
  disposeInspectWorker,
  inspectFile,
} from "@/lib/ingest/inspect-client";
import {
  renderPreviewFromFile,
  renderPreviewSvg,
} from "@/lib/verovio/preview-client";

const MAX_BATCH_FILES = 200;
const MAX_BATCH_BYTES = 100 * 1024 * 1024;

type PreviewState = "idle" | "rendering" | "ready" | "failed";

function applyInspection(
  row: BatchRow,
  result: InspectedScoreSummary,
): BatchRow {
  return {
    ...row,
    status: "ready",
    error: null,
    contentHash: result.contentHash,
    metadata: result.metadata,
    suggestedTitle: result.suggestedTitle,
    suggestedComposer: result.metadata.composer,
    titleSource: result.titleSource,
    titleCheck: result.titleCheck,
    exactMatch: null,
    similarMatches: [],
  };
}

function applyCatalogMatches(
  row: BatchRow,
  result: PreflightLookupResult,
): BatchRow {
  if (
    row.status !== "ready" &&
    !(row.status === "duplicate" && row.exactMatch?.kind === "catalog")
  ) {
    return row;
  }

  const exactMatch = result.exactMatch;
  const isDuplicate = Boolean(exactMatch) && !row.includedAnyway;
  return {
    ...row,
    status: isDuplicate ? "duplicate" : "ready",
    exactMatch: exactMatch
      ? { ...exactMatch, kind: "catalog" }
      : null,
    similarMatches: result.similarMatches,
    error: null,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function AdminBatchUpload() {
  const navigate = useNavigate();
  const router = useRouter();
  const [rows, setRows] = useState<BatchRow[]>([]);
  const rowsRef = useRef<BatchRow[]>([]);
  const [settings, setSettings] = useState<BatchSettings>(DEFAULT_BATCH_SETTINGS);
  const [phase, setPhase] = useState<BatchPhase>("empty");
  const [filter, setFilter] = useState<BatchFilter>("all");
  const [importId, setImportId] = useState<string | null>(null);
  const importIdRef = useRef<string | null>(null);
  const [openRowKey, setOpenRowKey] = useState<string | null>(null);

  const filesRef = useRef<Map<string, File>>(new Map());
  const [fileKeys, setFileKeys] = useState<Set<string>>(new Set());
  const fileKeysRef = useRef<Set<string>>(new Set());

  const [previewSvgs, setPreviewSvgs] = useState<Record<string, string>>({});
  const previewSvgsRef = useRef<Record<string, string>>({});
  const [previewStatus, setPreviewStatus] = useState<Record<string, PreviewState>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const drawingRef = useRef<Set<string>>(new Set());

  const [running, setRunning] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const cancelRef = useRef(false);
  const pausedRef = useRef(false);
  const inspectingRef = useRef<Set<string>>(new Set());
  const [catalogCheckFailed, setCatalogCheckFailed] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  const [publishConfirm, setPublishConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const latestManifestRef = useRef<BatchManifest | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const applyRows = useCallback(
    (updater: (previous: BatchRow[]) => BatchRow[]) => {
      setRows((previous) => {
        const next = updater(previous);
        rowsRef.current = next;
        return next;
      });
    },
    [],
  );

  const commitFileKeys = useCallback((next: Set<string>) => {
    fileKeysRef.current = next;
    setFileKeys(next);
  }, []);

  const ensureImportId = useCallback(() => {
    if (importIdRef.current) {
      return importIdRef.current;
    }
    const id = crypto.randomUUID();
    importIdRef.current = id;
    setImportId(id);
    return id;
  }, []);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    const manifest = loadBatchManifest();
    if (!manifest) return;

    rowsRef.current = manifest.rows;
    importIdRef.current = manifest.importId;
    setRows(manifest.rows);
    setSettings(manifest.settings);
    setPhase(manifest.phase === "empty" ? "review" : manifest.phase);
    setImportId(manifest.importId);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!importId || rows.length === 0) return;
    const manifest: BatchManifest = {
      version: 1,
      importId,
      phase,
      settings,
      rows,
    };
    latestManifestRef.current = manifest;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      if (!saveBatchManifest(manifest)) {
        setStorageWarning(true);
      }
    }, 250);
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [importId, phase, rows, settings]);

  useEffect(() => {
    const persistLatest = () => {
      if (latestManifestRef.current) {
        saveBatchManifest(latestManifestRef.current);
      }
    };
    window.addEventListener("pagehide", persistLatest);
    return () => {
      window.removeEventListener("pagehide", persistLatest);
      persistLatest();
    };
  }, []);

  useEffect(() => {
    return () => {
      disposeInspectWorker();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [running]);

  const setPreview = useCallback((key: string, svg: string) => {
    const next = { ...previewSvgsRef.current, [key]: svg };
    previewSvgsRef.current = next;
    setPreviewSvgs(next);
    setPreviewStatus((previous) => ({ ...previous, [key]: "ready" }));
    setPreviewErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors[key];
      return nextErrors;
    });
  }, []);

  const markPreviewFailed = useCallback((key: string, message: string) => {
    setPreviewStatus((previous) => ({ ...previous, [key]: "failed" }));
    setPreviewErrors((previous) => ({ ...previous, [key]: message }));
  }, []);

  const runCatalogLookup = useCallback(
    async (items: PreflightLookupItem[]) => {
      if (items.length === 0) return;

      try {
        const results = await lookupPreflight(items);
        const byKey = new Map(results.map((result) => [result.key, result]));
        applyRows((previous) =>
          markBatchDuplicates(
            previous.map((row) => {
              const result = byKey.get(row.key);
              return result ? applyCatalogMatches(row, result) : row;
            }),
          ),
        );
        setCatalogCheckFailed(false);
        setPageError(null);
      } catch (error) {
        if (error instanceof BatchApiError && error.status === 401) {
          pausedRef.current = true;
          setAuthError(error.message);
          return;
        }
        setCatalogCheckFailed(true);
        setPageError(
          "Catalog duplicate check failed. The files are still ready; retry the check or upload anyway.",
        );
      }
    },
    [applyRows],
  );

  const runInspect = useCallback(
    async (keys: string[]) => {
      const activeKeys = keys.filter(
        (key) =>
          !inspectingRef.current.has(key) && filesRef.current.has(key),
      );
      if (activeKeys.length === 0 || pausedRef.current) return;

      for (const key of activeKeys) {
        inspectingRef.current.add(key);
      }
      applyRows((previous) =>
        previous.map((row) =>
          activeKeys.includes(row.key)
            ? { ...row, status: "reading", error: null }
            : row,
        ),
      );

      const lookupItems: PreflightLookupItem[] = [];

      await runPool(
        activeKeys,
        2,
        async (key) => {
          const file = filesRef.current.get(key);
          if (!file) {
            applyRows((previous) =>
              previous.map((row) =>
                row.key === key
                  ? {
                      ...row,
                      status: "new",
                      error: "Re-add this file to continue.",
                    }
                  : row,
              ),
            );
            return;
          }

          try {
            const result = await inspectFile(file);
            applyRows((previous) =>
              markBatchDuplicates(
                previous.map((row) =>
                  row.key === key && row.status === "reading"
                    ? applyInspection(row, result)
                    : row,
                ),
              ),
            );

            const currentRow = rowsRef.current.find((row) => row.key === key);
            lookupItems.push({
              key,
              filename: currentRow?.name ?? file.name,
              size: file.size,
              contentHash: result.contentHash,
              title:
                currentRow?.overrides.title ??
                result.suggestedTitle,
            });
          } catch (error) {
            applyRows((previous) =>
              previous.map((row) =>
                row.key === key
                  ? {
                      ...row,
                      status: "invalid",
                      error: errorMessage(error),
                    }
                  : row,
              ),
            );
          } finally {
            inspectingRef.current.delete(key);
          }
        },
        () => pausedRef.current,
      );

      applyRows((previous) =>
        previous.map((row) =>
          activeKeys.includes(row.key) && row.status === "reading"
            ? {
                ...row,
                status: "new",
                error: "Reading was interrupted. Try again.",
              }
            : row,
        ),
      );
      for (const key of activeKeys) {
        inspectingRef.current.delete(key);
      }

      await runCatalogLookup(lookupItems);
    },
    [applyRows, runCatalogLookup],
  );

  useEffect(() => {
    if (phase !== "review" || running || pausedRef.current) return;
    const keys = rows
      .filter((row) => row.status === "new" && filesRef.current.has(row.key))
      .map((row) => row.key);
    if (keys.length > 0) {
      void runInspect(keys);
    }
  }, [phase, rows, running, runInspect]);

  function handleFiles(picked: PickedFile[]) {
    if (running) return;
    if (phase === "done") {
      setPageError("Start a new batch before adding more files.");
      return;
    }

    const current = rowsRef.current;
    const next = [...current];
    const files = new Map(filesRef.current);
    const keys = new Set(fileKeysRef.current);
    let totalBytes = next.reduce((sum, row) => sum + row.size, 0);
    let ignored = 0;
    let oversized = 0;

    for (const pickedFile of picked) {
      const { file } = pickedFile;
      const path = pickedFile.path || file.name;
      if (file.size > MAX_UPLOAD_BYTES) {
        oversized += 1;
        continue;
      }
      const existingIndex = next.findIndex(
        (row) =>
          row.path === path ||
          (row.name === file.name &&
            row.size === file.size &&
            row.lastModified === file.lastModified),
      );

      if (existingIndex >= 0) {
        const existing = next[existingIndex];
        const changed =
          existing.size !== file.size ||
          existing.lastModified !== file.lastModified;

        if (changed && !isUploadedStatus(existing.status)) {
          next[existingIndex] = {
            ...existing,
            size: file.size,
            lastModified: file.lastModified,
            status: "new",
            error: null,
            contentHash: null,
            metadata: null,
            titleCheck: false,
            exactMatch: null,
            similarMatches: [],
          };
          delete previewSvgsRef.current[existing.key];
          setPreviewSvgs((previous) => {
            const nextSvgs = { ...previous };
            delete nextSvgs[existing.key];
            return nextSvgs;
          });
          setPreviewStatus((previous) => ({
            ...previous,
            [existing.key]: "idle",
          }));
          setPreviewErrors((previous) => {
            const nextErrors = { ...previous };
            delete nextErrors[existing.key];
            return nextErrors;
          });
          files.set(existing.key, file);
          keys.add(existing.key);
          totalBytes += file.size - existing.size;
        } else {
          files.set(existing.key, file);
          keys.add(existing.key);
          if (
            existing.status === "invalid" ||
            existing.status === "new" ||
            existing.status === "duplicate"
          ) {
            next[existingIndex] = {
              ...existing,
              status: "new",
              error: null,
            };
          }
        }
        continue;
      }

      if (
        next.length >= MAX_BATCH_FILES ||
        totalBytes + file.size > MAX_BATCH_BYTES
      ) {
        ignored += 1;
        continue;
      }

      const row = newBatchRow(file, path);
      next.push(row);
      files.set(row.key, file);
      keys.add(row.key);
      totalBytes += file.size;
    }

    filesRef.current = files;
    commitFileKeys(keys);
    rowsRef.current = next;
    setRows(next);

    if (next.length > 0) {
      ensureImportId();
      setPhase((previous) => (previous === "empty" ? "review" : previous));
      setRestored(false);
    }

    const issues: string[] = [];
    if (oversized > 0) {
      issues.push(
        `${oversized} ${oversized === 1 ? "file exceeds" : "files exceed"} the 8 MB limit.`,
      );
    }
    if (ignored > 0) {
      issues.push(
        `${ignored} ${ignored === 1 ? "file was" : "files were"} not added; the batch limit is ${MAX_BATCH_FILES} files or 100 MB.`,
      );
    }
    setPageError(issues.length > 0 ? issues.join(" ") : null);
  }

  function handleOverride(
    rowKey: string,
    field:
      | "title"
      | "composer"
      | "catalogNumber"
      | "license"
      | "visibility"
      | "tags"
      | "sourceUrl",
    value: string | undefined,
  ) {
    applyRows((previous) =>
      previous.map((row) => {
        if (row.key !== rowKey) return row;
        const overrides = { ...row.overrides };
        switch (field) {
          case "visibility":
            overrides.visibility = value as ScoreVisibility | undefined;
            break;
          case "title":
            overrides.title = value;
            break;
          case "composer":
            overrides.composer = value;
            break;
          case "catalogNumber":
            overrides.catalogNumber = value;
            break;
          case "license":
            overrides.license = value;
            break;
          case "tags":
            overrides.tags = value;
            break;
          case "sourceUrl":
            overrides.sourceUrl = value;
            break;
        }
        return {
          ...row,
          overrides,
          titleCheck: field === "title" ? false : row.titleCheck,
        };
      }),
    );
  }

  function handleInclude(rowKey: string) {
    applyRows((previous) =>
      previous.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              status: "ready",
              includedAnyway: true,
              error: null,
            }
          : row,
      ),
    );
  }

  function handleExclude(rowKey: string) {
    applyRows((previous) =>
      previous.map((row) =>
        row.key === rowKey
          ? { ...row, status: "excluded", error: null }
          : row,
      ),
    );
  }

  function handleRemove(rowKey: string) {
    const current = rowsRef.current;
    const row = current.find((candidate) => candidate.key === rowKey);
    if (!row || row.score) return;

    const next = current.filter((candidate) => candidate.key !== rowKey);
    filesRef.current.delete(rowKey);
    const keys = new Set(fileKeysRef.current);
    keys.delete(rowKey);
    commitFileKeys(keys);
    delete previewSvgsRef.current[rowKey];
    setPreviewSvgs((previous) => {
      const nextSvgs = { ...previous };
      delete nextSvgs[rowKey];
      return nextSvgs;
    });
    setPreviewStatus((previous) => {
      const nextStatus = { ...previous };
      delete nextStatus[rowKey];
      return nextStatus;
    });
    setPreviewErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors[rowKey];
      return nextErrors;
    });
    rowsRef.current = next;
    setRows(next);
    if (openRowKey === rowKey) setOpenRowKey(null);

    if (next.length === 0) {
      resetBatch();
    }
  }

  async function drawPreview(rowKey: string) {
    if (drawingRef.current.has(rowKey)) return;
    const row = rowsRef.current.find((candidate) => candidate.key === rowKey);
    if (!row) return;

    drawingRef.current.add(rowKey);
    setPreviewStatus((previous) => ({ ...previous, [rowKey]: "rendering" }));
    setPreviewErrors((previous) => {
      const next = { ...previous };
      delete next[rowKey];
      return next;
    });

    try {
      let svg = previewSvgsRef.current[rowKey];
      if (!svg) {
        const file = filesRef.current.get(rowKey);
        if (file) {
          svg = await renderPreviewFromFile(file);
        } else if (row.score) {
          const input = await fetchScorePreviewInput(row.score.id, row.name);
          svg = await renderPreviewSvg(input);
        } else {
          throw new Error("Re-add this file before drawing its preview.");
        }
        setPreview(rowKey, svg);
      }

      if (
        row.score &&
        (row.status === "preview-failed" ||
          row.status === "uploaded" ||
          row.status === "previewing")
      ) {
        await putScorePreview(row.score.id, svg);
        applyRows((previous) =>
          previous.map((candidate) =>
            candidate.key === rowKey
              ? { ...candidate, status: "done", error: null }
              : candidate,
          ),
        );
      }
    } catch (error) {
      markPreviewFailed(rowKey, errorMessage(error));
      if (error instanceof BatchApiError && error.status === 401) {
        pausedRef.current = true;
        setAuthError(error.message);
      }
    } finally {
      drawingRef.current.delete(rowKey);
    }
  }

  async function uploadOne(
    row: BatchRow,
    activeSettings: BatchSettings,
    activeImportId: string,
  ) {
    const file = filesRef.current.get(row.key);
    if (!file) {
      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? {
                ...candidate,
                status: "failed",
                error: "Re-add this file before uploading.",
              }
            : candidate,
        ),
      );
      return;
    }

    applyRows((previous) =>
      previous.map((candidate) =>
        candidate.key === row.key
          ? { ...candidate, status: "uploading", error: null }
          : candidate,
      ),
    );

    let canonicalXml: string;
    let contentHash: string;
    try {
      const prepared = await inspectFile(file, { includeCanonical: true });
      if (!prepared.canonicalXml) {
        throw new Error("Could not prepare the canonical MusicXML");
      }
      if (row.contentHash && row.contentHash !== prepared.contentHash) {
        throw new Error(
          "This file changed since it was read. Re-add it and review it again.",
        );
      }
      canonicalXml = prepared.canonicalXml;
      contentHash = prepared.contentHash;
    } catch (error) {
      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? { ...candidate, status: "failed", error: errorMessage(error) }
            : candidate,
        ),
      );
      return;
    }

    let score: { id: string; slug: string; title: string };
    try {
      const result = await uploadBatchFile({
        file,
        title: effectiveTitle(row),
        composer: effectiveComposer(row),
        catalogNumber: effectiveCatalogNumber(row),
        license: effectiveLicense(row, activeSettings),
        visibility: effectiveVisibility(row, activeSettings),
        tags: effectiveTags(row, activeSettings),
        sourceUrl: effectiveSourceUrl(row, activeSettings),
        uploadKey: row.key,
        importId: activeImportId,
        allowDuplicate: row.includedAnyway,
        canonicalXml,
        contentHash,
      });
      score = { id: result.id, slug: result.slug, title: result.title };
      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? {
                ...candidate,
                status: "uploaded",
                score,
                error: null,
              }
            : candidate,
        ),
      );
    } catch (error) {
      if (error instanceof BatchApiError && error.status === 401) {
        pausedRef.current = true;
        setAuthError(error.message);
        applyRows((previous) =>
          previous.map((candidate) =>
            candidate.key === row.key
              ? {
                  ...candidate,
                  status: "failed",
                  error: "Session ended before upload.",
                }
              : candidate,
          ),
        );
        return;
      }

      if (
        error instanceof BatchApiError &&
        error.status === 409 &&
        error.code === "duplicate" &&
        error.existing
      ) {
        applyRows((previous) =>
          previous.map((candidate) =>
            candidate.key === row.key
              ? {
                  ...candidate,
                  status: "duplicate",
                  exactMatch: { ...error.existing!, kind: "catalog" },
                  error: error.message,
                }
              : candidate,
          ),
        );
        return;
      }

      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? { ...candidate, status: "failed", error: errorMessage(error) }
            : candidate,
        ),
      );
      return;
    }

    try {
      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? { ...candidate, status: "previewing", error: null }
            : candidate,
        ),
      );

      let svg = previewSvgsRef.current[row.key];
      if (!svg) {
        const storedFile = filesRef.current.get(row.key);
        const input = storedFile
          ? { filename: storedFile.name, bytes: await storedFile.arrayBuffer() }
          : await fetchScorePreviewInput(score.id, row.name);
        svg = await renderPreviewSvg(input);
        setPreview(row.key, svg);
      }

      await putScorePreview(score.id, svg);
      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? { ...candidate, status: "done", error: null }
            : candidate,
        ),
      );
    } catch (error) {
      applyRows((previous) =>
        previous.map((candidate) =>
          candidate.key === row.key
            ? {
                ...candidate,
                status: "preview-failed",
                error: errorMessage(error),
              }
            : candidate,
        ),
      );
      markPreviewFailed(row.key, errorMessage(error));
      if (error instanceof BatchApiError && error.status === 401) {
        pausedRef.current = true;
        setAuthError(error.message);
      }
    }
  }

  async function beginUpload(sourceRows?: BatchRow[]) {
    if (running) return;
    const current = sourceRows ?? rowsRef.current;
    const activeSettings = settings;

    const readyRows = current.filter(isIncluded);
    const missingLicense = readyRows.filter(
      (row) => !effectiveLicense(row, activeSettings).trim(),
    );
    if (missingLicense.length > 0) {
      setPageError(
        `Choose a license for ${missingLicense.length} ${
          missingLicense.length === 1 ? "file" : "files"
        } before uploading.`,
      );
      setPhase("review");
      return;
    }
    const missing = readyRows.filter((row) => !fileKeysRef.current.has(row.key));
    if (missing.length > 0) {
      setPageError(
        `${missing.length} ${missing.length === 1 ? "file needs" : "files need"} to be re-added before uploading.`,
      );
      setPhase("review");
      return;
    }
    if (readyRows.length === 0) {
      setPageError("No files are ready to upload.");
      setPhase("review");
      return;
    }

    const activeImportId = ensureImportId();
    pausedRef.current = false;
    cancelRef.current = false;
    setCancelRequested(false);
    setAuthError(null);
    setPageError(null);
    setPublished(false);
    setPublishConfirm(false);
    setRunning(true);
    setPhase("running");

    applyRows((previous) =>
      previous.map((row) =>
        isIncluded(row) ? { ...row, status: "queued", error: null } : row,
      ),
    );

    await runPool(
      readyRows,
      2,
      async (row) => {
        if (pausedRef.current || cancelRef.current) return;
        await uploadOne(row, activeSettings, activeImportId);
      },
      () => pausedRef.current || cancelRef.current,
    );

    setRunning(false);
    void router.invalidate();

    if (pausedRef.current || cancelRef.current) {
      applyRows((previous) =>
        previous.map((row) =>
          row.status === "queued" || row.status === "uploading"
            ? { ...row, status: "ready", error: null }
            : row,
        ),
      );
      setPhase("review");
      return;
    }

    const unfinished = rowsRef.current.some(
      (row) => row.status === "queued" || row.status === "uploading",
    );
    if (unfinished) {
      applyRows((previous) =>
        previous.map((row) =>
          row.status === "queued" || row.status === "uploading"
            ? { ...row, status: "ready", error: null }
            : row,
        ),
      );
      setPhase("review");
      return;
    }

    setPhase("done");
  }

  function resetForRetry(keys: string[]) {
    if (pausedRef.current) {
      setAuthError("Sign in again to continue reading this batch.");
      return false;
    }
    setPageError(null);
    if (phase === "done") {
      setPhase("review");
    }
    applyRows((previous) =>
      previous.map((row) =>
        keys.includes(row.key)
          ? {
              ...row,
              status: "new",
              error: null,
              contentHash: null,
              metadata: null,
              titleCheck: false,
              exactMatch: null,
              similarMatches: [],
            }
          : row,
      ),
    );
    return true;
  }

  function retryUnread() {
    const keys = rowsRef.current
      .filter((row) => row.status === "invalid")
      .map((row) => row.key);
    if (keys.length === 0) return;
    if (!resetForRetry(keys)) return;
    void runInspect(keys);
  }

  function retryRow(key: string) {
    const row = rowsRef.current.find((candidate) => candidate.key === key);
    if (!row || row.status !== "invalid") return;
    if (!resetForRetry([key])) return;
    void runInspect([key]);
  }

  function retryCatalogCheck() {
    const items = rowsRef.current
      .filter(
        (row) =>
          row.contentHash &&
          (row.status === "ready" ||
            (row.status === "duplicate" &&
              row.exactMatch?.kind === "catalog")),
      )
      .map((row) => ({
        key: row.key,
        filename: row.name,
        size: row.size,
        contentHash: row.contentHash!,
        title: effectiveTitle(row),
      }));
    if (items.length === 0) return;
    setCatalogCheckFailed(false);
    setPageError(null);
    void runCatalogLookup(items);
  }

  function retryFailed() {
    const current = rowsRef.current;
    const previewFailed = current.filter((row) => row.status === "preview-failed");
    for (const row of previewFailed) {
      void drawPreview(row.key);
    }

    const failed = current.filter((row) => row.status === "failed");
    if (failed.length === 0) {
      return;
    }

    const next = current.map((row) =>
      row.status === "failed"
        ? { ...row, status: "ready" as const, error: null }
        : row,
    );
    rowsRef.current = next;
    setRows(next);
    void beginUpload(next);
  }

  async function publishBatch() {
    if (!importId || publishing) return;
    setPublishing(true);
    setPageError(null);
    try {
      await publishImport(importId);
      setPublished(true);
      setPublishConfirm(false);
      setSettings((previous) => ({ ...previous, visibility: "public" }));
      applyRows((previous) =>
        previous.map((row) => {
          if (!row.score || effectiveVisibility(row, settings) !== "private") {
            return row;
          }
          const overrides = { ...row.overrides };
          delete overrides.visibility;
          return { ...row, overrides };
        }),
      );
      void router.invalidate();
    } catch (error) {
      if (error instanceof BatchApiError && error.status === 401) {
        setAuthError(error.message);
      } else {
        setPageError(errorMessage(error));
      }
    } finally {
      setPublishing(false);
    }
  }

  function resetBatch() {
    latestManifestRef.current = null;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    rowsRef.current = [];
    filesRef.current.clear();
    fileKeysRef.current = new Set();
    previewSvgsRef.current = {};
    drawingRef.current.clear();
    inspectingRef.current.clear();
    pausedRef.current = false;
    cancelRef.current = false;
    importIdRef.current = null;
    setRows([]);
    setFileKeys(new Set());
    setPreviewSvgs({});
    setPreviewStatus({});
    setPreviewErrors({});
    setImportId(null);
    setSettings(DEFAULT_BATCH_SETTINGS);
    setPhase("empty");
    setFilter("all");
    setOpenRowKey(null);
    setRunning(false);
    setCancelRequested(false);
    setPublishConfirm(false);
    setPublishing(false);
    setPublished(false);
    setPageError(null);
    setAuthError(null);
    setRestored(false);
    setCatalogCheckFailed(false);
    setStorageWarning(false);
    clearBatchManifest();
  }

  function startNewBatch() {
    if (running) return;
    if (
      rowsRef.current.length > 0 &&
      !window.confirm(
        "Start a new batch? Scores already uploaded stay in the catalog.",
      )
    ) {
      return;
    }
    resetBatch();
  }

  function reviewImported() {
    navigate({
      href: importId
        ? `/admin/scores?import=${encodeURIComponent(importId)}`
        : "/admin/scores",
    });
  }

  const counts = countBatch(rows);
  const readyRows = rows.filter(isIncluded);
  const uploadableRows = readyRows.filter((row) => fileKeys.has(row.key));
  const missingFiles = readyRows.length - uploadableRows.length;
  const missingTitles = rows.filter(
    (row) => row.status === "ready" && !hasTitle(row),
  ).length;
  const reading = rows.some((row) => row.status === "reading");
  const invalidCount = rows.filter((row) => row.status === "invalid").length;
  const privateCount = rows.filter(
    (row) => row.score && effectiveVisibility(row, settings) === "private",
  ).length;
  const hasFailures = rows.some(
    (row) => row.status === "failed" || row.status === "preview-failed",
  );

  let disabledReason: string | null = null;
  if (reading) {
    disabledReason = "Still reading files…";
  } else if (missingFiles > 0) {
    disabledReason = `${missingFiles} ${
      missingFiles === 1 ? "file needs" : "files need"
    } to be re-added.`;
  } else if (missingTitles > 0 && uploadableRows.length === 0) {
    disabledReason = `${missingTitles} ${
      missingTitles === 1 ? "file needs" : "files need"
    } a title.`;
  } else if (uploadableRows.length === 0) {
    disabledReason = "No files are ready to upload.";
  } else if (
    uploadableRows.some(
      (row) => !effectiveLicense(row, settings).trim(),
    )
  ) {
    disabledReason = "Choose a license for the files without one.";
  }

  const canStart =
    !disabledReason && uploadableRows.length > 0 && !running;
  const selectedRow = openRowKey
    ? rows.find((row) => row.key === openRowKey) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      {authError ? (
        <div
          className="border-l-2 border-edition-semantic-error bg-edition-surface-strong/50 px-4 py-3"
          role="alert"
        >
          <p className="type-body-sm text-edition-semantic-error">{authError}</p>
          <Link
            to="/admin/login"
            search={{ next: "/admin/batch-upload" }}
            className="mt-2 inline-block type-hint text-edition-gilt hover:text-edition-ink"
          >
            Sign in again
          </Link>
        </div>
      ) : null}

      {pageError ? (
        <div className="border-l-2 border-edition-gilt px-4 py-2" role="alert">
          <p className="type-body-sm text-edition-gilt">{pageError}</p>
          {catalogCheckFailed ? (
            <button
              type="button"
              className="mt-2 type-hint text-edition-gilt hover:text-edition-ink"
              onClick={retryCatalogCheck}
            >
              Retry catalog check
            </button>
          ) : null}
        </div>
      ) : null}

      {storageWarning ? (
        <div className="border-l-2 border-edition-gilt px-4 py-2" role="alert">
          <p className="type-body-sm text-edition-gilt">
            This batch is too large to save in this browser. Keep this tab open
            until the upload finishes.
          </p>
        </div>
      ) : null}

      {restored ? (
        <div className="border-l-2 border-edition-hairline-strong px-4 py-2">
          <p className="type-body-sm text-edition-muted">
            {rows.some((row) => row.status === "new")
              ? "This batch was restored. Re-add the folder to continue; files already uploaded will not be sent again."
              : "This batch was restored from this browser. Uploaded scores are safe; previews can be regenerated from the stored files."}
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <BatchPicker onFiles={handleFiles} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edition-hairline pb-3">
            <p className="type-shelf">
              {counts.total} files · {counts.ready} ready
              {counts.uploaded > 0 ? ` · ${counts.uploaded} uploaded` : ""}
              {counts.active > 0 ? ` · ${counts.active} in progress` : ""}
              {counts.attention > 0
                ? ` · ${counts.attention} need attention`
                : ""}
              {counts.skipped > 0 ? ` · ${counts.skipped} skipped` : ""}
            </p>
            {phase !== "running" && phase !== "done" ? (
              <BatchPicker
                compact
                onFiles={handleFiles}
              />
            ) : null}
          </div>

          <div className="grid gap-6 pb-44 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10 xl:pb-24">
            <BatchQueue
              rows={rows}
              settings={settings}
              filter={filter}
              onFilter={setFilter}
              onOpen={setOpenRowKey}
            />
            <aside className="order-first xl:order-none">
              <BatchSettingsPanel
                settings={settings}
                rows={rows}
                disabled={phase === "running" || phase === "done"}
                onChange={setSettings}
                onDiscard={() => resetBatch()}
              />
            </aside>
          </div>

          <BatchActionBar
            phase={phase}
            counts={counts}
            includedCount={uploadableRows.length}
            canStart={canStart}
            disabledReason={disabledReason}
            running={running}
            cancelRequested={cancelRequested}
            privateCount={privateCount}
            publishConfirm={publishConfirm}
            publishing={publishing}
            published={published}
            hasFailures={hasFailures}
            invalidCount={invalidCount}
            onStart={() => void beginUpload()}
            onCancel={() => {
              cancelRef.current = true;
              setCancelRequested(true);
            }}
            onReview={reviewImported}
            onRetryFailed={retryFailed}
            onRetryUnread={retryUnread}
            onPublish={() => setPublishConfirm(true)}
            onPublishConfirm={() => void publishBatch()}
            onPublishCancel={() => setPublishConfirm(false)}
            onNewBatch={startNewBatch}
          />
        </>
      )}

      <BatchFileDrawer
        row={selectedRow}
        settings={settings}
        open={Boolean(openRowKey && selectedRow)}
        editable={
          phase === "review" ||
          (phase === "done" && selectedRow?.status === "invalid")
        }
        previewSvg={openRowKey ? previewSvgs[openRowKey] ?? null : null}
        previewStatus={
          openRowKey ? previewStatus[openRowKey] ?? "idle" : "idle"
        }
        previewError={openRowKey ? previewErrors[openRowKey] ?? null : null}
        onClose={() => setOpenRowKey(null)}
        onOverride={handleOverride}
        onInclude={handleInclude}
        onExclude={handleExclude}
        onRemove={handleRemove}
        onRetry={retryRow}
        onDrawPreview={(key) => void drawPreview(key)}
      />
    </div>
  );
}
