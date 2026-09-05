import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreRights } from "@/components/score/ScoreRights";
import { ScoreViewerLoader } from "@/components/score/ScoreViewerLoader";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import { isMxlR2Key } from "@/lib/score-file";
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

  const composer = score.composer ? ` - ${score.composer}` : "";
  return {
    title: `${score.title}${composer}`,
    description: `${score.title} by ${score.composer ?? "unknown credit"}. License: ${score.license}.`,
  };
}

export default async function ScoreDetailPage({ params }: ScorePageProps) {
  const { slug } = await params;
  const score = await getPublicScoreBySlug(slug);
  if (!score) {
    notFound();
  }

  const compressed = score.r2Key ? isMxlR2Key(score.r2Key) : false;
  const metadataLine = formatCatalogLine({
    catalogNumber: score.catalogNumber,
    key: score.key,
    timeSignature: score.timeSignature,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 py-10 md:gap-12 md:py-16">
      <div className="space-y-4">
        <Link
          href="/"
          className="type-body-sm text-edition-muted hover:text-edition-ink"
        >
          Back to catalog
        </Link>
        <header className="space-y-2">
          {score.composer ? (
            <p className="type-body-sm text-edition-muted">{score.composer}</p>
          ) : null}
          <h1 className="type-work-title text-xl md:text-2xl">{score.title}</h1>
          {score.lyricist ? (
            <p className="type-body-sm text-edition-muted">
              Lyrics by {score.lyricist}
            </p>
          ) : null}
          {metadataLine ? (
            <p className="type-caption-mono">{metadataLine}</p>
          ) : null}
        </header>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {score.key ? (
            <div>
              <dt className="font-medium text-edition-ink">Key</dt>
              <dd className="text-edition-body">{score.key}</dd>
            </div>
          ) : null}
          {score.timeSignature ? (
            <div>
              <dt className="font-medium text-edition-ink">Time</dt>
              <dd className="text-edition-body">{score.timeSignature}</dd>
            </div>
          ) : null}
          {score.difficulty ? (
            <div>
              <dt className="font-medium text-edition-ink">Difficulty</dt>
              <dd className="text-edition-body">{score.difficulty}</dd>
            </div>
          ) : null}
        </dl>
        {score.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {score.tags.map((tag) => (
              <li
                key={tag.slug}
                className="rounded-full bg-edition-surface-strong px-3 py-1 text-xs font-medium text-edition-body"
              >
                {tag.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ScoreViewerLoader
        fileUrl={`/api/scores/${score.id}/file`}
        compressed={compressed}
        title={score.title}
      />

      <ScoreRights license={score.license} sourceUrl={score.sourceUrl} />
    </div>
  );
}
