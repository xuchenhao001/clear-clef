import type { InspectedScoreSummary } from "@/lib/ingest/inspect";

export type InspectFileOptions = {
  includeCanonical?: boolean;
};

type PendingInspect = {
  resolve: (result: InspectedScoreSummary) => void;
  reject: (error: Error) => void;
  timeout: number;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, PendingInspect>();
let inspectChain: Promise<unknown> = Promise.resolve();

function rejectPending(message: string) {
  for (const [id, entry] of pending) {
    window.clearTimeout(entry.timeout);
    entry.reject(new Error(message));
    pending.delete(id);
  }
}

function getWorker(): Worker {
  if (worker) {
    return worker;
  }

  worker = new Worker(new URL("./inspect-worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (
    event: MessageEvent<
      | {
          id: number;
          result: InspectedScoreSummary;
        }
      | { id: number; error: string }
    >,
  ) => {
    const entry = pending.get(event.data.id);
    if (!entry) {
      return;
    }
    window.clearTimeout(entry.timeout);
    pending.delete(event.data.id);
    if ("error" in event.data) {
      entry.reject(new Error(event.data.error));
      return;
    }
    entry.resolve(event.data.result);
  };

  worker.onerror = (event) => {
    event.preventDefault();
    rejectPending("The file reader stopped");
    worker?.terminate();
    worker = null;
  };

  return worker;
}

function resetWorker() {
  rejectPending("The file reader stopped");
  worker?.terminate();
  worker = null;
}

async function inspectInWorker(
  file: File,
  options: InspectFileOptions,
): Promise<InspectedScoreSummary> {
  const activeWorker = getWorker();
  const id = nextId;
  nextId += 1;

  return new Promise<InspectedScoreSummary>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      resetWorker();
      reject(new Error("Reading this file took too long"));
    }, 60_000);

    pending.set(id, { resolve, reject, timeout });
    activeWorker.postMessage({
      id,
      filename: file.name,
      file,
      includeCanonical: options.includeCanonical ?? false,
    });
  });
}

async function inspectOnMainThread(
  file: File,
  options: InspectFileOptions,
): Promise<InspectedScoreSummary> {
  const [{ inspectMusicXmlBytes }, constants] = await Promise.all([
    import("@/lib/ingest/inspect"),
    import("@/lib/ingest/constants"),
  ]);
  const bytes = new Uint8Array(await file.arrayBuffer());
  return inspectMusicXmlBytes(file.name, bytes, {
    maxUncompressedBytes: constants.MAX_MXL_UNCOMPRESSED_BYTES,
    maxFiles: constants.MAX_MXL_FILES,
    maxUploadBytes: constants.MAX_UPLOAD_BYTES,
    includeCanonical: options.includeCanonical ?? false,
  });
}

async function inspectOnce(
  file: File,
  options: InspectFileOptions,
): Promise<InspectedScoreSummary> {
  if (typeof Worker === "undefined" || typeof window === "undefined") {
    return inspectOnMainThread(file, options);
  }

  try {
    return await inspectInWorker(file, options);
  } catch (error) {
    resetWorker();
    if (typeof window === "undefined") {
      throw error;
    }
    return inspectOnMainThread(file, options);
  }
}

/** Reads a file one at a time so the worker's memory stays bounded. */
export function inspectFile(
  file: File,
  options: InspectFileOptions = {},
): Promise<InspectedScoreSummary> {
  const task = inspectChain.then(() => inspectOnce(file, options));
  inspectChain = task.catch(() => undefined);
  return task;
}

export function disposeInspectWorker() {
  resetWorker();
}
