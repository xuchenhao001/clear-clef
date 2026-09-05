const DOCTYPE_PATTERN = /<!DOCTYPE[\s\S]*?>/i;
const DOCTYPE_INTERNAL_SUBSET_PATTERN = /<!DOCTYPE[\s\S]*?\[[\s\S]*?\]>/i;
const ENTITY_PATTERN = /<!ENTITY[\s\S]*?>/i;

export class XmlSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XmlSecurityError";
  }
}

export function stripUtf8Bom(xml: string): string {
  return xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml;
}

export function decodeXmlText(bytes: Uint8Array): string {
  return stripUtf8Bom(new TextDecoder().decode(bytes));
}

export function stripDoctype(xml: string): string {
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
