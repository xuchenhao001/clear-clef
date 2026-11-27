CREATE TABLE `composers` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`sort_name` text NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`birth_year` integer,
	`death_year` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `composers_slug_unique` ON `composers` (`slug`);--> statement-breakpoint
CREATE INDEX `composers_sort_idx` ON `composers` (`sort_name`);--> statement-breakpoint
CREATE INDEX `composers_display_idx` ON `composers` (`display_name`);--> statement-breakpoint
ALTER TABLE `scores` ADD `composer_id` text REFERENCES composers(id);--> statement-breakpoint
ALTER TABLE `scores` ADD `arranger` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `work_key` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `edition_label` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `title_sort` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `search_text` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `preview_version` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `updated_at` integer;--> statement-breakpoint
UPDATE `scores` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;--> statement-breakpoint
UPDATE `scores` SET `title_sort` = lower(trim(`title`)) WHERE `title_sort` IS NULL;--> statement-breakpoint
UPDATE `scores` SET `work_key` = lower(trim(`title`)) || '|' || lower(trim(coalesce(`composer`, ''))) WHERE `work_key` IS NULL;--> statement-breakpoint
CREATE INDEX `scores_public_created_idx` ON `scores` (`visibility`, `created_at`);--> statement-breakpoint
CREATE INDEX `scores_public_composer_idx` ON `scores` (`visibility`, `composer_id`, `title_sort`);--> statement-breakpoint
CREATE INDEX `scores_public_title_idx` ON `scores` (`visibility`, `title_sort`);--> statement-breakpoint
CREATE INDEX `scores_public_key_idx` ON `scores` (`visibility`, `key`);--> statement-breakpoint
CREATE INDEX `scores_public_difficulty_idx` ON `scores` (`visibility`, `difficulty`);--> statement-breakpoint
CREATE INDEX `scores_public_license_idx` ON `scores` (`visibility`, `license`);--> statement-breakpoint
CREATE INDEX `scores_work_key_idx` ON `scores` (`work_key`);--> statement-breakpoint
CREATE INDEX `score_tags_tag_idx` ON `score_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `score_slug_aliases` (
	`slug` text PRIMARY KEY NOT NULL,
	`score_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `score_slug_aliases_score_idx` ON `score_slug_aliases` (`score_id`);--> statement-breakpoint
CREATE VIRTUAL TABLE `catalog_search` USING fts5(
	`score_id` UNINDEXED,
	`title`,
	`composer`,
	`catalog_number`,
	`lyricist`,
	`key`,
	`tags`,
	`all_text`,
	tokenize = 'unicode61 remove_diacritics 2'
);--> statement-breakpoint
INSERT INTO `catalog_search` (
	`score_id`, `title`, `composer`, `catalog_number`, `lyricist`, `key`, `tags`, `all_text`
)
SELECT
	s.`id`,
	s.`title`,
	coalesce(s.`composer`, ''),
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
		coalesce(s.`composer`, '') || ' ' ||
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
FROM `scores` s;--> statement-breakpoint
UPDATE `scores`
SET `search_text` = lower(
	coalesce(`title`, '') || ' ' ||
	coalesce(`composer`, '') || ' ' ||
	coalesce(`catalog_number`, '') || ' ' ||
	coalesce(`lyricist`, '') || ' ' ||
	coalesce(`key`, '')
);
