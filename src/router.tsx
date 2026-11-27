import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { NotFoundPage } from "@/components/not-found-page";
import { parseSearch, stringifySearch } from "@/lib/router-search";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
    parseSearch,
    stringifySearch,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
