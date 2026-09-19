"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
      className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-edition-hairline bg-edition-surface-card px-4 py-3"
      role="status"
    >
      <p className="type-body-sm text-edition-body">
        Score uploaded. Review metadata and visibility before publishing.
      </p>
      <button
        type="button"
        className="type-body-sm text-edition-muted underline-offset-2 hover:underline"
        onClick={dismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
