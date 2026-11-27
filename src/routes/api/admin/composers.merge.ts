import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { mergeComposers } from "@/lib/scores/composers";

export const Route = createFileRoute("/api/admin/composers/merge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { sourceId?: unknown; targetId?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (
          typeof body.sourceId !== "string" ||
          typeof body.targetId !== "string"
        ) {
          return Response.json({ error: "Choose two composers" }, { status: 400 });
        }

        try {
          const result = await mergeComposers(body.sourceId, body.targetId);
          return Response.json(result);
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Merge failed" },
            { status: 400 },
          );
        }
      },
    },
  },
});
