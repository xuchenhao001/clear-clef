import type { ScoreMatch } from "@/lib/scores/duplicates";
import type {
  PreflightLookupItem,
  PreflightLookupResult,
  ScoreVisibility,
} from "@/lib/batch/types";

export type BatchApiErrorCode =
  | "auth"
  | "cpu"
  | "duplicate"
  | "server"
  | "too-large"
  | "validation";

export class BatchApiError extends Error {
  status: number;
  code?: BatchApiErrorCode;
  existing?: ScoreMatch;

  constructor(
    message: string,
    status: number,
    code?: BatchApiErrorCode,
    existing?: ScoreMatch,
  ) {
    super(message);
    this.name = "BatchApiError";
    this.status = status;
    this.code = code;
    this.existing = existing;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function errorCodeForStatus(status: number): BatchApiErrorCode | undefined {
  if (status === 401 || status === 403) return "auth";
  if (status === 409) return "duplicate";
  if (status === 413) return "too-large";
  if (status >= 500) return "server";
  if (status >= 400) return "validation";
  return undefined;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  attempts = 1,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const retryable =
        response.status === 429 ||
        response.status === 502 ||
        response.status === 504;
      if (retryable && attempt < attempts) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await wait(Math.max(retryAfter * 1000, 800 * 2 ** attempt));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(800 * 2 ** attempt);
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

async function readError(response: Response): Promise<BatchApiError> {
  let message = `The server returned ${response.status}`;
  let code = errorCodeForStatus(response.status);
  let existing: ScoreMatch | undefined;

  const text = await response.text().catch(() => "");
  try {
    const body = JSON.parse(text) as {
      error?: string;
      code?: string;
      existing?: ScoreMatch;
    };
    message = body.error ?? message;
    if (body.code === "duplicate") {
      code = "duplicate";
    }
    existing = body.existing;
  } catch {
    if (response.status === 503 && /exceeded CPU/i.test(text)) {
      message =
        "The server ran out of CPU for this file. Try again, or use a smaller score.";
      code = "cpu";
    } else if (response.status === 503) {
      message = "The server is busy. Try again in a moment.";
    } else if (response.status === 413) {
      message = "This upload is too large for the server.";
      code = "too-large";
    } else if (response.status === 401 || response.status === 403) {
      message = "Sign in again to continue.";
      code = "auth";
    }
  }

  return new BatchApiError(message, response.status, code, existing);
}

export async function lookupPreflight(
  items: PreflightLookupItem[],
): Promise<PreflightLookupResult[]> {
  if (items.length === 0) {
    return [];
  }

  const response = await fetchWithRetry("/api/admin/uploads/preflight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw await readError(response);
  }

  const body = (await response.json()) as {
    results?: PreflightLookupResult[];
  };
  return body.results ?? [];
}

export type UploadBatchInput = {
  file: File;
  title: string;
  composer: string;
  catalogNumber: string;
  license: string;
  visibility: ScoreVisibility;
  tags: string;
  sourceUrl: string;
  uploadKey: string;
  importId: string;
  allowDuplicate: boolean;
  canonicalXml: string;
  contentHash: string;
};

export type UploadBatchResult = {
  id: string;
  slug: string;
  title: string;
  created: boolean;
};

export async function uploadBatchFile(
  input: UploadBatchInput,
): Promise<UploadBatchResult> {
  const formData = new FormData();
  formData.set("file", input.file, input.file.name);
  formData.set("title", input.title);
  formData.set("composer", input.composer);
  formData.set("catalogNumber", input.catalogNumber);
  formData.set("license", input.license);
  formData.set("visibility", input.visibility);
  formData.set("tags", input.tags);
  formData.set("sourceUrl", input.sourceUrl);
  formData.set("uploadKey", input.uploadKey);
  formData.set("importId", input.importId);
  // A multipart text field normalizes line endings; a Blob preserves the exact
  // canonical bytes that were hashed in the browser.
  formData.set(
    "canonical",
    new File([input.canonicalXml], "canonical.musicxml", {
      type: "application/xml",
    }),
  );
  formData.set("contentHash", input.contentHash);
  if (input.allowDuplicate) {
    formData.set("allowDuplicate", "1");
  }

  const response = await fetchWithRetry("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as UploadBatchResult;
}

export async function putScorePreview(
  scoreId: string,
  svg: string,
): Promise<void> {
  const response = await fetchWithRetry(`/api/admin/scores/${scoreId}/preview`, {
    method: "PUT",
    headers: { "Content-Type": "image/svg+xml" },
    body: svg,
  });

  if (!response.ok) {
    throw await readError(response);
  }

  try {
    const { uploadPreviewThumb } = await import("@/lib/verovio/preview-thumb");
    await uploadPreviewThumb(scoreId, svg);
  } catch {
    // The catalog falls back to the larger SVG preview.
  }
}

export async function publishImport(importId: string): Promise<number> {
  const response = await fetchWithRetry(
    `/api/admin/imports/${encodeURIComponent(importId)}/publish`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw await readError(response);
  }

  const body = (await response.json()) as { published?: number };
  return body.published ?? 0;
}

export async function fetchScorePreviewInput(
  scoreId: string,
  filename: string,
): Promise<{ filename: string; bytes: ArrayBuffer }> {
  const response = await fetchWithRetry(`/api/admin/scores/${scoreId}/file`, {
    method: "GET",
  });

  if (!response.ok) {
    throw await readError(response);
  }

  return {
    filename,
    bytes: await response.arrayBuffer(),
  };
}
