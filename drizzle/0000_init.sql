CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`composer` text,
	`lyricist` text,
	`source_url` text,
	`license` text NOT NULL,
	`key` text,
	`time_signature` text,
	`difficulty` text,
	`instrument` text DEFAULT 'piano' NOT NULL,
	`format` text DEFAULT 'musicxml' NOT NULL,
	`r2_key` text,
	`canonical_r2_key` text,
	`preview_r2_key` text,
	`default_visible_parts` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`owner_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scores_slug_unique` ON `scores` (`slug`);--> statement-breakpoint
CREATE INDEX `scores_visibility_idx` ON `scores` (`visibility`);--> statement-breakpoint
CREATE INDEX `scores_created_at_idx` ON `scores` (`created_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `score_tags` (
	`score_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`score_id`, `tag_id`),
	FOREIGN KEY (`score_id`) REFERENCES `scores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
