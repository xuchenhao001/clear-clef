import { unzipSync, type UnzipFileInfo } from "fflate";
import { MAX_UPLOAD_BYTES } from "@/lib/ingest/constants";
import { IngestValidationError } from "@/lib/ingest/errors";
import { decodeXmlBytes } from "@/lib/ingest/xml";

export { IngestValidationError } from "@/lib/ingest/errors";

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

type ArchiveEntry = {
  name: string;
  originalSize: number;
};

function validateEntry(
  entry: UnzipFileInfo,
  state: { count: number; total: number },
  options: { maxUncompressedBytes: number; maxFiles: number },
): void {
  state.count += 1;
  if (state.count > options.maxFiles) {
    throw new IngestValidationError(".mxl archive contains too many files");
  }
  if (
    entry.name.includes("..") ||
    entry.name.startsWith("/") ||
    entry.name.includes("\\")
  ) {
    throw new IngestValidationError(".mxl archive contains unsafe paths");
  }
  state.total += entry.originalSize;
  if (state.total > options.maxUncompressedBytes) {
    throw new IngestValidationError(
      ".mxl archive is too large when uncompressed",
    );
  }
}

function readArchive(
  buffer: Uint8Array,
  options: { maxUncompressedBytes: number; maxFiles: number },
  predicate: (entry: ArchiveEntry) => boolean,
): {
  entries: Record<string, Uint8Array>;
  names: string[];
} {
  const names: string[] = [];
  const state = { count: 0, total: 0 };
  const entries = unzipSync(buffer, {
    filter: (entry) => {
      validateEntry(entry, state, options);
      names.push(entry.name);
      return predicate(entry);
    },
  });
  return { entries, names };
}

function findMusicXmlEntry(
  names: string[],
  rootfile: string,
): string | undefined {
  const normalizedRoot = rootfile.replace(/^\/+/, "");
  const exact = names.find((name) => name === normalizedRoot);
  if (exact) {
    return exact;
  }
  return names.find(
    (name) => name.toLowerCase() === normalizedRoot.toLowerCase(),
  );
}

function findFallbackMusicXmlEntry(names: string[]): string | null {
  const candidates = names.filter(
    (name) =>
      !name.toLowerCase().startsWith("meta-inf/") &&
      /\.(musicxml|xml)$/i.test(name),
  );

  return candidates.length === 1 ? candidates[0] : null;
}

export function extractMusicXmlFromMxl(
  buffer: Uint8Array,
  options: {
    maxUncompressedBytes: number;
    maxFiles: number;
  },
): { xml: string } {
  let archive: ReturnType<typeof readArchive>;
  try {
    // First pass: validate every declaration and extract only the small
    // container. No score XML is decompressed until the rootfile is known.
    archive = readArchive(buffer, options, (entry) =>
      entry.name.toLowerCase().endsWith("meta-inf/container.xml"),
    );
  } catch (error) {
    if (error instanceof IngestValidationError) {
      throw error;
    }
    throw new IngestValidationError("Invalid .mxl archive");
  }

  if (archive.names.length === 0) {
    throw new IngestValidationError(".mxl archive is empty");
  }

  const containerName = archive.names.find((name) =>
    name.toLowerCase().endsWith("meta-inf/container.xml"),
  );
  const containerEntry = containerName ? archive.entries[containerName] : null;

  let rootName: string | null = null;
  if (containerEntry) {
    const containerXml = decodeXmlBytes(containerEntry);
    const rootfileMatch = containerXml.match(
      /full-path="([^"]+\.(?:musicxml|xml))"/i,
    );
    const rootfile = rootfileMatch?.[1];
    if (!rootfile) {
      throw new IngestValidationError(
        "Could not locate MusicXML rootfile in .mxl",
      );
    }
    rootName = findMusicXmlEntry(archive.names, rootfile) ?? null;
    if (!rootName) {
      throw new IngestValidationError(
        "MusicXML rootfile missing from .mxl archive",
      );
    }
  } else {
    rootName = findFallbackMusicXmlEntry(archive.names);
    if (!rootName) {
      throw new IngestValidationError("Missing META-INF/container.xml in .mxl");
    }
  }

  let extracted: Record<string, Uint8Array>;
  try {
    // Second pass: decompress only the rootfile. Other entries (images,
    // thumbnails) do not cost CPU or memory.
    extracted = readArchive(
      buffer,
      options,
      (entry) => entry.name === rootName,
    ).entries;
  } catch (error) {
    if (error instanceof IngestValidationError) {
      throw error;
    }
    throw new IngestValidationError("Invalid .mxl archive");
  }

  const rootEntry = rootName ? extracted[rootName] : null;
  if (!rootEntry) {
    throw new IngestValidationError("MusicXML rootfile missing from .mxl archive");
  }
  if (rootEntry.length > options.maxUncompressedBytes) {
    throw new IngestValidationError(".mxl archive is too large when uncompressed");
  }

  return {
    xml: decodeXmlBytes(rootEntry),
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
    xml: decodeXmlBytes(buffer),
    originalExtension: extension === "xml" ? "musicxml" : extension,
  };
}
