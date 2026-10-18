import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackToCatalog } from "@/components/catalog/back-to-catalog";
import { ScoreRights } from "@/components/score/ScoreRights";
import { ScoreViewerLoader } from "@/components/score/ScoreViewerLoader";
import { isMxlR2Key } from "@/lib/score-file";
import { getPublicScoreBySlug } from "@/lib/scores/queries";

// Literal on purpose: Next only accepts a statically analyzable segment config.
// Keep in step with PUBLIC_PAGE_REVALIDATE_SECONDS.
export const revalidate = 60;

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

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-10 md:py-16">
      <div className="space-y-4">
        <BackToCatalog />
        <header className="space-y-3">
          {score.composer ? (
            <p className="type-eyebrow">{score.composer}</p>
          ) : null}
          <h1 className="type-masthead-sm">{score.title}</h1>
          <span aria-hidden className="rule-gilt block h-0.5 w-16" />
          {score.lyricist ? (
            <p className="type-shelf">Lyrics by {score.lyricist}</p>
          ) : null}
        </header>
        <dl className="max-w-xl pt-2">
          {score.key ? (
            <div className="stat-row">
              <dt className="type-label">Key</dt>
              <dd className="type-value">{score.key}</dd>
            </div>
          ) : null}
          {score.timeSignature ? (
            <div className="stat-row">
              <dt className="type-label">Time</dt>
              <dd className="type-value">{score.timeSignature}</dd>
            </div>
          ) : null}
          {score.catalogNumber ? (
            <div className="stat-row">
              <dt className="type-label">Catalogue</dt>
              <dd className="type-value">{score.catalogNumber}</dd>
            </div>
          ) : null}
          {score.difficulty ? (
            <div className="stat-row">
              <dt className="type-label">Difficulty</dt>
              <dd className="type-value">{score.difficulty}</dd>
            </div>
          ) : null}
          {score.tags.length > 0 ? (
            <div className="stat-row">
              <dt className="type-label">Tags</dt>
              <dd className="type-value">
                {score.tags.map((tag) => tag.label).join(", ")}
              </dd>
            </div>
          ) : null}
          <ScoreRights license={score.license} sourceUrl={score.sourceUrl} />
        </dl>
      </div>

      <div className="pt-8 md:pt-10">
        <ScoreViewerLoader
          fileUrl={`/api/scores/${score.id}/file`}
          compressed={compressed}
          title={score.title}
        />
      </div>

    </div>
  );
}
