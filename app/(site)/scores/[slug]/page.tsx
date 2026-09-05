import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreViewerLoader } from "@/components/score/ScoreViewerLoader";
import { getPublicScoreBySlug } from "@/lib/scores/queries";

export const dynamic = "force-dynamic";

type ScorePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ScorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const score = await getPublicScoreBySlug(slug);
  if (!score) {
    return { title: "Score not found" };
  }

  const composer = score.composer ? ` — ${score.composer}` : "";
  return {
    title: `${score.title}${composer}`,
    description: `${score.title} by ${score.composer ?? "unknown composer"}. License: ${score.license}.`,
  };
}

export default async function ScoreDetailPage({ params }: ScorePageProps) {
  const { slug } = await params;
  const score = await getPublicScoreBySlug(slug);
  if (!score) {
    notFound();
  }

  const visibleParts = score.defaultVisibleParts
    ? (JSON.parse(score.defaultVisibleParts) as string[])
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
          ← Back to catalog
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">{score.title}</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {score.composer ?? "Unknown composer"}
          {score.lyricist ? ` · lyrics by ${score.lyricist}` : ""}
        </p>
        <dl className="grid gap-2 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
          <div>
            <dt className="font-medium text-foreground">License</dt>
            <dd>{score.license}</dd>
          </div>
          {score.key ? (
            <div>
              <dt className="font-medium text-foreground">Key</dt>
              <dd>{score.key}</dd>
            </div>
          ) : null}
          {score.timeSignature ? (
            <div>
              <dt className="font-medium text-foreground">Time</dt>
              <dd>{score.timeSignature}</dd>
            </div>
          ) : null}
          {score.difficulty ? (
            <div>
              <dt className="font-medium text-foreground">Difficulty</dt>
              <dd>{score.difficulty}</dd>
            </div>
          ) : null}
        </dl>
        {score.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {score.tags.map((tag) => (
              <li
                key={tag.slug}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
              >
                {tag.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ScoreViewerLoader
        fileUrl={`/api/scores/${score.id}/file`}
        visibleParts={visibleParts}
        title={score.title}
      />
    </div>
  );
}
