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

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
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
  requestMiddleware: [csrfMiddleware, publicHtmlCache],
}));
