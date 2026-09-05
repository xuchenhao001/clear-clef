# ClearClef

Public catalog of Common Western Musical Notation scores. **MusicXML** is the canonical interchange format; scores render in the browser with Verovio; metadata and files live on **Next.js** plus **Cloudflare** (D1 + R2).

Anyone can browse. Uploads are admin-only in v1 (membership/auth comes later).

## Status

**Documentation only.** Application scaffold, D1 schema migrations, and Verovio viewer are not in the repo yet. Start with [docs/roadmap.md](docs/roadmap.md) when implementing.

## Stack (planned)

| Layer | Choice |
| --- | --- |
| App | Next.js App Router + TypeScript |
| Deploy | [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) |
| UI | Tailwind + shadcn/ui |
| Score files | Cloudflare R2 |
| Catalog metadata | Cloudflare D1 + Drizzle ORM |
| Engraving | Verovio (WASM → SVG), client-only |

## Docs

| Doc | Topic |
| --- | --- |
| [docs/README.md](docs/README.md) | Index |
| [docs/architecture.md](docs/architecture.md) | System design and request flows |
| [docs/data-model.md](docs/data-model.md) | D1 tables and R2 layout |
| [docs/notation.md](docs/notation.md) | MusicXML and related standards |
| [docs/ingest.md](docs/ingest.md) | Upload, validation, XXE, license |
| [docs/rendering.md](docs/rendering.md) | Verovio viewer and previews |
| [docs/roadmap.md](docs/roadmap.md) | Implementation phases |
| [docs/decisions.md](docs/decisions.md) | ADRs |
| [AGENTS.md](AGENTS.md) | Instructions for coding agents |

## Not in v1

- In-browser note editor, transposition UI, or community comments
- Server-side full-score PNG pipelines
- MIDI playback (easy later via Verovio MIDI export + Tone.js)
- MEI as the store format
- Open public uploads (spam / copyright risk)

## Seed content

Prefer public-domain or clearly licensed works (e.g. IMSLP, MuseScore public-domain). Do **not** scrape publisher PDFs. Every catalog entry requires an explicit license field.
