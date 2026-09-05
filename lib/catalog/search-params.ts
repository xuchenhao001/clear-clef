import type { CatalogFilters } from "@/lib/scores/queries";

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export function readCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  return {
    key: readSearchParam(params, "key"),
    difficulty: readSearchParam(params, "difficulty"),
    license: readSearchParam(params, "license"),
    tag: readSearchParam(params, "tag"),
  };
}

export function hasCatalogFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.key || filters.difficulty || filters.license || filters.tag,
  );
}
