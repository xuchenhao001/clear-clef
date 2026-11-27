import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { composers, scores } from "@/lib/db/schema";
import { canonicalComposer, composerSlug } from "@/lib/catalog/composers";
import { normalizeText } from "@/lib/catalog/normalize";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { rebuildSearchIndex } from "@/lib/search";
import type { CatalogDb } from "@/lib/scores/queries";

export type ComposerSummary = {
  id: string;
  slug: string;
  displayName: string;
  sortName: string;
  aliases: string[];
  birthYear: number | null;
  deathYear: number | null;
};

function parseAliases(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toSummary(row: typeof composers.$inferSelect): ComposerSummary {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    sortName: row.sortName,
    aliases: parseAliases(row.aliases),
    birthYear: row.birthYear,
    deathYear: row.deathYear,
  };
}

export async function listComposersWithCounts(
  db?: CatalogDb,
): Promise<Array<ComposerSummary & { scoreCount: number }>> {
  const database = db ?? getDb();
  const [rows, counts] = await Promise.all([
    database.select().from(composers).orderBy(composers.sortName),
    database
      .select({ composerId: scores.composerId, count: sql<number>`count(*)` })
      .from(scores)
      .groupBy(scores.composerId),
  ]);
  const byComposer = new Map(
    counts.map((row) => [row.composerId, row.count]),
  );
  return rows.map((row) => ({
    ...toSummary(row),
    scoreCount: Number(byComposer.get(row.id) ?? 0),
  }));
}

export async function findComposerByName(
  database: CatalogDb,
  rawName: string | null | undefined,
): Promise<ComposerSummary | null> {
  const canonical = canonicalComposer(rawName);
  if (!canonical) {
    return null;
  }

  const rows = await database.select().from(composers);
  const target = normalizeText(canonical.displayName);
  const row = rows.find((candidate) => {
    if (normalizeText(candidate.displayName) === target) {
      return true;
    }
    return parseAliases(candidate.aliases).some(
      (alias) => normalizeText(alias) === target,
    );
  });

  return row ? toSummary(row) : null;
}

export async function getOrCreateComposer(
  database: CatalogDb,
  rawName: string | null | undefined,
): Promise<ComposerSummary | null> {
  const canonical =
    canonicalComposer(rawName) ?? canonicalComposer("Uncredited");
  if (!canonical) {
    return null;
  }

  const existing = await findComposerByName(database, canonical.displayName);
  if (existing) {
    const aliases = [
      ...new Set(
        [rawName?.trim(), canonical.displayName, ...existing.aliases].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ];
    if (aliases.length !== existing.aliases.length) {
      await database
        .update(composers)
        .set({ aliases: JSON.stringify(aliases), updatedAt: new Date() })
        .where(eq(composers.id, existing.id));
    }
    return existing;
  }

  const now = new Date();
  const baseSlug = composerSlug(canonical.displayName);
  let slug = baseSlug;
  for (let attempt = 2; attempt < 100; attempt += 1) {
    const collision = await database
      .select({ id: composers.id })
      .from(composers)
      .where(eq(composers.slug, slug))
      .get();
    if (!collision) {
      break;
    }
    slug = `${baseSlug}-${attempt}`;
  }

  const id = crypto.randomUUID();
  await database.insert(composers).values({
    id,
    slug,
    displayName: canonical.displayName,
    sortName: canonical.sortName,
    aliases: JSON.stringify(
      [...new Set([rawName?.trim(), canonical.displayName, ...canonical.aliases].filter(Boolean))],
    ),
    birthYear: canonical.birthYear,
    deathYear: canonical.deathYear,
    createdAt: now,
    updatedAt: now,
  });

  const inserted = await database
    .select()
    .from(composers)
    .where(eq(composers.id, id))
    .get();

  return inserted ? toSummary(inserted) : null;
}

export async function mergeComposers(
  sourceId: string,
  targetId: string,
  db?: CatalogDb,
): Promise<{ moved: number }> {
  if (sourceId === targetId) {
    return { moved: 0 };
  }

  const database = db ?? getDb();
  const [source, target] = await Promise.all([
    database.select().from(composers).where(eq(composers.id, sourceId)).get(),
    database.select().from(composers).where(eq(composers.id, targetId)).get(),
  ]);
  if (!source || !target) {
    throw new Error("Composer not found");
  }

  const aliases = [
    ...new Set([
      ...parseAliases(source.aliases),
      ...parseAliases(target.aliases),
      source.displayName,
    ]),
  ];

  await database
    .update(scores)
    .set({
      composerId: targetId,
      composer: target.displayName,
      updatedAt: new Date(),
    })
    .where(eq(scores.composerId, sourceId));
  await database.run(
    sql`UPDATE scores SET work_key = lower(trim(title)) || '|' || lower(${normalizeText(target.displayName)}) WHERE composer_id = ${targetId}`,
  );

  await database
    .update(composers)
    .set({ aliases: JSON.stringify(aliases), updatedAt: new Date() })
    .where(eq(composers.id, targetId));

  await database.delete(composers).where(eq(composers.id, sourceId));

  const moved = await database
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.composerId, targetId));

  await rebuildSearchIndex(database);
  const movedSlugs = await database
    .select({ slug: scores.slug })
    .from(scores)
    .where(eq(scores.composerId, targetId));
  await Promise.allSettled(
    movedSlugs.map((row) => purgePublicScore(row.slug)),
  );

  return { moved: moved.length };
}
