UPDATE `scores`
SET `arranger` = 'E Muirhead'
WHERE `composer` LIKE '%arr. E Muirhead%' AND (`arranger` IS NULL OR `arranger` = '');
--> statement-breakpoint
UPDATE `scores`
SET `arranger` = 'Verona'
WHERE `composer` LIKE '%arr. Verona%' AND (`arranger` IS NULL OR `arranger` = '');
--> statement-breakpoint
UPDATE `scores`
SET `arranger` = 'Manjuprasad'
WHERE lower(`composer`) LIKE '%arranged by manjuprasad%' AND (`arranger` IS NULL OR `arranger` = '');
--> statement-breakpoint
UPDATE `scores`
SET `composer` = CASE
  WHEN lower(`composer`) LIKE '%chopin%' THEN 'Frédéric Chopin'
  WHEN lower(`composer`) LIKE '%beethoven%' THEN 'Ludwig van Beethoven'
  WHEN lower(`composer`) LIKE '%bach%' THEN 'Johann Sebastian Bach'
  WHEN lower(`composer`) LIKE '%debussy%' THEN 'Claude Debussy'
  WHEN lower(`composer`) LIKE '%satie%' THEN 'Erik Satie'
  WHEN lower(`composer`) LIKE '%liszt%' THEN 'Franz Liszt'
  WHEN lower(`composer`) LIKE '%mozart%' THEN 'Wolfgang Amadeus Mozart'
  WHEN lower(`composer`) LIKE '%tchaikovsky%' THEN 'Pyotr Ilyich Tchaikovsky'
  WHEN lower(`composer`) LIKE '%pachelbel%' THEN 'Johann Pachelbel'
  WHEN lower(`composer`) LIKE '%brahms%' THEN 'Johannes Brahms'
  WHEN lower(`composer`) LIKE '%schubert%' THEN 'Franz Schubert'
  WHEN lower(`composer`) LIKE '%joplin%' THEN 'Scott Joplin'
  WHEN lower(`composer`) LIKE '%jj lin%' THEN 'JJ Lin'
  WHEN lower(`composer`) LIKE '%lyo ni%' THEN 'Lyo Ni'
  WHEN lower(`composer`) LIKE '%will ross%' OR lower(`composer`) LIKE '%will_ross%' THEN 'Will Ross'
  WHEN lower(`composer`) LIKE '%traditional%' THEN 'Traditional'
  WHEN lower(`composer`) LIKE '%arr. verona%' THEN 'Uncredited'
  WHEN lower(`composer`) LIKE '%arranged by manjuprasad%' THEN 'Uncredited'
  WHEN lower(`composer`) LIKE '%unknown%' OR lower(`composer`) LIKE '%uncredited%' THEN 'Uncredited'
  ELSE trim(`composer`)
END
WHERE `composer` IS NOT NULL AND trim(`composer`) <> '';
--> statement-breakpoint
INSERT INTO `composers`
  (`id`, `slug`, `display_name`, `sort_name`, `aliases`, `birth_year`, `death_year`, `created_at`, `updated_at`)
SELECT
  'composer-' || lower(substr(hex(randomblob(8)), 1, 16)),
  CASE s.`composer`
    WHEN 'Frédéric Chopin' THEN 'frederic-chopin'
    WHEN 'Ludwig van Beethoven' THEN 'ludwig-van-beethoven'
    WHEN 'Johann Sebastian Bach' THEN 'johann-sebastian-bach'
    WHEN 'Claude Debussy' THEN 'claude-debussy'
    WHEN 'Erik Satie' THEN 'erik-satie'
    WHEN 'Franz Liszt' THEN 'franz-liszt'
    WHEN 'Wolfgang Amadeus Mozart' THEN 'wolfgang-amadeus-mozart'
    WHEN 'Pyotr Ilyich Tchaikovsky' THEN 'pyotr-ilyich-tchaikovsky'
    WHEN 'Johann Pachelbel' THEN 'johann-pachelbel'
    WHEN 'Johannes Brahms' THEN 'johannes-brahms'
    WHEN 'Franz Schubert' THEN 'franz-schubert'
    WHEN 'Scott Joplin' THEN 'scott-joplin'
    WHEN 'JJ Lin' THEN 'jj-lin'
    WHEN 'Lyo Ni' THEN 'lyo-ni'
    WHEN 'Will Ross' THEN 'will-ross'
    WHEN 'Traditional' THEN 'traditional'
    WHEN 'Uncredited' THEN 'uncredited'
    ELSE 'composer-' || lower(substr(hex(randomblob(4)), 1, 8))
  END,
  s.`composer`,
  CASE s.`composer`
    WHEN 'Frédéric Chopin' THEN 'Chopin, Frédéric'
    WHEN 'Ludwig van Beethoven' THEN 'Beethoven, Ludwig van'
    WHEN 'Johann Sebastian Bach' THEN 'Bach, Johann Sebastian'
    WHEN 'Claude Debussy' THEN 'Debussy, Claude'
    WHEN 'Erik Satie' THEN 'Satie, Erik'
    WHEN 'Franz Liszt' THEN 'Liszt, Franz'
    WHEN 'Wolfgang Amadeus Mozart' THEN 'Mozart, Wolfgang Amadeus'
    WHEN 'Pyotr Ilyich Tchaikovsky' THEN 'Tchaikovsky, Pyotr Ilyich'
    WHEN 'Johann Pachelbel' THEN 'Pachelbel, Johann'
    WHEN 'Johannes Brahms' THEN 'Brahms, Johannes'
    WHEN 'Franz Schubert' THEN 'Schubert, Franz'
    WHEN 'Scott Joplin' THEN 'Joplin, Scott'
    WHEN 'JJ Lin' THEN 'Lin, JJ'
    ELSE s.`composer`
  END,
  CASE s.`composer`
    WHEN 'Frédéric Chopin' THEN json_array('Chopin', 'Fredrik Chopin', 'Fréderic François Chopin', 'Frédéric Chopin')
    WHEN 'Ludwig van Beethoven' THEN json_array('Beethoven', 'L. van Beethoven', 'Ludwig Van Beethoven', 'Ludwig van Beethoven')
    WHEN 'Johann Sebastian Bach' THEN json_array('Bach', 'J.S. Bach', 'J. S. Bach', 'Johann Sebastian Bach')
    WHEN 'Claude Debussy' THEN json_array('Debussy', 'Claude Achille Debussy', 'Claude Debussy')
    WHEN 'Wolfgang Amadeus Mozart' THEN json_array('Mozart', 'Wolfgang Amadeus Mozart')
    WHEN 'Pyotr Ilyich Tchaikovsky' THEN json_array('Tchaikovsky', 'Pyotr Ilyich Tchaikovsky')
    WHEN 'Johann Pachelbel' THEN json_array('Pachelbel', 'Johann Pachelbel')
    WHEN 'Uncredited' THEN json_array('Unknown', 'Uncredited')
    ELSE json_array(s.`composer`)
  END,
  CASE s.`composer`
    WHEN 'Frédéric Chopin' THEN 1810
    WHEN 'Ludwig van Beethoven' THEN 1770
    WHEN 'Johann Sebastian Bach' THEN 1685
    WHEN 'Claude Debussy' THEN 1862
    WHEN 'Erik Satie' THEN 1866
    WHEN 'Franz Liszt' THEN 1811
    WHEN 'Wolfgang Amadeus Mozart' THEN 1756
    WHEN 'Pyotr Ilyich Tchaikovsky' THEN 1840
    WHEN 'Johann Pachelbel' THEN 1653
    WHEN 'Johannes Brahms' THEN 1833
    WHEN 'Franz Schubert' THEN 1797
    WHEN 'Scott Joplin' THEN 1868
    ELSE NULL
  END,
  CASE s.`composer`
    WHEN 'Frédéric Chopin' THEN 1849
    WHEN 'Ludwig van Beethoven' THEN 1827
    WHEN 'Johann Sebastian Bach' THEN 1750
    WHEN 'Claude Debussy' THEN 1918
    WHEN 'Erik Satie' THEN 1925
    WHEN 'Franz Liszt' THEN 1886
    WHEN 'Wolfgang Amadeus Mozart' THEN 1791
    WHEN 'Pyotr Ilyich Tchaikovsky' THEN 1893
    WHEN 'Johann Pachelbel' THEN 1706
    WHEN 'Johannes Brahms' THEN 1897
    WHEN 'Franz Schubert' THEN 1828
    WHEN 'Scott Joplin' THEN 1917
    ELSE NULL
  END,
  coalesce(
    (SELECT min(`created_at`) FROM `scores` WHERE trim(`composer`) = s.`composer`),
    strftime('%s', 'now') * 1000
  ),
  coalesce(
    (SELECT max(`updated_at`) FROM `scores` WHERE trim(`composer`) = s.`composer`),
    strftime('%s', 'now') * 1000
  )
FROM (
  SELECT DISTINCT trim(`composer`) AS `composer`
  FROM `scores`
  WHERE `composer` IS NOT NULL AND trim(`composer`) <> ''
) AS s
WHERE NOT EXISTS (
  SELECT 1 FROM `composers` c WHERE c.`display_name` = s.`composer`
);
--> statement-breakpoint
INSERT INTO `composers`
  (`id`, `slug`, `display_name`, `sort_name`, `aliases`, `birth_year`, `death_year`, `created_at`, `updated_at`)
SELECT
  'composer-' || lower(substr(hex(randomblob(8)), 1, 16)),
  'uncredited',
  'Uncredited',
  'Uncredited',
  json_array('Uncredited', 'Unknown'),
  NULL,
  NULL,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `composers` WHERE `display_name` = 'Uncredited');
--> statement-breakpoint
UPDATE `scores`
SET `composer` = 'Uncredited',
    `composer_id` = (SELECT `id` FROM `composers` WHERE `display_name` = 'Uncredited' LIMIT 1)
WHERE `composer` IS NULL OR trim(`composer`) = '';
--> statement-breakpoint
UPDATE `scores`
SET `composer_id` = (
  SELECT c.`id` FROM `composers` c WHERE c.`display_name` = trim(`scores`.`composer`)
)
WHERE `composer_id` IS NULL AND `composer` IS NOT NULL AND trim(`composer`) <> '';
--> statement-breakpoint
UPDATE `scores`
SET
  `title_sort` = lower(trim(`title`)),
  `work_key` = lower(trim(`title`)) || '|' || lower(trim(coalesce(`composer`, ''))),
  `search_text` = lower(
    coalesce(`title`, '') || ' ' ||
    coalesce(`composer`, '') || ' ' ||
    coalesce(`catalog_number`, '') || ' ' ||
    coalesce(`lyricist`, '') || ' ' ||
    coalesce(`key`, '')
  )
WHERE `title` IS NOT NULL;
--> statement-breakpoint
UPDATE `scores`
SET `edition_label` = 'Edition ' || (
  SELECT COUNT(*) FROM `scores` earlier
  WHERE earlier.`work_key` = `scores`.`work_key`
    AND (
      earlier.`created_at` < `scores`.`created_at`
      OR (earlier.`created_at` = `scores`.`created_at` AND earlier.`id` <= `scores`.`id`)
    )
)
WHERE (`edition_label` IS NULL OR `edition_label` = '')
  AND `work_key` IN (
    SELECT `work_key` FROM `scores`
    WHERE `work_key` IS NOT NULL
    GROUP BY `work_key` HAVING COUNT(*) > 1
  );
--> statement-breakpoint
DELETE FROM `catalog_search`;
--> statement-breakpoint
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
FROM `scores` s;
