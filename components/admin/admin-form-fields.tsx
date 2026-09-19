"use client";

import {
  adminFormInputClassName,
  adminFormLabelClassName,
} from "@/components/admin/admin-form-styles";
import { EditionSelect } from "@/components/ui/edition-select";
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
      <div className="space-y-2">
        <label htmlFor={sourceUrlId} className={adminFormLabelClassName}>
          Source URL
        </label>
        <input
          id={sourceUrlId}
          name="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(event) => onSourceUrlChange(event.target.value)}
          placeholder="https://imslp.org/..."
          className={adminFormInputClassName}
        />
      </div>
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
      <div className="space-y-2">
        <label htmlFor="catalogNumber" className={adminFormLabelClassName}>
          Catalog number
        </label>
        <input
          id="catalogNumber"
          name="catalogNumber"
          type="text"
          value={catalogNumber}
          onChange={(event) => onCatalogNumberChange(event.target.value)}
          placeholder="BWV 846, Op. 27 No. 2"
          className={adminFormInputClassName}
        />
      </div>
      {showExtendedMetadata ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="key" className={adminFormLabelClassName}>
                Key
              </label>
              <input
                id="key"
                name="key"
                type="text"
                value={scoreKey}
                onChange={(event) => onScoreKeyChange?.(event.target.value)}
                className={adminFormInputClassName}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="timeSignature" className={adminFormLabelClassName}>
                Time signature
              </label>
              <input
                id="timeSignature"
                name="timeSignature"
                type="text"
                value={timeSignature}
                onChange={(event) => onTimeSignatureChange?.(event.target.value)}
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
              name="difficulty"
              type="text"
              value={difficulty}
              onChange={(event) => onDifficultyChange?.(event.target.value)}
              className={adminFormInputClassName}
            />
          </div>
        </>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="tags" className={adminFormLabelClassName}>
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={tags}
          onChange={(event) => onTagsChange(event.target.value)}
          placeholder="bach, etude, sight-reading"
          className={adminFormInputClassName}
        />
      </div>
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
    <div className="space-y-2">
      <label htmlFor={id} className={adminFormLabelClassName}>
        {label}
      </label>
      <div className="rounded-xl border border-edition-hairline bg-edition-surface-card px-4 py-3">
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          required={required}
          accept=".mxl,.musicxml,.xml,application/vnd.recordare.musicxml+xml,application/xml,text/xml"
          className="block w-full text-sm text-edition-body file:mr-4 file:rounded-full file:border-0 file:bg-edition-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-edition-on-primary"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            onFileChange(file?.name ?? null);
          }}
        />
        {selectedFileName ? (
          <p className="mt-2 type-body-sm text-edition-muted">{selectedFileName}</p>
        ) : null}
      </div>
      <p className="text-xs text-edition-muted">{helperText}</p>
    </div>
  );
}
