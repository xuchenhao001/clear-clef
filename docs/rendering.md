# Rendering

ClearClef is a **viewer** catalog, not an in-browser editor. Engraving happens in the browser with Verovio; catalog pages stay free of WASM.

## Library choice

| Library | Best for | Tradeoff |
| --- | --- | --- |
| **[Verovio](https://www.verovio.org)** (`verovio` npm, C++ → WASM) | Engraving quality; MusicXML, ABC, MEI, Humdrum; SVG | Large WASM (~several MB) — load only on score pages |
| **[OpenSheetMusicDisplay](https://opensheetmusicdisplay.github.io)** | MusicXML-only, simpler TS API, no WASM | Weaker engraving |

**Default: Verovio.** OSMD is the documented fallback if WASM bundling on OpenNext / Next becomes painful.

Both are viewers, not editors. Full editing is a different product (Flat.io, MuseScore Studio, or ABC + abcjs).

## Client-only loading

1. Implement `ScoreViewer` as a Client Component.
2. Load it with `next/dynamic(..., { ssr: false })` from the score detail page.
3. Prefer ESM + modular WASM:

```ts
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";

const module = await createVerovioModule();
const tk = new VerovioToolkit(module);
```

4. For `.mxl`: `fetch` → `arrayBuffer` → `tk.loadZipDataBuffer(buffer)`.
5. For uncompressed MusicXML: `tk.loadData(xmlString)`.
6. Render **per page**: `tk.renderToSVG(pageNumber)`; lazy-load as the user scrolls.
7. Pass options to honor `default_visible_parts` when files contain extra staves.

**Do not** import Verovio on list pages or into shared Server Component trees.

## Serving score bytes

App route streams the object from R2 (authenticated to the bucket; public read of the HTTP route is fine for public scores). Viewer never needs Worker-side WASM for full-score engraving.

## Previews (catalog cards)

- Generate **page-1 SVG** once at ingest (admin browser with Verovio, or a one-off Worker job).
- Store as `scores/{id}/preview.svg` in R2.
- List cards use the static preview URL — **do not** engrave the full score on the server per request (WASM CPU + Worker limits).

## Fonts

Load one SMuFL webfont (e.g. Bravura) on the **viewer route only**, not globally.

## Accessibility

- Expose title and composer as real HTML on the detail page.
- Wrap the SVG viewer with appropriate `aria` (e.g. labeled region). Screen readers do **not** read Verovio SVG as music.
- Paginate / virtualize; do not dump a giant single SVG into the DOM.

## Caching engraved assets

Preview and immutable score objects: long-lived `Cache-Control` (see [architecture.md](architecture.md)). HTML detail pages remain short-cached so metadata updates show up after revalidation.

## Related docs

- [architecture.md](architecture.md)
- [ingest.md](ingest.md)
- [decisions.md](decisions.md) — ADR-002, ADR-005
