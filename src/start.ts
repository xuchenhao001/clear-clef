import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import {
  matchPublicDocument,
  publicDocumentRequest,
  storePublicDocument,
} from "@/lib/cache/public-pages";
import { canonicalHostRedirect } from "@/lib/seo/canonical-host";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const canonicalHostMiddleware = createMiddleware().server(async ({ next, request }) => {
  const redirect = canonicalHostRedirect(request);
  return redirect ?? next();
});

const publicHtmlCache = createMiddleware().server(async ({ next, request }) => {
  if (!publicDocumentRequest(request)) {
    return next();
  }

  const hit = await matchPublicDocument(request);
  if (hit) {
    return hit;
  }

  const result = await next();
  if (result.response) {
    await storePublicDocument(request, result.response);
  }
  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, canonicalHostMiddleware, publicHtmlCache],
}));
