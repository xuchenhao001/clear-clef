import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  IngestValidationError,
  readMusicXmlInput,
} from "@/lib/ingest/mxl";
import {
  assertSafeXml,
  extractScoreMetadata,
  XmlSecurityError,
} from "@/lib/ingest/metadata";
import { createUniqueSlug, slugifyTitle } from "@/lib/scores/slug";
import * as catalogSchema from "@/lib/db/schema";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";

const fixture = (name: string) =>
  readFileSync(resolve(process.cwd(), "tests/fixtures", name));

describe("ingest", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof catalogSchema>>;

  afterEach(async () => {
    if (db) {
      await cleanupScores(db);
    }
    if (sqlite) {
      destroyTestDb(sqlite);
    }
  });

  it("extracts metadata from a minimal MusicXML file", () => {
    const xml = fixture("minuet.musicxml").toString();
    assertSafeXml(xml);
    const metadata = extractScoreMetadata(xml);
    expect(metadata.title).toBe("Test Minuet");
    expect(metadata.composer).toBe("Test Composer");
    expect(metadata.key).toBe("C major");
    expect(metadata.timeSignature).toBe("4/4");
  });

  it("rejects XXE payloads", () => {
    const xml = fixture("xxe.musicxml").toString();
    expect(() => assertSafeXml(xml)).toThrow(XmlSecurityError);
  });

  it("rejects empty uploads and unsupported extensions", () => {
    expect(() =>
      readMusicXmlInput("score.pdf", new Uint8Array([1, 2, 3]), {
        maxFiles: 10,
        maxUncompressedBytes: 1024,
      }),
    ).toThrow(IngestValidationError);

    expect(() =>
      readMusicXmlInput("empty.musicxml", new Uint8Array(), {
        maxFiles: 10,
        maxUncompressedBytes: 1024,
        maxUploadBytes: 1024,
      }),
    ).toThrow(IngestValidationError);
  });

  it("creates unique slugs", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);

    const taken = new Set<string>();
    const exists = async (slug: string) => {
      if (taken.has(slug)) {
        return true;
      }
      const row = await db
        .select({ id: catalogSchema.scores.id })
        .from(catalogSchema.scores)
        .where(eq(catalogSchema.scores.slug, slug))
        .get();
      return Boolean(row);
    };

    const first = await createUniqueSlug("Test Minuet!", exists);
    taken.add(first);
    const second = await createUniqueSlug("Test Minuet!", exists);

    expect(slugifyTitle("Test Minuet!")).toBe("test-minuet");
    expect(first).toBe("test-minuet");
    expect(second).toBe("test-minuet-2");
  });
});
