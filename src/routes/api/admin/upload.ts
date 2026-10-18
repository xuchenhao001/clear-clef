import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { parseAdminUploadFormData } from "@/lib/ingest/admin-form";
import { mapIngestError, uploadScore } from "@/lib/ingest/upload";

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const fields = parseAdminUploadFormData(formData);

          if (!(file instanceof File)) {
            return Response.json({ error: "File is required" }, { status: 400 });
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
          });

          return Response.json(result, { status: 201 });
        } catch (error) {
          const mapped = mapIngestError(error);
          return Response.json(
            { error: mapped.message },
            { status: mapped.status },
          );
        }
      },
    },
  },
});
