import { XMLParser } from "fast-xml-parser";

const DTD_PATTERN = /<!DOCTYPE[\s\S]*?>/i;
const ENTITY_PATTERN = /<!ENTITY[\s\S]*?>/i;

export class XmlSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XmlSecurityError";
  }
}

export function assertSafeXml(xml: string): void {
  if (DTD_PATTERN.test(xml)) {
    throw new XmlSecurityError("DTD declarations are not allowed");
  }
  if (ENTITY_PATTERN.test(xml)) {
    throw new XmlSecurityError("ENTITY declarations are not allowed");
  }
  if (/&\w+;/.test(xml) && /<!ENTITY/i.test(xml)) {
    throw new XmlSecurityError("External entities are not allowed");
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  processEntities: false,
  htmlEntities: false,
});

export type ExtractedScoreMetadata = {
  title: string;
  composer: string | null;
  lyricist: string | null;
  key: string | null;
  timeSignature: string | null;
  defaultVisibleParts: string | null;
};

function firstString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = firstString(item);
      if (result) {
        return result;
      }
    }
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      const result = firstString(nested);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function formatKey(fifths: unknown, mode: unknown): string | null {
  const fifthsNumber =
    typeof fifths === "number"
      ? fifths
      : typeof fifths === "string"
        ? Number.parseInt(fifths, 10)
        : null;
  const modeValue = typeof mode === "string" ? mode.toLowerCase() : null;
  if (fifthsNumber === null || Number.isNaN(fifthsNumber) || !modeValue) {
    return null;
  }

  const majorKeys = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
  const minorKeys = ["a", "e", "b", "f#", "c#", "g#", "d#", "a#"];
  const index = fifthsNumber + (modeValue === "minor" ? 3 : 0);
  if (modeValue === "minor") {
    return `${minorKeys[index] ?? `fifths:${fifthsNumber}`} minor`;
  }
  return `${majorKeys[index] ?? `fifths:${fifthsNumber}`} major`;
}

export function extractScoreMetadata(xml: string): ExtractedScoreMetadata {
  assertSafeXml(xml);
  const parsed = parser.parse(xml);
  const scorePartwise = parsed["score-partwise"] ?? parsed["score-timewise"];
  if (!scorePartwise) {
    throw new XmlSecurityError("Not a MusicXML partwise/timewise document");
  }

  const workTitle = firstString(scorePartwise.work?.["work-title"]);
  const movementTitle = firstString(scorePartwise.movementTitle);
  const title = workTitle ?? movementTitle ?? "Untitled";

  const creators = scorePartwise.identification?.creator;
  const creatorList = Array.isArray(creators) ? creators : creators ? [creators] : [];
  let composer: string | null = null;
  let lyricist: string | null = null;

  for (const creator of creatorList) {
    if (typeof creator === "string") {
      composer ??= creator;
      continue;
    }
    if (creator && typeof creator === "object") {
      const record = creator as Record<string, unknown>;
      const type = String(record.type ?? "").toLowerCase();
      const value = firstString(record["#text"] ?? record);
      if (!value) {
        continue;
      }
      if (type.includes("lyric")) {
        lyricist = value;
      } else {
        composer ??= value;
      }
    }
  }

  const partList = scorePartwise.partList?.scorePart;
  const parts = Array.isArray(partList) ? partList : partList ? [partList] : [];
  const partIds = parts
    .map((part) => {
      if (typeof part === "object" && part && "id" in part) {
        return String(part.id);
      }
      return null;
    })
    .filter(Boolean) as string[];

  const firstPart = scorePartwise.part;
  const partArray = Array.isArray(firstPart) ? firstPart : firstPart ? [firstPart] : [];
  const firstMeasure = partArray[0]?.measure;
  const measureArray = Array.isArray(firstMeasure)
    ? firstMeasure
    : firstMeasure
      ? [firstMeasure]
      : [];
  const attributesRaw = measureArray[0]?.attributes;
  const attributes = Array.isArray(attributesRaw)
    ? attributesRaw[0]
    : attributesRaw;
  const fifths = attributes?.key?.fifths;
  const mode = attributes?.key?.mode;
  const beats = attributes?.time?.beats;
  const beatType =
    attributes?.time?.beatType ?? attributes?.time?.["beat-type"];
  const timeSignature =
    beats != null && beatType != null
      ? `${beats}/${beatType}`
      : firstString(attributes?.time);

  return {
    title,
    composer,
    lyricist,
    key: formatKey(fifths, mode),
    timeSignature,
    defaultVisibleParts: partIds.length > 0 ? JSON.stringify(partIds) : null,
  };
}

export function normalizeCanonicalMusicXml(xml: string): string {
  assertSafeXml(xml);
  return xml.trim();
}
