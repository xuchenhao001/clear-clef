import { getScoresBucket } from "@/lib/cloudflare";
import {
  MUSICXML_COMPRESSED_MIME,
  MUSICXML_UNCOMPRESSED_MIME,
} from "@/lib/ingest/constants";

export type OriginalExtension = "mxl" | "musicxml";

export function scoreOriginalR2Key(
  scoreId: string,
  originalExtension: OriginalExtension,
): string {
  return originalExtension === "mxl"
    ? `scores/${scoreId}/original.mxl`
    : `scores/${scoreId}/original.musicxml`;
}

export function scoreCanonicalR2Key(scoreId: string): string {
  return `scores/${scoreId}/canonical.musicxml`;
}

export function toOriginalExtension(extension: string): OriginalExtension {
  return extension === "mxl" ? "mxl" : "musicxml";
}

export async function putScoreMusicXmlObjects(
  scoreId: string,
  originalExtension: OriginalExtension,
  bytes: Uint8Array,
  canonicalXml: string,
): Promise<{ r2Key: string; canonicalR2Key: string }> {
  const r2Key = scoreOriginalR2Key(scoreId, originalExtension);
  const canonicalR2Key = scoreCanonicalR2Key(scoreId);
  const bucket = await getScoresBucket();

  await bucket.put(r2Key, bytes, {
    httpMetadata: {
      contentType:
        originalExtension === "mxl"
          ? MUSICXML_COMPRESSED_MIME
          : MUSICXML_UNCOMPRESSED_MIME,
    },
  });

  await bucket.put(canonicalR2Key, canonicalXml, {
    httpMetadata: {
      contentType: MUSICXML_UNCOMPRESSED_MIME,
    },
  });

  return { r2Key, canonicalR2Key };
}

export async function deleteR2Object(key: string | null | undefined) {
  if (!key) {
    return;
  }
  const bucket = await getScoresBucket();
  await bucket.delete(key);
}

/** Delete all R2 objects under scores/{id}/ (handles truncated list). */
export async function deleteScoreObjects(scoreId: string) {
  const prefix = `scores/${scoreId}/`;
  const bucket = await getScoresBucket();
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix, cursor });
    if (listed.objects.length > 0) {
      await Promise.all(listed.objects.map((object) => bucket.delete(object.key)));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
}
