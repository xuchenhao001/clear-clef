# Data model

Keep the D1 schema small. Prefer nullable columns now for membership and format evolution over rewriting tables later.

## Tables

### `composers`

Authority records: one row per person or credited entity.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `slug` | text unique | Public filter / URL value |
| `display_name` | text | Canonical public credit |
| `normalized_name` | text unique | `display_name` lowercased and trimmed; authority lookup key |
| `sort_name` | text | Library sort form, e.g. `Beethoven, Ludwig van` |
| `aliases` | text / JSON | Search aliases; retained for the FTS document |
| `birth_year`, `death_year` | integer | Optional |
| `created_at`, `updated_at` | integer | Milliseconds |

Known variants (`Fredrik Chopin`, `J.S. Bach`, `Ludwig van Beethoven(1770–1827)`) resolve to one record through `lib/catalog/composers.ts`. `scores.composer_id` is the only authority link; there is no display-name cache on `scores`.

### `composer_aliases`

| Column | Type | Notes |
| --- | --- | --- |
| `normalized_alias` | text PK | Lookup key, one composer per alias |
| `composer_id` | text FK | `composers.id`, cascade delete |
| `alias` | text | Display form |
| `created_at` | integer | Milliseconds |

`getOrCreateComposer` resolves by `normalized_name` first and `composer_aliases` second. The unique keys make concurrent uploads safe; a new credit never silently creates a duplicate authority row. Blank and `unknown` credits return `null`; only the explicit **Keep uncredited** action assigns the `Uncredited` record.

### `scores`

| Column | Type (conceptual) | Notes |
| --- | --- | --- |
| `id` | text PK | UUID or similar |
| `slug` | text unique | Stable URL segment; old slugs live in `score_slug_aliases` |
| `title` | text | Required for catalog |
| `composer_id` | text FK | `composers.id`; `NULL` means **needs review** |
| `composer_raw` | text | Credit exactly as read from the file, before canonicalisation |
| `source_filename` | text | Uploaded filename, shown as evidence in the queue |
| `arranger` | text | Kept separate from composer |
| `work_key` | text | Normalized work cluster (title + composer) |
| `edition_label` | text | Distinguishes editions/arrangements |
| `title_sort` | text | Normalized title for sorting |
| `search_text` | text | Normalized text for admin/LIKE fallback |
| `catalog_number` | text | Optional opus or thematic catalog (BWV, Op., etc.) |
| `lyricist` | text | Nullable |
| `source_url` | text | Provenance; http(s) only |
| `license` | text | **Required** — normalized to `LICENSE_OPTIONS` |
| `key` | text | Canonical display, e.g. `C# minor` |
| `time_signature` | text | e.g. `4/4` |
| `difficulty` | text | `beginner \| easy \| intermediate \| advanced` |
| `instrument` | text | Default `piano` |
| `format` | text | `musicxml \| abc \| mnx` — v1 is always `musicxml` |
| `r2_key` | text | Original `.mxl` / `.musicxml` |
| `canonical_r2_key` | text | Sanitized uncompressed MusicXML |
| `preview_r2_key` | text | Page-1 SVG |
| `preview_thumb_r2_key` | text | Page-1 WebP thumbnail |
| `preview_version` | text | Version token for immutable preview URLs |
| `default_visible_parts` | text / JSON | Part IDs; future viewer filtering |
| `visibility` | text | `public \| unlisted \| private` |
| `content_hash` | text | SHA-256 of canonical XML; exact duplicate detection |
| `upload_key` | text unique | Idempotency key |
| `import_id` | text | Batch grouping |
| `created_at`, `updated_at` | integer | Milliseconds |

`composer_id IS NULL` is the review queue. `composer_id = Uncredited` means an admin reviewed the work and decided it is anonymous. Public projections render both as “Uncredited”, but only the first appears in the assignment queue.

### `score_credit_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `score_id` | text FK | `scores.id`, cascade delete |
| `previous_composer_id` | text FK | Nullable |
| `new_composer_id` | text FK | Nullable |
| `action` | text | `assign` or `keep_uncredited` |
| `actor_id` | text | Admin user id |
| `created_at` | integer | Milliseconds |

The audit trail powers “Recent credit decisions” and makes bulk assignment reviewable. It is intentionally small: assignment, keep-uncredited and merge-adjacent fixes; not a general event log.

### `score_slug_aliases`

| Column | Type | Notes |
| --- | --- | --- |
| `slug` | text PK | Old public URL segment |
| `score_id` | text FK | Current score |
| `created_at` | integer | When the slug was replaced |

`/scores/{old-slug}` returns a 301 to the current slug. **Composers & credit → Maintenance** has **Fix legacy slugs** for rows created before the slug policy; it replaces `untitled-*` with title-based slugs and keeps aliases.

### `catalog_search`

SQLite FTS5 virtual table:

| Column | Notes |
| --- | --- |
| `score_id` | `UNINDEXED`, joins to scores |
| `title`, `composer`, `catalog_number`, `lyricist`, `key`, `tags` | Weighted fields |
| `all_text` | Slug, aliases, CJK character-spaced text |

`lib/search/index.ts` refreshes one row after score/tag/composer changes. Admins can rebuild the whole index and fix legacy slugs from **Composers & credit → Maintenance**.

### `tags`, `score_tags`

Unchanged many-to-many. `score_tags (tag_id)` is indexed for facet counts. Only tags attached to public scores appear in public facets.

### Better Auth tables

Managed in [`lib/db/auth-schema.ts`](../lib/db/auth-schema.ts) and [`drizzle/0001_auth.sql`](../drizzle/0001_auth.sql):

- `user` — includes `role`, ban fields (admin plugin)
- `session`
- `account` — credential/OAuth accounts; includes `issuer`
- `verification`

Public sign-up is disabled. On first boot, create the admin at `/admin/setup`.

## Composer credit queue

`/admin/composers` has three URL-backed views:

- `?view=unassigned` (default) — `scores.composer_id IS NULL`, searchable by title, raw credit, filename, catalogue number or slug, filterable by visibility and import batch.
- `?view=authority` — authority records, alias search, works drill-down (`/admin/scores?composer={id}`) and the guarded merge tool.
- `?view=maintenance` — legacy-slug cleanup, search rebuild, catalog health and recent credit decisions.

Assignment writes `composer_id`, recomputes `work_key`, refreshes the score's FTS row, purges the public page and inserts a `score_credit_events` row. Merge rejects the `Uncredited` record explicitly; bulk assignment is the only path from the queue to a real composer.

## Public queries

Always constrain public list/detail:

```sql
WHERE visibility = 'public'
```

`getPublicScoreBySlug` returns a public projection with **no** `owner_id`, `content_hash`, `upload_key`, `import_id` or storage keys. Media is exposed as versioned `/api/...?v=…` URLs.

Unlisted may be reachable by slug later; private requires owner/auth.

## Catalog search and pagination

`searchPublicCatalog()` returns one page of 30 works plus contextual facet counts. Facet values are URL slugs (`c-sharp-minor`, `public-domain`, `intermediate`). The query layer maps slugs back to canonical stored values.

- `q` uses FTS5 `bm25` ranking with title/composer/catalogue weights.
- CJK text is character-spaced into the index so partial Chinese titles match.
- If FTS5 returns nothing, the query falls back to normalized `search_text` (D1 limits `LIKE` patterns to 50 bytes).
- Facet counts exclude the facet being counted and apply the other filters.
- Page 2 redirects to the last real page if it is out of range.
- Search and filtered results are `noindex,follow`; default browse pages are indexable with self-canonical and `rel=prev/next`.

## R2 layout

Prefer `.mxl` for the original upload when the client sent compressed MusicXML. Always keep a canonical uncompressed (or re-serialized) MusicXML for interchange.

```text
scores/{id}/original.mxl          # or original.musicxml / original.abc if that was uploaded
scores/{id}/canonical.musicxml    # Sanitized MusicXML (DOCTYPE stripped; not a 4.x rewrite)
scores/{id}/preview.svg           # page 1 only, generated at ingest
scores/{id}/preview-thumb.webp    # 320×452 catalog thumbnail, generated in the admin browser
```

Media URLs include a version token (`?v=contentHash` or `?v=previewVersion`). The public API serves `Cache-Control: immutable` only when the token matches; old or unversioned URLs redirect to the current token.

All catalog objects live under `scores/{id}/`. Public HTML caching is handled at the edge (see [architecture.md](architecture.md)), not as R2 keys.

## TypeScript (`ScoreFile`)

Isolate format so MNX (or ABC-as-canonical) can land without rewriting D1. The app boundary type lives in [`lib/score-file.ts`](../lib/score-file.ts):

```ts
import { toScoreFile } from "@/lib/score-file";

const scoreFile = toScoreFile(scoreRow);
```

Map `scores.format` + R2 keys through `toScoreFile()` at upload and file-stream routes.

## Future columns (do not invent early)

MIDI derived artifacts, MEI mirrors, and membership tables can wait. `visibility` + `owner_id` are enough hooks for phase 2 auth.

## Related docs

- [architecture.md](architecture.md)
- [ingest.md](ingest.md)
- [notation.md](notation.md)
