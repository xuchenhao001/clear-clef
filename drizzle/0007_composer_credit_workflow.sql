ALTER TABLE `composers` ADD `normalized_name` text NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE `composers` SET `normalized_name` = lower(trim(`display_name`));
--> statement-breakpoint
UPDATE `composers`
SET `display_name` = 'Uncredited', `sort_name` = 'Uncredited'
WHERE lower(trim(`display_name`)) = 'uncredited';
--> statement-breakpoint
-- One authority row per normalised name. Any legacy duplicates are folded into
-- the oldest row before the unique index is created.
UPDATE `scores`
SET `composer_id` = (
  SELECT keeper.`id`
  FROM `composers` keeper
  WHERE keeper.`normalized_name` = (
    SELECT current.`normalized_name`
    FROM `composers` current
    WHERE current.`id` = `scores`.`composer_id`
  )
  ORDER BY keeper.`created_at`, keeper.`id`
  LIMIT 1
)
WHERE `composer_id` IS NOT NULL;
--> statement-breakpoint
DELETE FROM `composers`
WHERE `rowid` NOT IN (
  SELECT min(`rowid`) FROM `composers` GROUP BY `normalized_name`
);
--> statement-breakpoint
CREATE UNIQUE INDEX `composers_normalized_name_idx` ON `composers` (`normalized_name`);
--> statement-breakpoint
CREATE TABLE `composer_aliases` (
  `normalized_alias` text PRIMARY KEY NOT NULL,
  `composer_id` text NOT NULL,
  `alias` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`composer_id`) REFERENCES `composers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `composer_aliases_composer_idx` ON `composer_aliases` (`composer_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `composer_aliases` (`normalized_alias`, `composer_id`, `alias`, `created_at`)
SELECT
  lower(trim(alias.`value`)),
  c.`id`,
  trim(alias.`value`),
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM `composers` c, json_each(c.`aliases`) AS alias
WHERE trim(alias.`value`) <> ''
  AND lower(trim(alias.`value`)) <> c.`normalized_name`;
--> statement-breakpoint
ALTER TABLE `scores` ADD `composer_raw` text;
--> statement-breakpoint
ALTER TABLE `scores` ADD `source_filename` text;
--> statement-breakpoint
-- Preserve the best available evidence. The current display value was already
-- canonicalised by 0006, but it is the only surviving credit for old rows.
UPDATE `scores`
SET `composer_raw` = CASE
  WHEN `composer` IS NULL OR trim(`composer`) = '' OR `composer` = 'Uncredited' THEN NULL
  ELSE trim(`composer`)
END;
--> statement-breakpoint
-- Uncredited becomes an explicit reviewed-anonymous decision. Everything that
-- was parked there returns to the review queue (composer_id IS NULL).
UPDATE `scores`
SET `composer_id` = NULL
WHERE `composer_id` IN (
  SELECT `id` FROM `composers` WHERE lower(trim(`display_name`)) = 'uncredited'
);
--> statement-breakpoint
CREATE INDEX `scores_unassigned_idx` ON `scores` (`composer_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `score_credit_events` (
  `id` text PRIMARY KEY NOT NULL,
  `score_id` text NOT NULL,
  `previous_composer_id` text,
  `new_composer_id` text,
  `action` text NOT NULL,
  `actor_id` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`previous_composer_id`) REFERENCES `composers`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`new_composer_id`) REFERENCES `composers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `score_credit_events_score_idx` ON `score_credit_events` (`score_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `score_credit_events_created_idx` ON `score_credit_events` (`created_at`);
--> statement-breakpoint
ALTER TABLE `scores` DROP COLUMN `composer`;
--> statement-breakpoint
UPDATE `scores`
SET
  `title_sort` = lower(trim(`title`)),
  `work_key` = lower(trim(`title`)) || '|' || lower(coalesce((
    SELECT `display_name` FROM `composers` WHERE `id` = `scores`.`composer_id`
  ), 'uncredited')),
  `search_text` = lower(
    coalesce(`title`, '') || ' ' ||
    coalesce((SELECT `display_name` FROM `composers` WHERE `id` = `scores`.`composer_id`), '') || ' ' ||
    coalesce(`catalog_number`, '') || ' ' ||
    coalesce(`lyricist`, '') || ' ' ||
    coalesce(`key`, '')
  )
WHERE `title` IS NOT NULL;
--> statement-breakpoint
DELETE FROM `catalog_search`;
--> statement-breakpoint
INSERT INTO `catalog_search` (
  `score_id`, `title`, `composer`, `catalog_number`, `lyricist`, `key`, `tags`, `all_text`
)
SELECT
  s.`id`,
  s.`title`,
  coalesce(c.`display_name`, ''),
  coalesce(s.`catalog_number`, ''),
  coalesce(s.`lyricist`, ''),
  coalesce(s.`key`, ''),
  coalesce((
    SELECT group_concat(t.`label`, ' ')
    FROM `score_tags` st
    JOIN `tags` t ON t.`id` = st.`tag_id`
    WHERE st.`score_id` = s.`id`
  ), ''),
  lower(
    coalesce(s.`title`, '') || ' ' ||
    coalesce(c.`display_name`, '') || ' ' ||
    coalesce(s.`composer_raw`, '') || ' ' ||
    coalesce(s.`source_filename`, '') || ' ' ||
    coalesce(c.`sort_name`, '') || ' ' ||
    coalesce(c.`aliases`, '') || ' ' ||
    coalesce(s.`catalog_number`, '') || ' ' ||
    coalesce(s.`lyricist`, '') || ' ' ||
    coalesce(s.`key`, '') || ' ' ||
    coalesce(s.`slug`, '') || ' ' ||
    coalesce((
      SELECT group_concat(t.`label`, ' ')
      FROM `score_tags` st
      JOIN `tags` t ON t.`id` = st.`tag_id`
      WHERE st.`score_id` = s.`id`
    ), '')
  )
FROM `scores` s
LEFT JOIN `composers` c ON c.`id` = s.`composer_id`;
