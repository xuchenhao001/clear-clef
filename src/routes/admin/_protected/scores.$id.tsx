import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminScoreEditForm } from "@/components/admin/AdminScoreEditForm";
import { AdminUploadedBanner } from "@/components/admin/admin-upload-banner";
import { loadAdminScoreEdit } from "@/src/server/admin";

type ScoreEditSearch = {
  uploaded?: string;
};

export const Route = createFileRoute("/admin/_protected/scores/$id")({
  validateSearch: (search): ScoreEditSearch => ({
    uploaded: typeof search.uploaded === "string" ? search.uploaded : undefined,
  }),
  loader: ({ params }) => loadAdminScoreEdit({ data: params.id }),
  component: AdminScoreEditPage,
});

function AdminScoreEditPage() {
  const score = Route.useLoaderData();
  const tagsValue = score.tags
    .map((tag: { label: string }) => tag.label)
    .join(", ");

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <AdminUploadedBanner />
      </Suspense>
      <AdminPageHeader
        title="Edit score"
        description="Update catalog metadata, replace the file, or remove this entry."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Scores", href: "/admin/scores" },
          { label: score.title },
        ]}
      />
      <AdminScoreEditForm
        scoreId={score.id}
        slug={score.slug}
        initialVisibility={score.visibility as "public" | "unlisted" | "private"}
        initial={{
          title: score.title,
          composer: score.composer ?? "",
          lyricist: score.lyricist ?? "",
          catalogNumber: score.catalogNumber ?? "",
          license: score.license,
          key: score.key ?? "",
          timeSignature: score.timeSignature ?? "",
          difficulty: score.difficulty ?? "",
          sourceUrl: score.sourceUrl ?? "",
          tags: tagsValue,
        }}
        hasPreview={Boolean(score.previewR2Key)}
      />
    </div>
  );
}
