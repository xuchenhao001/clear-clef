export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_MXL_UNCOMPRESSED_BYTES = 32 * 1024 * 1024;
export const MAX_MXL_FILES = 64;

export const LICENSE_OPTIONS = [
  "Public Domain",
  "CC0",
  "CC-BY",
  "CC-BY-SA",
  "All rights reserved",
] as const;

export type LicenseOption = (typeof LICENSE_OPTIONS)[number];
