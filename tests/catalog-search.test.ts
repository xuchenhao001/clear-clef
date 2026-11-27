import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as catalogSchema from "@/lib/db/schema";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";
import { getOrCreateComposer } from "@/lib/scores/composers";
import { refreshSearchDocument, rebuildSearchIndex } from "@/lib/search";
import {
  getPublicScoreBySlug,
  searchPublicCatalog,
} from "@/lib/scores/queries";

describe("catalog search", () => {
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

  async function seed() {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    const now = new Date();
    const chopin = await getOrCreateComposer(db as never, "Fredrik Chopin");
    const pachelbel = await getOrCreateComposer(db as never, "Pachelbel");
    const chinese = await getOrCreateComposer(db as never, "JJ Lin");

    await db.insert(catalogSchema.scores).values([
      {
        id: "s1",
        slug: "nocturne",
        title: "Nocturne in C sharp Minor",
        composerId: chopin?.id,
        catalogNumber: "Op. 9 No. 2",
        key: "C# minor",
        license: "Public Domain",
        visibility: "public",
        createdAt: now,
      },
      {
        id: "s2",
        slug: "canon",
        title: "Canon in D",
        composerId: pachelbel?.id,
        key: "D major",
        difficulty: "beginner",
        license: "Public Domain",
        visibility: "public",
        createdAt: new Date(now.getTime() - 1000),
      },
      {
        id: "s3",
        slug: "untitled",
        title: "可惜没如果",
        composerId: chinese?.id,
        license: "Public Domain",
        visibility: "public",
        createdAt: new Date(now.getTime() - 2000),
      },
      {
        id: "s4",
        slug: "secret",
        title: "Secret Nocturne",
        composerId: chopin?.id,
        license: "Public Domain",
        visibility: "private",
        createdAt: now,
      },
    ]);

    for (const id of ["s1", "s2", "s3", "s4"]) {
      await refreshSearchDocument(id, db as never);
    }
    return { chopin, pachelbel };
  }

  it("matches composer aliases, catalogue numbers, keys and CJK titles", async () => {
    await seed();

    const byAlias = await searchPublicCatalog({ q: "frederic" }, db as never);
    expect(byAlias.items.map((item) => item.slug)).toContain("nocturne");
    expect(byAlias.items.some((item) => item.slug === "secret")).toBe(false);

    const byCatalogue = await searchPublicCatalog({ q: "Op. 9" }, db as never);
    expect(byCatalogue.items[0]?.slug).toBe("nocturne");

    const byKey = await searchPublicCatalog({ q: "c# minor" }, db as never);
    expect(byKey.items[0]?.slug).toBe("nocturne");

    const byCjk = await searchPublicCatalog({ q: "可惜" }, db as never);
    expect(byCjk.items[0]?.slug).toBe("untitled");
  });

  it("returns facet counts and applies key filters", async () => {
    await seed();
    const page = await searchPublicCatalog({ key: ["c-sharp-minor"] }, db as never);
    expect(page.total).toBe(1);
    expect(page.items[0]?.slug).toBe("nocturne");
    expect(page.facets.find((facet) => facet.name === "key")?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: "c-sharp-minor", count: 1 }),
      ]),
    );
    expect(page.facets.find((facet) => facet.name === "license")?.values[0]).toMatchObject({
      label: "Public Domain",
      count: 1,
    });

    const unfiltered = await searchPublicCatalog({}, db as never);
    expect(
      unfiltered.facets.find((facet) => facet.name === "license")?.values[0],
    ).toMatchObject({ label: "Public Domain", count: 3 });
  });

  it("paginates with a stable sort", async () => {
    await seed();
    const first = await searchPublicCatalog({ sort: "newest", page: 1 }, db as never);
    expect(first.total).toBe(3);
    expect(first.pageCount).toBe(1);
    expect(first.items.map((item) => item.slug)).toEqual([
      "nocturne",
      "canon",
      "untitled",
    ]);
  });

  it("combines facets with OR within a field and AND across fields", async () => {
    await seed();
    const keys = await searchPublicCatalog(
      { key: ["c-sharp-minor", "d-major"] },
      db as never,
    );
    expect(keys.items.map((item) => item.slug).sort()).toEqual([
      "canon",
      "nocturne",
    ]);

    const both = await searchPublicCatalog(
      { key: ["c-sharp-minor", "d-major"], difficulty: ["beginner"] },
      db as never,
    );
    expect(both.items.map((item) => item.slug)).toEqual(["canon"]);
  });

  it("clamps an out-of-range page to the last page", async () => {
    await seed();
    const page = await searchPublicCatalog({ page: 99 }, db as never);
    expect(page.page).toBe(1);
    expect(page.pageCount).toBe(1);
  });

  it("supports title sort", async () => {
    await seed();
    const page = await searchPublicCatalog({ sort: "title" }, db as never);
    expect(page.items.some((item) => item.slug === "canon")).toBe(true);
    expect(page.sort).toBe("title");
  });

  it("pages through more than one page", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
    const now = Date.now();
    for (let index = 0; index < 35; index += 1) {
      await db.insert(catalogSchema.scores).values({
        id: `page-${index}`,
        slug: `page-${index}`,
        title: `Work ${String(index).padStart(2, "0")}`,
        license: "Public Domain",
        visibility: "public",
        createdAt: new Date(now - index * 1000),
      });
    }

    const first = await searchPublicCatalog({}, db as never);
    const second = await searchPublicCatalog({ page: 2 }, db as never);
    expect(first.total).toBe(35);
    expect(first.pageCount).toBe(2);
    expect(first.items).toHaveLength(30);
    expect(second.items).toHaveLength(5);
    expect(second.page).toBe(2);
  });

  it("rebuilds the index in bulk", async () => {
    await seed();
    expect(await rebuildSearchIndex(db as never)).toBe(4);
    const results = await searchPublicCatalog({ q: "chopin" }, db as never);
    expect(results.total).toBe(1);
  });

  it("exposes versioned media URLs and no storage keys", async () => {
    await seed();
    await db
      .update(catalogSchema.scores)
      .set({ contentHash: "abc123", previewVersion: "pv1" })
      .where(eq(catalogSchema.scores.slug, "nocturne"));
    const detail = await getPublicScoreBySlug("nocturne", db as never);
    expect(detail?.fileUrl).toContain("?v=abc123");
    expect(detail?.previewUrl).toBeNull();
    expect(JSON.stringify(detail)).not.toContain("r2Key");
  });

  it("prefers the versioned thumbnail URL when a thumbnail exists", async () => {
    await seed();
    await db
      .update(catalogSchema.scores)
      .set({
        previewR2Key: "scores/s1/preview.svg",
        previewThumbR2Key: "scores/s1/preview-thumb.webp",
        previewVersion: "pv1",
      })
      .where(eq(catalogSchema.scores.id, "s1"));
    const page = await searchPublicCatalog({ q: "nocturne" }, db as never);
    expect(page.items[0]?.previewUrl).toContain("/preview?v=pv1&thumb=1");
  });
});
