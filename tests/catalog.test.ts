import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as catalogSchema from "@/lib/db/schema";
import {
  getPublicScoreBySlug,
  searchPublicCatalog,
} from "@/lib/scores/queries";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";

describe("catalog queries", () => {
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

  it("lists only public scores and hides private/unlisted", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);

    const now = new Date();
    await db.insert(catalogSchema.scores).values([
      {
        id: "score-public",
        slug: "public-score",
        title: "Public Score",
        license: "Public Domain",
        visibility: "public",
        createdAt: now,
      },
      {
        id: "score-private",
        slug: "private-score",
        title: "Private Score",
        license: "Public Domain",
        visibility: "private",
        createdAt: now,
      },
      {
        id: "score-unlisted",
        slug: "unlisted-score",
        title: "Unlisted Score",
        license: "Public Domain",
        visibility: "unlisted",
        createdAt: now,
      },
    ]);

    const page = await searchPublicCatalog({}, db as never);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.slug).toBe("public-score");
    expect(page.totalPublic).toBe(1);

    const detail = await getPublicScoreBySlug("public-score", db as never);
    expect(detail?.title).toBe("Public Score");

    const missing = await getPublicScoreBySlug("private-score", db as never);
    expect(missing).toBeNull();
  });

  it("filters by license slug", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);

    const now = new Date();
    await db.insert(catalogSchema.scores).values([
      {
        id: "score-cc0",
        slug: "cc0-score",
        title: "CC0 Score",
        license: "CC0",
        visibility: "public",
        createdAt: now,
      },
      {
        id: "score-pd",
        slug: "pd-score",
        title: "PD Score",
        license: "Public Domain",
        visibility: "public",
        createdAt: now,
      },
    ]);

    const page = await searchPublicCatalog({ license: ["cc0"] }, db as never);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.slug).toBe("cc0-score");
  });

  it("returns catalog metadata without internal storage keys", async () => {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);

    const now = new Date();
    await db.insert(catalogSchema.scores).values({
      id: "score-bwv",
      slug: "bwv-846",
      title: "Prelude in C major",
      composer: "J.S. Bach",
      catalogNumber: "BWV 846",
      key: "C major",
      timeSignature: "4/4",
      license: "Public Domain",
      visibility: "public",
      r2Key: "scores/score-bwv/original.mxl",
      previewR2Key: "scores/score-bwv/preview.svg",
      contentHash: "hash",
      createdAt: now,
    });

    const page = await searchPublicCatalog({}, db as never);
    expect(page.items[0]).toMatchObject({
      slug: "bwv-846",
      catalogNumber: "BWV 846",
      key: "C major",
      keyLabel: "C major",
      timeSignature: "4/4",
      hasPreview: true,
    });
    expect(JSON.stringify(page.items)).not.toContain("r2Key");
    expect(JSON.stringify(page.items)).not.toContain("previewR2Key");
  });
});
