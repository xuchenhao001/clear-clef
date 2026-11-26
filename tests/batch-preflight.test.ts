import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as catalogSchema from "@/lib/db/schema";
import {
  inspectMusicXml,
  inspectMusicXmlBytes,
} from "@/lib/ingest/inspect";
import {
  MAX_MXL_FILES,
  MAX_MXL_UNCOMPRESSED_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/ingest/constants";
import { hashMusicXml } from "@/lib/ingest/hash";
import {
  humanizeFilename,
  titleMatchesFilename,
} from "@/lib/ingest/suggestions";
import {
  findPreflightMatches,
  findScoreByContentHash,
} from "@/lib/scores/duplicates";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";

const fixture = (name: string) =>
  readFileSync(resolve(process.cwd(), "tests/fixtures", name), "utf8");

describe("batch preflight helpers", () => {
  it("uses the file title when present", () => {
    const inspected = inspectMusicXml(
      "minuet.mxl",
      fixture("minuet.musicxml"),
    );
    expect(inspected.suggestedTitle).toBe("Test Minuet");
    expect(inspected.titleSource).toBe("file");
    expect(inspected.titleCheck).toBe(false);
  });

  it("falls back to a humanised filename", () => {
    const inspected = inspectMusicXml(
      "Mozart_-_Piano_Sonata_No._16_-_Allegro.mxl",
      `<?xml version="1.0"?>
      <score-partwise version="4.0">
        <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
        <part id="P1"><measure number="1"><attributes><key><fifths>0</fifths></key></attributes></measure></part>
      </score-partwise>`,
    );
    expect(inspected.titleSource).toBe("filename");
    expect(inspected.suggestedTitle).toContain("Mozart");
    expect(inspected.suggestedTitle).not.toContain(".mxl");
  });

  it("flags a credit title that disagrees with the filename", () => {
    const inspected = inspectMusicXml(
      "Lacrimosa_-_Requiem.mxl",
      `<?xml version="1.0"?>
      <score-partwise version="4.0">
        <credit><credit-words>Amade Wolfgang Mozart</credit-words></credit>
        <credit><credit-words>Lacrimosa - Requiem</credit-words></credit>
        <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
        <part id="P1"><measure number="1"><attributes><key><fifths>0</fifths></key></attributes></measure></part>
      </score-partwise>`,
    );
    expect(inspected.metadata.title).toBe("Amade Wolfgang Mozart");
    expect(inspected.metadata.credits).toHaveLength(2);
    expect(inspected.titleCheck).toBe(true);
  });

  it("reads rights, source, software, and counts", () => {
    const inspected = inspectMusicXml(
      "score.mxl",
      `<?xml version="1.0"?>
      <score-partwise version="4.0">
        <identification>
          <rights>Public Domain</rights>
          <source>https://musescore.com/score/1</source>
          <encoding><software>MuseScore 4.0</software></encoding>
        </identification>
        <part-list>
          <score-part id="P1"><part-name>Piano</part-name></score-part>
          <score-part id="P2"><part-name>Piano</part-name></score-part>
        </part-list>
        <part id="P1"><measure number="1"/></part>
        <part id="P2"><measure number="1"/></part>
      </score-partwise>`,
    );
    expect(inspected.metadata.rights).toBe("Public Domain");
    expect(inspected.metadata.sourceUrl).toBe("https://musescore.com/score/1");
    expect(inspected.metadata.software).toBe("MuseScore 4.0");
    expect(inspected.metadata.partCount).toBe(2);
  });

  it("hashes canonical bytes and only returns canonical XML when requested", async () => {
    const bytes = new TextEncoder().encode(fixture("minuet.musicxml"));
    const options = {
      maxFiles: MAX_MXL_FILES,
      maxUncompressedBytes: MAX_MXL_UNCOMPRESSED_BYTES,
      maxUploadBytes: MAX_UPLOAD_BYTES,
    };

    const summary = await inspectMusicXmlBytes("minuet.musicxml", bytes, options);
    const withCanonical = await inspectMusicXmlBytes(
      "minuet.musicxml",
      bytes,
      { ...options, includeCanonical: true },
    );

    expect(summary.contentHash).toHaveLength(64);
    expect(withCanonical.contentHash).toBe(summary.contentHash);
    expect(summary.canonicalXml).toBeUndefined();
    expect(withCanonical.canonicalXml).toContain("<score-partwise");
  });

  it("normalises filename tokens and diacritics", () => {
    expect(humanizeFilename("Fur_Elise.mxl")).toBe("Fur Elise");
    expect(titleMatchesFilename("Für Elise", "Fur_Elise.mxl")).toBe(true);
    expect(titleMatchesFilename("Amade Wolfgang Mozart", "Lacrimosa.mxl")).toBe(
      false,
    );
  });

  it("hashes the same canonical XML to the same value", async () => {
    const first = await hashMusicXml("<score/>");
    const second = await hashMusicXml("<score/>");
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});

describe("duplicate lookups", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof catalogSchema>>;

  afterEach(async () => {
    if (db) await cleanupScores(db);
    if (sqlite) destroyTestDb(sqlite);
  });

  it("finds exact hashes and similar titles", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    await db.insert(catalogSchema.scores).values([
      {
        id: "score-a",
        slug: "canon-in-d",
        title: "Canon in D",
        license: "Public Domain",
        visibility: "public",
        contentHash: "hash-a",
        createdAt: new Date(),
      },
      {
        id: "score-b",
        slug: "canon-in-d-2",
        title: "Canon in D",
        license: "CC0",
        visibility: "public",
        contentHash: "hash-b",
        createdAt: new Date(),
      },
    ]);

    expect(
      await findScoreByContentHash(db as never, "hash-a"),
    ).toMatchObject({ id: "score-a", slug: "canon-in-d" });
  });

  it("looks up a whole batch of exact and similar matches", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    await db.insert(catalogSchema.scores).values([
      {
        id: "score-a",
        slug: "canon-in-d",
        title: "Canon in D",
        license: "Public Domain",
        visibility: "public",
        contentHash: "hash-a",
        createdAt: new Date(),
      },
      {
        id: "score-b",
        slug: "canon-in-d-2",
        title: "Canon in D",
        license: "CC0",
        visibility: "public",
        contentHash: "hash-b",
        createdAt: new Date(),
      },
    ]);

    const matches = await findPreflightMatches(db as never, [
      { contentHash: "hash-a", title: "Canon in D" },
      { contentHash: "hash-c", title: "canon in d" },
      { contentHash: "hash-d", title: "Unrelated" },
    ]);

    expect(matches[0]?.exactMatch).toMatchObject({ id: "score-a" });
    expect(matches[0]?.similarMatches).toHaveLength(1);
    expect(matches[1]?.exactMatch).toBeNull();
    expect(matches[1]?.similarMatches).toHaveLength(2);
    expect(matches[2]).toEqual({ exactMatch: null, similarMatches: [] });
  });

  it("chunks large lookup batches and handles an empty batch", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);

    expect(await findPreflightMatches(db as never, [])).toEqual([]);

    const items = Array.from({ length: 85 }, (_, index) => ({
      contentHash: index.toString(16).padStart(64, "0"),
      title: `Work ${index}`,
    }));
    const matches = await findPreflightMatches(db as never, items);

    expect(matches).toHaveLength(85);
    expect(matches[0]).toEqual({ exactMatch: null, similarMatches: [] });
  });
});
