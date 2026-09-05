# Data model

Keep the D1 schema small. Prefer nullable columns now for membership and format evolution over rewriting tables later.

## Tables

### `scores`

| Column | Type (conceptual) | Notes |
| --- | --- | --- |
| `id` | text PK | UUID or similar |
| `slug` | text unique | URL segment |
| `title` | text | Required for catalog |
| `composer` | text | Nullable if unknown |
| `lyricist` | text | Nullable |
| `source_url` | text | Provenance (IMSLP, MuseScore, etc.) |
| `license` | text | **Required** — see [ingest.md](ingest.md) |
| `key` | text | e.g. `C major`, `a minor` |
| `time_signature` | text | e.g. `4/4` |
| `difficulty` | text / int | Piano-oriented filter |
| `instrument` | text | Default `piano` |
| `format` | text | `musicxml` \| `abc` \| `mnx` — store format of canonical file; v1 is always `musicxml` |
| `r2_key` | text | Path to preferred download / viewer source (usually original `.mxl`) |
| `canonical_r2_key` | text | Path to canonical MusicXML |
| `preview_r2_key` | text | Path to page-1 SVG |
| `default_visible_parts` | text / JSON | Part IDs shown by default (grand staff for piano) |
| `visibility` | text | `public` \| `unlisted` \| `private`; public catalog filters `public` |
| `owner_id` | text | Nullable until auth; future member ownership |
| `created_at` | integer / text | ISO or unix |

### `tags`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `slug` | text unique | e.g. `bach`, `etude`, `sight-reading` |
| `label` | text | Display name |

### `score_tags`

Many-to-many join: `score_id`, `tag_id` (composite PK).

## Public queries

Always constrain public list/detail:

```sql
WHERE visibility = 'public'
```

Unlisted may be reachable by slug later; private requires owner/auth (phase 2).

## R2 layout

Prefer `.mxl` for the original upload when the client sent compressed MusicXML. Always keep a canonical uncompressed (or re-serialized) MusicXML for interchange.

```text
scores/{id}/original.mxl          # or original.musicxml / original.abc if that was uploaded
scores/{id}/canonical.musicxml    # MusicXML 4.x partwise preferred
scores/{id}/preview.svg           # page 1 only, generated at ingest
incremental-cache/                # OpenNext ISR / data cache (NEXT_INC_CACHE_R2_PREFIX)
```

Do not write catalog objects under `incremental-cache/`. Do not write ISR cache under `scores/`.

## TypeScript sketch (`ScoreFile`)

Isolate format so MNX (or ABC-as-canonical) can land without rewriting D1:

```ts
export type ScoreFormat = "musicxml" | "abc" | "mnx";

export type ScoreFile = {
  format: ScoreFormat;
  /** R2 key for viewer / download preferred blob */
  r2Key: string;
  /** R2 key for MusicXML 4.x partwise when format === "musicxml" */
  canonicalR2Key?: string;
  previewR2Key?: string;
};
```

Map `scores.format` + R2 keys into this type at the app boundary.

## Future columns (do not invent early)

MIDI derived artifacts, MEI mirrors, and membership tables can wait. `visibility` + `owner_id` are enough hooks for phase 2 auth.

## Related docs

- [architecture.md](architecture.md)
- [ingest.md](ingest.md)
- [notation.md](notation.md)
