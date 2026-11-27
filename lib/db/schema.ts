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
    normalizedName: text("normalized_name").notNull(),
    sortName: text("sort_name").notNull(),
    aliases: text("aliases").notNull().default("[]"),
    birthYear: integer("birth_year"),
    deathYear: integer("death_year"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("composers_normalized_name_idx").on(table.normalizedName),
    index("composers_sort_idx").on(table.sortName),
    index("composers_display_idx").on(table.displayName),
  ],
);

export const composerAliases = sqliteTable(
  "composer_aliases",
  {
    normalizedAlias: text("normalized_alias").primaryKey(),
    composerId: text("composer_id")
      .notNull()
      .references(() => composers.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("composer_aliases_composer_idx").on(table.composerId)],
);

export const scores = sqliteTable(
  "scores",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    composerId: text("composer_id").references(() => composers.id, {
      onDelete: "set null",
    }),
    /** The credit exactly as read from the file, before canonicalisation. */
    composerRaw: text("composer_raw"),
    sourceFilename: text("source_filename"),
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
    index("scores_unassigned_idx").on(table.composerId, table.createdAt),
  ],
);

export const scoreCreditEvents = sqliteTable(
  "score_credit_events",
  {
    id: text("id").primaryKey(),
    scoreId: text("score_id")
      .notNull()
      .references(() => scores.id, { onDelete: "cascade" }),
    previousComposerId: text("previous_composer_id").references(
      () => composers.id,
      { onDelete: "set null" },
    ),
    newComposerId: text("new_composer_id").references(() => composers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    actorId: text("actor_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("score_credit_events_score_idx").on(table.scoreId, table.createdAt),
    index("score_credit_events_created_idx").on(table.createdAt),
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
export type ComposerAlias = typeof composerAliases.$inferSelect;
export type ScoreCreditEvent = typeof scoreCreditEvents.$inferSelect;
export type ScoreSlugAlias = typeof scoreSlugAliases.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ScoreTag = typeof scoreTags.$inferInsert;
