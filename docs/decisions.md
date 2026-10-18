# Decisions (ADRs)

Short architecture decision records. Update when a decision is reversed.

## ADR-001: MusicXML as canonical score format

- **Status:** Accepted
- **Context:** Need an interchange format that MuseScore/Dorico/Sibelius already speak, with engraving semantics (not just playback).
- **Decision:** Store and accept MusicXML 4.x partwise; prefer `.mxl` for originals on disk; keep original + canonical.
- **Consequences:** MIDI/ABC/MEI/MNX/PDF are ingest or derived formats only. See [notation.md](notation.md).

## ADR-002: Verovio over OSMD for display

- **Status:** Accepted
- **Context:** Public catalog needs publication-quality SVG; optional ABC/MEI ingest later.
- **Decision:** Use Verovio WASM in a client-only component; OSMD is the fallback if bundling is painful.
- **Consequences:** Large WASM payload; must never load on catalog list routes. See [rendering.md](rendering.md).

## ADR-003: Cloudflare (Workers + D1 + R2) over Node host + S3

- **Status:** Accepted
- **Context:** Greenfield app; zero egress R2 fits score/SVG delivery; D1 fits small catalog metadata.
- **Decision:** TanStack Start on Cloudflare Workers (`cf` CLI, `cloudflare.config.ts`); D1 + Drizzle; one R2 bucket for score objects (see ADR-007).
- **Consequences:** Worker CPU limits — no per-request full-score server engraving; public HTML cache via Workers Cache API. See [architecture.md](architecture.md).

## ADR-004: Admin-only writes for MVP

- **Status:** Accepted
- **Context:** Open upload invites spam and copyright infringement.
- **Decision:** Public read; `/admin/*` gated by Better Auth admin role (email/password; no public sign-up).
- **Consequences:** No community contributions in v1; seed with clearly licensed works. See [ingest.md](ingest.md).

## ADR-005: No per-request server engraving

- **Status:** Accepted
- **Context:** Full-score SVG is large; Verovio WASM is heavy for Worker CPU/time limits.
- **Decision:** Engrave in the browser for viewing; generate page-1 preview once at ingest and store in R2.
- **Consequences:** Preview pipeline is part of ingest (phase 5); catalog row previews stay static. See [rendering.md](rendering.md).

## ADR-006: Copyright / license metadata is mandatory

- **Status:** Accepted
- **Context:** Redistributing sheet music without rights is a legal risk.
- **Decision:** Require an explicit license on every score; prefer public-domain / Creative Commons seed content; do not scrape publisher PDFs.
- **Consequences:** Upload UX must block submit without license; filters can include license. See [ingest.md](ingest.md).

## ADR-007: Single R2 bucket with key prefixes

- **Status:** Accepted (supersedes the two-bucket split in the original ADR-003 wording)
- **Context:** Score files and previews share the same durability needs; a second bucket was only needed for the former Next.js/OpenNext ISR cache.
- **Decision:** Use one R2 bucket (`clear-clef`) with binding `SCORES_BUCKET`; all catalog objects under `scores/…`. Public HTML is cached with the Workers Cache API (`src/start.ts`), not R2.
- **Consequences:** Simpler ops. Split buckets again only if cache eviction, jurisdiction, or IAM must diverge from catalog files.

## ADR-008: Better Auth for admin access

- **Status:** Accepted
- **Context:** Admin upload needs real sessions; env-secret headers are brittle and hard to rotate.
- **Decision:** Use Better Auth with Drizzle adapter on the same D1 database; email/password only; `disableSignUp: true`; admin plugin with first-boot setup at `/admin/setup`; `owner_id` set on ingest.
- **Consequences:** Auth tables live in D1 (`user`, `session`, `account`, `verification`); `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` required; first admin is created once via `/admin/setup`; OAuth/membership can extend later without replacing the gate. When `BETTER_AUTH_URL` is a loopback origin, the common Vite dev ports (3000/3001 on `localhost` and `127.0.0.1`) are trusted as well, so a busy default port does not turn sign-in into `Invalid origin`; deployed base URLs keep the strict single-origin check.

## ADR-009: TanStack Start + native `cf` CLI (replaces Next.js / OpenNext)

- **Status:** Accepted
- **Context:** Next.js App Router + OpenNext added a second deploy model and Wrangler-centric config on top of a mostly loader-driven catalog.
- **Decision:** TanStack Start + TanStack Router; server data via `createServerFn` in `src/server/*`; `cloudflare.config.ts` + `worker-bindings.mjs` for `cf dev` / `cf build` / `cf deploy --prebuilt`; `@cloudflare/vite-plugin@2` beta reads the same config.
- **Consequences:** No `app/` directory, no ISR/RSC split, no `wrangler.jsonc`. Breaking URL or binding changes require editing `cloudflare.config.ts` and re-running `pnpm cf-typegen`.
