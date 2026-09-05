import { inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as authSchema from "@/lib/db/auth-schema";
import * as catalogSchema from "@/lib/db/schema";

export async function cleanupAuthUsers(
  db: BetterSQLite3Database<typeof authSchema>,
  emails: string[],
) {
  if (emails.length === 0) {
    return;
  }

  const users = await db
    .select({ id: authSchema.user.id })
    .from(authSchema.user)
    .where(inArray(authSchema.user.email, emails));

  const ids = users.map((row) => row.id);
  if (ids.length === 0) {
    return;
  }

  await db.delete(authSchema.session).where(inArray(authSchema.session.userId, ids));
  await db.delete(authSchema.account).where(inArray(authSchema.account.userId, ids));
  await db.delete(authSchema.user).where(inArray(authSchema.user.id, ids));
}

export async function cleanupScores(
  db: BetterSQLite3Database<typeof catalogSchema>,
) {
  await db.delete(catalogSchema.scoreTags);
  await db.delete(catalogSchema.tags).where(
    inArray(catalogSchema.tags.slug, ["bach", "etude", "test-tag"]),
  );
  await db.delete(catalogSchema.scores).where(
    inArray(catalogSchema.scores.id, [
      "score-public",
      "score-private",
      "score-unlisted",
      "score-cc0",
      "score-pd",
    ]),
  );
}
