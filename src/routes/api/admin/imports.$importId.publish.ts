import { and, eq } from "drizzle-orm";
import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { getDb } from "@/lib/db";
import { scores } from "@/lib/db/schema";

const IMPORT_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

export const Route = createFileRoute("/api/admin/imports/$importId/publish")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { importId } = params;
        if (!IMPORT_ID_PATTERN.test(importId)) {
          return Response.json({ error: "Invalid import" }, { status: 400 });
        }

        const db = getDb();
        const rows = await db
          .select({ id: scores.id, slug: scores.slug })
          .from(scores)
          .where(
            and(
              eq(scores.importId, importId),
              eq(scores.visibility, "private"),
            ),
          );

        if (rows.length === 0) {
          return Response.json({ published: 0 });
        }

        await db
          .update(scores)
          .set({ visibility: "public" })
          .where(
            and(
              eq(scores.importId, importId),
              eq(scores.visibility, "private"),
            ),
          );

        await Promise.all(
          rows.map((row) => purgePublicScore(row.slug).catch(() => undefined)),
        );

        return Response.json({ published: rows.length });
      },
    },
  },
});
