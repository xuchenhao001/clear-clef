import {
  canonicalDifficulty,
  canonicalKey,
  canonicalLicense,
  DIFFICULTY_BY_VALUE,
  DIFFICULTY_BY_SLUG,
  difficultyFromSlug,
  keyFromSlug,
  keySlug,
  LICENSE_BY_VALUE,
  LICENSE_BY_SLUG,
  licenseFromSlug,
  licenseSlug,
  normalizeFacetText,
} from "@/lib/catalog/vocab";
import type { CatalogFilters, CatalogSort } from "@/lib/scores/queries";

export type CatalogSearch = {
  q?: string;
  composer?: string[];
  key?: string[];
  difficulty?: string[];
  license?: string[];
  tag?: string[];
  sort?: CatalogSort;
  page?: number;
};

const SORTS = new Set<CatalogSort>([
  "composer",
  "relevance",
  "title",
  "newest",
]);

function readStringList(
  params: Record<string, unknown>,
  name: string,
): string[] {
  const value = params[name];
  let raw: string[];
  if (Array.isArray(value)) {
    raw = value.filter((item): item is string => typeof item === "string");
  } else if (typeof value === "string") {
    if (value.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        raw = Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        raw = value.split(",");
      }
    } else {
      raw = value.split(",");
    }
  } else {
    raw = [];
  }

  return [
    ...new Set(
      raw
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  ];
}

function normalizeSlugList(name: string, values: string[]): string[] {
  return values
    .map((value) => {
      if (name === "key") {
        const canonical = keyFromSlug(value) ?? canonicalKey(value);
        return canonical ? keySlug(canonical) : null;
      }
      if (name === "difficulty") {
        const canonical = difficultyFromSlug(value) ?? canonicalDifficulty(value);
        return canonical
          ? (DIFFICULTY_BY_SLUG.get(canonical)?.slug ??
              DIFFICULTY_BY_VALUE.get(canonical)?.slug ??
              null)
          : null;
      }
      if (name === "license") {
        const canonical = licenseFromSlug(value) ?? canonicalLicense(value);
        return canonical
          ? (LICENSE_BY_SLUG.get(licenseSlug(canonical))?.slug ??
              LICENSE_BY_VALUE.get(canonical)?.slug ??
              null)
          : null;
      }
      return normalizeFacetText(value).replace(/\s+/g, "-") || null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 20);
}

export function readCatalogSearch(
  params: Record<string, unknown>,
): CatalogSearch {
  const q =
    typeof params.q === "string" ? params.q.trim().slice(0, 100) : undefined;
  const composer = normalizeSlugList(
    "composer",
    readStringList(params, "composer"),
  );
  const key = normalizeSlugList("key", readStringList(params, "key"));
  const difficulty = normalizeSlugList(
    "difficulty",
    readStringList(params, "difficulty"),
  );
  const license = normalizeSlugList(
    "license",
    readStringList(params, "license"),
  );
  const tag = normalizeSlugList("tag", readStringList(params, "tag"));
  const sort =
    typeof params.sort === "string" && SORTS.has(params.sort as CatalogSort)
      ? (params.sort as CatalogSort)
      : undefined;
  const rawPage =
    typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page =
    Number.isFinite(rawPage) && rawPage > 1
      ? Math.min(Math.floor(rawPage), 9999)
      : undefined;

  return {
    ...(q ? { q } : {}),
    ...(composer.length ? { composer } : {}),
    ...(key.length ? { key } : {}),
    ...(difficulty.length ? { difficulty } : {}),
    ...(license.length ? { license } : {}),
    ...(tag.length ? { tag } : {}),
    ...(sort ? { sort } : {}),
    ...(page ? { page } : {}),
  };
}

export function catalogFilterValues(search: CatalogSearch): CatalogFilters {
  return {
    q: search.q,
    composer: search.composer,
    key: search.key,
    difficulty: search.difficulty,
    license: search.license,
    tag: search.tag,
    sort: search.sort,
    page: search.page,
  };
}

export function buildCatalogSearch(
  search: CatalogSearch,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  if (search.q) result.q = search.q;
  for (const name of [
    "composer",
    "key",
    "difficulty",
    "license",
    "tag",
  ] as const) {
    const values = search[name];
    if (values?.length) {
      result[name] = values;
    }
  }
  if (search.sort) {
    const defaultSort = search.q ? "relevance" : "composer";
    if (search.sort !== defaultSort) {
      result.sort = search.sort;
    }
  }
  if (search.page && search.page > 1) result.page = String(search.page);
  return result;
}

export function catalogSearchToQuery(search: CatalogSearch): string {
  const params = new URLSearchParams();
  const built = buildCatalogSearch(search);
  for (const [name, value] of Object.entries(built)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(name, item);
    } else {
      params.set(name, value);
    }
  }
  return params.toString();
}

export function hasCatalogRefinements(search: CatalogSearch): boolean {
  return Boolean(
    search.q ||
      search.composer?.length ||
      search.key?.length ||
      search.difficulty?.length ||
      search.license?.length ||
      search.tag?.length,
  );
}

export function isDefaultBrowse(search: CatalogSearch): boolean {
  return (
    !hasCatalogRefinements(search) &&
    (!search.sort || search.sort === "composer")
  );
}

export function toggleFacetValue(
  values: string[] | undefined,
  value: string,
): string[] {
  const current = values ?? [];
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function setFacetValue(
  search: CatalogSearch,
  name: "composer" | "key" | "difficulty" | "license" | "tag",
  value: string,
): CatalogSearch {
  return {
    ...search,
    [name]: toggleFacetValue(search[name], value),
    page: undefined,
  };
}

