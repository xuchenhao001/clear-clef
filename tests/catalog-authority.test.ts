import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as catalogSchema from "@/lib/db/schema";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";
import {
  canonicalComposer,
  composerSortName,
  splitComposerAndArranger,
} from "@/lib/catalog/composers";
import { canonicalKey, keySlug, licenseSlug } from "@/lib/catalog/vocab";
import { readCatalogSearch } from "@/lib/catalog/url-state";
import { getOrCreateComposer } from "@/lib/scores/composers";
import { updateScoreMetadata } from "@/lib/scores/admin";
import { fixLegacySlugs } from "@/lib/scores/cleanup";
import { resolveSlugAlias } from "@/lib/scores/queries";
import { normalizeSourceUrl } from "@/lib/scores/source-url";

describe("catalog authority", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof catalogSchema>>;

  afterEach(async () => {
    if (db) await cleanupScores(db);
    if (sqlite) destroyTestDb(sqlite);
  });

  it("merges the known composer spellings", () => {
    expect(canonicalComposer("Fredrik Chopin")?.displayName).toBe(
      "Frédéric Chopin",
    );
    expect(
      canonicalComposer("Ludwig van Beethoven(1770–1827)")?.displayName,
    ).toBe("Ludwig van Beethoven");
    expect(canonicalComposer("J.S. Bach")?.displayName).toBe(
      "Johann Sebastian Bach",
    );
    expect(canonicalComposer("unknown")?.displayName).toBe("Uncredited");
    expect(composerSortName("Ludwig van Beethoven")).toBe(
      "Beethoven, Ludwig van",
    );
  });

  it("separates arrangers from composers", () => {
    expect(
      splitComposerAndArranger(
        "Ludwig van Beethoven(1770–1827) arr. E Muirhead",
      ),
    ).toEqual({ composer: "Ludwig van Beethoven", arranger: "E Muirhead" });
    expect(splitComposerAndArranger("arr. Verona")).toEqual({
      composer: null,
      arranger: "Verona",
    });
  });

  it("normalizes keys and licenses", () => {
    expect(canonicalKey("c sharp minor")).toBe("C# minor");
    expect(canonicalKey("D♭ major")).toBe("Db major");
    expect(keySlug("C# minor")).toBe("c-sharp-minor");
    expect(licenseSlug("Public Domain")).toBe("public-domain");
    expect(readCatalogSearch({ key: "C# minor" })).toEqual({
      key: ["c-sharp-minor"],
    });
  });

  it("rejects unsafe source links", () => {
    expect(normalizeSourceUrl("https://imslp.org/wiki/Example")).toBe(
      "https://imslp.org/wiki/Example",
    );
    expect(() => normalizeSourceUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeSourceUrl("ftp://example.com/score")).toThrow();
  });

  it("reuses a composer authority record for aliases", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    const first = await getOrCreateComposer(db as never, "Chopin");
    const second = await getOrCreateComposer(db as never, "Fredrik Chopin");
    expect(first?.id).toBe(second?.id);
    expect(second?.displayName).toBe("Frédéric Chopin");
  });

  it("keeps old slugs reachable through aliases", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    await db.insert(catalogSchema.scores).values({
      id: "score-slug",
      slug: "old-slug",
      title: "Old title",
      license: "Public Domain",
      visibility: "public",
      createdAt: new Date(),
    });

    const result = await updateScoreMetadata(
      "score-slug",
      {
        title: "New title",
        license: "Public Domain",
        visibility: "public",
        slug: "new-slug",
        tagList: [],
      },
      db as never,
    );
    expect(result.slug).toBe("new-slug");

    const alias = await db
      .select()
      .from(catalogSchema.scoreSlugAliases)
      .where(eq(catalogSchema.scoreSlugAliases.scoreId, "score-slug"))
      .all();
    expect(alias.some((row) => row.slug === "old-slug")).toBe(true);
    expect(await resolveSlugAlias("old-slug", db as never)).toBe("new-slug");
  });

  it("turns legacy untitled slugs into title-based aliases", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    await db.insert(catalogSchema.scores).values({
      id: "legacy",
      slug: "untitled-5",
      title: "I Am Alive",
      license: "Public Domain",
      visibility: "public",
      createdAt: new Date(),
    });

    const result = await fixLegacySlugs(20, db as never);
    expect(result.fixed).toBe(1);
    expect(result.remaining).toBe(0);
    const score = await db
      .select({ slug: catalogSchema.scores.slug })
      .from(catalogSchema.scores)
      .where(eq(catalogSchema.scores.id, "legacy"))
      .get();
    expect(score?.slug).toBe("i-am-alive");
  });
});
