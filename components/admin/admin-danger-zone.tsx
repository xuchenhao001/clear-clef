"use client";

import { Button } from "@/components/ui/button";

type AdminDangerZoneProps = {
  title: string;
  description: string;
  confirmDelete: boolean;
  deletePending: boolean;
  onDelete: () => void;
  onCancelConfirm: () => void;
};

export function AdminDangerZone({
  title,
  description,
  confirmDelete,
  deletePending,
  onDelete,
  onCancelConfirm,
}: AdminDangerZoneProps) {
  return (
    <section className="rounded-xl border border-edition-semantic-error/30 bg-edition-surface-card p-6">
      <h2 className="text-sm font-semibold text-edition-semantic-error">Danger zone</h2>
      <p className="mt-2 type-body-sm text-edition-muted">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="destructive"
          disabled={deletePending}
          onClick={onDelete}
        >
          {confirmDelete
            ? deletePending
              ? "Deleting…"
              : `Confirm delete “${title}”`
            : "Delete score"}
        </Button>
        {confirmDelete && !deletePending ? (
          <button
            type="button"
            className="text-sm text-edition-muted underline-offset-2 hover:underline"
            onClick={onCancelConfirm}
          >
            Cancel
          </button>
        ) : null}
      </div>
      {confirmDelete ? (
        <p className="mt-3 type-body-sm text-edition-muted">
          This permanently removes the score and all stored files. This cannot be undone.
        </p>
      ) : null}
    </section>
  );
}
