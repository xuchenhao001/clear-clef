import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackToCatalog } from "@/components/catalog/back-to-catalog";
import { tagPillClassName } from "@/components/ui/tag-pill";
import { ScoreRights } from "@/components/score/ScoreRights";
import { ScoreViewerLoader } from "@/components/score/ScoreViewerLoader";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import { isMxlR2Key } from "@/lib/score-file";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/public-pages";
import { getPublicScoreBySlug } from "@/lib/scores/queries";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

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
    <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-10 md:py-16">
      <div className="space-y-4">
        <BackToCatalog />
        <header className="space-y-2">
          {score.composer ? (
            <p className="type-body-sm text-edition-muted">{score.composer}</p>
          ) : null}
          <h1 className="type-work-title-detail">{score.title}</h1>
          {score.lyricist ? (
            <p className="type-body-sm text-edition-muted">
              Lyrics by {score.lyricist}
            </p>
          ) : null}
          {metadataLine ? (
            <p className="type-caption-mono">{metadataLine}</p>
          ) : null}
        </header>
        {score.difficulty ? (
          <p className="type-body-sm text-edition-muted">
            Difficulty: {score.difficulty}
          </p>
        ) : null}
        {score.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {score.tags.map((tag) => (
              <li key={tag.slug} className={tagPillClassName}>
                {tag.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="pt-8 md:pt-10">
        <ScoreViewerLoader
          fileUrl={`/api/scores/${score.id}/file`}
          compressed={compressed}
          title={score.title}
        />
      </div>

      <div className="pt-8 md:pt-12">
        <ScoreRights license={score.license} sourceUrl={score.sourceUrl} />
      </div>
    </div>
  );
}
