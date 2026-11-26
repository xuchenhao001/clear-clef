import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const scores = sqliteTable(
  "scores",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    composer: text("composer"),
    catalogNumber: text("catalog_number"),
    lyricist: text("lyricist"),
    sourceUrl: text("source_url"),
    license: text("license").notNull(),
    key: text("key"),
    timeSignature: text("time_signature"),
    difficulty: text("difficulty"),
    instrument: text("instrument").notNull().default("piano"),
    format: text("format").notNull().default("musicxml"),
    r2Key: text("r2_key"),
    canonicalR2Key: text("canonical_r2_key"),
    previewR2Key: text("preview_r2_key"),
    defaultVisibleParts: text("default_visible_parts"),
    visibility: text("visibility").notNull().default("public"),
    ownerId: text("owner_id"),
    contentHash: text("content_hash"),
    uploadKey: text("upload_key"),
    importId: text("import_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("scores_visibility_idx").on(table.visibility),
    index("scores_created_at_idx").on(table.createdAt),
    index("scores_content_hash_idx").on(table.contentHash),
    uniqueIndex("scores_upload_key_idx").on(table.uploadKey),
    index("scores_import_id_idx").on(table.importId),
  ],
);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const scoreTags = sqliteTable(
  "score_tags",
  {
    scoreId: text("score_id")
      .notNull()
      .references(() => scores.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.scoreId, table.tagId] })],
);

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type ScoreTag = typeof scoreTags.$inferInsert;
