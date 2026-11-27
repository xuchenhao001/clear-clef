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
      GET: async ({ request, params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const score = await getScoreById(id);
        const wantsThumb =
          new URL(request.url).searchParams.get("thumb") === "1";
        const key =
          wantsThumb && score?.previewThumbR2Key
            ? score.previewThumbR2Key
            : score?.previewR2Key;
        if (!key) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const bucket = getScoresBucket();
        const object = await bucket.get(key);
        if (!object) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        return new Response(object.body, {
          headers: {
            "Content-Type": key.endsWith(".webp")
              ? "image/webp"
              : "image/svg+xml",
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

        const contentType = request.headers.get("content-type") ?? "";
        const bucket = getScoresBucket();
        const db = getDb();

        if (contentType.includes("image/webp") || contentType.includes("image/png")) {
          const bytes = await request.arrayBuffer();
          if (bytes.byteLength === 0 || bytes.byteLength > 2 * 1024 * 1024) {
            return Response.json({ error: "Invalid preview thumbnail" }, { status: 400 });
          }
          const thumbKey = `scores/${id}/preview-thumb.webp`;
          await bucket.put(thumbKey, bytes, {
            httpMetadata: { contentType: "image/webp" },
          });
          await db
            .update(scores)
            .set({ previewThumbR2Key: thumbKey, updatedAt: new Date() })
            .where(eq(scores.id, id));
          await purgePublicScore(score.slug);
          return Response.json({ previewThumbR2Key: thumbKey });
        }

        const svg = await request.text();
        if (!svg.includes("<svg")) {
          return Response.json({ error: "Invalid SVG preview" }, { status: 400 });
        }

        const previewKey = `scores/${id}/preview.svg`;
        const previewVersion = crypto.randomUUID();
        await bucket.put(previewKey, svg, {
          httpMetadata: { contentType: "image/svg+xml" },
        });

        await db
          .update(scores)
          .set({
            previewR2Key: previewKey,
            previewThumbR2Key: null,
            previewVersion,
            updatedAt: new Date(),
          })
          .where(eq(scores.id, id));

        await purgePublicScore(score.slug);

        return Response.json({ previewR2Key: previewKey, previewVersion });
      },
    },
  },
});
