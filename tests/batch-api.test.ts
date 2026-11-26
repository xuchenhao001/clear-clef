import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupPreflight } from "@/lib/batch/api";
import type { PreflightLookupItem } from "@/lib/batch/types";

const item: PreflightLookupItem = {
  key: "row-1",
  filename: "score.mxl",
  size: 100,
  contentHash: "a".repeat(64),
  title: "Score",
};

describe("batch api errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("classifies a Worker CPU 503 without retrying it", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("Worker exceeded CPU time limit.", { status: 503 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupPreflight([item])).rejects.toMatchObject({
      status: 503,
      code: "cpu",
      message: expect.stringContaining("ran out of CPU"),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps a JSON validation message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Invalid content hash" }, { status: 400 }),
      ),
    );

    await expect(lookupPreflight([item])).rejects.toMatchObject({
      status: 400,
      code: "validation",
      message: "Invalid content hash",
    });
  });
});
