import {
  BETTER_AUTH_ALTERNATE_ORIGINS,
  BETTER_AUTH_URL_PRODUCTION,
} from "@/lib/worker-bindings";

const PUBLIC_PREFIXES = ["/scores/", "/sitemap.xml", "/robots.txt", "/og-default.png"];

export function canonicalHostRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const url = new URL(request.url);
  const alternateOrigins = new Set(
    BETTER_AUTH_ALTERNATE_ORIGINS.map((origin) => new URL(origin).origin),
  );
  if (!alternateOrigins.has(url.origin)) {
    return null;
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/cdn-cgi/")
  ) {
    return null;
  }

  if (
    url.pathname !== "/" &&
    !PUBLIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    return null;
  }

  return Response.redirect(
    new URL(`${url.pathname}${url.search}`, BETTER_AUTH_URL_PRODUCTION).toString(),
    301,
  );
}
