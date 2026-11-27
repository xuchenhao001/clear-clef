import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import {
  MAX_CANONICAL_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import {
  parseAdminUploadFormData,
  readCanonicalField,
} from "@/lib/ingest/admin-form";
import { mapIngestError, uploadScore } from "@/lib/ingest/upload";

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

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
          const fields = parseAdminUploadFormData(formData);
          const canonical = await readCanonicalField(formData);

          if (!(file instanceof File)) {
            return Response.json({ error: "File is required" }, { status: 400 });
          }

          if (file.size > MAX_UPLOAD_BYTES) {
            return Response.json(
              { error: `File exceeds ${MAX_UPLOAD_BYTES} byte limit` },
              { status: 400 },
            );
          }

          const bytes = new Uint8Array(await file.arrayBuffer());
          const result = await uploadScore({
            filename: file.name,
            bytes,
            license: fields.license,
            visibility: fields.visibility,
            ownerId: session.user.id,
            sourceUrl: fields.sourceUrl,
            catalogNumber: fields.catalogNumber,
            tagList: fields.tagList,
            title: fields.title,
            composer: fields.composer,
            composerRaw: fields.composerRaw,
            keepUncredited: fields.keepUncredited,
            arranger: fields.arranger,
            editionLabel: fields.editionLabel,
            difficulty: fields.difficulty,
            key: fields.key,
            uploadKey: fields.uploadKey,
            importId: fields.importId,
            allowDuplicate: fields.allowDuplicate,
            canonicalXml: canonical,
            contentHash: fields.contentHash,
          });

          return Response.json(result, { status: result.created ? 201 : 200 });
        } catch (error) {
          const mapped = mapIngestError(error);
          return Response.json(
            {
              error: mapped.message,
              ...(mapped.code ? { code: mapped.code } : {}),
              ...(mapped.existing ? { existing: mapped.existing } : {}),
            },
            { status: mapped.status },
          );
        }
      },
    },
  },
});
