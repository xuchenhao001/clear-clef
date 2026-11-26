# ClearClef

Public catalog of Common Western Musical Notation scores. **MusicXML** is the canonical interchange format; scores render in the browser with Verovio; metadata and files live on **TanStack Start** plus **Cloudflare** (D1 + R2).

Anyone can browse. Uploads are admin-only in v1 (Better Auth email/password; public sign-up disabled). Admins can add one score or a whole folder from `/admin/batch-upload`.

## Status

**Phases 1–9 are implemented.** Public catalog (contents list), admin upload, batch upload, Verovio viewer, page-1 previews, tags, filters, and edition UI are in place. Batch review and canonical preparation run in the browser so the app stays within the Workers Free CPU budget. See [docs/roadmap.md](docs/roadmap.md).

## Stack

| Layer | Choice |
| --- | --- |
| App | [TanStack Start](https://tanstack.com/start) + TypeScript |
| Package manager | pnpm 11 (Corepack) |
| Deploy | `cf build` + `cf deploy --prebuilt`; config in `cloudflare.config.ts` |
| UI | Tailwind + shadcn/ui |
| Auth | Better Auth + D1 (admin plugin; email/password) |
| Score files | R2 bucket `clear-clef` (`SCORES_BUCKET`, keys under `scores/`) |
| Public page cache | `Cache-Control` + Workers Cache API purge on admin writes |
| Catalog metadata | D1 database `clear-clef` (`DB`) + Drizzle ORM |
| Engraving | Verovio (WASM → SVG), client-only |

## Local development

Requires Node **24** (LTS), [pnpm](https://pnpm.io) 11 (via Corepack), and a logged-in Cloudflare CLI session (`pnpm exec cf auth login`). See [docs/cloudflare.md](docs/cloudflare.md) and [docs/local-dev.md](docs/local-dev.md).

```bash
corepack enable
cp .dev.vars.example .dev.vars
pnpm install
pnpm db:migrate:local   # once after clone; again after pull when drizzle/*.sql changes
pnpm cf-typegen                  # after cloudflare.config.ts changes; writes .cloudflare/types
pnpm dev
```

On first run, open `/admin/setup` to create the admin account.

- `pnpm dev` — `cf dev` (Vite + Workers bindings, `development` mode); does **not** run D1 migrations (use `pnpm db:migrate:local` or `pnpm db:ensure:local` when schema changes)
- `pnpm test` — Vitest unit tests (in-memory SQLite; no remote D1)
- `pnpm typecheck` — TypeScript without emit
- `pnpm lint` — ESLint
- `pnpm preview` — `cf build` then Vite preview
- `pnpm db:migrate:remote` — apply Drizzle SQL to remote D1
- `pnpm deploy` — `cf build` + `cf deploy --prebuilt` (`clear-clef` Worker)

Local **secrets** live in **`.dev.vars`** (see [`.dev.vars.example`](.dev.vars.example)); do not commit it. `BETTER_AUTH_URL` is **not** in `.dev.vars` — `cloudflare.config.ts` sets it from Vite/cf `mode` (`development` → `http://localhost:3000`, deploy → `https://clearclef.dedog.top`). Production secrets use `cf` / the dashboard.

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
| [docs/design.md](docs/design.md) | Visual system and catalog layout |
| [AGENTS.md](AGENTS.md) | Instructions for coding agents |

## Not in v1

- In-browser note editor, transposition UI, or community comments
- Server-side full-score PNG pipelines
- MIDI playback (easy later via Verovio MIDI export + Tone.js)
- MEI as the store format
- Open public uploads (spam / copyright risk)

## Seed content

Prefer public-domain or clearly licensed works (e.g. IMSLP, MuseScore public-domain). Do **not** scrape publisher PDFs. Every catalog entry requires an explicit license field.
