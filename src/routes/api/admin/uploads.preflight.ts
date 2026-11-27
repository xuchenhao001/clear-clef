import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  MAX_PREFLIGHT_BODY_BYTES,
  MAX_PREFLIGHT_ITEMS,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import { IngestValidationError } from "@/lib/ingest/errors";
import { mapIngestError } from "@/lib/ingest/upload";
import type { PreflightLookupItem } from "@/lib/batch/types";
import { findPreflightMatches } from "@/lib/scores/duplicates";

const CONTENT_HASH_PATTERN = /^[a-f0-9]{64}$/;

function readItem(value: unknown): PreflightLookupItem {
  if (!value || typeof value !== "object") {
    throw new IngestValidationError("Invalid preflight item");
  }
  const item = value as Record<string, unknown>;
  const key = typeof item.key === "string" ? item.key.trim() : "";
  const filename = typeof item.filename === "string" ? item.filename.trim() : "";
  const contentHash =
    typeof item.contentHash === "string" ? item.contentHash.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const composer =
    typeof item.composer === "string" ? item.composer.trim().slice(0, 200) : null;
  const size = typeof item.size === "number" ? item.size : Number.NaN;

  if (!key || key.length > 100) {
    throw new IngestValidationError("Invalid preflight row key");
  }
  if (!filename || filename.length > 255) {
    throw new IngestValidationError("Invalid preflight filename");
  }
  if (!Number.isInteger(size) || size < 0 || size > MAX_UPLOAD_BYTES) {
    throw new IngestValidationError("Invalid preflight file size");
  }
  if (!CONTENT_HASH_PATTERN.test(contentHash)) {
    throw new IngestValidationError("Invalid preflight content hash");
  }
  if (title.length > 500) {
    throw new IngestValidationError("Preflight title is too long");
  }

  return { key, filename, size, contentHash, title, composer };
}

export const Route = createFileRoute("/api/admin/uploads/preflight")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireAdminSession();
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const declaredLength = Number(
          request.headers.get("content-length") ?? "0",
        );
        if (declaredLength > MAX_PREFLIGHT_BODY_BYTES) {
          return Response.json(
            { error: "Preflight request is too large" },
            { status: 413 },
          );
        }

        try {
          let body: { items?: unknown };
          try {
            body = (await request.json()) as { items?: unknown };
          } catch {
            throw new IngestValidationError("Invalid JSON");
          }
          if (!body || !Array.isArray(body.items) || body.items.length === 0) {
            throw new IngestValidationError("No files to check");
          }
          if (body.items.length > MAX_PREFLIGHT_ITEMS) {
            throw new IngestValidationError(
              `At most ${MAX_PREFLIGHT_ITEMS} files can be checked at once`,
            );
          }

          const items = body.items.map(readItem);
          const matches = await findPreflightMatches(getDb(), items);

          return Response.json({
            results: items.map((item, index) => ({
              key: item.key,
              ...matches[index],
            })),
          });
        } catch (error) {
          const mapped = mapIngestError(error);
          return Response.json(
            { error: mapped.message },
            { status: mapped.status },
          );
        }
      },
    },
  },
});
