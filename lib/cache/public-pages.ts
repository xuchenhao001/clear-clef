import { env } from "cloudflare:workers";
import { publicDocumentRequest, publicPageCacheControl } from "@/lib/cache/public-document";

export { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/constants";
export { publicDocumentRequest, publicPageCacheControl } from "@/lib/cache/public-document";

function workerCache(): Cache {
  return (caches as CacheStorage & { default: Cache }).default;
}

/** Read a stored public HTML document, if this colo still has it. */
export async function matchPublicDocument(request: Request): Promise<Response | null> {
  const key = publicDocumentRequest(request);
  if (!key) return null;
  return (await workerCache().match(key)) ?? null;
}

/** Store a successful HTML response for the public document TTL. */
export async function storePublicDocument(request: Request, response: Response) {
  const key = publicDocumentRequest(request);
  if (!key || response.status !== 200) return;

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", publicPageCacheControl);
  const stored = new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  await workerCache().put(key, stored);
}

/**
 * Drop cached HTML for `/` and `/scores/:slug` on the public origin.
 * Keys match `publicDocumentRequest` when the request host equals `env.BETTER_AUTH_URL`
 * (localhost in `vite dev`, workers.dev URL in deploy).
 */
export async function purgePublicScore(slug: string) {
  const origin = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const cache = workerCache();
  await cache.delete(new Request(`${origin}/`));
  await cache.delete(new Request(`${origin}/scores/${slug}`));
}
