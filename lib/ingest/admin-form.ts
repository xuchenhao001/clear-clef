import { IngestValidationError } from "@/lib/ingest/errors";

export type ScoreVisibility = "public" | "unlisted" | "private";

export function parseTagList(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseScoreVisibility(value: string): ScoreVisibility | null {
  if (value === "public" || value === "unlisted" || value === "private") {
    return value;
  }
  return null;
}

export type AdminUploadFields = {
  license: string;
  visibility: ScoreVisibility;
  sourceUrl: string | null;
  catalogNumber: string | null;
  tagList: string[];
  title?: string;
  composer?: string | null;
  composerId?: string | null;
  composerRaw?: string | null;
  keepUncredited?: boolean;
  arranger?: string | null;
  editionLabel?: string | null;
  difficulty?: string | null;
  key?: string | null;
  slug?: string | null;
  uploadKey?: string;
  importId?: string;
  allowDuplicate?: boolean;
  contentHash?: string;
};

function optionalText(formData: FormData, name: string): string | undefined {
  return formData.has(name) ? String(formData.get(name) ?? "").trim() : undefined;
}

function optionalNullableText(
  formData: FormData,
  name: string,
): string | null | undefined {
  if (!formData.has(name)) {
    return undefined;
  }
  return String(formData.get(name) ?? "").trim() || null;
}

export function parseAdminUploadFormData(formData: FormData): AdminUploadFields {
  const visibility = parseScoreVisibility(String(formData.get("visibility") ?? "public"));
  if (!visibility) {
    throw new IngestValidationError("Invalid visibility");
  }

  const fields: AdminUploadFields = {
    license: String(formData.get("license") ?? ""),
    visibility,
    sourceUrl: formData.get("sourceUrl") ? String(formData.get("sourceUrl")) : null,
    catalogNumber: formData.get("catalogNumber")
      ? String(formData.get("catalogNumber"))
      : null,
    tagList: parseTagList(String(formData.get("tags") ?? "")),
  };

  const title = optionalText(formData, "title");
  if (title !== undefined) fields.title = title;
  const composer = optionalNullableText(formData, "composer");
  if (composer !== undefined) fields.composer = composer;
  const composerId = optionalNullableText(formData, "composerId");
  if (composerId !== undefined) fields.composerId = composerId;
  const composerRaw = optionalNullableText(formData, "composerRaw");
  if (composerRaw !== undefined) fields.composerRaw = composerRaw;
  if (
    formData.get("keepUncredited") === "1" ||
    formData.get("keepUncredited") === "true"
  ) {
    fields.keepUncredited = true;
  }
  const arranger = optionalNullableText(formData, "arranger");
  if (arranger !== undefined) fields.arranger = arranger;
  const editionLabel = optionalNullableText(formData, "editionLabel");
  if (editionLabel !== undefined) fields.editionLabel = editionLabel;
  const difficulty = optionalNullableText(formData, "difficulty");
  if (difficulty !== undefined) fields.difficulty = difficulty;
  const key = optionalNullableText(formData, "key");
  if (key !== undefined) fields.key = key;
  const slug = optionalNullableText(formData, "slug");
  if (slug !== undefined) fields.slug = slug;
  const uploadKey = optionalText(formData, "uploadKey");
  if (uploadKey) fields.uploadKey = uploadKey;
  const importId = optionalText(formData, "importId");
  if (importId) fields.importId = importId;
  const allowDuplicate = formData.get("allowDuplicate");
  if (allowDuplicate === "1" || allowDuplicate === "true") {
    fields.allowDuplicate = true;
  }
  const contentHash = optionalText(formData, "contentHash");
  if (contentHash) fields.contentHash = contentHash.toLowerCase();

  return fields;
}

/**
 * Canonical XML is sent as a Blob/File so multipart text-field line-ending
 * normalization cannot change the bytes that the client hashed.
 */
export async function readCanonicalField(
  formData: FormData,
): Promise<string | undefined> {
  const value = formData.get("canonical");
  if (value instanceof File) {
    const text = (await value.text()).trim();
    return text || undefined;
  }
  if (typeof value === "string") {
    const text = value.trim();
    return text || undefined;
  }
  return undefined;
}

export type AdminPatchFields = AdminUploadFields & {
  title: string;
  composer: string | null;
  arranger: string | null;
  editionLabel: string | null;
  slug: string | null;
  lyricist: string | null;
  key: string | null;
  timeSignature: string | null;
  difficulty: string | null;
};

export function parseAdminPatchFormData(formData: FormData): AdminPatchFields {
  const base = parseAdminUploadFormData(formData);

  return {
    ...base,
    title: String(formData.get("title") ?? ""),
    composer: formData.get("composer") ? String(formData.get("composer")) : null,
    arranger: formData.get("arranger") ? String(formData.get("arranger")) : null,
    editionLabel: formData.get("editionLabel")
      ? String(formData.get("editionLabel"))
      : null,
    slug: formData.get("slug") ? String(formData.get("slug")) : null,
    lyricist: formData.get("lyricist") ? String(formData.get("lyricist")) : null,
    key: formData.get("key") ? String(formData.get("key")) : null,
    timeSignature: formData.get("timeSignature")
      ? String(formData.get("timeSignature"))
      : null,
    difficulty: formData.get("difficulty") ? String(formData.get("difficulty")) : null,
  };
}
