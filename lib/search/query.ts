import { isCjk, normalizeText } from "@/lib/catalog/normalize";

const FTS_OPERATORS = /\b(AND|OR|NOT|NEAR)\b/gi;

export type SearchTokens = {
  fts: string | null;
  tokens: string[];
  fallback: string;
};

export function buildSearchTokens(rawQuery: string): SearchTokens {
  const trimmed = rawQuery.trim().slice(0, 100);
  const normalized = trimmed.replace(/["']/g, " ").replace(FTS_OPERATORS, " ");
  const parts = normalized
    .split(/[^\p{L}\p{N}#]+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);

  const tokens: string[] = [];
  const ftsParts: string[] = [];

  for (const part of parts) {
    if (isCjk(part)) {
      for (const char of [...part].slice(0, 8)) {
        tokens.push(char);
        ftsParts.push(`"${char.replace(/"/g, '""')}"`);
      }
      continue;
    }

    const clean = part.replace(/"/g, "").slice(0, 40);
    if (!clean) {
      continue;
    }
    tokens.push(clean);
    ftsParts.push(`"${clean}"*`);
  }

  return {
    fts: ftsParts.length > 0 ? ftsParts.join(" AND ") : null,
    tokens,
    fallback: truncateUtf8(normalizeText(parts.join(" ")), 40),
  };
}

export function truncateUtf8(value: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  let bytes = 0;
  let result = "";
  for (const char of value) {
    const size = encoder.encode(char).length;
    if (bytes + size > maxBytes) {
      break;
    }
    bytes += size;
    result += char;
  }
  return result;
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
