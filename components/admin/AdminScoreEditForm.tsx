"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  adminFormInputClassName,
  adminFormLabelClassName,
} from "@/components/admin/admin-form-styles";
import { Button } from "@/components/ui/button";
import { EditionSelect } from "@/components/ui/edition-select";
import { LICENSE_OPTIONS } from "@/lib/ingest/constants";
import { generatePreviewSvg } from "@/lib/verovio/generate-preview-svg";
import { cn } from "cn";

type ScoreFormState = {
  title: string;
  composer: string;
  lyricist: string;
  catalogNumber: string;
  license: string;
  key: string;
  timeSignature: string;
  difficulty: string;
  visibility: "public" | "unlisted" | "private";
  sourceUrl: string;
  tags: string;
};

type AdminScoreEditFormProps = {
  scoreId: string;
  slug: string;
  initial: ScoreFormState;
  hasPreview: boolean;
};

function buildPatchFormData(
  form: ScoreFormState,
  license: string,
  visibility: ScoreFormState["visibility"],
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
  hasPreview,
}: AdminScoreEditFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [license, setLicense] = useState(initial.license);
  const [visibility, setVisibility] = useState(initial.visibility);
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
    const formData = buildPatchFormData(form, license, visibility, file);

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
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      {hasPreview ? (
        <div className="space-y-2">
          <p className={adminFormLabelClassName}>Current preview</p>
          <div className="overflow-hidden rounded-xl border border-edition-hairline bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only SVG from session-gated API */}
            <img
              src={`/api/admin/scores/${scoreId}/preview`}
              alt="Page 1 preview"
              className="mx-auto max-h-48 w-full object-contain"
            />
          </div>
        </div>
      ) : null}

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
        <label htmlFor="slug-display" className={adminFormLabelClassName}>
          Slug
        </label>
        <input
          id="slug-display"
          type="text"
          readOnly
          value={slug}
          className={cn(adminFormInputClassName, "text-edition-muted")}
        />
        <p className="text-xs text-edition-muted">
          Public URL stays /scores/{slug} when the title changes.
        </p>
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

      <EditionSelect
        name="license"
        label="License"
        value={license}
        required
        triggerVariant="boxed"
        labelVariant="form"
        placeholder="Choose license"
        items={LICENSE_OPTIONS.map((option) => ({
          label: option,
          value: option,
        }))}
        onValueChange={setLicense}
      />

      <EditionSelect
        name="visibility"
        label="Visibility"
        value={visibility}
        triggerVariant="boxed"
        labelVariant="form"
        items={[
          { label: "Public", value: "public" },
          { label: "Unlisted", value: "unlisted" },
          { label: "Private", value: "private" },
        ]}
        onValueChange={(value) =>
          setVisibility(value as "public" | "unlisted" | "private")
        }
      />

      <div className="space-y-2">
        <label htmlFor="catalogNumber" className={adminFormLabelClassName}>
          Catalog number
        </label>
        <input
          id="catalogNumber"
          type="text"
          value={form.catalogNumber}
          onChange={(event) => updateField("catalogNumber", event.target.value)}
          className={adminFormInputClassName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="key" className={adminFormLabelClassName}>
            Key
          </label>
          <input
            id="key"
            type="text"
            value={form.key}
            onChange={(event) => updateField("key", event.target.value)}
            className={adminFormInputClassName}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="timeSignature" className={adminFormLabelClassName}>
            Time signature
          </label>
          <input
            id="timeSignature"
            type="text"
            value={form.timeSignature}
            onChange={(event) => updateField("timeSignature", event.target.value)}
            className={adminFormInputClassName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="difficulty" className={adminFormLabelClassName}>
          Difficulty
        </label>
        <input
          id="difficulty"
          type="text"
          value={form.difficulty}
          onChange={(event) => updateField("difficulty", event.target.value)}
          className={adminFormInputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className={adminFormLabelClassName}>
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={form.tags}
          onChange={(event) => updateField("tags", event.target.value)}
          placeholder="bach, etude, sight-reading"
          className={adminFormInputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sourceUrl" className={adminFormLabelClassName}>
          Source URL
        </label>
        <input
          id="sourceUrl"
          type="url"
          value={form.sourceUrl}
          onChange={(event) => updateField("sourceUrl", event.target.value)}
          className={adminFormInputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="file" className={adminFormLabelClassName}>
          Replace score file
        </label>
        <div className="rounded-xl border border-edition-hairline bg-edition-surface-card px-4 py-3">
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept=".mxl,.musicxml,.xml,application/vnd.recordare.musicxml+xml,application/xml,text/xml"
            className="block w-full text-sm text-edition-body file:mr-4 file:rounded-full file:border-0 file:bg-edition-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-edition-on-primary"
            onChange={(event) => {
              const nextFile = event.currentTarget.files?.[0];
              setSelectedFileName(nextFile?.name ?? null);
            }}
          />
          {selectedFileName ? (
            <p className="mt-2 type-body-sm text-edition-muted">{selectedFileName}</p>
          ) : null}
        </div>
        <p className="text-xs text-edition-muted">
          Optional. Catalog fields above stay as edited; a new file only replaces R2
          storage and part defaults.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/admin/scores/${scoreId}/file`}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-full border border-edition-hairline-strong px-4 text-sm font-medium text-edition-ink",
          )}
        >
          Download original
        </a>
      </div>

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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={deletePending}
          onClick={onDelete}
        >
          {confirmDelete
            ? deletePending
              ? "Deleting…"
              : `Confirm delete “${form.title}”`
            : "Delete score"}
        </Button>
        {confirmDelete && !deletePending ? (
          <button
            type="button"
            className="text-sm text-edition-muted underline-offset-2 hover:underline"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
        ) : null}
      </div>
      {confirmDelete ? (
        <p className="text-sm text-edition-muted">
          This permanently removes the score and all files in R2. This cannot be undone.
        </p>
      ) : null}
    </form>
  );
}
