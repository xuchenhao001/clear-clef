import { eq } from "drizzle-orm";
import { getDbAsync } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { IngestValidationError } from "@/lib/ingest/errors";
import {
  MAX_MXL_FILES,
  MAX_MXL_UNCOMPRESSED_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import {
  readMusicXmlInput,
} from "@/lib/ingest/mxl";
import { extractScoreMetadata } from "@/lib/ingest/metadata";
import { sanitizeMusicXml, XmlSecurityError } from "@/lib/ingest/xml";
import { revalidateScorePaths } from "@/lib/scores/revalidate";
import {
  deleteR2Object,
  putScoreMusicXmlObjects,
  toOriginalExtension,
} from "@/lib/scores/r2";
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
  catalogNumber?: string | null;
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
  const catalogNumber =
    input.catalogNumber?.trim() || metadata.catalogNumber?.trim() || null;
  const id = crypto.randomUUID();
  const slug = await createUniqueSlug(metadata.title, slugExists);
  const extension = toOriginalExtension(originalExtension);
  const { r2Key, canonicalR2Key } = await putScoreMusicXmlObjects(
    id,
    extension,
    input.bytes,
    canonicalXml,
  );

  const db = await getDbAsync();
  await db.insert(scores).values({
    id,
    slug,
    title: metadata.title,
    composer: metadata.composer,
    catalogNumber,
    lyricist: metadata.lyricist,
    sourceUrl: input.sourceUrl ?? null,
    license: input.license.trim(),
    key: metadata.key,
    timeSignature: metadata.timeSignature,
    difficulty: null,
    instrument: "piano",
    format: "musicxml",
    r2Key,
    canonicalR2Key,
    previewR2Key: null,
    defaultVisibleParts: metadata.defaultVisibleParts,
    visibility: input.visibility,
    ownerId: input.ownerId,
    createdAt: new Date(),
  });

  if (input.tagList?.length) {
    await attachTagsToScore(id, input.tagList);
  }

  revalidateScorePaths(slug);

  return { id, slug, title: metadata.title };
}

export type ReplaceScoreFileResult = {
  r2Key: string;
  canonicalR2Key: string;
  defaultVisibleParts: string | null;
};

export async function replaceScoreFile(
  scoreId: string,
  filename: string,
  bytes: Uint8Array,
): Promise<ReplaceScoreFileResult> {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new IngestValidationError(`File exceeds ${MAX_UPLOAD_BYTES} byte limit`);
  }

  const db = await getDbAsync();
  const existing = await db.select().from(scores).where(eq(scores.id, scoreId)).get();
  if (!existing) {
    throw new IngestValidationError("Score not found");
  }

  const { xml, originalExtension } = readMusicXmlInput(filename, bytes, {
    maxUncompressedBytes: MAX_MXL_UNCOMPRESSED_BYTES,
    maxFiles: MAX_MXL_FILES,
  });

  const metadata = extractScoreMetadata(xml);
  const canonicalXml = sanitizeMusicXml(xml);
  const extension = toOriginalExtension(originalExtension);
  const { r2Key, canonicalR2Key } = await putScoreMusicXmlObjects(
    scoreId,
    extension,
    bytes,
    canonicalXml,
  );

  if (existing.r2Key && existing.r2Key !== r2Key) {
    await deleteR2Object(existing.r2Key);
  }

  await db
    .update(scores)
    .set({
      r2Key,
      canonicalR2Key,
      defaultVisibleParts: metadata.defaultVisibleParts,
    })
    .where(eq(scores.id, scoreId));

  return {
    r2Key,
    canonicalR2Key,
    defaultVisibleParts: metadata.defaultVisibleParts,
  };
}

export function mapIngestError(error: unknown): { status: number; message: string } {
  if (error instanceof IngestValidationError) {
    const status = error.message === "Score not found" ? 404 : 400;
    return { status, message: error.message };
  }
  if (error instanceof XmlSecurityError) {
    return { status: 400, message: error.message };
  }
  return { status: 500, message: "Upload failed" };
}
