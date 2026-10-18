import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/constants";

/** Cache-Control for public catalog HTML stored in the Workers Cache API. */
export const publicPageCacheControl = `public, max-age=${PUBLIC_PAGE_REVALIDATE_SECONDS}`;

/**
 * Stable GET request used as the Workers cache key.
 * Unfiltered `/` and `/scores/:slug` only. Filtered catalog URLs return null.
 */
export function publicDocumentRequest(request: Request): Request | null {
  if (request.method !== "GET") return null;

  const url = new URL(request.url);
  if (url.pathname === "/") {
    if ([...url.searchParams.keys()].length > 0) return null;
    return new Request(new URL("/", url.origin), { method: "GET" });
  }

  if (/^\/scores\/[^/]+$/.test(url.pathname)) {
    return new Request(new URL(url.pathname, url.origin), { method: "GET" });
  }

  return null;
}
