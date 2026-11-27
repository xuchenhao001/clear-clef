import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const composers = sqliteTable(
  "composers",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    displayName: text("display_name").notNull(),
    sortName: text("sort_name").notNull(),
    aliases: text("aliases").notNull().default("[]"),
    birthYear: integer("birth_year"),
    deathYear: integer("death_year"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("composers_sort_idx").on(table.sortName),
    index("composers_display_idx").on(table.displayName),
  ],
);

export const scores = sqliteTable(
  "scores",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    composer: text("composer"),
    composerId: text("composer_id").references(() => composers.id, {
      onDelete: "set null",
    }),
    arranger: text("arranger"),
    workKey: text("work_key"),
    editionLabel: text("edition_label"),
    titleSort: text("title_sort"),
    searchText: text("search_text"),
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
    previewThumbR2Key: text("preview_thumb_r2_key"),
    defaultVisibleParts: text("default_visible_parts"),
    visibility: text("visibility").notNull().default("public"),
    ownerId: text("owner_id"),
    contentHash: text("content_hash"),
    uploadKey: text("upload_key"),
    importId: text("import_id"),
    previewVersion: text("preview_version"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("scores_visibility_idx").on(table.visibility),
    index("scores_created_at_idx").on(table.createdAt),
    index("scores_content_hash_idx").on(table.contentHash),
    uniqueIndex("scores_upload_key_idx").on(table.uploadKey),
    index("scores_import_id_idx").on(table.importId),
    index("scores_public_created_idx").on(table.visibility, table.createdAt),
    index("scores_public_composer_idx").on(
      table.visibility,
      table.composerId,
      table.titleSort,
    ),
    index("scores_public_title_idx").on(table.visibility, table.titleSort),
    index("scores_public_key_idx").on(table.visibility, table.key),
    index("scores_public_difficulty_idx").on(
      table.visibility,
      table.difficulty,
    ),
    index("scores_public_license_idx").on(table.visibility, table.license),
    index("scores_work_key_idx").on(table.workKey),
  ],
);

export const scoreSlugAliases = sqliteTable(
  "score_slug_aliases",
  {
    slug: text("slug").primaryKey(),
    scoreId: text("score_id")
      .notNull()
      .references(() => scores.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("score_slug_aliases_score_idx").on(table.scoreId)],
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
  (table) => [
    primaryKey({ columns: [table.scoreId, table.tagId] }),
    index("score_tags_tag_idx").on(table.tagId),
  ],
);

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type Composer = typeof composers.$inferSelect;
export type NewComposer = typeof composers.$inferInsert;
export type ScoreSlugAlias = typeof scoreSlugAliases.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ScoreTag = typeof scoreTags.$inferInsert;
