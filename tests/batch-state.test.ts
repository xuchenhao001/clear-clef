import { describe, expect, it } from "vitest";
import {
  countBatch,
  DEFAULT_BATCH_SETTINGS,
  displayStatus,
  markBatchDuplicates,
  newBatchRow,
  rowMatchesFilter,
} from "@/lib/batch/state";
import { deriveBatchPhase } from "@/lib/batch/storage";

function file(name: string): File {
  return new File(["<score/>"], name, { lastModified: 1 });
}

function readyRow(name: string, title: string, hash: string) {
  const row = newBatchRow(file(name), name);
  return {
    ...row,
    status: "ready" as const,
    suggestedTitle: title,
    contentHash: hash,
  };
}

describe("batch state", () => {
  it("marks a later identical file as a duplicate", () => {
    const first = readyRow("Canon_in_D.mxl", "Canon in D", "hash-a");
    const second = readyRow("Canon_in_D_2.mxl", "Canon in D", "hash-a");

    const rows = markBatchDuplicates([first, second]);

    expect(rows[0]?.status).toBe("ready");
    expect(rows[1]?.status).toBe("duplicate");
    expect(rows[1]?.exactMatch).toMatchObject({
      kind: "batch",
      rowKey: first.key,
    });
  });

  it("respects a file the admin chose to include anyway", () => {
    const first = readyRow("Canon_in_D.mxl", "Canon in D", "hash-a");
    const second = {
      ...readyRow("Canon_in_D_2.mxl", "Canon in D", "hash-a"),
      includedAnyway: true,
    };

    const rows = markBatchDuplicates([first, second]);
    expect(rows[1]?.status).toBe("ready");
  });

  it("counts uploaded, skipped, attention, and failed rows", () => {
    const ready = readyRow("a.mxl", "A", "a");
    const duplicate = {
      ...readyRow("b.mxl", "B", "b"),
      status: "duplicate" as const,
    };
    const done = {
      ...readyRow("c.mxl", "C", "c"),
      status: "done" as const,
    };
    const failed = {
      ...readyRow("d.mxl", "D", "d"),
      status: "failed" as const,
    };

    expect(countBatch([ready, duplicate, done, failed])).toMatchObject({
      total: 4,
      ready: 1,
      skipped: 1,
      uploaded: 1,
      failed: 1,
      attention: 1,
    });
  });

  it("filters ready rows that have no composer", () => {
    const withComposer = {
      ...readyRow("a.mxl", "A", "a"),
      suggestedComposer: "Composer",
    };
    const withoutComposer = readyRow("b.mxl", "B", "b");

    expect(rowMatchesFilter(withComposer, "composer")).toBe(false);
    expect(rowMatchesFilter(withoutComposer, "composer")).toBe(true);
  });

  it("reopens a failed upload instead of leaving restored rows in done", () => {
    const done = {
      ...readyRow("done.mxl", "Done", "done"),
      status: "done" as const,
    };
    const unread = {
      ...readyRow("unread.mxl", "Unread", "unread"),
      status: "new" as const,
    };

    expect(deriveBatchPhase([done, unread], "done")).toBe("review");
    expect(deriveBatchPhase([done], "done")).toBe("done");
    expect(deriveBatchPhase([], "done")).toBe("empty");
  });

  it("asks for a license before calling a row ready", () => {
    const row = readyRow("a.mxl", "A", "a");
    expect(displayStatus(row, DEFAULT_BATCH_SETTINGS)).toEqual({
      label: "License not set",
      tone: "warn",
    });
    expect(
      displayStatus(row, {
        ...DEFAULT_BATCH_SETTINGS,
        license: "Public Domain",
      }),
    ).toEqual({ label: "Ready", tone: "ok" });
  });
});
