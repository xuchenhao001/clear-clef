export type CatalogLineInput = {
  catalogNumber?: string | null;
  key?: string | null;
  timeSignature?: string | null;
};

export function formatCatalogLine(input: CatalogLineInput): string {
  const parts = [
    input.catalogNumber?.trim(),
    input.key?.trim(),
    input.timeSignature?.trim(),
  ].filter((part): part is string => Boolean(part));

  return parts.join(" · ");
}
