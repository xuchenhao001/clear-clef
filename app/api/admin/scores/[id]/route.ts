import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { parseAdminPatchFormData } from "@/lib/ingest/admin-form";
import { mapIngestError, replaceScoreFile } from "@/lib/ingest/upload";
import { deleteScore, updateScoreMetadata } from "@/lib/scores/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

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

    return NextResponse.json({ id, slug: result.slug });
  } catch (error) {
    const mapped = mapIngestError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteScore(id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, slug: result.slug });
}
