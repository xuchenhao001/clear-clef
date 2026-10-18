"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/** A slip pasted into the ledger after an upload: a leaf strip with a brass mark. */
export function AdminUploadedBanner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const uploaded = searchParams.get("uploaded") === "1";

  if (!uploaded || dismissed) {
    return null;
  }

  function dismiss() {
    setDismissed(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("uploaded");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
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
