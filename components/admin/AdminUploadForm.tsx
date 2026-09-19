"use client";

import { useState } from "react";
import { adminFormInputClassName, adminFormLabelClassName } from "@/components/admin/admin-form-styles";
import { Button } from "@/components/ui/button";
import { EditionSelect } from "@/components/ui/edition-select";
import { LICENSE_OPTIONS } from "@/lib/ingest/constants";
import { generatePreviewSvg } from "@/lib/verovio/generate-preview-svg";

export function AdminUploadForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [license, setLicense] = useState("Public Domain");
  const [visibility, setVisibility] = useState("public");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setError("Choose a MusicXML file");
      setPending(false);
      return;
    }

    try {
      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = (await uploadResponse.json()) as {
        error?: string;
        id?: string;
        slug?: string;
        title?: string;
      };

      if (!uploadResponse.ok) {
        throw new Error(uploadJson.error ?? "Upload failed");
      }

      const previewSvg = await generatePreviewSvg(file);
      const previewResponse = await fetch(
        `/api/admin/scores/${uploadJson.id}/preview`,
        {
          method: "PUT",
          headers: { "Content-Type": "image/svg+xml" },
          body: previewSvg,
        },
      );

      if (!previewResponse.ok) {
        throw new Error("Score uploaded, but preview generation failed");
      }

      setMessage(`Uploaded "${uploadJson.title}" as /scores/${uploadJson.slug}`);
      form.reset();
      setSelectedFileName(null);
      setLicense("Public Domain");
      setVisibility("public");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Upload failed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="space-y-2">
        <label htmlFor="file" className={adminFormLabelClassName}>
          Score file
        </label>
        <div className="rounded-xl border border-edition-hairline bg-edition-surface-card px-4 py-3">
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".mxl,.musicxml,.xml,application/vnd.recordare.musicxml+xml,application/xml,text/xml"
            className="block w-full text-sm text-edition-body file:mr-4 file:rounded-full file:border-0 file:bg-edition-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-edition-on-primary"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              setSelectedFileName(file?.name ?? null);
            }}
          />
          {selectedFileName ? (
            <p className="mt-2 type-body-sm text-edition-muted">{selectedFileName}</p>
          ) : null}
        </div>
        <p className="text-xs text-edition-muted">
          Accepts .mxl, .musicxml, or .xml up to 8 MB.
        </p>
      </div>

      <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
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
          onValueChange={setVisibility}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="catalogNumber" className={adminFormLabelClassName}>
          Catalog number
        </label>
        <input
          id="catalogNumber"
          name="catalogNumber"
          type="text"
          placeholder="BWV 846, Op. 27 No. 2"
          className={adminFormInputClassName}
        />
        <p className="text-xs text-edition-muted">
          Optional. Opus or thematic catalog if the work has one.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className={adminFormLabelClassName}>
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
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
          name="sourceUrl"
          type="url"
          placeholder="https://imslp.org/..."
          className={adminFormInputClassName}
        />
      </div>

      {message ? (
        <p
          className="text-sm text-edition-semantic-success"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-edition-semantic-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload score"}
      </Button>
    </form>
  );
}
