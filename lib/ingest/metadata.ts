import { XMLParser } from "fast-xml-parser";
import { IngestValidationError } from "@/lib/ingest/errors";
import { sanitizeMusicXml } from "@/lib/ingest/xml";

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
  catalogNumber: string | null;
  lyricist: string | null;
  key: string | null;
  timeSignature: string | null;
  defaultVisibleParts: string | null;
};

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

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

function extractTitleFromCredits(scorePartwise: Record<string, unknown>): string | null {
  for (const credit of asArray(scorePartwise.credit)) {
    if (!credit || typeof credit !== "object") {
      continue;
    }
    const record = credit as Record<string, unknown>;
    const type = String(record["credit-type"] ?? "").toLowerCase();
    if (type && type !== "title") {
      continue;
    }
    const words = firstString(record["credit-words"]);
    if (words) {
      return words;
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
  if (fifthsNumber === null || Number.isNaN(fifthsNumber)) {
    return null;
  }

  const modeValue =
    typeof mode === "string" && mode.trim()
      ? mode.toLowerCase()
      : "major";

  const majorKeys = [
    "Cb",
    "Gb",
    "Db",
    "Ab",
    "Eb",
    "Bb",
    "F",
    "C",
    "G",
    "D",
    "A",
    "E",
    "B",
    "F#",
    "C#",
  ];
  const minorKeys = [
    "ab",
    "eb",
    "bb",
    "f",
    "c",
    "g",
    "d",
    "a",
    "e",
    "b",
    "f#",
    "c#",
    "g#",
    "d#",
    "a#",
  ];
  const index = fifthsNumber + 7;
  if (index < 0 || index >= majorKeys.length) {
    return `fifths:${fifthsNumber} ${modeValue}`;
  }

  if (modeValue === "minor") {
    return `${minorKeys[index]} minor`;
  }
  return `${majorKeys[index]} major`;
}

export function extractScoreMetadata(xml: string): ExtractedScoreMetadata {
  const sanitized = sanitizeMusicXml(xml);
  const parsed = parser.parse(sanitized);
  const scorePartwise = parsed["score-partwise"] ?? parsed["score-timewise"];
  if (!scorePartwise) {
    throw new IngestValidationError("Not a MusicXML partwise/timewise document");
  }

  const workTitle = firstString(scorePartwise.work?.["work-title"]);
  const catalogNumber = firstString(scorePartwise.work?.["work-number"]);
  const movementTitle = firstString(scorePartwise["movement-title"]);
  const creditTitle = extractTitleFromCredits(scorePartwise);
  const title = workTitle ?? movementTitle ?? creditTitle ?? "Untitled";

  let composer: string | null = null;
  let lyricist: string | null = null;

  for (const creator of asArray(scorePartwise.identification?.creator)) {
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

  const partIds = asArray(scorePartwise["part-list"]?.["score-part"])
    .map((part) => {
      if (typeof part === "object" && part && "id" in part) {
        return String(part.id);
      }
      return null;
    })
    .filter(Boolean) as string[];

  const firstPart = asArray(scorePartwise.part)[0];
  const firstMeasure = asArray(firstPart?.measure)[0];
  const attributesRaw = firstMeasure?.attributes;
  const attributes = Array.isArray(attributesRaw)
    ? attributesRaw[0]
    : attributesRaw;
  const fifths = attributes?.key?.fifths;
  const mode = attributes?.key?.mode;
  const beats = attributes?.time?.beats;
  const beatType = attributes?.time?.["beat-type"];
  const timeSignature =
    beats != null && beatType != null
      ? `${beats}/${beatType}`
      : firstString(attributes?.time);

  return {
    title,
    composer,
    catalogNumber,
    lyricist,
    key: formatKey(fifths, mode),
    timeSignature,
    defaultVisibleParts: partIds.length > 0 ? JSON.stringify(partIds) : null,
  };
}
