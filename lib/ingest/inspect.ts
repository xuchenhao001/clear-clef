import { hashMusicXml } from "@/lib/ingest/hash";
import {
  extractScoreMetadataFromSanitized,
  type ExtractedScoreMetadata,
} from "@/lib/ingest/metadata";
import { readMusicXmlInput } from "@/lib/ingest/mxl";
import {
  humanizeFilename,
  titleMatchesFilename,
} from "@/lib/ingest/suggestions";
import { sanitizeMusicXml } from "@/lib/ingest/xml";

export type InspectedScore = {
  metadata: ExtractedScoreMetadata;
  suggestedTitle: string;
  titleSource: "file" | "filename";
  titleCheck: boolean;
  canonicalXml: string;
};

export type InspectedScoreSummary = Omit<InspectedScore, "canonicalXml"> & {
  contentHash: string;
  canonicalXml?: string;
};

export function inspectMusicXml(
  filename: string,
  xml: string,
): InspectedScore {
  const canonicalXml = sanitizeMusicXml(xml);
  const metadata = extractScoreMetadataFromSanitized(canonicalXml);
  const hasFileTitle =
    metadata.title.trim().length > 0 && metadata.title !== "Untitled";
  const suggestedTitle = hasFileTitle
    ? metadata.title
    : humanizeFilename(filename);

  return {
    metadata,
    suggestedTitle,
    titleSource: hasFileTitle ? "file" : "filename",
    titleCheck:
      metadata.titleSource === "credit" &&
      !titleMatchesFilename(metadata.title, filename),
    canonicalXml,
  };
}

export async function inspectMusicXmlBytes(
  filename: string,
  bytes: Uint8Array,
  options: {
    maxUncompressedBytes: number;
    maxFiles: number;
    maxUploadBytes?: number;
    includeCanonical?: boolean;
  },
): Promise<InspectedScoreSummary> {
  const { xml } = readMusicXmlInput(filename, bytes, options);
  const inspected = inspectMusicXml(filename, xml);
  const contentHash = await hashMusicXml(inspected.canonicalXml);

  if (options.includeCanonical) {
    return { ...inspected, contentHash };
  }

  return {
    metadata: inspected.metadata,
    suggestedTitle: inspected.suggestedTitle,
    titleSource: inspected.titleSource,
    titleCheck: inspected.titleCheck,
    contentHash,
  };
}
