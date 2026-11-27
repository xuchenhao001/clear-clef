import { IngestValidationError } from "@/lib/ingest/errors";

export function normalizeSourceUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > 2048) {
    throw new IngestValidationError("Source URL is too long");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new IngestValidationError(
      "Source URL must be a valid http(s) address",
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new IngestValidationError("Source URL must use http or https");
  }
  return url.toString();
}
