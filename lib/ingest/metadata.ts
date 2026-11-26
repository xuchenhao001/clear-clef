import { XMLParser } from "fast-xml-parser";
import { IngestValidationError } from "@/lib/ingest/errors";
import { assertSafeXml, sanitizeMusicXml } from "@/lib/ingest/xml";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  processEntities: false,
  htmlEntities: false,
});

/**
 * Only malformed or unusual small files fall back to a full document parse.
 * Large scores are read from their header so a Worker stays well inside its
 * CPU budget.
 */
const FULL_PARSE_FALLBACK_CHARS = 512 * 1024;

export type ScoreCredit = {
  type: string | null;
  words: string[];
};

export type ExtractedScoreMetadata = {
  title: string;
  titleSource: "work" | "movement" | "credit" | "fallback";
  composer: string | null;
  catalogNumber: string | null;
  lyricist: string | null;
  key: string | null;
  timeSignature: string | null;
  defaultVisibleParts: string | null;
  partCount: number;
  measureCount: number;
  rights: string | null;
  sourceUrl: string | null;
  software: string | null;
  credits: ScoreCredit[];
};

type XmlRecord = Record<string, unknown>;

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: unknown): XmlRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as XmlRecord)
    : null;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = decodeBasicEntities(value.trim());
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

function decodeBasicEntities(value: string): string {
  return value.replace(
    /&(amp|lt|gt|quot|apos);/g,
    (match, name: string) => {
      switch (name) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return '"';
        case "apos":
          return "'";
        default:
          return match;
      }
    },
  );
}

function extractCredits(scorePartwise: XmlRecord): ScoreCredit[] {
  const credits: ScoreCredit[] = [];

  for (const credit of asArray(scorePartwise.credit)) {
    const record = asRecord(credit);
    if (!record) {
      continue;
    }
    const typeValue = firstString(record["credit-type"]);
    const words = asArray(record["credit-words"])
      .map((value) => firstString(value))
      .filter((value): value is string => Boolean(value));

    if (words.length > 0) {
      credits.push({
        type: typeValue,
        words,
      });
    }
  }

  return credits;
}

function extractTitleFromCredits(credits: ScoreCredit[]): string | null {
  for (const credit of credits) {
    const type = credit.type?.toLowerCase() ?? "";
    if (type && type !== "title") {
      continue;
    }
    const words = credit.words.join(" ").trim();
    if (words) {
      return words;
    }
  }

  return null;
}

function formatKey(
  fifths: unknown,
  mode: unknown,
  title: string,
): string | null {
  const fifthsNumber =
    typeof fifths === "number"
      ? fifths
      : typeof fifths === "string"
        ? Number.parseInt(fifths, 10)
        : null;
  if (fifthsNumber === null || Number.isNaN(fifthsNumber)) {
    return null;
  }

  const declaredMode =
    typeof mode === "string" && mode.trim()
      ? mode.trim().toLowerCase()
      : null;
  const titleMode = /\b(major|minor)\b/i.exec(title)?.[1]?.toLowerCase() ?? null;

  // Many MusicXML exports omit <mode>. Use an explicit mode first, then a
  // title such as "Prélude in E Minor". Without either, do not guess major:
  // C major and A minor share a signature.
  const modeValue = declaredMode ?? titleMode;
  if (modeValue !== "major" && modeValue !== "minor") {
    return null;
  }

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
    return null;
  }

  if (modeValue === "minor") {
    return `${minorKeys[index]} minor`;
  }
  return `${majorKeys[index]} major`;
}

function rootElementName(xml: string): "score-partwise" | "score-timewise" | null {
  const match = xml.match(/<\s*(score-partwise|score-timewise)\b/i);
  if (!match) {
    return null;
  }
  return match[1].toLowerCase() as "score-partwise" | "score-timewise";
}

function findPartListEnd(xml: string): number {
  const close = /<\/part-list\s*>/i.exec(xml);
  if (close?.index != null) {
    return close.index + close[0].length;
  }

  // A malformed document without a closing part-list still has a useful
  // header; stop before the first musical part.
  const firstPart = /<part(?=[\s>])/i.exec(xml);
  return firstPart?.index ?? xml.length;
}

function parseHeader(
  sanitizedXml: string,
  root: "score-partwise" | "score-timewise",
): XmlRecord | null {
  const end = findPartListEnd(sanitizedXml);
  const headerXml = `${sanitizedXml.slice(0, end)}</${root}>`;
  try {
    const parsed = parser.parse(headerXml) as XmlRecord;
    return asRecord(parsed[root]);
  } catch {
    return null;
  }
}

function parseFull(sanitizedXml: string, root: string): XmlRecord | null {
  try {
    const parsed = parser.parse(sanitizedXml) as XmlRecord;
    return asRecord(parsed[root]);
  } catch {
    return null;
  }
}

function firstPartXml(sanitizedXml: string): string | null {
  const start = /<part(?=[\s>])[^>]*>/i.exec(sanitizedXml);
  if (!start || start.index == null) {
    return null;
  }

  const bodyStart = start.index + start[0].length;
  const end = sanitizedXml.indexOf("</part>", bodyStart);
  if (end < 0) {
    return sanitizedXml.slice(start.index);
  }
  return sanitizedXml.slice(start.index, end + "</part>".length);
}

function countMeasures(partXml: string | null): number {
  if (!partXml) {
    return 0;
  }
  return (partXml.match(/<measure(?=[\s/>])/g) ?? []).length;
}

function firstMeasureXml(partXml: string | null): string | null {
  if (!partXml) {
    return null;
  }
  const open = /<measure(?=[\s/>])[^>]*>/i.exec(partXml);
  if (!open || open.index == null) {
    return null;
  }
  if (open[0].endsWith("/>")) {
    return open[0];
  }
  const close = partXml.indexOf("</measure>", open.index + open[0].length);
  if (close < 0) {
    return open[0];
  }
  return partXml.slice(open.index, close + "</measure>".length);
}

function firstMeasureRecord(measureXml: string | null): XmlRecord | null {
  if (!measureXml) {
    return null;
  }
  try {
    const parsed = parser.parse(
      `<score-partwise><part id="P1">${measureXml}</part></score-partwise>`,
    ) as XmlRecord;
    const partwise = asRecord(parsed["score-partwise"]);
    const part = asRecord(asArray(partwise?.part)[0]);
    return asRecord(asArray(part?.measure)[0]);
  } catch {
    return null;
  }
}

function creditBlocks(xml: string): XmlRecord[] {
  const blocks = xml.match(/<credit(?=[\s>])[\s\S]*?<\/credit>/gi) ?? [];
  const records: XmlRecord[] = [];
  for (const block of blocks) {
    try {
      const parsed = parser.parse(
        `<score-partwise>${block}</score-partwise>`,
      ) as XmlRecord;
      const partwise = asRecord(parsed["score-partwise"]);
      records.push(...asArray(partwise?.credit).map(asRecord).filter(Boolean) as XmlRecord[]);
    } catch {
      // Ignore malformed credit blocks; the header parse remains authoritative.
    }
  }
  return records;
}

function extractLyricist(creators: unknown): string | null {
  let lyricist: string | null = null;
  for (const creator of asArray(creators)) {
    if (typeof creator === "string") {
      continue;
    }
    const record = asRecord(creator);
    if (!record) {
      continue;
    }
    const type = String(record.type ?? "").toLowerCase();
    if (!type.includes("lyric")) {
      continue;
    }
    lyricist = firstString(record["#text"] ?? record) ?? lyricist;
  }
  return lyricist;
}

function extractComposer(creators: unknown): string | null {
  let composer: string | null = null;
  for (const creator of asArray(creators)) {
    if (typeof creator === "string") {
      composer ??= firstString(creator);
      continue;
    }
    const record = asRecord(creator);
    if (!record) {
      continue;
    }
    const type = String(record.type ?? "").toLowerCase();
    if (type.includes("lyric")) {
      continue;
    }
    composer ??= firstString(record["#text"] ?? record);
  }
  return composer;
}

/**
 * Reads the metadata that appears before the notes, plus a small first-measure
 * fragment. This keeps CPU close to linear in the XML size while preserving the
 * previous metadata shape and fallbacks.
 */
export function extractScoreMetadataFromSanitized(
  sanitizedXml: string,
): ExtractedScoreMetadata {
  assertSafeXml(sanitizedXml);

  const root = rootElementName(sanitizedXml);
  if (!root) {
    throw new IngestValidationError("Not a MusicXML partwise/timewise document");
  }

  let scorePartwise = parseHeader(sanitizedXml, root);
  if (!scorePartwise) {
    if (sanitizedXml.length > FULL_PARSE_FALLBACK_CHARS) {
      throw new IngestValidationError("Could not read MusicXML header");
    }
    scorePartwise = parseFull(sanitizedXml, root);
  }
  if (!scorePartwise) {
    throw new IngestValidationError("Not a MusicXML partwise/timewise document");
  }

  const work = asRecord(scorePartwise.work);
  const identification = asRecord(scorePartwise.identification);
  const partList = asRecord(scorePartwise["part-list"]);
  const workTitle = firstString(work?.["work-title"]);
  const catalogNumber = firstString(work?.["work-number"]);
  const movementTitle = firstString(scorePartwise["movement-title"]);
  let credits = extractCredits(scorePartwise);
  if (credits.length === 0) {
    const fallbackCredits = creditBlocks(sanitizedXml);
    if (fallbackCredits.length > 0) {
      credits = extractCredits({ credit: fallbackCredits });
    }
  }
  const creditTitle = extractTitleFromCredits(credits);
  const title = workTitle ?? movementTitle ?? creditTitle ?? "Untitled";
  const titleSource: ExtractedScoreMetadata["titleSource"] = workTitle
    ? "work"
    : movementTitle
      ? "movement"
      : creditTitle
        ? "credit"
        : "fallback";

  const creators = identification?.creator;
  let composer = extractComposer(creators);
  const lyricist = extractLyricist(creators);
  if (!composer) {
    const creditComposer = credits.find((credit) =>
      credit.type?.toLowerCase().includes("composer"),
    );
    if (creditComposer) {
      composer = creditComposer.words.join(" ").trim() || null;
    }
  }

  const partIds = asArray(partList?.["score-part"])
    .map((part) => {
      const record = asRecord(part);
      return record && "id" in record ? String(record.id) : null;
    })
    .filter(Boolean) as string[];

  const partXml = firstPartXml(sanitizedXml);
  const measureXml = firstMeasureXml(partXml);
  const firstMeasure = firstMeasureRecord(measureXml);
  const attributesValue = firstMeasure?.attributes;
  const attributes = asRecord(
    Array.isArray(attributesValue) ? attributesValue[0] : attributesValue,
  );
  const key = asRecord(attributes?.key);
  const time = asRecord(attributes?.time);
  const fifths = key?.fifths;
  const mode = key?.mode;
  const beats = time?.beats;
  const beatType = time?.["beat-type"];
  const timeSignature =
    beats != null && beatType != null
      ? `${beats}/${beatType}`
      : firstString(attributes?.time);

  return {
    title,
    titleSource,
    composer,
    catalogNumber,
    lyricist,
    key: formatKey(fifths, mode, title),
    timeSignature,
    defaultVisibleParts: partIds.length > 0 ? JSON.stringify(partIds) : null,
    partCount: partIds.length,
    measureCount: countMeasures(partXml),
    rights: firstString(identification?.rights),
    sourceUrl: firstString(identification?.source),
    software: firstString(asRecord(identification?.encoding)?.["software"]),
    credits,
  };
}

export function extractScoreMetadata(xml: string): ExtractedScoreMetadata {
  return extractScoreMetadataFromSanitized(sanitizeMusicXml(xml));
}
