import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { mapIngestError, uploadScore } from "@/lib/ingest/upload";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const license = String(formData.get("license") ?? "");
    const visibility = String(formData.get("visibility") ?? "public");
    const sourceUrl = formData.get("sourceUrl");
    const catalogNumber = formData.get("catalogNumber");
    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!["public", "unlisted", "private"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadScore({
      filename: file.name,
      bytes,
      license,
      visibility: visibility as "public" | "unlisted" | "private",
      ownerId: session.user.id,
      sourceUrl: sourceUrl ? String(sourceUrl) : null,
      catalogNumber: catalogNumber ? String(catalogNumber) : null,
      tagList: tags,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const mapped = mapIngestError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
