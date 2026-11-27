import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { DuplicateScoreError } from "@/lib/ingest/duplicate-error";
import { IngestValidationError } from "@/lib/ingest/errors";
import {
  MAX_CANONICAL_BYTES,
  MAX_MXL_FILES,
  MAX_MXL_UNCOMPRESSED_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import { hashMusicXml } from "@/lib/ingest/hash";
import {
  assertAcceptedExtension,
  assertFileSize,
  readMusicXmlInput,
} from "@/lib/ingest/mxl";
import {
  extractScoreMetadataFromSanitized,
  type ExtractedScoreMetadata,
} from "@/lib/ingest/metadata";
import { sanitizeMusicXml, XmlSecurityError } from "@/lib/ingest/xml";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { splitComposerAndArranger } from "@/lib/catalog/composers";
import {
  canonicalLicense,
  canonicalDifficulty,
  canonicalKey,
} from "@/lib/catalog/vocab";
import { sortTitle, workKey } from "@/lib/catalog/normalize";
import {
  deleteR2Object,
  putScoreMusicXmlObjects,
  scoreCanonicalR2Key,
  scoreOriginalR2Key,
  toOriginalExtension,
} from "@/lib/scores/r2";
import { attachTagsToScore } from "@/lib/scores/tags";
import { getOrCreateComposer } from "@/lib/scores/composers";
import { createUniqueSlug } from "@/lib/scores/slug";
import { normalizeSourceUrl } from "@/lib/scores/source-url";
import { refreshSearchDocument } from "@/lib/search";
import {
  findScoreByContentHash,
  type ScoreMatch,
} from "@/lib/scores/duplicates";

const CLIENT_KEY_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

export type UploadScoreInput = {
  filename: string;
  bytes: Uint8Array;
  license: string;
  visibility: "public" | "unlisted" | "private";
  ownerId: string;
  sourceUrl?: string | null;
  catalogNumber?: string | null;
  tagList?: string[];
  title?: string;
  composer?: string | null;
  arranger?: string | null;
  editionLabel?: string | null;
  workKey?: string | null;
  difficulty?: string | null;
  key?: string | null;
  uploadKey?: string | null;
  importId?: string | null;
  allowDuplicate?: boolean;
  canonicalXml?: string | null;
  contentHash?: string | null;
};

export type UploadScoreResult = {
  id: string;
  slug: string;
  title: string;
  created: boolean;
};

const CONTENT_HASH_PATTERN = /^[a-f0-9]{64}$/;
const CANONICAL_ROOT_PATTERN = /<\s*score-(?:partwise|timewise)\b/i;

function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveMusicXmlInput(input: {
  filename: string;
  bytes: Uint8Array;
  canonicalXml?: string | null;
}): {
  canonicalXml: string;
  metadata: ExtractedScoreMetadata;
  originalExtension: string;
} {
  const extension = assertAcceptedExtension(input.filename);
  const providedCanonical = input.canonicalXml?.trim();

  if (providedCanonical) {
    const canonicalXml = sanitizeMusicXml(providedCanonical);
    if (canonicalXml.length > MAX_CANONICAL_BYTES) {
      throw new IngestValidationError("Canonical MusicXML is too large");
    }
    if (!CANONICAL_ROOT_PATTERN.test(canonicalXml)) {
      throw new IngestValidationError("Not a MusicXML partwise/timewise document");
    }
    return {
      canonicalXml,
      metadata: extractScoreMetadataFromSanitized(canonicalXml),
      originalExtension: extension,
    };
  }

  const { xml, originalExtension } = readMusicXmlInput(
    input.filename,
    input.bytes,
    {
      maxUncompressedBytes: MAX_MXL_UNCOMPRESSED_BYTES,
      maxFiles: MAX_MXL_FILES,
    },
  );
  const canonicalXml = sanitizeMusicXml(xml);
  if (canonicalXml.length > MAX_CANONICAL_BYTES) {
    throw new IngestValidationError("Canonical MusicXML is too large");
  }
  return {
    canonicalXml,
    metadata: extractScoreMetadataFromSanitized(canonicalXml),
    originalExtension,
  };
}

function validateClientKey(
  value: string | null | undefined,
  label: string,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (!CLIENT_KEY_PATTERN.test(trimmed)) {
    throw new IngestValidationError(`Invalid ${label}`);
  }
  return trimmed;
}

function uniqueConstraintField(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  if (!/unique constraint/i.test(message)) {
    return null;
  }
  if (message.includes("scores.upload_key")) {
    return "scores.upload_key";
  }
  if (message.includes("scores.slug")) {
    return "scores.slug";
  }
  return null;
}

async function deleteObjects(keys: Array<string | null | undefined>) {
  await Promise.all(keys.map((key) => deleteR2Object(key).catch(() => undefined)));
}

export async function uploadScore(
  input: UploadScoreInput,
): Promise<UploadScoreResult> {
  if (!input.license.trim()) {
    throw new IngestValidationError("License is required");
  }

  assertFileSize(input.bytes.byteLength, MAX_UPLOAD_BYTES);
  const expectedContentHash = input.contentHash?.trim().toLowerCase();
  if (expectedContentHash && !CONTENT_HASH_PATTERN.test(expectedContentHash)) {
    throw new IngestValidationError("Invalid content hash");
  }

  const db = getDb();
  const uploadKey = validateClientKey(input.uploadKey, "upload key");
  const importId = validateClientKey(input.importId, "import id");

  if (uploadKey) {
    const existing = await db
      .select({ id: scores.id, slug: scores.slug, title: scores.title })
      .from(scores)
      .where(eq(scores.uploadKey, uploadKey))
      .get();
    if (existing) {
      return { ...existing, created: false };
    }
  }

  const { canonicalXml, metadata, originalExtension } = resolveMusicXmlInput({
    filename: input.filename,
    bytes: input.bytes,
    canonicalXml: input.canonicalXml,
  });
  const contentHash = await hashMusicXml(canonicalXml);
  if (expectedContentHash && expectedContentHash !== contentHash) {
    throw new IngestValidationError(
      "The MusicXML changed while uploading; review it again",
    );
  }

  const title = input.title !== undefined ? input.title.trim() : metadata.title.trim();
  if (!title) {
    throw new IngestValidationError("Title is required");
  }

  const rawComposer =
    input.composer !== undefined
      ? optionalText(input.composer)
      : metadata.composer;
  const split = splitComposerAndArranger(rawComposer);
  const composerName = split.composer;
  const arranger = optionalText(input.arranger) ?? split.arranger;
  const catalogNumber =
    optionalText(input.catalogNumber) ?? optionalText(metadata.catalogNumber);
  const sourceUrl = normalizeSourceUrl(input.sourceUrl);
  const license = canonicalLicense(input.license) ?? input.license.trim();
  const key = canonicalKey(input.key ?? metadata.key) ?? metadata.key;
  const difficulty = canonicalDifficulty(input.difficulty);

  const id = crypto.randomUUID();
  const composerRecord = await getOrCreateComposer(db, composerName);
  const composerDisplay = composerRecord?.displayName ?? composerName;
  const titleSort = sortTitle(title);
  const workKeyValue = input.workKey?.trim() || workKey(title, composerDisplay);

  if (!input.allowDuplicate) {
    const duplicate = await findScoreByContentHash(db, contentHash);
    if (duplicate) {
      throw new DuplicateScoreError(duplicate);
    }
  }

  const extension = toOriginalExtension(originalExtension);
  const r2Key = scoreOriginalR2Key(id, extension);
  const canonicalR2Key = scoreCanonicalR2Key(id);
  let insertedSlug: string | null = null;
  let inserted = false;

  const slugTaken = async (slug: string) => {
    const existing = await db
      .select({ id: scores.id })
      .from(scores)
      .where(eq(scores.slug, slug))
      .get();
    return Boolean(existing);
  };

  try {
    await putScoreMusicXmlObjects(id, extension, input.bytes, canonicalXml);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = await createUniqueSlug(title, slugTaken, id);
      try {
        await db.insert(scores).values({
          id,
          slug,
          title,
          composer: composerDisplay,
          composerId: composerRecord?.id ?? null,
          arranger,
          editionLabel: optionalText(input.editionLabel),
          workKey: workKeyValue,
          titleSort,
          catalogNumber,
          lyricist: metadata.lyricist,
          sourceUrl,
          license,
          key,
          timeSignature: metadata.timeSignature,
          difficulty,
          instrument: "piano",
          format: "musicxml",
          r2Key,
          canonicalR2Key,
          previewR2Key: null,
          previewVersion: null,
          defaultVisibleParts: metadata.defaultVisibleParts,
          visibility: input.visibility,
          ownerId: input.ownerId,
          contentHash,
          uploadKey,
          importId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        insertedSlug = slug;
        inserted = true;
        break;
      } catch (error) {
        const field = uniqueConstraintField(error);
        if (field === "scores.slug") {
          continue;
        }
        if (field === "scores.upload_key" && uploadKey) {
          const existing = await db
            .select({ id: scores.id, slug: scores.slug, title: scores.title })
            .from(scores)
            .where(eq(scores.uploadKey, uploadKey))
            .get();
          if (existing) {
            await deleteObjects([r2Key, canonicalR2Key]);
            return { ...existing, created: false };
          }
        }
        throw error;
      }
    }

    if (!inserted || !insertedSlug) {
      throw new IngestValidationError("Could not allocate a unique address");
    }
  } catch (error) {
    await deleteObjects([r2Key, canonicalR2Key]);
    throw error;
  }

  const finalSlug = insertedSlug;
  if (!finalSlug) {
    throw new IngestValidationError("Could not allocate a unique address");
  }

  if (input.tagList?.length) {
    try {
      await attachTagsToScore(id, input.tagList);
    } catch (error) {
      console.error("Could not attach tags to uploaded score", error);
    }
  }

  try {
    await refreshSearchDocument(id, db);
  } catch (error) {
    console.error("Could not refresh the catalog search index", error);
  }

  try {
    await purgePublicScore(finalSlug);
  } catch {
    // Cache purge is best-effort; the score is already stored.
  }

  return { id, slug: finalSlug, title, created: true };
}

type ReplaceScoreFileResult = {
  defaultVisibleParts: string | null;
};

export async function replaceScoreFile(
  scoreId: string,
  filename: string,
  bytes: Uint8Array,
  canonicalXmlInput?: string | null,
): Promise<ReplaceScoreFileResult> {
  assertFileSize(bytes.byteLength, MAX_UPLOAD_BYTES);

  const db = getDb();
  const existing = await db.select().from(scores).where(eq(scores.id, scoreId)).get();
  if (!existing) {
    throw new IngestValidationError("Score not found");
  }

  const {
    canonicalXml,
    metadata,
    originalExtension,
  } = resolveMusicXmlInput({
    filename,
    bytes,
    canonicalXml: canonicalXmlInput,
  });
  const contentHash = await hashMusicXml(canonicalXml);
  const extension = toOriginalExtension(originalExtension);
  const r2Key = scoreOriginalR2Key(scoreId, extension);
  const canonicalR2Key = scoreCanonicalR2Key(scoreId);

  try {
    await putScoreMusicXmlObjects(scoreId, extension, bytes, canonicalXml);

    await db
      .update(scores)
      .set({
        r2Key,
        canonicalR2Key,
        contentHash,
        defaultVisibleParts: metadata.defaultVisibleParts,
        updatedAt: new Date(),
      })
      .where(eq(scores.id, scoreId));
  } catch (error) {
    if (existing.r2Key !== r2Key) {
      await deleteR2Object(r2Key).catch(() => undefined);
    }
    // The canonical key is shared with the existing row; keep it rather than
    // deleting a live object when the metadata update fails.
    throw error;
  }

  if (existing.r2Key && existing.r2Key !== r2Key) {
    await deleteR2Object(existing.r2Key).catch(() => undefined);
  }

  return {
    defaultVisibleParts: metadata.defaultVisibleParts,
  };
}

export type IngestErrorMapping = {
  status: number;
  message: string;
  code?: "duplicate";
  existing?: ScoreMatch;
};

export function mapIngestError(error: unknown): IngestErrorMapping {
  if (error instanceof DuplicateScoreError) {
    return {
      status: 409,
      message: error.message,
      code: "duplicate",
      existing: error.existing,
    };
  }
  if (error instanceof IngestValidationError) {
    const status = error.message === "Score not found" ? 404 : 400;
    return { status, message: error.message };
  }
  if (error instanceof XmlSecurityError) {
    return { status: 400, message: error.message };
  }
  console.error("Ingest request failed", error);
  return { status: 500, message: "Upload failed" };
}
