import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  composerAliases,
  composers,
  scores,
  type Composer,
} from "@/lib/db/schema";
import { canonicalComposer, composerSlug } from "@/lib/catalog/composers";
import { purgePublicScore } from "@/lib/cache/public-pages";
import { refreshSearchDocuments } from "@/lib/search";
import type { CatalogDb } from "@/lib/scores/queries";

export const UNCREDITED_COMPOSER = "Uncredited";

export type ComposerSummary = {
  id: string;
  slug: string;
  displayName: string;
  sortName: string;
  aliases: string[];
  birthYear: number | null;
  deathYear: number | null;
};

export type ComposerWithCount = ComposerSummary & { scoreCount: number };

export function composerAuthorityKey(value: string): string {
  return value.trim().toLowerCase();
}

export function parseComposerAliases(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toSummary(row: Composer): ComposerSummary {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    sortName: row.sortName,
    aliases: parseComposerAliases(row.aliases),
    birthYear: row.birthYear,
    deathYear: row.deathYear,
  };
}

/**
 * D1 batches are transactional; better-sqlite3 in tests has no batch API, so
 * the same statements run sequentially there. Query builders are lazy, which
 * makes the two paths interchangeable.
 */
async function runMutationBatch(
  database: CatalogDb,
  statements: unknown[],
): Promise<void> {
  const batch = (
    database as unknown as {
      batch?: (queries: unknown[]) => Promise<unknown>;
    }
  ).batch;
  if (typeof batch === "function") {
    await batch.call(database, statements);
    return;
  }
  for (const statement of statements) {
    await statement;
  }
}

function uniqueAliases(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = composerAuthorityKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export async function registerComposerAliases(
  database: CatalogDb,
  composerId: string,
  values: Array<string | null | undefined>,
): Promise<void> {
  const existing = await database
    .select({ normalizedName: composers.normalizedName })
    .from(composers)
    .where(eq(composers.id, composerId))
    .get();
  if (!existing) return;

  const rows = uniqueAliases(values)
    .map((alias) => ({
      normalizedAlias: composerAuthorityKey(alias),
      composerId,
      alias,
      createdAt: new Date(),
    }))
    .filter((row) => row.normalizedAlias !== existing.normalizedName);

  if (rows.length === 0) return;

  for (let offset = 0; offset < rows.length; offset += 20) {
    await database
      .insert(composerAliases)
      .values(rows.slice(offset, offset + 20))
      .onConflictDoNothing();
  }
}

export async function listComposersWithCounts(
  db?: CatalogDb,
  options: { query?: string } = {},
): Promise<ComposerWithCount[]> {
  const database = db ?? getDb();
  const [rows, counts, aliasRows] = await Promise.all([
    database.select().from(composers).orderBy(composers.sortName),
    database
      .select({ composerId: scores.composerId, count: sql<number>`count(*)` })
      .from(scores)
      .groupBy(scores.composerId),
    database
      .select({
        composerId: composerAliases.composerId,
        alias: composerAliases.alias,
      })
      .from(composerAliases),
  ]);
  const byComposer = new Map(
    counts.map((row) => [row.composerId, Number(row.count)]),
  );
  const aliasesByComposer = new Map<string, string[]>();
  for (const row of aliasRows) {
    const list = aliasesByComposer.get(row.composerId) ?? [];
    list.push(row.alias);
    aliasesByComposer.set(row.composerId, list);
  }

  const query = options.query?.trim().toLowerCase() ?? "";
  return rows
    .map((row) => {
      const aliases = uniqueAliases([
        ...parseComposerAliases(row.aliases),
        ...(aliasesByComposer.get(row.id) ?? []),
      ]).filter(
        (alias) =>
          composerAuthorityKey(alias) !== composerAuthorityKey(row.displayName),
      );
      return {
        ...toSummary(row),
        aliases,
        scoreCount: byComposer.get(row.id) ?? 0,
      };
    })
    .filter((composer) => {
      if (!query) return true;
      return (
        composer.displayName.toLowerCase().includes(query) ||
        composer.sortName.toLowerCase().includes(query) ||
        composer.aliases.some((alias) => alias.toLowerCase().includes(query))
      );
    });
}

export async function findComposerById(
  database: CatalogDb,
  id: string,
): Promise<ComposerSummary | null> {
  const row = await database
    .select()
    .from(composers)
    .where(eq(composers.id, id))
    .get();
  return row ? toSummary(row) : null;
}

/**
 * Resolve a credit through the authority key first, then the alias table.
 * This is one indexed lookup and one alias lookup instead of scanning every
 * composer row in JavaScript.
 */
export async function findComposerByName(
  database: CatalogDb,
  rawName: string | null | undefined,
): Promise<ComposerSummary | null> {
  const canonical = canonicalComposer(rawName);
  if (!canonical) {
    return null;
  }

  const keys = [
    composerAuthorityKey(canonical.displayName),
    rawName ? composerAuthorityKey(rawName) : "",
  ].filter(Boolean);

  const byName = await database
    .select()
    .from(composers)
    .where(inArray(composers.normalizedName, keys))
    .get();
  if (byName) {
    return toSummary(byName);
  }

  const alias = await database
    .select({ composerId: composerAliases.composerId })
    .from(composerAliases)
    .where(inArray(composerAliases.normalizedAlias, keys))
    .get();
  if (!alias) {
    return null;
  }

  return findComposerById(database, alias.composerId);
}

export async function getUncreditedComposer(
  database: CatalogDb,
): Promise<ComposerSummary> {
  const composer = await getOrCreateComposer(database, UNCREDITED_COMPOSER, {
    allowUncredited: true,
  });
  if (!composer) {
    throw new Error("Could not create the Uncredited composer record");
  }
  return composer;
}

async function nextAvailableSlug(
  database: CatalogDb,
  displayName: string,
): Promise<string> {
  const base = composerSlug(displayName);
  for (let attempt = 1; attempt < 100; attempt += 1) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const collision = await database
      .select({ id: composers.id })
      .from(composers)
      .where(eq(composers.slug, slug))
      .get();
    if (!collision) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export type GetOrCreateComposerOptions = {
  /**
   * A blank or unknown credit is a review state, not an anonymous decision.
   * Only the explicit "Keep uncredited" action opts in to the authority row.
   */
  allowUncredited?: boolean;
};

export async function getOrCreateComposer(
  database: CatalogDb,
  rawName: string | null | undefined,
  options: GetOrCreateComposerOptions = {},
): Promise<ComposerSummary | null> {
  const canonical = canonicalComposer(rawName);
  if (!canonical) {
    return null;
  }
  if (
    canonical.displayName === UNCREDITED_COMPOSER &&
    !options.allowUncredited
  ) {
    return null;
  }

  const existing = await findComposerByName(database, canonical.displayName);
  if (existing) {
    const canonicalAgain = canonicalComposer(rawName);
    await registerComposerAliases(database, existing.id, [
      rawName,
      canonicalAgain?.displayName,
    ]);
    const mergedAliases = uniqueAliases([
      ...existing.aliases,
      rawName,
      canonicalAgain?.displayName,
    ]);
    if (mergedAliases.length !== existing.aliases.length) {
      await database
        .update(composers)
        .set({ aliases: JSON.stringify(mergedAliases), updatedAt: new Date() })
        .where(eq(composers.id, existing.id));
    }
    return existing;
  }

  const now = new Date();
  const id = crypto.randomUUID();
  const normalizedName = composerAuthorityKey(canonical.displayName);
  let slug = await nextAvailableSlug(database, canonical.displayName);
  const aliases = uniqueAliases([rawName, canonical.displayName, ...canonical.aliases]);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await database
        .insert(composers)
        .values({
          id,
          slug,
          displayName: canonical.displayName,
          normalizedName,
          sortName: canonical.sortName,
          aliases: JSON.stringify(aliases),
          birthYear: canonical.birthYear,
          deathYear: canonical.deathYear,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: composers.normalizedName });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/unique constraint/i.test(message) && /composers\.slug/.test(message)) {
        slug = await nextAvailableSlug(database, canonical.displayName);
        continue;
      }
      throw error;
    }
  }

  const inserted = await database
    .select()
    .from(composers)
    .where(eq(composers.normalizedName, normalizedName))
    .get();
  if (!inserted) {
    // A concurrent writer won the normalized-name race but its row is not
    // visible yet; one indexed retry is enough for D1's single-writer model.
    const retry = await findComposerByName(database, canonical.displayName);
    return retry;
  }

  await registerComposerAliases(database, inserted.id, [
    rawName,
    canonical.displayName,
    ...canonical.aliases,
  ]);
  return toSummary(inserted);
}

export async function createComposer(
  database: CatalogDb,
  name: string,
): Promise<ComposerSummary> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Composer name is required");
  }
  const canonical = canonicalComposer(trimmed);
  if (!canonical || canonical.displayName === UNCREDITED_COMPOSER) {
    throw new Error("Enter a composer name");
  }
  const existing = await findComposerByName(database, canonical.displayName);
  if (existing) {
    return existing;
  }
  const created = await getOrCreateComposer(database, canonical.displayName);
  if (!created) {
    throw new Error("Could not create the composer");
  }
  return created;
}

export async function mergeComposers(
  sourceId: string,
  targetId: string,
  db?: CatalogDb,
): Promise<{ moved: number; target: ComposerSummary }> {
  if (sourceId === targetId) {
    throw new Error("Choose two different composers");
  }

  const database = db ?? getDb();
  const [source, target] = await Promise.all([
    database.select().from(composers).where(eq(composers.id, sourceId)).get(),
    database.select().from(composers).where(eq(composers.id, targetId)).get(),
  ]);
  if (!source || !target) {
    throw new Error("Composer not found");
  }
  if (
    source.displayName === UNCREDITED_COMPOSER ||
    target.displayName === UNCREDITED_COMPOSER
  ) {
    throw new Error(
      "Uncredited is not merged. Assign works from the credit queue instead.",
    );
  }

  const movedRows = await database
    .select({ id: scores.id, slug: scores.slug })
    .from(scores)
    .where(eq(scores.composerId, sourceId));

  const aliases = uniqueAliases([
    ...parseComposerAliases(source.aliases),
    ...parseComposerAliases(target.aliases),
    source.displayName,
    target.displayName,
  ]);

  const sourceAliasRows = await database
    .select()
    .from(composerAliases)
    .where(eq(composerAliases.composerId, sourceId));

  const aliasValues = new Map<
    string,
    {
      normalizedAlias: string;
      composerId: string;
      alias: string;
      createdAt: Date;
    }
  >();
  for (const row of sourceAliasRows) {
    aliasValues.set(row.normalizedAlias, {
      normalizedAlias: row.normalizedAlias,
      composerId: targetId,
      alias: row.alias,
      createdAt: row.createdAt,
    });
  }
  for (const alias of aliases) {
    const normalizedAlias = composerAuthorityKey(alias);
    if (normalizedAlias === target.normalizedName) continue;
    aliasValues.set(normalizedAlias, {
      normalizedAlias,
      composerId: targetId,
      alias,
      createdAt: new Date(),
    });
  }

  const now = new Date();
  const mutations: unknown[] = [];
  const aliasList = [...aliasValues.values()];
  for (let offset = 0; offset < aliasList.length; offset += 20) {
    mutations.push(
      database
        .insert(composerAliases)
        .values(aliasList.slice(offset, offset + 20))
        .onConflictDoNothing(),
    );
  }
  mutations.push(
    database
      .update(scores)
      .set({
        composerId: targetId,
        updatedAt: now,
        workKey: sql`lower(trim(${scores.title})) || '|' || lower(${target.displayName})`,
      })
      .where(eq(scores.composerId, sourceId)),
    database
      .update(composers)
      .set({ aliases: JSON.stringify(aliases), updatedAt: now })
      .where(eq(composers.id, targetId)),
    database
      .delete(composerAliases)
      .where(eq(composerAliases.composerId, sourceId)),
    database.delete(composers).where(eq(composers.id, sourceId)),
  );

  await runMutationBatch(database, mutations);
  await refreshSearchDocuments(
    movedRows.map((row) => row.id),
    database,
    { composerDisplay: target.displayName },
  );
  await Promise.allSettled(movedRows.map((row) => purgePublicScore(row.slug)));

  const updatedTarget = await database
    .select()
    .from(composers)
    .where(eq(composers.id, targetId))
    .get();
  return {
    moved: movedRows.length,
    target: updatedTarget ? toSummary(updatedTarget) : toSummary(target),
  };
}
