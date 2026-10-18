"use client";

import { Button } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";

type AdminDangerZoneProps = {
  title: string;
  description: string;
  confirmDelete: boolean;
  deletePending: boolean;
  onDelete: () => void;
  onCancelConfirm: () => void;
};

/**
 * The destructive plate: the same leaf as every other section, but ruled in the
 * rubric (vermilion) instead of brass, so danger reads as a colour of the ledger
 * rather than a red-tinted card bolted on.
 */
export function AdminDangerZone({
  title,
  description,
  confirmDelete,
  deletePending,
  onDelete,
  onCancelConfirm,
}: AdminDangerZoneProps) {
  return (
    <Plate edge="rubric">
      <div className="rule-printed px-4 py-3">
        <h2 className="font-display text-[0.6875rem] font-semibold tracking-[0.2em] uppercase text-edition-rubric">
          Danger zone
        </h2>
        <p className="mt-1.5 type-body-sm text-edition-muted text-pretty">
          {description}
        </p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
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
              className="type-nav-link hover:text-edition-ink"
              onClick={onCancelConfirm}
            >
              Cancel
            </button>
          ) : null}
        </div>
        {confirmDelete ? (
          <p className="mt-3 type-body-sm text-edition-muted">
            This permanently removes the score and all stored files. This cannot be
            undone.
          </p>
        ) : null}
      </div>
    </Plate>
  );
}
