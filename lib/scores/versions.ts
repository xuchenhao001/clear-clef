type VersionedScore = {
  previewVersion?: string | null;
  contentHash?: string | null;
  updatedAt?: Date | number | null;
  createdAt?: Date | number | null;
};

function numeric(value: Date | number | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  return String(value instanceof Date ? value.getTime() : value);
}

export function scoreFileVersion(score: VersionedScore): string {
  return (
    score.contentHash ??
    numeric(score.updatedAt) ??
    numeric(score.createdAt) ??
    "1"
  );
}

export function scorePreviewVersion(score: VersionedScore): string {
  return (
    score.previewVersion ??
    score.contentHash ??
    numeric(score.updatedAt) ??
    numeric(score.createdAt) ??
    "1"
  );
}
