# Notation standards

## Canonical format: MusicXML

**MusicXML is the de facto standard** for transmitting Common Western Musical Notation between apps. 270+ programs (MuseScore, Dorico, Sibelius, Finale, many OMR tools) import/export it. The W3C Music Notation Community Group maintains it.

| Version | Status |
| --- | --- |
| MusicXML **4.0** | Current stable (June 2021) |
| MusicXML **4.1** | Draft — watch, do not require yet |

### On-disk forms

| Extension | Form | Guidance |
| --- | --- | --- |
| `.musicxml` / `.xml` | Uncompressed XML | Accept on upload; good for canonical interchange |
| `.mxl` | ZIP-compressed MusicXML | Prefer for originals on R2 (~20× smaller typical) |

**Canonical store = MusicXML 4.x partwise.** Keep the original upload too. Layout hints in MusicXML are advisory; let Verovio reflow for phone vs desktop.

## Do not use as the catalog source of truth

| Format | Role | Why not canonical here |
| --- | --- | --- |
| **MIDI** | Performance / timing | No beams, slurs, dynamics-as-notation, engraving layout. OK later as a *derived* playback format |
| **MEI** | Scholarly encoding | Strong for libraries/archives (variants, mensural, source images); weaker for “export from MuseScore and share” |
| **ABC** | Compact text | Great for folk/simple tunes and typing by hand. Optional *ingest* → convert once to MusicXML |
| **MNX** | W3C next-gen JSON | Still a draft. Isolate via `ScoreFile.format` ([data-model.md](data-model.md)); do not build on it yet |
| **PDF / PNG** | Display only | Cannot transpose, reflow, or play as notation |

## SMuFL

**SMuFL** (Standard Music Font Layout) is the companion standard for *glyphs* (noteheads, clefs, accidentals). Renderers already use it. ClearClef only needs a SMuFL webfont (e.g. Bravura, Leland) if customizing viewer appearance — load it on the viewer route only.

## Parts vs full score

Piano learning usually wants the grand staff. If a file has extra parts, store `default_visible_parts` and pass Verovio options to hide the rest. See [rendering.md](rendering.md).

## Related docs

- [ingest.md](ingest.md) — validation and metadata
- [rendering.md](rendering.md) — Verovio
- [decisions.md](decisions.md) — ADR-001
