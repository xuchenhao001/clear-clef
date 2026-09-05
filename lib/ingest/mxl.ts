import { unzipSync } from "fflate";
import { MAX_UPLOAD_BYTES } from "@/lib/ingest/constants";

export class IngestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestValidationError";
  }
}

export function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1)! : "";
}

export function assertAcceptedExtension(filename: string): string {
  const extension = getExtension(filename);
  if (!["mxl", "musicxml", "xml"].includes(extension)) {
    throw new IngestValidationError(
      "Only .mxl, .musicxml, and .xml files are accepted",
    );
  }
  return extension;
}

export function assertFileSize(size: number, maxBytes: number): void {
  if (size <= 0) {
    throw new IngestValidationError("Uploaded file is empty");
  }
  if (size > maxBytes) {
    throw new IngestValidationError(`File exceeds ${maxBytes} byte limit`);
  }
}

export function extractMusicXmlFromMxl(
  buffer: Uint8Array,
  options: {
    maxUncompressedBytes: number;
    maxFiles: number;
  },
): { xml: string; originalName: string } {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(buffer);
  } catch {
    throw new IngestValidationError("Invalid .mxl archive");
  }

  const names = Object.keys(entries);
  if (names.length === 0) {
    throw new IngestValidationError(".mxl archive is empty");
  }
  if (names.length > options.maxFiles) {
    throw new IngestValidationError(".mxl archive contains too many files");
  }

  let totalUncompressed = 0;
  for (const name of names) {
    if (name.includes("..") || name.startsWith("/") || name.includes("\\")) {
      throw new IngestValidationError(".mxl archive contains unsafe paths");
    }
    totalUncompressed += entries[name].length;
    if (totalUncompressed > options.maxUncompressedBytes) {
      throw new IngestValidationError(".mxl archive is too large when uncompressed");
    }
  }

  const containerEntry = names.find((name) =>
    name.toLowerCase().endsWith("meta-inf/container.xml"),
  );
  if (!containerEntry) {
    throw new IngestValidationError("Missing META-INF/container.xml in .mxl");
  }

  const containerXml = new TextDecoder().decode(entries[containerEntry]);
  const rootfileMatch = containerXml.match(
    /full-path="([^"]+\.(?:musicxml|xml))"/i,
  );
  const rootfile = rootfileMatch?.[1];
  if (!rootfile) {
    throw new IngestValidationError("Could not locate MusicXML rootfile in .mxl");
  }

  const normalizedRoot = rootfile.replace(/^\/+/, "");
  const musicXmlEntry =
    entries[normalizedRoot] ??
    entries[names.find((name) => name.toLowerCase().endsWith(normalizedRoot.toLowerCase())) ?? ""];

  if (!musicXmlEntry) {
    throw new IngestValidationError("MusicXML rootfile missing from .mxl archive");
  }

  return {
    xml: new TextDecoder().decode(musicXmlEntry),
    originalName: normalizedRoot,
  };
}

export function readMusicXmlInput(
  filename: string,
  buffer: Uint8Array,
  options: {
    maxUncompressedBytes: number;
    maxFiles: number;
    maxUploadBytes?: number;
  },
): { xml: string; originalExtension: string } {
  assertFileSize(buffer.byteLength, options.maxUploadBytes ?? MAX_UPLOAD_BYTES);
  const extension = assertAcceptedExtension(filename);

  if (extension === "mxl") {
    const extracted = extractMusicXmlFromMxl(buffer, options);
    return { xml: extracted.xml, originalExtension: "mxl" };
  }

  return {
    xml: new TextDecoder().decode(buffer),
    originalExtension: extension === "xml" ? "musicxml" : extension,
  };
}
