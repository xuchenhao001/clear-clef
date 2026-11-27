import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createComposer } from "@/lib/scores/composers";
import {
  assignComposerToScores,
  keepScoresUncredited,
} from "@/lib/scores/credit";

type AssignBody = {
  scoreIds?: unknown;
  composerId?: unknown;
  createName?: unknown;
  keepUncredited?: unknown;
};

function readScoreIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Select at least one work");
  }
  const ids = [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  if (ids.length === 0) {
    throw new Error("Select at least one work");
  }
  if (ids.length > 500) {
    throw new Error("Assign at most 500 works at once");
  }
  if (ids.some((id) => id.length > 80)) {
    throw new Error("Invalid work id");
  }
  return ids;
}

export const Route = createFileRoute("/api/admin/composers/assign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: AssignBody;
        try {
          body = (await request.json()) as AssignBody;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        try {
          const scoreIds = readScoreIds(body.scoreIds);
          const database = getDb();

          if (body.keepUncredited === true) {
            const result = await keepScoresUncredited(
              scoreIds,
              session.user.id,
              database,
            );
            return Response.json(result);
          }

          if (typeof body.composerId === "string" && body.composerId.trim()) {
            const result = await assignComposerToScores(
              {
                scoreIds,
                composerId: body.composerId.trim(),
                actorId: session.user.id,
              },
              database,
            );
            return Response.json(result);
          }

          if (typeof body.createName === "string" && body.createName.trim()) {
            const composer = await createComposer(database, body.createName);
            const result = await assignComposerToScores(
              {
                scoreIds,
                composerId: composer.id,
                actorId: session.user.id,
              },
              database,
            );
            return Response.json(result);
          }

          return Response.json(
            { error: "Choose a composer or keep the works uncredited" },
            { status: 400 },
          );
        } catch (error) {
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Assignment failed",
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
