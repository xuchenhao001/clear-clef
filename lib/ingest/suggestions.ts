const TRACK_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "arr",
  "arrangement",
  "beginner",
  "bwv",
  "d",
  "easy",
  "for",
  "in",
  "k",
  "no",
  "of",
  "on",
  "op",
  "opus",
  "piano",
  "solo",
  "the",
  "to",
  "version",
]);

function stripExtension(filename: string): string {
  return filename.replace(/\.(mxl|musicxml|xml)$/i, "");
}

/** A human-readable title suggestion, used only when the file has none. */
export function humanizeFilename(filename: string): string {
  const base = stripExtension(filename)
    .replace(/[_-]+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();

  return base || "Untitled";
}

function tokens(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !TRACK_STOP_WORDS.has(token));
}

function tokenMatches(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }
  const shortest = Math.min(left.length, right.length);
  if (shortest < 4) {
    return false;
  }
  return left.startsWith(right) || right.startsWith(left);
}

/**
 * A deliberately soft check: does the extracted title share a meaningful word
 * with the filename? A false positive only opens a review note; it never edits
 * metadata.
 */
export function titleMatchesFilename(title: string, filename: string): boolean {
  const titleTokens = tokens(title);
  const filenameTokens = tokens(filename);

  if (titleTokens.length === 0 || filenameTokens.length === 0) {
    return true;
  }

  return titleTokens.some((titleToken) =>
    filenameTokens.some((filenameToken) => tokenMatches(titleToken, filenameToken)),
  );
}

/** Normalised title + composer key, used for same-work warnings only. */
export function workKey(title: string, composer: string | null): string {
  const titleTokens = tokens(title).sort();
  const composerTokens = composer ? tokens(composer).sort() : [];
  return `${titleTokens.join(" ")}|${composerTokens.join(" ")}`;
}
