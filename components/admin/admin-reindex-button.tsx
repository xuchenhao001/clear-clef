import { useState } from "react";

export function AdminReindexButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reindex() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/search/reindex", {
        method: "POST",
      });
      const json = (await response.json()) as { indexed?: number; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Reindex failed");
      }
      setMessage(`Indexed ${json.indexed ?? 0} scores.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reindex failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={reindex}
        disabled={pending}
        className="type-hint border border-edition-hairline-strong px-3 py-2 text-edition-ink hover:border-edition-gilt hover:text-edition-gilt disabled:cursor-not-allowed disabled:text-edition-muted-soft"
      >
        {pending ? "Reindexing…" : "Rebuild search index"}
      </button>
      {message ? <p className="type-shelf">{message}</p> : null}
    </div>
  );
}
