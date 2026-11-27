import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cache/public-pages", () => ({
  purgePublicScore: vi.fn(),
}));

vi.mock("@/lib/scores/r2", () => ({
  deleteScoreObjects: vi.fn().mockResolvedValue(undefined),
}));
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as catalogSchema from "@/lib/db/schema";
import {
  deleteScore,
  getAdminScoreById,
  searchAdminScores,
  updateScoreMetadata,
} from "@/lib/scores/admin";
import { replaceTagsForScore } from "@/lib/scores/tags";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";

describe("admin scores", () => {
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

  async function seedScores() {
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
        r2Key: "scores/score-public/original.mxl",
        createdAt: now,
      },
      {
        id: "score-private",
        slug: "private-score",
        title: "Private Score",
        license: "CC0",
        visibility: "private",
        r2Key: "scores/score-private/original.musicxml",
        createdAt: now,
      },
    ]);
    await db.insert(catalogSchema.tags).values({
      id: "tag-bach",
      slug: "bach",
      label: "Bach",
    });
    await db.insert(catalogSchema.scoreTags).values({
      scoreId: "score-public",
      tagId: "tag-bach",
    });
  }

  it("lists all visibilities for admin", async () => {
    await seedScores();
    const page = await searchAdminScores({}, db as never);
    const rows = page.items;
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.slug).sort()).toEqual([
      "private-score",
      "public-score",
    ]);
    const publicRow = rows.find((row) => row.id === "score-public");
    expect(publicRow?.tags).toEqual([{ slug: "bach", label: "Bach" }]);
    expect(page.stats).toEqual({
      total: 2,
      public: 1,
      unlisted: 0,
      private: 1,
    });
  });

  it("loads admin score detail with tags", async () => {
    await seedScores();
    const score = await getAdminScoreById("score-public", db as never);
    expect(score?.title).toBe("Public Score");
    expect(score?.tags).toHaveLength(1);
  });

  it("requires license when updating metadata", async () => {
    await seedScores();
    await expect(
      updateScoreMetadata(
        "score-public",
        {
          title: "Renamed",
          license: "  ",
          visibility: "public",
          tagList: [],
        },
        db as never,
      ),
    ).rejects.toThrow("License is required");
  });

  it("replaces tags for a score", async () => {
    await seedScores();
    await replaceTagsForScore("score-public", ["etude"], db as never);
    const joins = await db
      .select()
      .from(catalogSchema.scoreTags)
      .where(eq(catalogSchema.scoreTags.scoreId, "score-public"));
    expect(joins).toHaveLength(1);
    const tag = await db
      .select()
      .from(catalogSchema.tags)
      .where(eq(catalogSchema.tags.id, joins[0]!.tagId))
      .get();
    expect(tag?.slug).toBe("etude");
  });

  it("paginates the admin list and filters by user query", async () => {
    await seedScores();
    const now = Date.now();
    await db.insert(catalogSchema.scores).values(
      Array.from({ length: 53 }, (_, index) => ({
        id: `bulk-${index}`,
        slug: `bulk-${index}`,
        title: index === 0 ? "Unique Etude" : `Bulk Work ${index}`,
        license: "Public Domain",
        visibility: "private" as const,
        searchText: index === 0 ? "unique etude" : `bulk work ${index}`,
        createdAt: new Date(now - index * 1000),
      })),
    );

    const page = await searchAdminScores({ page: 2 }, db as never);
    expect(page.total).toBe(55);
    expect(page.items).toHaveLength(5);
    expect(page.pageCount).toBe(2);

    const filtered = await searchAdminScores({ q: "unique" }, db as never);
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.title).toBe("Unique Etude");
  });

  it("deletes score row and tag joins", async () => {
    await seedScores();
    const result = await deleteScore("score-public", db as never);
    expect(result?.slug).toBe("public-score");
    const remaining = await db
      .select()
      .from(catalogSchema.scores)
      .where(eq(catalogSchema.scores.id, "score-public"));
    expect(remaining).toHaveLength(0);
    const joins = await db
      .select()
      .from(catalogSchema.scoreTags)
      .where(eq(catalogSchema.scoreTags.scoreId, "score-public"));
    expect(joins).toHaveLength(0);
  });

});
