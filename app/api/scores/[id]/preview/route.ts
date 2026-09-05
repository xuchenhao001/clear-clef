import { NextResponse } from "next/server";
import { getScoresBucket } from "@/lib/cloudflare";
import { toScoreFile } from "@/lib/score-file";
import { getScoreById } from "@/lib/scores/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const score = await getScoreById(id);
  if (!score || score.visibility !== "public") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scoreFile = toScoreFile(score);
  if (!scoreFile?.previewR2Key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bucket = await getScoresBucket();
  const object = await bucket.get(scoreFile.previewR2Key);
  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
