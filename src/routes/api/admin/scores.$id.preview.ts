import { eq } from "drizzle-orm";
import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { getScoresBucket } from "@/lib/cloudflare";
import { getDb } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { getScoreById } from "@/lib/scores/queries";

export const Route = createFileRoute("/api/admin/scores/$id/preview")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const score = await getScoreById(id);
        if (!score?.previewR2Key) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const bucket = getScoresBucket();
        const object = await bucket.get(score.previewR2Key);
        if (!object) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        return new Response(object.body, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "private, no-store",
          },
        });
      },
      PUT: async ({ request, params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const score = await getScoreById(id);
        if (!score) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const svg = await request.text();
        if (!svg.includes("<svg")) {
          return Response.json({ error: "Invalid SVG preview" }, { status: 400 });
        }

        const previewKey = `scores/${id}/preview.svg`;
        const bucket = getScoresBucket();
        await bucket.put(previewKey, svg, {
          httpMetadata: { contentType: "image/svg+xml" },
        });

        const db = getDb();
        await db
          .update(scores)
          .set({ previewR2Key: previewKey })
          .where(eq(scores.id, id));

        await purgePublicScore(score.slug);

        return Response.json({ previewR2Key: previewKey });
      },
    },
  },
});
