import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { parseAdminPatchFormData } from "@/lib/ingest/admin-form";
import { mapIngestError, replaceScoreFile } from "@/lib/ingest/upload";
import { deleteScore, updateScoreMetadata } from "@/lib/scores/admin";

export const Route = createFileRoute("/api/admin/scores/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const fields = parseAdminPatchFormData(formData);

          let defaultVisibleParts: string | null | undefined;
          if (file instanceof File && file.size > 0) {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const replaced = await replaceScoreFile(id, file.name, bytes);
            defaultVisibleParts = replaced.defaultVisibleParts;
          }

          const result = await updateScoreMetadata(id, {
            title: fields.title,
            license: fields.license,
            visibility: fields.visibility,
            composer: fields.composer,
            lyricist: fields.lyricist,
            catalogNumber: fields.catalogNumber,
            key: fields.key,
            timeSignature: fields.timeSignature,
            difficulty: fields.difficulty,
            sourceUrl: fields.sourceUrl,
            tagList: fields.tagList,
            defaultVisibleParts,
          });

          return Response.json({ id, slug: result.slug });
        } catch (error) {
          const mapped = mapIngestError(error);
          return Response.json(
            { error: mapped.message },
            { status: mapped.status },
          );
        }
      },
      DELETE: async ({ params }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const result = await deleteScore(id);
        if (!result) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        return Response.json({ ok: true, slug: result.slug });
      },
    },
  },
});
