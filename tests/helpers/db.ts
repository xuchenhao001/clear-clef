import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const migrations = readdirSync(resolve(process.cwd(), "drizzle"))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) =>
    readFileSync(resolve(process.cwd(), "drizzle", file), "utf8"),
  );

export function createTestDb<TSchema extends Record<string, unknown>>(schema: TSchema) {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

export function applyMigrations(sqlite: Database.Database) {
  for (const migration of migrations) {
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) {
        sqlite.exec(sql);
      }
    }
  }
}

export function destroyTestDb(sqlite: Database.Database) {
  sqlite.close();
}
