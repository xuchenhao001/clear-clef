import { IngestValidationError } from "@/lib/ingest/errors";

const DOCTYPE_PATTERN = /<!DOCTYPE[\s\S]*?>/i;
const DOCTYPE_INTERNAL_SUBSET_PATTERN = /<!DOCTYPE[\s\S]*?\[[\s\S]*?\]>/i;
const ENTITY_PATTERN = /<!ENTITY[\s\S]*?>/i;
const XML_DECLARATION_ENCODING_PATTERN = /encoding\s*=\s*["']([^"']+)["']/i;

export class XmlSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XmlSecurityError";
  }
}

function stripUtf8Bom(xml: string): string {
  return xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml;
}

function bomEncoding(bytes: Uint8Array): "utf-8" | "utf-16le" | "utf-16be" | null {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8";
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "utf-16le";
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "utf-16be";
  }
  return null;
}

function declaredEncoding(bytes: Uint8Array): string | null {
  // XML declarations are ASCII-compatible for the encodings MusicXML uses.
  const prefix = new TextDecoder("utf-8", { fatal: false }).decode(
    bytes.slice(0, 512),
  );
  const match = prefix.match(XML_DECLARATION_ENCODING_PATTERN);
  return match?.[1]?.trim() ?? null;
}

function normalizeEncoding(label: string): string {
  const normalized = label.toLowerCase().replace(/_/g, "-");
  switch (normalized) {
    case "utf-8":
    case "utf8":
      return "utf-8";
    case "utf-16":
    case "utf-16le":
    case "utf16":
    case "utf16le":
      return "utf-16le";
    case "utf-16be":
    case "utf16be":
      return "utf-16be";
    case "iso-8859-1":
    case "iso8859-1":
    case "latin1":
    case "latin-1":
      return "iso-8859-1";
    case "windows-1252":
    case "cp1252":
      return "windows-1252";
    default:
      return normalized;
  }
}

/**
 * Decodes a MusicXML byte stream according to its BOM or declaration. Unknown
 * or malformed encodings are rejected rather than silently replaced.
 */
export function decodeXmlBytes(bytes: Uint8Array): string {
  const bom = bomEncoding(bytes);
  const declared = bom ? null : declaredEncoding(bytes);
  const encoding = bom ?? normalizeEncoding(declared ?? "utf-8");

  if (encoding === "utf-16le" && !bom && declared?.toLowerCase() === "utf-16") {
    throw new IngestValidationError(
      "UTF-16 MusicXML requires a byte-order mark",
    );
  }

  try {
    const text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
    return stripUtf8Bom(text);
  } catch {
    throw new IngestValidationError(
      `Unsupported or invalid XML encoding: ${encoding}`,
    );
  }
}

function stripDoctype(xml: string): string {
  return xml.replace(DOCTYPE_PATTERN, "");
}

export function assertSafeXml(xml: string): void {
  if (ENTITY_PATTERN.test(xml)) {
    throw new XmlSecurityError("ENTITY declarations are not allowed");
  }
  if (DOCTYPE_INTERNAL_SUBSET_PATTERN.test(xml)) {
    throw new XmlSecurityError("DTD internal subsets are not allowed");
  }
}

export function sanitizeMusicXml(xml: string): string {
  assertSafeXml(xml);
  return stripUtf8Bom(stripDoctype(xml)).trim();
}
