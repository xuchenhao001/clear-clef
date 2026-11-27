import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as catalogSchema from "@/lib/db/schema";
import { applyMigrations, createTestDb, destroyTestDb } from "@/tests/helpers/db";
import { cleanupScores } from "@/tests/helpers/cleanup";
import {
  createComposer,
  getOrCreateComposer,
  getUncreditedComposer,
  listComposersWithCounts,
  mergeComposers,
} from "@/lib/scores/composers";
import {
  assignComposerToScores,
  getComposerCreditStats,
  keepScoresUncredited,
  listRecentCreditEvents,
  listUnassignedScoreIds,
  listUnassignedScores,
} from "@/lib/scores/credit";
import { searchAdminScores, updateScoreMetadata } from "@/lib/scores/admin";
import { findPreflightMatches } from "@/lib/scores/duplicates";

describe("composer credit workflow", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof catalogSchema>>;

  afterEach(async () => {
    if (db) await cleanupScores(db);
    if (sqlite) destroyTestDb(sqlite);
  });

  async function setup() {
    ({ sqlite, db } = createTestDb(catalogSchema));
    applyMigrations(sqlite);
  }

  async function unassignedScore(
    id: string,
    overrides: Partial<typeof catalogSchema.scores.$inferInsert> = {},
  ) {
    await db.insert(catalogSchema.scores).values({
      id,
      slug: id,
      title: `Work ${id}`,
      license: "Public Domain",
      visibility: "public",
      createdAt: new Date(),
      ...overrides,
    });
  }

  it("treats a blank or unknown credit as review state, not anonymous", async () => {
    await setup();
    expect(await getOrCreateComposer(db as never, null)).toBeNull();
    expect(await getOrCreateComposer(db as never, "   ")).toBeNull();
    expect(await getOrCreateComposer(db as never, "unknown")).toBeNull();
    expect(await getOrCreateComposer(db as never, "Uncredited")).toBeNull();

    const uncredited = await getUncreditedComposer(db as never);
    expect(uncredited.displayName).toBe("Uncredited");
  });

  it("reuses the authority record through canonical names and aliases", async () => {
    await setup();
    const first = await getOrCreateComposer(db as never, "Chopin");
    const second = await getOrCreateComposer(db as never, "Fredrik Chopin");
    const third = await createComposer(db as never, "Frédéric Chopin");

    expect(first?.id).toBe(second?.id);
    expect(second?.id).toBe(third.id);
    expect(second?.displayName).toBe("Frédéric Chopin");

    const aliases = await db
      .select()
      .from(catalogSchema.composerAliases)
      .where(eq(catalogSchema.composerAliases.composerId, first!.id));
    expect(aliases.some((row) => row.alias === "Chopin")).toBe(true);
  });

  it("lists and searches the unassigned queue", async () => {
    await setup();
    await unassignedScore("score-a", {
      title: "Nocturne",
      composerRaw: "Fredrik Chopin",
      sourceFilename: "nocturne.mxl",
      importId: "batch-one",
    });
    await unassignedScore("score-b", {
      title: "Canon",
      composerRaw: "Pachelbel",
      visibility: "private",
      sourceFilename: "canon.mxl",
      importId: "batch-two",
    });

    const byCredit = await listUnassignedScores({ q: "fredrik" }, db as never);
    expect(byCredit.items.map((item) => item.id)).toEqual(["score-a"]);

    const byFilename = await listUnassignedScores({ q: "canon.mxl" }, db as never);
    expect(byFilename.items.map((item) => item.id)).toEqual(["score-b"]);

    const byVisibility = await listUnassignedScores(
      { visibility: "private" },
      db as never,
    );
    expect(byVisibility.total).toBe(1);
    expect(byVisibility.items[0]?.id).toBe("score-b");

    const byImport = await listUnassignedScores(
      { import: "batch-one" },
      db as never,
    );
    expect(byImport.items[0]?.id).toBe("score-a");
  });

  it("paginates the queue and can select all matching ids", async () => {
    await setup();
    await db.insert(catalogSchema.scores).values(
      Array.from({ length: 31 }, (_, index) => ({
        id: `queue-${index}`,
        slug: `queue-${index}`,
        title: index < 3 ? "Nocturne" : `Work ${index}`,
        license: "Public Domain",
        visibility: "public" as const,
        createdAt: new Date(Date.now() - index * 1000),
      })),
    );

    const page = await listUnassignedScores({ page: 1 }, db as never);
    expect(page.total).toBe(31);
    expect(page.pageCount).toBe(2);
    expect(page.items).toHaveLength(25);

    const matches = await listUnassignedScoreIds({ q: "nocturne" }, 500, db as never);
    expect(matches.total).toBe(3);
    expect(matches.ids).toHaveLength(3);
  });

  it("assigns a chunked selection and records an audit event per work", async () => {
    await setup();
    const chopin = await getOrCreateComposer(db as never, "Chopin");
    expect(chopin).not.toBeNull();

    const ids = Array.from({ length: 61 }, (_, index) => `bulk-${index}`);
    await db.insert(catalogSchema.scores).values(
      ids.map((id) => ({
        id,
        slug: id,
        title: `Bulk Work ${id}`,
        license: "Public Domain",
        visibility: "public" as const,
        composerRaw: "unknown",
        createdAt: new Date(),
      })),
    );

    const result = await assignComposerToScores(
      {
        scoreIds: ids,
        composerId: chopin!.id,
        actorId: "admin-1",
      },
      db as never,
    );
    expect(result.assigned).toBe(61);
    expect(result.target.displayName).toBe("Frédéric Chopin");

    const remaining = await listUnassignedScores({}, db as never);
    expect(remaining.total).toBe(0);

    const events = await db.select().from(catalogSchema.scoreCreditEvents);
    expect(events).toHaveLength(61);
    expect(events[0]?.action).toBe("assign");
    expect(events[0]?.actorId).toBe("admin-1");

    const row = await db
      .select()
      .from(catalogSchema.scores)
      .where(eq(catalogSchema.scores.id, "bulk-0"))
      .get();
    expect(row?.workKey).toContain("chopin");
    expect(row?.composerRaw).toBe("unknown");

    const recent = await listRecentCreditEvents(10, db as never);
    expect(recent).toHaveLength(10);
  });

  it("keeps reviewed anonymous works out of the queue", async () => {
    await setup();
    await unassignedScore("anonymous");

    const result = await keepScoresUncredited(["anonymous"], "admin-1", db as never);
    expect(result.target.displayName).toBe("Uncredited");

    expect((await listUnassignedScores({}, db as never)).total).toBe(0);
    expect(await getComposerCreditStats(db as never)).toMatchObject({
      unassigned: 0,
      uncredited: 1,
    });
  });

  it("rejects empty assignments and missing composers", async () => {
    await setup();
    await expect(
      assignComposerToScores({ scoreIds: [], composerId: "missing" }, db as never),
    ).rejects.toThrow("Select at least one work");
  });

  it("merges duplicate composers and refuses to merge Uncredited", async () => {
    await setup();
    const source = await getOrCreateComposer(db as never, "Fredrik Chopin");
    const target = await getOrCreateComposer(db as never, "Frédéric Chopin");
    const uncredited = await getUncreditedComposer(db as never);

    // Force a separate duplicate for the merge exercise.
    await db.insert(catalogSchema.composers).values({
      id: "composer-duplicate",
      slug: "fredrik-chopin",
      displayName: "Fredrik Chopin",
      normalizedName: "fredrik chopin",
      sortName: "Chopin, Fredrik",
      aliases: JSON.stringify(["Fredrik Chopin"]),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await unassignedScore("merge-work", {
      composerId: "composer-duplicate",
    });

    const merged = await mergeComposers(
      "composer-duplicate",
      target!.id,
      db as never,
    );
    expect(merged.moved).toBe(1);
    expect(merged.target.displayName).toBe("Frédéric Chopin");

    const moved = await db
      .select()
      .from(catalogSchema.scores)
      .where(eq(catalogSchema.scores.id, "merge-work"))
      .get();
    expect(moved?.composerId).toBe(target!.id);

    const aliases = await listComposersWithCounts(db as never);
    const resolved = aliases.find((composer) => composer.id === target!.id);
    expect(resolved?.aliases).toContain("Fredrik Chopin");

    await expect(
      mergeComposers(uncredited.id, target!.id, db as never),
    ).rejects.toThrow("Uncredited is not merged");
    expect(source).not.toBeNull();
  });

  it("filters the admin score list by composer authority", async () => {
    await setup();
    const chopin = await getOrCreateComposer(db as never, "Chopin");
    const pachelbel = await getOrCreateComposer(db as never, "Pachelbel");
    await unassignedScore("chopin-work", { composerId: chopin!.id });
    await unassignedScore("pachelbel-work", { composerId: pachelbel!.id });

    const page = await searchAdminScores(
      { composer: chopin!.id },
      db as never,
    );
    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe("chopin-work");
    expect(page.items[0]?.composer).toBe("Frédéric Chopin");
  });

  it("updates metadata through a composer id and preserves the raw credit", async () => {
    await setup();
    const chopin = await getOrCreateComposer(db as never, "Chopin");
    await unassignedScore("edit-work", { composerRaw: "Fredrik Chopin" });

    const result = await updateScoreMetadata(
      "edit-work",
      {
        title: "Edited Work",
        composerId: chopin!.id,
        license: "Public Domain",
        visibility: "public",
        tagList: [],
      },
      db as never,
    );
    expect(result.slug).toBe("edit-work");

    const row = await db
      .select()
      .from(catalogSchema.scores)
      .where(eq(catalogSchema.scores.id, "edit-work"))
      .get();
    expect(row?.composerId).toBe(chopin!.id);
    expect(row?.composerRaw).toBe("Fredrik Chopin");
  });

  it("matches preflight titles with composer keys, not title alone", async () => {
    await setup();
    const chopin = await getOrCreateComposer(db as never, "Chopin");
    const pachelbel = await getOrCreateComposer(db as never, "Pachelbel");
    await unassignedScore("nocturne", {
      title: "Nocturne",
      composerId: chopin!.id,
      contentHash: "hash-chopin",
    });
    await unassignedScore("canon", {
      title: "Nocturne",
      composerId: pachelbel!.id,
      contentHash: "hash-pachelbel",
    });

    const withComposer = await findPreflightMatches(db as never, [
      {
        contentHash: "new-hash",
        title: "Nocturne",
        composer: "Fredrik Chopin",
      },
    ]);
    expect(withComposer[0]?.similarMatches.map((match) => match.id)).toEqual([
      "nocturne",
    ]);

    const withoutComposer = await findPreflightMatches(db as never, [
      { contentHash: "new-hash", title: "Nocturne" },
    ]);
    expect(withoutComposer[0]?.similarMatches).toHaveLength(2);
  });
});
