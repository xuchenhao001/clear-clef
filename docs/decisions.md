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
- **Consequences:** Large WASM payload; must never load on list RSC pages. See [rendering.md](rendering.md).

## ADR-003: Cloudflare (Workers + D1 + R2) over Node host + S3

- **Status:** Accepted
- **Context:** Greenfield app; zero egress R2 fits score/SVG delivery; D1 fits small catalog metadata.
- **Decision:** Next.js via OpenNext Cloudflare; D1 + Drizzle; one R2 bucket for scores and OpenNext incremental cache, isolated by key prefix (see ADR-007).
- **Consequences:** Node runtime (not Edge export); Worker CPU limits — no per-request full-score server engraving. See [architecture.md](architecture.md).

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
- **Context:** Two empty R2 buckets add dashboard and Wrangler noise; OpenNext already namespaces ISR objects with `NEXT_INC_CACHE_R2_PREFIX` (default `incremental-cache`).
- **Decision:** Use one bucket (`clear-clef`) with two bindings: `SCORES_BUCKET` (`scores/…`) and `NEXT_INC_CACHE_R2_BUCKET` (`incremental-cache/…`).
- **Consequences:** Simpler ops. If cache eviction, jurisdiction, or IAM later need to differ from catalog files, split buckets again.

## ADR-008: Better Auth for admin access

- **Status:** Accepted
- **Context:** Admin upload needs real sessions; env-secret headers are brittle and hard to rotate.
- **Decision:** Use Better Auth with Drizzle adapter on the same D1 database; email/password only; `disableSignUp: true`; admin plugin with first-boot setup at `/admin/setup`; `owner_id` set on ingest.
- **Consequences:** Auth tables live in D1 (`user`, `session`, `account`, `verification`); `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` required; first admin is created once via `/admin/setup`; OAuth/membership can extend later without replacing the gate. When `BETTER_AUTH_URL` is a loopback origin, the common `next dev` ports (3000/3001 on `localhost` and `127.0.0.1`) are trusted as well, so a busy default port does not turn sign-in into `Invalid origin`; deployed base URLs keep the strict single-origin check.
