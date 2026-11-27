
import { AdminField, AdminInput } from "@/components/admin/admin-field";
import { EditionSelect } from "@/components/ui/edition-select";
import {
  canonicalKey,
  DIFFICULTY_OPTIONS,
  KEY_OPTIONS,
} from "@/lib/catalog/vocab";
import { LICENSE_OPTIONS } from "@/lib/ingest/constants";

export type ScoreVisibility = "public" | "unlisted" | "private";

type AdminRightsFieldsProps = {
  license: string;
  onLicenseChange: (value: string) => void;
  sourceUrl: string;
  onSourceUrlChange: (value: string) => void;
  sourceUrlId?: string;
};

export function AdminRightsFields({
  license,
  onLicenseChange,
  sourceUrl,
  onSourceUrlChange,
  sourceUrlId = "sourceUrl",
}: AdminRightsFieldsProps) {
  return (
    <>
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
        onValueChange={onLicenseChange}
      />
      <AdminField label="Source URL" htmlFor={sourceUrlId}>
        <AdminInput
          id={sourceUrlId}
          name="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(event) => onSourceUrlChange(event.target.value)}
          placeholder="https://imslp.org/…"
        />
      </AdminField>
    </>
  );
}

type AdminCatalogFieldsProps = {
  visibility: ScoreVisibility;
  onVisibilityChange: (value: ScoreVisibility) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  catalogNumber: string;
  onCatalogNumberChange: (value: string) => void;
  showExtendedMetadata?: boolean;
  scoreKey?: string;
  onScoreKeyChange?: (value: string) => void;
  timeSignature?: string;
  onTimeSignatureChange?: (value: string) => void;
  difficulty?: string;
  onDifficultyChange?: (value: string) => void;
};

export function AdminCatalogFields({
  visibility,
  onVisibilityChange,
  tags,
  onTagsChange,
  catalogNumber,
  onCatalogNumberChange,
  showExtendedMetadata = false,
  scoreKey = "",
  onScoreKeyChange,
  timeSignature = "",
  onTimeSignatureChange,
  difficulty = "",
  onDifficultyChange,
}: AdminCatalogFieldsProps) {
  return (
    <>
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
        onValueChange={(value) => onVisibilityChange(value as ScoreVisibility)}
      />
      <AdminField label="Catalog number" htmlFor="catalogNumber">
        <AdminInput
          id="catalogNumber"
          name="catalogNumber"
          type="text"
          value={catalogNumber}
          onChange={(event) => onCatalogNumberChange(event.target.value)}
          placeholder="BWV 846, Op. 27 No. 2"
        />
      </AdminField>
      {showExtendedMetadata ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <EditionSelect
              name="key"
              label="Key"
              value={canonicalKey(scoreKey) ?? scoreKey}
              placeholder="Not set"
              labelVariant="form"
              triggerVariant="boxed"
              items={[
                { label: "Not set", value: "" },
                ...KEY_OPTIONS.map((key) => ({
                  label: key.label,
                  value: key.value,
                })),
                ...(scoreKey && !canonicalKey(scoreKey)
                  ? [{ label: scoreKey, value: scoreKey }]
                  : []),
              ]}
              onValueChange={(value) => onScoreKeyChange?.(value)}
            />
            <AdminField label="Time signature" htmlFor="timeSignature">
              <AdminInput
                id="timeSignature"
                name="timeSignature"
                type="text"
                value={timeSignature}
                onChange={(event) => onTimeSignatureChange?.(event.target.value)}
                placeholder="4/4"
              />
            </AdminField>
          </div>
          <EditionSelect
            name="difficulty"
            label="Difficulty"
            value={difficulty}
            placeholder="Not set"
            labelVariant="form"
            triggerVariant="boxed"
            items={[
              { label: "Not set", value: "" },
              ...DIFFICULTY_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              })),
            ]}
            onValueChange={(value) => onDifficultyChange?.(value)}
          />
        </>
      ) : null}
      <AdminField
        label="Tags"
        htmlFor="tags"
        hint="Comma-separated. Tags become filters on the public index."
      >
        <AdminInput
          id="tags"
          name="tags"
          type="text"
          value={tags}
          onChange={(event) => onTagsChange(event.target.value)}
          placeholder="bach, etude, sight-reading"
        />
      </AdminField>
    </>
  );
}

type AdminScoreFileInputProps = {
  id: string;
  name?: string;
  required?: boolean;
  label: string;
  helperText: string;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  selectedFileName: string | null;
  onFileChange: (fileName: string | null) => void;
};

export function AdminScoreFileInput({
  id,
  name = "file",
  required = false,
  label,
  helperText,
  fileInputRef,
  selectedFileName,
  onFileChange,
}: AdminScoreFileInputProps) {
  return (
    <AdminField label={label} htmlFor={id} hint={helperText}>
      <div className="rounded-md border border-edition-field-border bg-edition-canvas/50 px-4 py-3">
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          required={required}
          accept=".mxl,.musicxml,.xml,application/vnd.recordare.musicxml+xml,application/xml,text/xml"
          className="block w-full text-sm text-edition-body file:mr-4 file:rounded-md file:border-0 file:bg-edition-primary file:px-4 file:py-2 file:font-display file:text-[0.8125rem] file:font-semibold file:tracking-[0.14em] file:text-edition-on-primary file:uppercase"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            onFileChange(file?.name ?? null);
          }}
        />
        {selectedFileName ? (
          <p className="mt-2 type-caption-mono">{selectedFileName}</p>
        ) : null}
      </div>
    </AdminField>
  );
}
