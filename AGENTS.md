# Agent instructions — ClearClef

ClearClef is a **public MusicXML score catalog** on Next.js + Cloudflare (D1 metadata, R2 files, Verovio in the browser). Prefer [docs/](docs/) over inventing new architecture.

## Non-negotiables

1. **Canonical format = MusicXML 4.x partwise.** Prefer `.mxl` for originals on R2. Keep original + canonical. MIDI / MEI / ABC / MNX / PDF are not the store format (ABC may convert once on ingest later).
2. **List/detail = Server Components + D1.** Never load Verovio/WASM on catalog index pages.
3. **Viewer = Client Component** via `next/dynamic(..., { ssr: false })`. Paginate SVG; do not SSR engraved scores.
4. **Writes are admin-only in v1.** Public read; protected `/admin/upload`. Require a **license** on every score.
5. **XXE:** Treat uploads as hostile. Non-validating parse; no DTD/external entity resolution. Harden before/around any MusicXML library.
6. **No per-request server engraving.** Page-1 preview SVG is generated at ingest and stored in R2.
7. **R2 buckets:** score files ≠ OpenNext incremental cache. Separate buckets.
8. Public queries use `visibility = 'public'`. Keep nullable `owner_id` / `visibility` / `format` for later auth and MNX.

## Do not build in v1

In-browser editor, transposition UI, comments, full-score server PNGs, MIDI playback, MEI-as-canonical, open public uploads.

## Where to look

| Topic | Doc |
| --- | --- |
| System design | [docs/architecture.md](docs/architecture.md) |
| Schema / R2 keys | [docs/data-model.md](docs/data-model.md) |
| Standards | [docs/notation.md](docs/notation.md) |
| Upload pipeline | [docs/ingest.md](docs/ingest.md) |
| Verovio | [docs/rendering.md](docs/rendering.md) |
| Phases | [docs/roadmap.md](docs/roadmap.md) |
| ADRs | [docs/decisions.md](docs/decisions.md) |

Cursor rules under `.cursor/rules/` reinforce product, ingest, and viewer constraints when matching files are open.
