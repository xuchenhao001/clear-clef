import { VEROVIO_PREVIEW_OPTIONS } from "./options";
import type {
  PreviewRequest,
  PreviewResponse,
} from "./preview-types";

type WorkerScope = {
  onmessage: ((event: MessageEvent<PreviewRequest>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: PreviewResponse) => void;
};

const scope = self as unknown as WorkerScope;

type PreviewToolkit = {
  setOptions: (options: Record<string, unknown>) => void;
  loadZipDataBuffer: (buffer: ArrayBuffer) => boolean;
  loadData: (xml: string) => boolean;
  renderToSVG: (page: number) => string;
  destroy: () => void;
};

let toolkitPromise: Promise<{ toolkit: PreviewToolkit }> | null = null;
let renderedCount = 0;

async function getToolkit() {
  if (!toolkitPromise) {
    toolkitPromise = (async () => {
      const [{ default: createVerovioModule }, { VerovioToolkit }] =
        await Promise.all([import("verovio/wasm"), import("verovio/esm")]);
      const module = await createVerovioModule();
      const toolkit = new VerovioToolkit(module);
      toolkit.setOptions(VEROVIO_PREVIEW_OPTIONS);
      return { toolkit };
    })();
  }
  return toolkitPromise;
}

async function renderPreview(request: PreviewRequest): Promise<string> {
  const { toolkit } = await getToolkit();
  const compressed =
    /\.mxl$/i.test(request.filename) ||
    (request.bytes.byteLength >= 2 &&
      new Uint8Array(request.bytes)[0] === 0x50 &&
      new Uint8Array(request.bytes)[1] === 0x4b);

  const loaded = compressed
    ? toolkit.loadZipDataBuffer(request.bytes)
    : toolkit.loadData(new TextDecoder().decode(request.bytes));

  if (!loaded) {
    throw new Error("Could not read this MusicXML file");
  }

  const svg = toolkit.renderToSVG(1);
  renderedCount += 1;
  if (renderedCount % 20 === 0) {
    toolkit.destroy();
    toolkitPromise = null;
  }
  return svg;
}

scope.onmessage = async (event: MessageEvent<PreviewRequest>) => {
  const { id, filename, bytes } = event.data;
  try {
    const svg = await renderPreview({ id, filename, bytes });
    scope.postMessage({ id, svg });
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : "Preview failed",
    });
  }
};

scope.onerror = (event: ErrorEvent) => {
  event.preventDefault();
};
