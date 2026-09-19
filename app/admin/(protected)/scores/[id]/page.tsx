import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminScoreEditForm } from "@/components/admin/AdminScoreEditForm";
import { AdminUploadedBanner } from "@/components/admin/admin-upload-banner";
import { getAdminScoreById } from "@/lib/scores/admin";

export default async function AdminScoreEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const score = await getAdminScoreById(id);
  if (!score) {
    notFound();
  }

  const tagsValue = score.tags.map((tag) => tag.label).join(", ");

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
