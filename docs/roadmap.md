# Roadmap

Implementation order for ClearClef.

## Phase 1 — Scaffold (done)

- TanStack Start + TanStack Router + TypeScript (`src/routes/`, Vite 8)
- Cloudflare Workers deploy (`cf deploy`, config in `cloudflare.config.ts`)
- D1 `clear-clef` + R2 bucket `clear-clef` (`scores/` prefix only); `cf` CLI for deploy and migrations
- Drizzle ORM against D1 (`lib/db`, `drizzle/0000_init.sql`)
- Tailwind + shadcn/ui baseline
- Better Auth on D1 (`drizzle/0001_auth.sql`), first-boot `/admin/setup`, `/admin/login`

## Phase 2 — Public catalog (done)

- List + detail via route loaders + `createServerFn` querying D1
- SEO-friendly HTML (title, composer, license)
- No WASM on these pages
- Filter `visibility = 'public'`

## Phase 3 — Admin upload (done)

- Protected `/admin/upload` (Better Auth admin role)
- Accept `.mxl` / `.musicxml` / `.xml`
- Size cap, XXE-hardened parse path, required license
- Extract metadata; store original + canonical in R2; insert D1 rows
- See [ingest.md](ingest.md)

## Phase 4 — Verovio viewer (done)

- Client-only dynamic import
- Stream `.mxl` from R2 via route handler
- Paginated SVG (`loadZipDataBuffer` / `loadData` → `renderToSVG`)
- See [rendering.md](rendering.md)

## Phase 5 — Previews and filters (done)

- Page-1 SVG previews on catalog rows (generated in admin browser at ingest)
- Tags (many-to-many)
- Piano-oriented filters: key, difficulty, license

## Phase 6 — Contents-list catalog UI (done)

- Credit-grouped contents list (replaces card grid)
- Bitter Egyptian slab for every capital (headings, title, wordmark, labels, buttons, nav), heavy and tightly tracked; EB Garamond for sentence case (self-hosted, Latin subset); Geist Mono only for technical strings. No sans-serif, no small capitals, no third display face (Red Dead recut, menu recut, contents recut)
- Value structure matches the menus: content sits on near-black **hide panels** (title plate, filter strip, contents plate, admin sections, popups) on an aged **map-paper floor**; brass is the metal and marks the current tab, the one vermilion is reserved for live state; two texture dead ends removed (a camouflaging 285px mottle, a plank-like anisotropic hide grain) and the tile seam ended by building the floor from seamless plain turbulence and painting the panels' lit relief `cover`
- Archive reading-room chrome; white notation invariant; theme menu (Light / Dark / System)
- Optional `catalog_number` (thematic/opus from MusicXML `<work-number>` or admin override)
- Sparse metadata line (`catalog_number · key · time`) on list and detail
- Auto-submit catalog filters (no Apply button)
- See [design.md](design.md)

## Phase 7 — Admin score CRUD (done)

- `/admin/scores` list (all visibilities) and `/admin/scores/{id}` edit
- `PATCH` / `DELETE` / admin download original / admin preview GET
- Hard delete (D1 + R2); metadata edit; optional MusicXML file replace with preview regen
- See [ingest.md](ingest.md)

## Phase 8 — Batch upload (done)

- `/admin/batch-upload`: folder picker, metadata/rights/duplicate review, idempotent per-file uploads, Web Worker previews, resume manifest, import filter, private-batch publish
- See [ingest.md](ingest.md) and ADR-010

## Phase 9 — Free-tier ingest hardening (done)

- Browser Web Worker inspection and JSON-only catalog lookup; no score file in preflight
- Targeted header metadata extraction, measure-count scan, keys only when mode/title states one
- Canonical XML handoff as a binary File part; server sanitizes/re-hashes without full parse
- Declared-size zip-bomb guard, rootfile-only extraction, encoding-aware decode
- Retry/error states: no blind 503 retries, retry unread, missing-composer filter
- See [ingest.md](ingest.md), [cloudflare.md](cloudflare.md), and ADR-011

## Out of scope for v1

- In-browser note editor, transposition UI, community comments
- Server-side full-score PNG pipelines
- MIDI playback
- MEI as store format
- Open unauthenticated uploads

## Future hooks (after v1)

| Hook | Direction |
| --- | --- |
| Membership / OAuth | Extend Better Auth (Google/GitHub); use `owner_id` / `visibility` |
| MIDI playback | Verovio MIDI export + Tone.js |
| ABC ingest | Convert once to MusicXML on upload |
| MNX | Extend `ScoreFile.format`; do not rewrite catalog |
| Turnstile | Bot protection on upload |
| Workers AI | Unused for MVP |

## Related docs

- [architecture.md](architecture.md)
- [decisions.md](decisions.md)
