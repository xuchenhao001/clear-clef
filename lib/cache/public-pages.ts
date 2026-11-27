import { publicDocumentRequest, publicPageCacheControl } from "@/lib/cache/public-document";
import { publicSiteOrigins } from "@/lib/worker-bindings";

export { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/constants";
export { publicDocumentRequest, publicPageCacheControl } from "@/lib/cache/public-document";

function workerCache(): Cache | null {
  if (typeof caches === "undefined") {
    return null;
  }
  return (caches as CacheStorage & { default: Cache }).default;
}

/** Read a stored public HTML document, if this colo still has it. */
export async function matchPublicDocument(request: Request): Promise<Response | null> {
  const key = publicDocumentRequest(request);
  if (!key) return null;
  const cache = workerCache();
  if (!cache) return null;
  return (await cache.match(key)) ?? null;
}

/** Store a successful HTML response for the public document TTL. */
export async function storePublicDocument(request: Request, response: Response) {
  const key = publicDocumentRequest(request);
  if (!key || response.status !== 200) return;
  const cache = workerCache();
  if (!cache) return;

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", publicPageCacheControl);
  const stored = new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  await cache.put(key, stored);
}

/**
 * Drop cached HTML for `/` and `/scores/:slug` on the public origin.
 * Keys use each request's origin (`publicDocumentRequest`); purge every public host.
 */
export async function purgePublicScore(slug: string) {
  const cache = workerCache();
  if (!cache) return;
  for (const origin of publicSiteOrigins()) {
    await cache.delete(new Request(`${origin}/`));
    await cache.delete(new Request(`${origin}/scores/${slug}`));
    await cache.delete(new Request(`${origin}/sitemap.xml`));
    await cache.delete(new Request(`${origin}/robots.txt`));
  }
}

export async function purgePublicCatalog() {
  const cache = workerCache();
  if (!cache) return;
  for (const origin of publicSiteOrigins()) {
    await cache.delete(new Request(`${origin}/`));
    await cache.delete(new Request(`${origin}/sitemap.xml`));
  }
}
