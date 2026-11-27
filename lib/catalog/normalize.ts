const CJK_PATTERN =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

const LEADING_ARTICLES = /^(the|a|an)\s+/i;

export function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Case/diacritic-insensitive text used for search and sort keys. */
export function normalizeText(value: string): string {
  return collapseWhitespace(
    stripDiacritics(value)
      .toLowerCase()
      .replace(/[♯#]/g, " sharp ")
      .replace(/[♭]/g, " flat ")
      .replace(/[^\p{L}\p{N}]+/gu, " "),
  );
}

/** FTS unicode61 tokenizes CJK titles as one token; spacing each character makes partial queries work. */
export function cjkSpaced(value: string): string {
  const chars = [...value];
  let result = "";
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index]!;
    const previous = chars[index - 1];
    const next = chars[index + 1];
    const cjk = CJK_PATTERN.test(char);
    const previousCjk = previous ? CJK_PATTERN.test(previous) : false;
    const nextCjk = next ? CJK_PATTERN.test(next) : false;
    if (cjk) {
      if (!previousCjk) {
        result += " ";
      }
      result += char;
      if (!nextCjk) {
        result += " ";
      }
    } else {
      result += char;
    }
  }
  return collapseWhitespace(result);
}

export function sortTitle(title: string): string {
  const withoutArticle = title.replace(LEADING_ARTICLES, "");
  return normalizeText(withoutArticle);
}

export function workKey(
  title: string,
  composerDisplayName: string | null | undefined,
): string {
  return `${normalizeText(title)}|${normalizeText(composerDisplayName ?? "uncredited")}`;
}

export function slugifyTitle(title: string, fallbackId?: string): string {
  const base = stripDiacritics(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  if (base) {
    return base;
  }

  return fallbackId ? `work-${fallbackId.slice(0, 8)}` : "work";
}

export function searchTextForScore(input: {
  title: string;
  composer?: string | null;
  composerSortName?: string | null;
  composerAliases?: string[];
  catalogNumber?: string | null;
  lyricist?: string | null;
  key?: string | null;
  tags?: string[];
  slug?: string | null;
}): string {
  return normalizeText(
    [
      input.title,
      input.composer,
      input.composerSortName,
      ...(input.composerAliases ?? []),
      input.catalogNumber,
      input.lyricist,
      input.key,
      ...(input.tags ?? []),
      input.slug,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function isCjk(value: string): boolean {
  return CJK_PATTERN.test(value);
}
