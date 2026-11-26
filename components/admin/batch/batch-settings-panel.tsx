import { useState } from "react";
import { AdminField, AdminInput } from "@/components/admin/admin-field";
import { EditionSelect } from "@/components/ui/edition-select";
import { Plate, PlateHead } from "@/components/ui/plate";
import type { BatchRow, BatchSettings } from "@/lib/batch/types";
import { LICENSE_OPTIONS } from "@/lib/ingest/constants";

type BatchSettingsPanelProps = {
  settings: BatchSettings;
  rows: BatchRow[];
  disabled: boolean;
  onChange: (settings: BatchSettings) => void;
  onDiscard: () => void;
};

export function BatchSettingsPanel({
  settings,
  rows,
  disabled,
  onChange,
  onDiscard,
}: BatchSettingsPanelProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const rightsCount = rows.filter(
    (row) => Boolean(row.metadata?.rights?.trim()),
  ).length;
  const customLicenseCount = rows.filter(
    (row) => row.overrides.license !== undefined,
  ).length;
  const customVisibilityCount = rows.filter(
    (row) => row.overrides.visibility !== undefined,
  ).length;
  const missingLicense = rows.some(
    (row) =>
      row.status === "ready" &&
      !(row.overrides.license ?? settings.license).trim(),
  );

  function update<K extends keyof BatchSettings>(
    key: K,
    value: BatchSettings[K],
  ) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <Plate>
      <PlateHead
        label="Batch settings"
        labelAs="h2"
        description="Rights and visibility for every file."
      />
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <EditionSelect
          name="batch-license"
          label="License"
          value={settings.license}
          required
          disabled={disabled}
          triggerVariant="boxed"
          labelVariant="form"
          placeholder="Choose license"
          items={LICENSE_OPTIONS.map((license) => ({
            label: license,
            value: license,
          }))}
          onValueChange={(value) => update("license", value)}
        />

        <EditionSelect
          name="batch-visibility"
          label="Visibility"
          value={settings.visibility}
          disabled={disabled}
          triggerVariant="boxed"
          labelVariant="form"
          items={[
            { label: "Private", value: "private" },
            { label: "Unlisted", value: "unlisted" },
            { label: "Public", value: "public" },
          ]}
          onValueChange={(value) =>
            update("visibility", value as BatchSettings["visibility"])
          }
        />

        <AdminField
          label="Tags"
          htmlFor="batch-tags"
          hint="Comma-separated. Applied to every score unless a file overrides them."
        >
          <AdminInput
            id="batch-tags"
            value={settings.tags}
            disabled={disabled}
            onChange={(event) => update("tags", event.target.value)}
            placeholder="piano, classical"
          />
        </AdminField>

        <AdminField
          label="Default source URL"
          htmlFor="batch-source"
          hint="Used only when a file carries no source of its own."
        >
          <AdminInput
            id="batch-source"
            type="url"
            value={settings.sourceUrl}
            disabled={disabled}
            onChange={(event) => update("sourceUrl", event.target.value)}
            placeholder="https://imslp.org/…"
          />
        </AdminField>

        {!disabled && missingLicense ? (
          <p className="type-body-sm text-edition-gilt">
            A license is required for every score. Set it here, or override it
            per file.
          </p>
        ) : null}

        {rightsCount > 0 ? (
          <p className="type-body-sm text-edition-muted">
            {rightsCount} {rightsCount === 1 ? "file carries" : "files carry"} a
            rights statement. Open a file to read it before choosing a license.
          </p>
        ) : null}

        {customLicenseCount > 0 || customVisibilityCount > 0 ? (
          <p className="type-caption-mono text-edition-muted">
            {customLicenseCount} custom license
            {customLicenseCount === 1 ? "" : "s"} · {customVisibilityCount} custom
            visibility setting{customVisibilityCount === 1 ? "" : "s"}
          </p>
        ) : null}

        <p className="type-caption-mono text-edition-muted">
          Page-1 previews are drawn in this browser. Keep this tab open while
          they render.
        </p>

        {!disabled ? (
          <div className="border-t border-edition-hairline-soft pt-4">
            {confirmDiscard ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="type-hint text-edition-semantic-error hover:text-edition-ink"
                  onClick={onDiscard}
                >
                  Confirm discard
                </button>
                <button
                  type="button"
                  className="type-hint hover:text-edition-gilt"
                  onClick={() => setConfirmDiscard(false)}
                >
                  Keep batch
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="type-hint text-edition-muted hover:text-edition-semantic-error"
                onClick={() => setConfirmDiscard(true)}
              >
                Discard batch
              </button>
            )}
          </div>
        ) : null}
      </div>
    </Plate>
  );
}
