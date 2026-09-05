import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as catalogSchema from "@/lib/db/schema";
import { listPublicScores, getPublicScoreBySlug } from "@/lib/scores/queries";
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

    const rows = await listPublicScores({}, db as never);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.slug).toBe("public-score");

    const detail = await getPublicScoreBySlug("public-score", db as never);
    expect(detail?.title).toBe("Public Score");

    const missing = await getPublicScoreBySlug("private-score", db as never);
    expect(missing).toBeNull();
  });

  it("filters by license", async () => {
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

    const rows = await listPublicScores({ license: "CC0" }, db as never);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.slug).toBe("cc0-score");
  });
});
