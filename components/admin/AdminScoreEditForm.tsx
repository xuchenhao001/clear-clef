"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AdminDangerZone } from "@/components/admin/admin-danger-zone";
import {
  AdminCatalogFields,
  AdminRightsFields,
  AdminScoreFileInput,
} from "@/components/admin/admin-form-fields";
import {
  adminFormInputClassName,
  adminFormLabelClassName,
} from "@/components/admin/admin-form-styles";
import { AdminSection } from "@/components/admin/admin-section";
import { AdminScoreEditSidebar } from "@/components/admin/admin-score-edit-sidebar";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { generatePreviewSvg } from "@/lib/verovio/generate-preview-svg";

type ScoreFormState = {
  title: string;
  composer: string;
  lyricist: string;
  catalogNumber: string;
  license: string;
  key: string;
  timeSignature: string;
  difficulty: string;
  sourceUrl: string;
  tags: string;
};

type AdminScoreEditFormProps = {
  scoreId: string;
  slug: string;
  initial: ScoreFormState;
  initialVisibility: "public" | "unlisted" | "private";
  hasPreview: boolean;
};

type ScoreVisibility = "public" | "unlisted" | "private";

function buildPatchFormData(
  form: ScoreFormState,
  license: string,
  visibility: ScoreVisibility,
  file: File | null,
): FormData {
  const formData = new FormData();
  formData.set("title", form.title);
  formData.set("composer", form.composer);
  formData.set("lyricist", form.lyricist);
  formData.set("catalogNumber", form.catalogNumber);
  formData.set("license", license);
  formData.set("visibility", visibility);
  formData.set("key", form.key);
  formData.set("timeSignature", form.timeSignature);
  formData.set("difficulty", form.difficulty);
  formData.set("sourceUrl", form.sourceUrl);
  formData.set("tags", form.tags);
  if (file) {
    formData.set("file", file);
  }
  return formData;
}

export function AdminScoreEditForm({
  scoreId,
  slug,
  initial,
  initialVisibility,
  hasPreview,
}: AdminScoreEditFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [license, setLicense] = useState(initial.license);
  const [formVisibility, setFormVisibility] = useState(initialVisibility);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ScoreFormState>(key: K, value: ScoreFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const file = fileInputRef.current?.files?.[0] ?? null;
    const formData = buildPatchFormData(form, license, formVisibility, file);

    try {
      const patchResponse = await fetch(`/api/admin/scores/${scoreId}`, {
        method: "PATCH",
        body: formData,
      });
      const patchJson = (await patchResponse.json()) as { error?: string };

      if (!patchResponse.ok) {
        throw new Error(patchJson.error ?? "Save failed");
      }

      if (file && file.size > 0) {
        const previewSvg = await generatePreviewSvg(file);
        const previewResponse = await fetch(
          `/api/admin/scores/${scoreId}/preview`,
          {
            method: "PUT",
            headers: { "Content-Type": "image/svg+xml" },
            body: previewSvg,
          },
        );
        if (!previewResponse.ok) {
          throw new Error("Score saved, but preview generation failed");
        }
      }

      setMessage("Changes saved.");
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Save failed",
      );
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeletePending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/scores/${scoreId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Delete failed");
      }
      router.push("/admin/scores");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      );
      setDeletePending(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
      <div className="flex flex-col gap-6">
        <AdminSection legend="Work" description="Displayed title and credits on the public catalog.">
          <div className="space-y-2">
            <label htmlFor="title" className={adminFormLabelClassName}>
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className={adminFormInputClassName}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="composer" className={adminFormLabelClassName}>
              Composer
            </label>
            <input
              id="composer"
              type="text"
              value={form.composer}
              onChange={(event) => updateField("composer", event.target.value)}
              className={adminFormInputClassName}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lyricist" className={adminFormLabelClassName}>
              Lyricist
            </label>
            <input
              id="lyricist"
              type="text"
              value={form.lyricist}
              onChange={(event) => updateField("lyricist", event.target.value)}
              className={adminFormInputClassName}
            />
          </div>
        </AdminSection>

        <AdminSection legend="Catalog metadata" description="Filters and list display on the public index.">
          <AdminCatalogFields
            visibility={formVisibility}
            onVisibilityChange={setFormVisibility}
            tags={form.tags}
            onTagsChange={(value) => updateField("tags", value)}
            catalogNumber={form.catalogNumber}
            onCatalogNumberChange={(value) => updateField("catalogNumber", value)}
            showExtendedMetadata
            scoreKey={form.key}
            onScoreKeyChange={(value) => updateField("key", value)}
            timeSignature={form.timeSignature}
            onTimeSignatureChange={(value) => updateField("timeSignature", value)}
            difficulty={form.difficulty}
            onDifficultyChange={(value) => updateField("difficulty", value)}
          />
        </AdminSection>

        <AdminSection legend="Rights" description="License and source link shown on the score detail page.">
          <AdminRightsFields
            license={license}
            onLicenseChange={setLicense}
            sourceUrl={form.sourceUrl}
            onSourceUrlChange={(value) => updateField("sourceUrl", value)}
          />
        </AdminSection>

        <AdminSection
          legend="Replace score file"
          description="Optional. Metadata above is kept; only storage and part defaults change."
        >
          <AdminScoreFileInput
            id="file"
            label="MusicXML file"
            helperText="Uploading a new file regenerates the page-1 preview after save."
            fileInputRef={fileInputRef}
            selectedFileName={selectedFileName}
            onFileChange={setSelectedFileName}
          />
        </AdminSection>

        <AdminDangerZone
          title={form.title}
          description="Permanently remove this score from the catalog and delete all stored files."
          confirmDelete={confirmDelete}
          deletePending={deletePending}
          onDelete={onDelete}
          onCancelConfirm={() => setConfirmDelete(false)}
        />

        {message ? (
          <p className="text-sm text-edition-semantic-success" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-edition-semantic-error" role="alert">
            {error}
          </p>
        ) : null}

        <AdminStickyActions pending={pending} backHref="/admin/scores" />
      </div>

      <AdminScoreEditSidebar
        scoreId={scoreId}
        slug={slug}
        visibility={formVisibility}
        hasPreview={hasPreview}
      />
    </form>
  );
}
