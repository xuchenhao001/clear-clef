import { revalidatePath } from "next/cache";
import { getDbAsync } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { getScoresBucket } from "@/lib/cloudflare";
import {
  MAX_MXL_FILES,
  MAX_MXL_UNCOMPRESSED_BYTES,
  MAX_UPLOAD_BYTES,
  MUSICXML_COMPRESSED_MIME,
  MUSICXML_UNCOMPRESSED_MIME,
} from "@/lib/ingest/constants";
import {
  IngestValidationError,
  readMusicXmlInput,
} from "@/lib/ingest/mxl";
import { extractScoreMetadata } from "@/lib/ingest/metadata";
import { sanitizeMusicXml, XmlSecurityError } from "@/lib/ingest/xml";
import { attachTagsToScore } from "@/lib/scores/tags";
import { createUniqueSlug } from "@/lib/scores/slug";
import { slugExists } from "@/lib/scores/queries";

export type UploadScoreInput = {
  filename: string;
  bytes: Uint8Array;
  license: string;
  visibility: "public" | "unlisted" | "private";
  ownerId: string;
  sourceUrl?: string | null;
  tagList?: string[];
};

export type UploadScoreResult = {
  id: string;
  slug: string;
  title: string;
};

export async function uploadScore(
  input: UploadScoreInput,
): Promise<UploadScoreResult> {
  if (!input.license.trim()) {
    throw new IngestValidationError("License is required");
  }

  if (input.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new IngestValidationError(`File exceeds ${MAX_UPLOAD_BYTES} byte limit`);
  }

  const { xml, originalExtension } = readMusicXmlInput(input.filename, input.bytes, {
    maxUncompressedBytes: MAX_MXL_UNCOMPRESSED_BYTES,
    maxFiles: MAX_MXL_FILES,
  });

  const metadata = extractScoreMetadata(xml);
  const canonicalXml = sanitizeMusicXml(xml);
  const id = crypto.randomUUID();
  const slug = await createUniqueSlug(metadata.title, slugExists);
  const originalKey =
    originalExtension === "mxl"
      ? `scores/${id}/original.mxl`
      : `scores/${id}/original.musicxml`;
  const canonicalKey = `scores/${id}/canonical.musicxml`;
  const bucket = await getScoresBucket();

  await bucket.put(originalKey, input.bytes, {
    httpMetadata: {
      contentType:
        originalExtension === "mxl"
          ? MUSICXML_COMPRESSED_MIME
          : MUSICXML_UNCOMPRESSED_MIME,
    },
  });

  await bucket.put(canonicalKey, canonicalXml, {
    httpMetadata: {
      contentType: MUSICXML_UNCOMPRESSED_MIME,
    },
  });

  const db = await getDbAsync();
  await db.insert(scores).values({
    id,
    slug,
    title: metadata.title,
    composer: metadata.composer,
    lyricist: metadata.lyricist,
    sourceUrl: input.sourceUrl ?? null,
    license: input.license.trim(),
    key: metadata.key,
    timeSignature: metadata.timeSignature,
    difficulty: null,
    instrument: "piano",
    format: "musicxml",
    r2Key: originalKey,
    canonicalR2Key: canonicalKey,
    previewR2Key: null,
    defaultVisibleParts: metadata.defaultVisibleParts,
    visibility: input.visibility,
    ownerId: input.ownerId,
    createdAt: new Date(),
  });

  if (input.tagList?.length) {
    await attachTagsToScore(id, input.tagList);
  }

  revalidatePath("/");
  revalidatePath(`/scores/${slug}`);

  return { id, slug, title: metadata.title };
}

export function mapIngestError(error: unknown): { status: number; message: string } {
  if (
    error instanceof IngestValidationError ||
    error instanceof XmlSecurityError
  ) {
    return { status: 400, message: error.message };
  }
  return { status: 500, message: "Upload failed" };
}
