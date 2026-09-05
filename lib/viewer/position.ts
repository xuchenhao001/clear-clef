import type { VerovioToolkitLike } from "@/lib/viewer/types";

/** First xml:id on the engraved page (for position restore across reflow). */
export function extractFirstXmlId(svg: string): string | null {
  const match = svg.match(/\bid="([^"]+)"/);
  return match?.[1] ?? null;
}

export function restorePageFromElement(
  toolkit: Pick<VerovioToolkitLike, "getPageWithElement">,
  xmlId: string | null,
  fallback = 1,
): number {
  if (!xmlId) {
    return fallback;
  }
  try {
    const page = toolkit.getPageWithElement(xmlId);
    return page > 0 ? page : fallback;
  } catch {
    return fallback;
  }
}
