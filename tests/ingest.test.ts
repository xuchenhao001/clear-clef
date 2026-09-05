import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  IngestValidationError,
  readMusicXmlInput,
} from "@/lib/ingest/mxl";
import { extractScoreMetadata } from "@/lib/ingest/metadata";
import {
  assertSafeXml,
  sanitizeMusicXml,
  XmlSecurityError,
} from "@/lib/ingest/xml";
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
    expect(metadata.defaultVisibleParts).toBe(JSON.stringify(["P1"]));
  });

  it("accepts standard MusicXML PUBLIC DOCTYPE and strips it for parsing", () => {
    const xml = fixture("minuet-doctype.musicxml").toString();
    assertSafeXml(xml);
    const metadata = extractScoreMetadata(xml);
    expect(metadata.title).toBe("Test Minuet");
    expect(metadata.defaultVisibleParts).toBe(JSON.stringify(["P1"]));
    expect(sanitizeMusicXml(xml)).not.toMatch(/<!DOCTYPE/i);
  });

  it("rejects XXE payloads", () => {
    const xml = fixture("xxe.musicxml").toString();
    expect(() => assertSafeXml(xml)).toThrow(XmlSecurityError);
    expect(() => extractScoreMetadata(xml)).toThrow(XmlSecurityError);
  });

  it("rejects DOCTYPE internal subsets with ENTITY declarations", () => {
    const xml = `<!DOCTYPE score-partwise [
  <!ENTITY xxe "evil">
]>
<score-partwise version="4.0"><work><work-title>Bad</work-title></work></score-partwise>`;
    expect(() => assertSafeXml(xml)).toThrow(XmlSecurityError);
  });

  it("extracts title from movement-title and credit fallbacks", () => {
    const movementOnly = sanitizeMusicXml(`<?xml version="1.0"?>
<score-partwise version="4.0">
  <movement-title>Canon in D</movement-title>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><key><fifths>2</fifths><mode>major</mode></key></attributes></measure></part>
</score-partwise>`);
    expect(extractScoreMetadata(movementOnly).title).toBe("Canon in D");

    const creditOnly = sanitizeMusicXml(`<?xml version="1.0"?>
<score-partwise version="4.0">
  <credit><credit-type>title</credit-type><credit-words>Credit Title</credit-words></credit>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><key><fifths>0</fifths></key></attributes></measure></part>
</score-partwise>`);
    expect(extractScoreMetadata(creditOnly).title).toBe("Credit Title");
  });

  it("extracts catalog number from work-number", () => {
    const xml = sanitizeMusicXml(`<?xml version="1.0"?>
<score-partwise version="4.0">
  <work>
    <work-title>Prelude</work-title>
    <work-number>BWV 846</work-number>
  </work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><key><fifths>0</fifths></key></attributes></measure></part>
</score-partwise>`);

    expect(extractScoreMetadata(xml).catalogNumber).toBe("BWV 846");
  });

  it("formats keys across sharps, flats, minor, and missing mode", () => {
    const makeXml = (fifths: number, mode?: string) => sanitizeMusicXml(`<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Key Test</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><key><fifths>${fifths}</fifths>${mode ? `<mode>${mode}</mode>` : ""}</key></attributes></measure></part>
</score-partwise>`);

    expect(extractScoreMetadata(makeXml(2, "major")).key).toBe("D major");
    expect(extractScoreMetadata(makeXml(-1, "major")).key).toBe("F major");
    expect(extractScoreMetadata(makeXml(0, "minor")).key).toBe("a minor");
    expect(extractScoreMetadata(makeXml(0)).key).toBe("C major");
  });

  it("reads MusicXML from a tiny .mxl archive", () => {
    const scoreXml = fixture("minuet-doctype.musicxml");
    const archive = zipSync({
      "META-INF/container.xml": new TextEncoder().encode(`<?xml version="1.0"?>
<container>
  <rootfiles>
    <rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`),
      "score.musicxml": scoreXml,
    });

    const { xml, originalExtension } = readMusicXmlInput(
      "canon.mxl",
      archive,
      {
        maxFiles: 10,
        maxUncompressedBytes: 1024 * 1024,
      },
    );

    expect(originalExtension).toBe("mxl");
    const metadata = extractScoreMetadata(xml);
    expect(metadata.title).toBe("Test Minuet");
    expect(metadata.defaultVisibleParts).toBe(JSON.stringify(["P1"]));
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
