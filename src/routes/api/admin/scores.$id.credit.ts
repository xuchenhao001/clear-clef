import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { updateScoreCreditEvidence } from "@/lib/scores/credit";

export const Route = createFileRoute("/api/admin/scores/$id/credit")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { composerRaw?: unknown; sourceFilename?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const composerRaw =
          typeof body.composerRaw === "string"
            ? body.composerRaw.trim().slice(0, 500)
            : null;
        const sourceFilename =
          typeof body.sourceFilename === "string"
            ? body.sourceFilename.trim().slice(0, 255)
            : null;

        try {
          await updateScoreCreditEvidence(
            params.id,
            { composerRaw, sourceFilename },
            getDb(),
          );
          return Response.json({ ok: true });
        } catch (error) {
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Could not save credit",
            },
            {
              status:
                error instanceof Error && error.message === "Score not found"
                  ? 404
                  : 400,
            },
          );
        }
      },
    },
  },
});
