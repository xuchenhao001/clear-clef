import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { getScoresBucket } from "@/lib/cloudflare";
import {
  originalDownloadFilename,
  scoreFileContentType,
  toScoreFile,
} from "@/lib/score-file";
import { getScoreById } from "@/lib/scores/queries";

export const Route = createFileRoute("/api/admin/scores/$id/file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const score = await getScoreById(id);
        if (!score) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const scoreFile = toScoreFile(score);
        if (!scoreFile) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const bucket = getScoresBucket();
        const object = await bucket.get(scoreFile.r2Key);
        if (!object) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const filename = originalDownloadFilename(score.slug, scoreFile.r2Key);

        return new Response(object.body, {
          headers: {
            "Content-Type": scoreFileContentType(scoreFile),
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
