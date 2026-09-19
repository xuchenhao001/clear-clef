import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getScoresBucket } from "@/lib/cloudflare";
import {
  originalDownloadFilename,
  scoreFileContentType,
  toScoreFile,
} from "@/lib/score-file";
import { getScoreById } from "@/lib/scores/queries";

export async function GET(
  _request: Request,
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

  const scoreFile = toScoreFile(score);
  if (!scoreFile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bucket = await getScoresBucket();
  const object = await bucket.get(scoreFile.r2Key);
  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = originalDownloadFilename(score.slug, scoreFile.r2Key);

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": scoreFileContentType(scoreFile),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
