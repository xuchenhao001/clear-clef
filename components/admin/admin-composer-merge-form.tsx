"use client";

import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ComposerPicker,
  type ComposerChoice,
} from "@/components/admin/composer-picker";
import { Button } from "@/components/ui/button";
import type { ComposerWithCount } from "@/lib/scores/composers";

type AdminComposerMergeFormProps = {
  composers: ComposerWithCount[];
};

export function AdminComposerMergeForm({
  composers,
}: AdminComposerMergeFormProps) {
  const router = useRouter();
  const [source, setSource] = useState<ComposerChoice | null>(null);
  const [target, setTarget] = useState<ComposerChoice | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mergeable = composers.filter(
    (composer) => composer.displayName !== "Uncredited",
  );
  const sourceComposer =
    source?.kind === "existing" ? source.composer : null;
  const targetComposer =
    target?.kind === "existing" ? target.composer : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceComposer || !targetComposer) {
      setError("Choose the duplicate and the composer to keep.");
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/composers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: sourceComposer.id,
          targetId: targetComposer.id,
        }),
      });
      const json = (await response.json()) as {
        error?: string;
        moved?: number;
        target?: { displayName: string };
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Merge failed");
      }
      setMessage(
        `${json.moved ?? 0} ${
          json.moved === 1 ? "work" : "works"
        } moved to ${json.target?.displayName ?? targetComposer.displayName}.`,
      );
      setSource(null);
      setTarget(null);
      setConfirming(false);
      await router.invalidate();
    } catch (mergeError) {
      setError(
        mergeError instanceof Error ? mergeError.message : "Merge failed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4 sm:p-5">
      <p className="type-body-sm text-edition-body">
        Merge a duplicate authority record into the one to keep. Works, aliases
        and search documents move together. Uncredited cannot be merged; assign
        those works from the queue.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <span className="type-label">Duplicate to remove</span>
          <ComposerPicker
            id="merge-source"
            composers={mergeable}
            value={source}
            onChange={(next) => {
              setSource(next);
              setConfirming(false);
              setMessage(null);
            }}
            placeholder="Search the duplicate…"
          />
        </div>
        <div className="space-y-2">
          <span className="type-label">Composer to keep</span>
          <ComposerPicker
            id="merge-target"
            composers={mergeable}
            value={target}
            onChange={(next) => {
              setTarget(next);
              setConfirming(false);
              setMessage(null);
            }}
            placeholder="Search the target…"
          />
        </div>
      </div>

      {sourceComposer && targetComposer ? (
        <p className="type-body-sm text-edition-body">
          {sourceComposer.scoreCount}{" "}
          {sourceComposer.scoreCount === 1 ? "work" : "works"} under{" "}
          <span className="text-edition-ink">{sourceComposer.displayName}</span>{" "}
          will be credited to{" "}
          <span className="text-edition-ink">{targetComposer.displayName}</span>.
        </p>
      ) : null}

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

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={
            !sourceComposer ||
            !targetComposer ||
            sourceComposer.id === targetComposer.id ||
            pending
          }
        >
          {pending
            ? "Merging…"
            : confirming
              ? `Confirm merge into ${targetComposer?.displayName ?? ""}`
              : "Merge composers"}
        </Button>
        {confirming ? (
          <button
            type="button"
            className="type-hint text-edition-muted hover:text-edition-ink"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
