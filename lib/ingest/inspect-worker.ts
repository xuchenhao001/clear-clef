import {
  MAX_MXL_FILES,
  MAX_MXL_UNCOMPRESSED_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import { inspectMusicXmlBytes } from "@/lib/ingest/inspect";

type InspectRequest = {
  id: number;
  filename: string;
  file: File;
  includeCanonical: boolean;
};

type InspectResponse =
  | {
      id: number;
      result: Awaited<ReturnType<typeof inspectMusicXmlBytes>>;
    }
  | {
      id: number;
      error: string;
    };

type WorkerScope = {
  onmessage: ((event: MessageEvent<InspectRequest>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: InspectResponse) => void;
};

const scope = self as unknown as WorkerScope;

scope.onmessage = async (event: MessageEvent<InspectRequest>) => {
  const { id, filename, file, includeCanonical } = event.data;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await inspectMusicXmlBytes(filename, bytes, {
      maxUncompressedBytes: MAX_MXL_UNCOMPRESSED_BYTES,
      maxFiles: MAX_MXL_FILES,
      maxUploadBytes: MAX_UPLOAD_BYTES,
      includeCanonical,
    });
    scope.postMessage({ id, result });
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : "Could not read this file",
    });
  }
};

scope.onerror = (event: ErrorEvent) => {
  event.preventDefault();
};
