
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AdminCatalogFields, AdminRightsFields, AdminScoreFileInput } from "@/components/admin/admin-form-fields";
import { adminFormErrorClassName } from "@/components/admin/admin-form-styles";
import { AdminSection } from "@/components/admin/admin-section";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { generatePreviewSvg } from "@/lib/verovio/generate-preview-svg";

export function AdminUploadForm() {
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [license, setLicense] = useState("Public Domain");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [tags, setTags] = useState("");
  const [catalogNumber, setCatalogNumber] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("license", license);
    formData.set("visibility", visibility);
    formData.set("tags", tags);
    formData.set("catalogNumber", catalogNumber);
    formData.set("sourceUrl", sourceUrl);
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
      };

      if (!uploadResponse.ok || !uploadJson.id) {
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

      navigate({
        to: "/admin/scores/$id",
        params: { id: uploadJson.id! },
        search: { uploaded: "1" },
      });
      await router.invalidate();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Upload failed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <AdminSection
        legend="Score file"
        description="We accept .mxl, .musicxml, or .xml up to 8 MB."
      >
        <AdminScoreFileInput
          id="file"
          required
          label="MusicXML file"
          helperText="After upload you can review metadata on the edit screen."
          selectedFileName={selectedFileName}
          onFileChange={setSelectedFileName}
        />
      </AdminSection>

      <AdminSection
        legend="Rights"
        description="License and provenance are required for every catalog entry."
      >
        <AdminRightsFields
          license={license}
          onLicenseChange={setLicense}
          sourceUrl={sourceUrl}
          onSourceUrlChange={setSourceUrl}
        />
      </AdminSection>

      <AdminSection
        legend="Catalog"
        description="Visibility controls whether the work appears on the public index."
      >
        <AdminCatalogFields
          visibility={visibility}
          onVisibilityChange={setVisibility}
          tags={tags}
          onTagsChange={setTags}
          catalogNumber={catalogNumber}
          onCatalogNumberChange={setCatalogNumber}
        />
      </AdminSection>

      {error ? (
        <p className={adminFormErrorClassName} role="alert">
          {error}
        </p>
      ) : null}

      <AdminStickyActions
        pending={pending}
        backHref="/admin/scores"
        submitLabel="Upload score"
        pendingLabel="Uploading…"
      />
    </form>
  );
}
