import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getScoresBucket } from "@/lib/cloudflare";
import { getDbAsync } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { getScoreById } from "@/lib/scores/queries";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const score = await getScoreById(id);
  if (!score) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const svg = await request.text();
  if (!svg.includes("<svg")) {
    return NextResponse.json({ error: "Invalid SVG preview" }, { status: 400 });
  }

  const previewKey = `scores/${id}/preview.svg`;
  const bucket = await getScoresBucket();
  await bucket.put(previewKey, svg, {
    httpMetadata: { contentType: "image/svg+xml" },
  });

  const db = await getDbAsync();
  await db
    .update(scores)
    .set({ previewR2Key: previewKey })
    .where(eq(scores.id, id));

  return NextResponse.json({ previewR2Key: previewKey });
}
