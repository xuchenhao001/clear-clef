import type {
  PreviewInput,
  PreviewResponse,
} from "./preview-types";
import { VEROVIO_PREVIEW_OPTIONS } from "./options";

type PendingPreview = {
  resolve: (svg: string) => void;
  reject: (error: Error) => void;
  timeout: number;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, PendingPreview>();
let previewChain: Promise<unknown> = Promise.resolve();

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

  worker = new Worker(new URL("./preview-worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<PreviewResponse>) => {
    const entry = pending.get(event.data.id);
    if (!entry) {
      return;
    }
    window.clearTimeout(entry.timeout);
    pending.delete(event.data.id);
    if (event.data.error || !event.data.svg) {
      entry.reject(new Error(event.data.error ?? "Preview failed"));
      return;
    }
    entry.resolve(event.data.svg);
  };

  worker.onerror = (event) => {
    event.preventDefault();
    rejectPending("The preview worker stopped");
    worker?.terminate();
    worker = null;
  };

  return worker;
}

function resetWorker() {
  rejectPending("The preview worker stopped");
  worker?.terminate();
  worker = null;
}

async function renderInWorker(input: PreviewInput): Promise<string> {
  const activeWorker = getWorker();
  const id = nextId;
  nextId += 1;

  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      resetWorker();
      reject(new Error("The page-1 preview took too long to draw"));
    }, 60_000);

    pending.set(id, { resolve, reject, timeout });
    activeWorker.postMessage({
      id,
      filename: input.filename,
      bytes: input.bytes,
    });
  });
}

async function renderOnMainThread(input: PreviewInput): Promise<string> {
  const [{ default: createVerovioModule }, { VerovioToolkit }] = await Promise.all([
    import("verovio/wasm"),
    import("verovio/esm"),
  ]);
  const module = await createVerovioModule();
  const toolkit = new VerovioToolkit(module);
  try {
    toolkit.setOptions(VEROVIO_PREVIEW_OPTIONS);
    const compressed =
      /\.mxl$/i.test(input.filename) ||
      (input.bytes.byteLength >= 2 &&
        new Uint8Array(input.bytes)[0] === 0x50 &&
        new Uint8Array(input.bytes)[1] === 0x4b);
    const loaded = compressed
      ? toolkit.loadZipDataBuffer(input.bytes)
      : toolkit.loadData(new TextDecoder().decode(input.bytes));
    if (!loaded) {
      throw new Error("Could not read this MusicXML file");
    }
    return toolkit.renderToSVG(1);
  } finally {
    toolkit.destroy();
  }
}

async function renderOnce(input: PreviewInput): Promise<string> {
  if (typeof Worker === "undefined") {
    return renderOnMainThread(input);
  }

  try {
    return await renderInWorker(input);
  } catch (error) {
    resetWorker();
    if (typeof window === "undefined") {
      throw error;
    }
    return renderOnMainThread(input);
  }
}

/** Page-1 preview, serialized so one Verovio render runs at a time. */
export function renderPreviewSvg(input: PreviewInput): Promise<string> {
  const task = previewChain.then(() => renderOnce(input));
  previewChain = task.catch(() => undefined);
  return task;
}

export async function renderPreviewFromFile(file: File): Promise<string> {
  return renderPreviewSvg({
    filename: file.name,
    bytes: await file.arrayBuffer(),
  });
}
