"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LICENSE_OPTIONS } from "@/lib/ingest/constants";

async function generatePreviewSvg(file: File): Promise<string> {
  const [{ default: createVerovioModule }, { VerovioToolkit }] = await Promise.all([
    import("verovio/wasm"),
    import("verovio/esm"),
  ]);

  const verovioModule = await createVerovioModule();
  const toolkit = new VerovioToolkit(verovioModule);
  toolkit.setOptions({
    scale: 40,
    footer: "none",
    header: "none",
  });

  const buffer = await file.arrayBuffer();
  const extension = file.name.toLowerCase().split(".").pop();
  const loaded =
    extension === "mxl"
      ? toolkit.loadZipDataBuffer(buffer)
      : toolkit.loadData(new TextDecoder().decode(buffer));

  if (!loaded) {
    throw new Error("Could not render preview from uploaded file");
  }

  return toolkit.renderToSVG(1);
}

export function AdminUploadForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

      setMessage(`Uploaded “${uploadJson.title}” as /scores/${uploadJson.slug}`);
      form.reset();
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
        <label htmlFor="file" className="text-sm font-medium">
          Score file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".mxl,.musicxml,.xml,application/vnd.recordare.musicxml+xml,application/xml,text/xml"
          className="block w-full text-sm"
        />
        <p className="text-xs text-zinc-500">
          Accepts .mxl, .musicxml, or .xml up to 8 MB.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="license" className="text-sm font-medium">
          License
        </label>
        <select
          id="license"
          name="license"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          defaultValue="Public Domain"
        >
          {LICENSE_OPTIONS.map((license) => (
            <option key={license} value={license}>
              {license}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="visibility" className="text-sm font-medium">
          Visibility
        </label>
        <select
          id="visibility"
          name="visibility"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          defaultValue="public"
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          placeholder="bach, etude, sight-reading"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sourceUrl" className="text-sm font-medium">
          Source URL
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="https://imslp.org/..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload score"}
      </Button>
    </form>
  );
}
