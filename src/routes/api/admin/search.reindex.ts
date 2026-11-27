import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { purgePublicCatalog } from "@/lib/cache/public-pages";
import { rebuildSearchIndex } from "@/lib/search";

export const Route = createFileRoute("/api/admin/search/reindex")({
  server: {
    handlers: {
      POST: async () => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const indexed = await rebuildSearchIndex();
        await purgePublicCatalog();
        return Response.json({ indexed });
      },
    },
  },
});
