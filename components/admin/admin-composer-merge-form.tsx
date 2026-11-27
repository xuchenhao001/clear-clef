import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import type { ComposerSummary } from "@/lib/scores/composers";
import { cn } from "cn";

type AdminComposerMergeFormProps = {
  composers: Array<ComposerSummary & { scoreCount: number }>;
};

export function AdminComposerMergeForm({ composers }: AdminComposerMergeFormProps) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/composers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, targetId }),
      });
      const json = (await response.json()) as { error?: string; moved?: number };
      if (!response.ok) {
        throw new Error(json.error ?? "Merge failed");
      }
      setMessage(`Merged. ${json.moved ?? 0} scores reindexed.`);
      setSourceId("");
      setTargetId("");
      await router.invalidate();
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : "Merge failed");
    } finally {
      setPending(false);
    }
  }

  const selectClassName =
    "w-full border border-edition-field-border bg-edition-ground-2 px-3 py-2 type-body-sm text-edition-ink outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring";

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 border-y border-edition-hairline py-5"
    >
      <p className="type-running-head">Merge a duplicate</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="type-label">Merge from</span>
          <select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            required
            className={cn(selectClassName)}
          >
            <option value="">Choose a composer</option>
            {composers.map((composer) => (
              <option key={composer.id} value={composer.id}>
                {composer.displayName} ({composer.scoreCount})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="type-label">Into</span>
          <select
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            required
            className={cn(selectClassName)}
          >
            <option value="">Choose a composer</option>
            {composers.map((composer) => (
              <option key={composer.id} value={composer.id}>
                {composer.displayName} ({composer.scoreCount})
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={pending || !sourceId || !targetId || sourceId === targetId}
        className="type-hint w-fit border border-edition-gilt px-4 py-2.5 text-edition-gilt hover:bg-edition-gilt hover:text-edition-on-gilt disabled:cursor-not-allowed disabled:border-edition-hairline disabled:text-edition-muted-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
      >
        {pending ? "Merging…" : "Merge composers"}
      </button>
      {message ? (
        <p className="type-body-sm text-edition-semantic-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="type-body-sm text-edition-semantic-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
