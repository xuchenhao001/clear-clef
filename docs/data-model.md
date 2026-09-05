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

### Better Auth tables

Managed in [`lib/db/auth-schema.ts`](../lib/db/auth-schema.ts) and [`drizzle/0001_auth.sql`](../drizzle/0001_auth.sql):

- `user` — includes `role`, ban fields (admin plugin)
- `session`
- `account` — credential/OAuth accounts; includes `issuer`
- `verification`

Public sign-up is disabled; seed the first admin with `pnpm auth:seed-admin`.

## Public queries

Always constrain public list/detail:

```sql
WHERE visibility = 'public'
```

Unlisted may be reachable by slug later; private requires owner/auth.

## R2 layout

Prefer `.mxl` for the original upload when the client sent compressed MusicXML. Always keep a canonical uncompressed (or re-serialized) MusicXML for interchange.

```text
scores/{id}/original.mxl          # or original.musicxml / original.abc if that was uploaded
scores/{id}/canonical.musicxml    # MusicXML 4.x partwise preferred
scores/{id}/preview.svg           # page 1 only, generated at ingest
incremental-cache/                # OpenNext ISR / data cache (NEXT_INC_CACHE_R2_PREFIX)
```

Do not write catalog objects under `incremental-cache/`. Do not write ISR cache under `scores/`.

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
