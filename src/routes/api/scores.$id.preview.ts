import { createFileRoute } from "@tanstack/react-router";
import { getScoresBucket } from "@/lib/cloudflare";
import { toScoreFile } from "@/lib/score-file";
import { getScoreById } from "@/lib/scores/queries";
import { scorePreviewVersion } from "@/lib/scores/versions";

export const Route = createFileRoute("/api/scores/$id/preview")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { id } = params;
        const score = await getScoreById(id);
        if (!score || score.visibility !== "public") {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const scoreFile = toScoreFile(score);
        if (!scoreFile?.previewR2Key) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const version = scorePreviewVersion(score);
        const requestUrl = new URL(request.url);
        const requestedVersion = requestUrl.searchParams.get("v");
        if (requestedVersion !== version) {
          requestUrl.searchParams.set("v", version);
          return Response.redirect(requestUrl.toString(), 302);
        }

        const useThumb = requestUrl.searchParams.get("thumb") === "1";
        if (useThumb && !score.previewThumbR2Key) {
          requestUrl.searchParams.delete("thumb");
          return Response.redirect(requestUrl.toString(), 302);
        }
        const thumbKey = useThumb ? score.previewThumbR2Key : null;
        const bucket = getScoresBucket();
        let object = thumbKey ? await bucket.get(thumbKey) : null;
        let servedThumb = Boolean(object);
        if (!object) {
          object = await bucket.get(scoreFile.previewR2Key);
          servedThumb = false;
        }
        if (!object) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        return new Response(object.body, {
          headers: {
            "Content-Type": servedThumb ? "image/webp" : "image/svg+xml",
            "Cache-Control":
              useThumb && !servedThumb
                ? "no-cache"
                : "public, max-age=31536000, immutable",
            ETag: `"${version}"`,
          },
        });
      },
    },
  },
});
