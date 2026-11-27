
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AdminDangerZone } from "@/components/admin/admin-danger-zone";
import { AdminField, AdminInput } from "@/components/admin/admin-field";
import {
  ComposerPicker,
  type ComposerChoice,
} from "@/components/admin/composer-picker";
import {
  AdminCatalogFields,
  AdminRightsFields,
  AdminScoreFileInput,
} from "@/components/admin/admin-form-fields";
import { adminFormErrorClassName } from "@/components/admin/admin-form-styles";
import { AdminSection } from "@/components/admin/admin-section";
import { AdminScoreEditSidebar } from "@/components/admin/admin-score-edit-sidebar";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { inspectFile } from "@/lib/ingest/inspect-client";
import type { ComposerWithCount } from "@/lib/scores/composers";
import { renderPreviewFromFile } from "@/lib/verovio/preview-client";
import { uploadPreviewThumb } from "@/lib/verovio/preview-thumb";

type ScoreFormState = {
  title: string;
  arranger: string;
  editionLabel: string;
  slug: string;
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
  composers: ComposerWithCount[];
  initialComposerId: string | null;
  composerRaw: string | null;
  initial: ScoreFormState;
  initialVisibility: "public" | "unlisted" | "private";
  hasPreview: boolean;
};

type ScoreVisibility = "public" | "unlisted" | "private";

function buildPatchFormData(
  form: ScoreFormState,
  license: string,
  visibility: ScoreVisibility,
  composerChoice: ComposerChoice | null,
  uncreditedId: string | null,
  file: File | null,
  canonicalXml?: string,
  contentHash?: string,
): FormData {
  const formData = new FormData();
  formData.set("title", form.title);
  if (composerChoice?.kind === "existing") {
    formData.set("composerId", composerChoice.composer.id);
  } else if (composerChoice?.kind === "uncredited" && uncreditedId) {
    formData.set("composerId", uncreditedId);
  } else if (composerChoice?.kind === "create") {
    formData.set("composer", composerChoice.name);
  } else {
    formData.set("composer", "");
  }
  formData.set("arranger", form.arranger);
  formData.set("editionLabel", form.editionLabel);
  formData.set("slug", form.slug);
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
  if (canonicalXml) {
    formData.set(
      "canonical",
      new File([canonicalXml], "canonical.musicxml", {
        type: "application/xml",
      }),
    );
  }
  if (contentHash) {
    formData.set("contentHash", contentHash);
  }
  return formData;
}

export function AdminScoreEditForm({
  scoreId,
  slug,
  composers,
  initialComposerId,
  composerRaw,
  initial,
  initialVisibility,
  hasPreview,
}: AdminScoreEditFormProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [composerChoice, setComposerChoice] = useState<ComposerChoice | null>(
    () => {
      const composer = initialComposerId
        ? composers.find((item) => item.id === initialComposerId)
        : null;
      return composer ? { kind: "existing", composer } : null;
    },
  );
  const uncredited = composers.find(
    (composer) => composer.displayName === "Uncredited",
  );
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

    try {
      let canonicalXml: string | undefined;
      let contentHash: string | undefined;
      if (file && file.size > 0) {
        const inspected = await inspectFile(file, { includeCanonical: true });
        if (!inspected.canonicalXml) {
          throw new Error("Could not prepare the canonical MusicXML");
        }
        canonicalXml = inspected.canonicalXml;
        contentHash = inspected.contentHash;
      }
      if (composerChoice?.kind === "uncredited" && !uncredited) {
        throw new Error("The Uncredited authority record is missing");
      }
      const formData = buildPatchFormData(
        form,
        license,
        formVisibility,
        composerChoice,
        uncredited?.id ?? null,
        file,
        canonicalXml,
        contentHash,
      );

      const patchResponse = await fetch(`/api/admin/scores/${scoreId}`, {
        method: "PATCH",
        body: formData,
      });
      const patchJson = (await patchResponse.json()) as { error?: string };

      if (!patchResponse.ok) {
        throw new Error(patchJson.error ?? "Save failed");
      }

      if (file && file.size > 0) {
        const previewSvg = await renderPreviewFromFile(file);
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
        try {
          await uploadPreviewThumb(scoreId, previewSvg);
        } catch {
          // The catalog falls back to the larger SVG preview.
        }
      }

      setMessage("Changes saved.");
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await router.invalidate();
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
      navigate({ to: "/admin/scores" });
      await router.invalidate();
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
          <AdminField label="Title" htmlFor="title">
            <AdminInput
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </AdminField>
          <AdminField
            label="Composer"
            htmlFor="composer"
            hint="Search the authority file, create a new record, or keep the work uncredited. Known aliases resolve to the same composer."
          >
            <ComposerPicker
              id="composer"
              composers={composers}
              value={composerChoice}
              onChange={setComposerChoice}
              suggestedName={composerRaw}
              allowUncredited
              allowClear
            />
            {composerRaw ? (
              <p className="type-caption-mono text-edition-muted">
                File credit: “{composerRaw}”
              </p>
            ) : null}
          </AdminField>
          <AdminField label="Arranger" htmlFor="arranger">
            <AdminInput
              id="arranger"
              type="text"
              value={form.arranger}
              onChange={(event) => updateField("arranger", event.target.value)}
              placeholder="E. Muirhead"
            />
          </AdminField>
          <AdminField label="Edition" htmlFor="editionLabel">
            <AdminInput
              id="editionLabel"
              type="text"
              value={form.editionLabel}
              onChange={(event) => updateField("editionLabel", event.target.value)}
              placeholder="Easy piano, original edition…"
            />
          </AdminField>
          <AdminField label="URL slug" htmlFor="slug" hint="Changing this leaves a 301 redirect from the old address.">
            <AdminInput
              id="slug"
              type="text"
              value={form.slug}
              onChange={(event) => updateField("slug", event.target.value)}
            />
          </AdminField>
          <AdminField label="Lyricist" htmlFor="lyricist">
            <AdminInput
              id="lyricist"
              type="text"
              value={form.lyricist}
              onChange={(event) => updateField("lyricist", event.target.value)}
            />
          </AdminField>
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
          <p className="type-body-sm text-edition-semantic-success" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className={adminFormErrorClassName} role="alert">
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
