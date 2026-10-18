import { createFileRoute } from "@tanstack/react-router";
import { getScoresBucket } from "@/lib/cloudflare";
import { scoreFileContentType, toScoreFile } from "@/lib/score-file";
import { getScoreById } from "@/lib/scores/queries";

export const Route = createFileRoute("/api/scores/$id/file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id } = params;
        const score = await getScoreById(id);
        if (!score || score.visibility !== "public") {
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

        return new Response(object.body, {
          headers: {
            "Content-Type": scoreFileContentType(scoreFile),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
