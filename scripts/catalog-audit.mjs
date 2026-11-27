import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = process.cwd();
const explicitDb = process.argv.find((arg) => arg.startsWith("--db="))?.slice(5);

function findLocalDb() {
  const base = path.join(root, ".cloudflare", "state", "v3", "d1");
  const dirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  for (const dir of dirs) {
    for (const file of fs.readdirSync(path.join(base, dir.name))) {
      if (file.endsWith(".sqlite") && file !== "metadata.sqlite") {
        return path.join(base, dir.name, file);
      }
    }
  }
  throw new Error("Local D1 database not found");
}

const db = new Database(explicitDb ?? findLocalDb(), { readonly: true });
const one = (sql, ...values) => db.prepare(sql).get(...values);
const all = (sql, ...values) => db.prepare(sql).all(...values);

const total = one("SELECT COUNT(*) AS count FROM scores").count;
const publicCount = one(
  "SELECT COUNT(*) AS count FROM scores WHERE visibility = 'public'",
).count;
const composerRows = all(
  `SELECT coalesce(c.display_name, '[needs review]') AS composer, COUNT(*) AS count
   FROM scores s
   LEFT JOIN composers c ON c.id = s.composer_id
   WHERE s.visibility = 'public'
   GROUP BY s.composer_id, c.display_name
   ORDER BY count DESC`,
);
const duplicateTitles = all(
  `SELECT lower(trim(title)) AS title, COUNT(*) AS count
   FROM scores WHERE visibility = 'public'
   GROUP BY lower(trim(title)) HAVING COUNT(*) > 1
   ORDER BY count DESC`,
);
const badSlugs = all(
  `SELECT slug, title FROM scores
   WHERE visibility = 'public' AND (slug LIKE 'untitled%' OR slug LIKE 'score%')
   ORDER BY slug`,
);
const missing = all(
  `SELECT
     coalesce(SUM(CASE WHEN composer_id IS NULL THEN 1 ELSE 0 END), 0) AS unassigned,
     coalesce(SUM(CASE WHEN c.display_name = 'Uncredited' THEN 1 ELSE 0 END), 0) AS uncredited,
     coalesce(SUM(CASE WHEN key IS NULL OR key = '' THEN 1 ELSE 0 END), 0) AS missing_key,
     coalesce(SUM(CASE WHEN difficulty IS NULL OR difficulty = '' THEN 1 ELSE 0 END), 0) AS missing_difficulty,
     coalesce(SUM(CASE WHEN preview_r2_key IS NULL THEN 1 ELSE 0 END), 0) AS missing_preview
   FROM scores s LEFT JOIN composers c ON c.id = s.composer_id
   WHERE s.visibility = 'public'`,
)[0];
const unusedTags = all(
  `SELECT t.slug, t.label FROM tags t
   LEFT JOIN score_tags st ON st.tag_id = t.id
   LEFT JOIN scores s ON s.id = st.score_id AND s.visibility = 'public'
   GROUP BY t.id HAVING COUNT(s.id) = 0
   ORDER BY t.label`,
);
const searchRows = one("SELECT COUNT(*) AS count FROM catalog_search").count;

console.log("ClearClef catalog audit");
console.log(`  database: ${explicitDb ?? "local D1"}`);
console.log(`  scores: ${total} (${publicCount} public)`);
console.log(`  credit strings: ${composerRows.length}`);
console.log(`  search rows: ${searchRows} (${searchRows === total ? "in sync" : "STALE — use Rebuild search index in /admin/composers"})`);
console.log(`  missing metadata: ${JSON.stringify(missing)}`);
console.log("");
console.log("Credit strings:");
for (const row of composerRows) console.log(`  ${row.count}  ${row.composer ?? "[none]"}`);
console.log("");
console.log("Repeated titles:");
for (const row of duplicateTitles) console.log(`  ${row.count}  ${row.title}`);
console.log("");
console.log("Bad slugs:");
for (const row of badSlugs) console.log(`  ${row.slug}  -> ${row.title}`);
console.log("");
console.log("Unused tags:");
for (const row of unusedTags) console.log(`  ${row.slug}  ${row.label}`);
db.close();
