# Roadmap

Implementation order for ClearClef.

## Phase 1 — Scaffold (done)

- Next.js App Router + TypeScript
- OpenNext Cloudflare (`@opennextjs/cloudflare`)
- Wrangler: D1 `clear-clef` + one R2 bucket `clear-clef` (scores + OpenNext ISR prefixes)
- Drizzle ORM against D1 (`lib/db`, `drizzle/0000_init.sql`)
- Tailwind + shadcn/ui baseline
- `initOpenNextCloudflareForDev()` for local bindings

## Phase 2 — Public catalog (metadata)

- List + detail as Server Components querying D1
- SEO-friendly HTML (title, composer, license)
- No WASM on these pages
- Filter `visibility = 'public'`

## Phase 3 — Admin upload

- Protected `/admin/upload`
- Accept `.mxl` / `.musicxml` / `.xml`
- Size cap, XXE-hardened parse path, required license
- Extract metadata; store original + canonical in R2; insert D1 rows
- See [ingest.md](ingest.md)

## Phase 4 — Verovio viewer

- Client-only dynamic import
- Stream `.mxl` from R2 via route handler
- Paginated SVG (`loadZipDataBuffer` / `loadData` → `renderToSVG`)
- See [rendering.md](rendering.md)

## Phase 5 — Previews and filters

- Page-1 SVG previews on cards
- Tags (many-to-many)
- Piano-oriented filters: key, difficulty, license

## Out of scope for v1

- In-browser note editor, transposition UI, community comments
- Server-side full-score PNG pipelines
- MIDI playback
- MEI as store format
- Open unauthenticated uploads

## Future hooks (after v1)

| Hook | Direction |
| --- | --- |
| Auth / membership | Better Auth or Clerk + D1; use `owner_id` / `visibility` |
| MIDI playback | Verovio MIDI export + Tone.js |
| ABC ingest | Convert once to MusicXML on upload |
| MNX | Extend `ScoreFile.format`; do not rewrite catalog |
| Turnstile | Bot protection on upload |
| Workers AI | Unused for MVP |

## Related docs

- [architecture.md](architecture.md)
- [decisions.md](decisions.md)
