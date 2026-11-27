import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { fixLegacySlugs } from "@/lib/scores/cleanup";

export const Route = createFileRoute("/api/admin/catalog/fix-slugs")({
  server: {
    handlers: {
      POST: async () => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await fixLegacySlugs(20);
        return Response.json(result);
      },
    },
  },
});
