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
};

export function parseAdminUploadFormData(formData: FormData): AdminUploadFields {
  const visibility = parseScoreVisibility(String(formData.get("visibility") ?? "public"));
  if (!visibility) {
    throw new IngestValidationError("Invalid visibility");
  }

  return {
    license: String(formData.get("license") ?? ""),
    visibility,
    sourceUrl: formData.get("sourceUrl") ? String(formData.get("sourceUrl")) : null,
    catalogNumber: formData.get("catalogNumber")
      ? String(formData.get("catalogNumber"))
      : null,
    tagList: parseTagList(String(formData.get("tags") ?? "")),
  };
}

export type AdminPatchFields = AdminUploadFields & {
  title: string;
  composer: string | null;
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
    lyricist: formData.get("lyricist") ? String(formData.get("lyricist")) : null,
    key: formData.get("key") ? String(formData.get("key")) : null,
    timeSignature: formData.get("timeSignature")
      ? String(formData.get("timeSignature"))
      : null,
    difficulty: formData.get("difficulty") ? String(formData.get("difficulty")) : null,
  };
}
