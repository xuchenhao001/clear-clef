import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";

function migrationFiles(): string[] {
  return readdirSync(resolve(process.cwd(), "drizzle"))
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function apply(sqlite: Database.Database, files: string[]) {
  for (const file of files) {
    const sql = readFileSync(resolve(process.cwd(), "drizzle", file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  }
}

describe("0007 composer credit migration", () => {
  it("preserves evidence, moves Uncredited to review and drops the display cache", () => {
    const sqlite = new Database(":memory:");
    try {
      const files = migrationFiles();
      const index = files.indexOf("0007_composer_credit_workflow.sql");
      expect(index).toBeGreaterThan(0);
      apply(sqlite, files.slice(0, index));

      const now = Date.now();
      // 0006 creates the Uncredited authority row on a clean database.
      const uncredited = sqlite
        .prepare("SELECT id FROM composers WHERE display_name = 'Uncredited'")
        .get() as { id: string };
      sqlite
        .prepare(
          `INSERT INTO composers
            (id, slug, display_name, sort_name, aliases, birth_year, death_year, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "composer-chopin",
          "frederic-chopin",
          "Frédéric Chopin",
          "Chopin, Frédéric",
          JSON.stringify(["Chopin", "Fredrik Chopin", "Frédéric Chopin"]),
          1810,
          1849,
          now,
          now,
        );

      sqlite
        .prepare(
          `INSERT INTO scores
            (id, slug, title, composer, composer_id, license, visibility, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "legacy-uncredited",
          "legacy-uncredited",
          "Anonymous",
          "Uncredited",
          uncredited.id,
          "Public Domain",
          "public",
          now,
        );
      sqlite
        .prepare(
          `INSERT INTO scores
            (id, slug, title, composer, composer_id, license, visibility, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "legacy-chopin",
          "legacy-chopin",
          "Nocturne",
          "Fredrik Chopin",
          "composer-chopin",
          "Public Domain",
          "public",
          now,
        );

      apply(sqlite, [files[index]!]);

      const columns = sqlite
        .prepare("PRAGMA table_info(scores)")
        .all() as Array<{ name: string }>;
      expect(columns.map((column) => column.name)).not.toContain("composer");

      const uncreditedRow = sqlite
        .prepare(
          "SELECT composer_id, composer_raw FROM scores WHERE id = 'legacy-uncredited'",
        )
        .get() as { composer_id: string | null; composer_raw: string | null };
      expect(uncreditedRow.composer_id).toBeNull();
      expect(uncreditedRow.composer_raw).toBeNull();

      const chopinRow = sqlite
        .prepare(
          "SELECT composer_id, composer_raw FROM scores WHERE id = 'legacy-chopin'",
        )
        .get() as { composer_id: string; composer_raw: string };
      expect(chopinRow.composer_id).toBe("composer-chopin");
      expect(chopinRow.composer_raw).toBe("Fredrik Chopin");

      const normalized = sqlite
        .prepare(
          "SELECT display_name, normalized_name FROM composers ORDER BY display_name",
        )
        .all() as Array<{ display_name: string; normalized_name: string }>;
      expect(normalized).toEqual(
        expect.arrayContaining([
          { display_name: "Frédéric Chopin", normalized_name: "frédéric chopin" },
          { display_name: "Uncredited", normalized_name: "uncredited" },
        ]),
      );

      const aliases = sqlite
        .prepare(
          "SELECT alias FROM composer_aliases WHERE composer_id = 'composer-chopin'",
        )
        .all() as Array<{ alias: string }>;
      expect(aliases.map((row) => row.alias)).toEqual(
        expect.arrayContaining(["Chopin", "Fredrik Chopin"]),
      );

      const searchRows = sqlite
        .prepare("SELECT COUNT(*) AS count FROM catalog_search")
        .get() as { count: number };
      expect(searchRows.count).toBe(2);
    } finally {
      sqlite.close();
    }
  });
});
