import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import {
  MAX_CANONICAL_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import {
  parseAdminPatchFormData,
  readCanonicalField,
} from "@/lib/ingest/admin-form";
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

        const declaredLength = Number(
          request.headers.get("content-length") ?? "0",
        );
        if (
          declaredLength >
          MAX_UPLOAD_BYTES + MAX_CANONICAL_BYTES + 1024 * 1024
        ) {
          return Response.json(
            { error: "Upload request is too large" },
            { status: 413 },
          );
        }

        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const fields = parseAdminPatchFormData(formData);
          const canonical = await readCanonicalField(formData);

          let defaultVisibleParts: string | null | undefined;
          if (file instanceof File && file.size > 0) {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const replaced = await replaceScoreFile(
              id,
              file.name,
              bytes,
              canonical,
            );
            defaultVisibleParts = replaced.defaultVisibleParts;
          }

          const result = await updateScoreMetadata(id, {
            title: fields.title,
            license: fields.license,
            visibility: fields.visibility,
            composer: fields.composer,
            arranger: fields.arranger,
            editionLabel: fields.editionLabel,
            slug: fields.slug,
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
