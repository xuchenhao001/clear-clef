const encoder = new TextEncoder();

/** SHA-256 of the sanitized canonical MusicXML, as lowercase hex. */
export async function hashMusicXml(xml: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(xml));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
