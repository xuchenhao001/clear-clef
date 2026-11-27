import { useState } from "react";

export function AdminFixSlugsButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function fix() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/catalog/fix-slugs", {
        method: "POST",
      });
      const json = (await response.json()) as {
        fixed?: number;
        remaining?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Slug cleanup failed");
      }
      setMessage(
        `Fixed ${json.fixed ?? 0}. ${json.remaining ? `${json.remaining} still use untitled slugs.` : "No untitled slugs left."}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Slug cleanup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={fix}
        disabled={pending}
        className="type-hint border border-edition-hairline-strong px-3 py-2 text-edition-ink hover:border-edition-gilt hover:text-edition-gilt disabled:cursor-not-allowed disabled:text-edition-muted-soft"
      >
        {pending ? "Fixing slugs…" : "Fix legacy slugs"}
      </button>
      {message ? <p className="type-shelf">{message}</p> : null}
    </div>
  );
}
