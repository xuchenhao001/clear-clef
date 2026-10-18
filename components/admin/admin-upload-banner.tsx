
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

export function AdminUploadedBanner() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { uploaded?: string };
  const [dismissed, setDismissed] = useState(false);
  const uploaded = search.uploaded === "1";

  if (!uploaded || dismissed) {
    return null;
  }

  function dismiss() {
    setDismissed(true);
    navigate({
      to: ".",
      search: (prev) => {
        const next = { ...prev } as Record<string, unknown>;
        delete next.uploaded;
        return next;
      },
      replace: true,
    });
  }

  return (
    <div
      className="surface-board on-board shadow-plate flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-edition-hairline px-4 py-3"
      role="status"
    >
      <p className="type-body-sm text-edition-body">
        <span className="mr-2 type-imprint text-edition-gilt-deep">Notice</span>
        Score uploaded. Review metadata and visibility before publishing.
      </p>
      <button
        type="button"
        className="type-nav-link hover:text-edition-ink"
        onClick={dismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
