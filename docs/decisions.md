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
- **Decision:** Next.js via OpenNext Cloudflare; D1 + Drizzle; dedicated R2 for scores separate from OpenNext cache R2.
- **Consequences:** Node runtime (not Edge export); Worker CPU limits — no per-request full-score server engraving. See [architecture.md](architecture.md).

## ADR-004: Admin-only writes for MVP

- **Status:** Accepted
- **Context:** Open upload invites spam and copyright infringement.
- **Decision:** Public read; `/admin/upload` gated by env secret or Cloudflare Access until membership exists.
- **Consequences:** No community contributions in v1; seed with clearly licensed works. See [ingest.md](ingest.md).

## ADR-005: No per-request server engraving

- **Status:** Accepted
- **Context:** Full-score SVG is large; Verovio WASM is heavy for Worker CPU/time limits.
- **Decision:** Engrave in the browser for viewing; generate page-1 preview once at ingest and store in R2.
- **Consequences:** Preview pipeline is part of ingest (phase 5); catalog cards stay static. See [rendering.md](rendering.md).

## ADR-006: Copyright / license metadata is mandatory

- **Status:** Accepted
- **Context:** Redistributing sheet music without rights is a legal risk.
- **Decision:** Require an explicit license on every score; prefer public-domain / Creative Commons seed content; do not scrape publisher PDFs.
- **Consequences:** Upload UX must block submit without license; filters can include license. See [ingest.md](ingest.md).
