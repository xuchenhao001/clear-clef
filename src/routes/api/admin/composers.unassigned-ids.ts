import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listUnassignedScoreIds } from "@/lib/scores/credit";

function readValue(url: URL, name: string, max = 100): string | undefined {
  const value = url.searchParams.get(name)?.trim();
  return value ? value.slice(0, max) : undefined;
}

export const Route = createFileRoute("/api/admin/composers/unassigned-ids")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const visibilityRaw = url.searchParams.get("visibility") ?? "";
        const visibility =
          visibilityRaw === "public" ||
          visibilityRaw === "unlisted" ||
          visibilityRaw === "private"
            ? visibilityRaw
            : undefined;
        const result = await listUnassignedScoreIds(
          {
            q: readValue(url, "q"),
            import: readValue(url, "import", 64),
            visibility,
          },
          500,
          getDb(),
        );
        return Response.json(result);
      },
    },
  },
});
