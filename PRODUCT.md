# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TanStack Start on Cloudflare Workers; D1 for metadata; R2 for score files and previews; Better Auth for admin; Verovio WASM in the browser for engraving. Package manager: **pnpm**.

## Users

Musicians, students, and teachers who need a **public, trustworthy catalog** of engraved MusicXML scores—browse by credit and metadata, open a work, read or practice from paginated notation in the browser.

**Administrators** (small trusted set) ingest scores, set license and metadata, and control visibility.

## Product Purpose

ClearClef makes **edition-quality engraved scores** discoverable and readable on the web without proprietary viewers. Success means fast catalog scan, reliable rendering, clear rights, and safe ingest of hostile XML.

## Positioning

A **score catalog in an archive finding-aid register**: reading-room chrome (light or dark) while **notation stays ink on white paper**; canonical storage is sanitized MusicXML with **page-1 preview SVG generated at ingest**, not per-request server engraving.

## Capabilities (v1)

- Public catalog: credit-grouped contents list, filters, score detail with embedded viewer and full-screen practice mode.
- Admin: setup, login, upload, edit metadata, delete, download originals.
- Every score requires a **license**; public rows are `visibility = public`.

## Constraints

- Canonical format: MusicXML (4.x partwise target); `.mxl` on R2; XXE-safe ingest.
- No Verovio on catalog index routes; viewer is client-only dynamic import.
- No in-browser editor, transposition UI, comments, MIDI playback, or open public uploads in v1.

## Accessibility

WCAG AA target: keyboard navigation, visible focus, semantic landmarks, reduced-motion respect, contrast-safe `edition-*` tokens. Primary controls are **40px** on fine pointers (design density) and **44px minimum** on coarse pointers (`coarse:` variant in `src/styles/globals.css`).

## Open decisions

- Membership / private scores beyond `visibility` hooks.
- Caching TTL tuning for catalog ISR (`PUBLIC_PAGE_REVALIDATE_SECONDS`).

## References

- [AGENTS.md](AGENTS.md), [docs/architecture.md](docs/architecture.md), [docs/design.md](docs/design.md)
