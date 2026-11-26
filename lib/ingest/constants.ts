export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_CANONICAL_BYTES = 8 * 1024 * 1024;
export const MAX_MXL_UNCOMPRESSED_BYTES = 32 * 1024 * 1024;
export const MAX_MXL_FILES = 64;
export const MAX_PREFLIGHT_ITEMS = 200;
export const MAX_PREFLIGHT_BODY_BYTES = 1024 * 1024;

export const MUSICXML_COMPRESSED_MIME = "application/vnd.recordare.musicxml";
export const MUSICXML_UNCOMPRESSED_MIME =
  "application/vnd.recordare.musicxml+xml";

export const LICENSE_OPTIONS = [
  "Public Domain",
  "CC0",
  "CC-BY",
  "CC-BY-SA",
  "All rights reserved",
] as const;
