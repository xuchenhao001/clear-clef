ALTER TABLE `scores` ADD `content_hash` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `upload_key` text;--> statement-breakpoint
ALTER TABLE `scores` ADD `import_id` text;--> statement-breakpoint
CREATE INDEX `scores_content_hash_idx` ON `scores` (`content_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `scores_upload_key_idx` ON `scores` (`upload_key`);--> statement-breakpoint
CREATE INDEX `scores_import_id_idx` ON `scores` (`import_id`);
