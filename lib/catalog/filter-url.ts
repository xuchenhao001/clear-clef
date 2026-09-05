import type { CatalogFilterField } from "@/lib/catalog/types";

export function buildCatalogFilterQuery(
  fields: CatalogFilterField[],
  updates: Partial<Record<string, string>> = {},
): string {
  const params = new URLSearchParams();

  for (const field of fields) {
    const value = updates[field.name] ?? field.current ?? "";
    if (value) {
      params.set(field.name, value);
    }
  }

  return params.toString();
}
