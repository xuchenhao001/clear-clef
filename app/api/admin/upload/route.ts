import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { parseAdminUploadFormData } from "@/lib/ingest/admin-form";
import { mapIngestError, uploadScore } from "@/lib/ingest/upload";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const fields = parseAdminUploadFormData(formData);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const mapped = mapIngestError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
