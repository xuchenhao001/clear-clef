# ClearClef design system

Visual reference for ClearClef's public catalog, viewer, and admin. **Archive finding-aid register**: a bound index volume. Aged paper leaves, leather boards, rust rubric, Cormorant Garamond display over EB Garamond text, Public Sans chrome, marbled endpaper for the two pages with no score to show. **Notation stays ink on white paper** in every mode.

**Dials:** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 4`

**Canonical catalog layout:** credit-grouped **contents list** with **extent lines** per credit (see [Catalog index](#catalog-index)).

## Overview

ClearClef reads like a bound finding aid: the shell is the book's leather binding, each page a paper leaf, and the two pages with no score to show are the marbled endpaper with a pasted bookplate. Credit headings and running heads are **real small capitals**, work counts are old-style figures, shelf marks read as printed catalogue entries, and the rust **rubric** marks active filters and draws the rule under the catalog title. Page-1 preview thumbnails sit in white mats on desktop. Dark mode is a candlelit library; engraved SVG and viewer/practice pages remain `#ffffff`.

**Key characteristics:**

- Aged paper canvas `{colors.canvas}` (#efe8da), iron-gall ink `{colors.ink}` (#1d1a15), lighter paper cards `{colors.surface-card}` (#f6f0e3). Leather boards `{colors.board}` (#241a14) for the header and footer.
- **Rust rubric** `{colors.locator}` (#8f3418) only for active filter holds, selection accents, and the catalog title rule, not primary CTAs.
- **Cormorant Garamond 600** for the title page, page headings, the score-detail title, and the wordmark. **EB Garamond 400-600** for row titles, credit headings, running heads, extents, shelf marks, and the colophon. **Public Sans** 400/500/600 for nav, filters, buttons, forms, and body. **Geist Mono** only for technical strings (ids, byte sizes, page counters, admin metadata).
- Both serifs are **self-hosted** (`app/fonts/`, subset to Latin) so genuine small capitals (`smcp`/`c2sc`) and ligatures ship; the Google subset stripped them and left Chrome to scale capitals down.
- Never set nav, buttons, filters, or admin forms in a serif.
- Squared controls (`rounded-md`, 8px); hairline dividers; catalog list on a lifted paper leaf with a warm shadow (`shadow-leaf` on plate and filter strip).
- Material system: laid and chain lines with fibre flecks and an ageing vignette on the paper floor, per-leaf corner ageing on each card, pore over an uneven dye lot with a raking sheen on the boards, blind-tooled rules at board seams, an inked rubric rule, a woven ribbon marker, and a marbled endpaper reserved for the empty states.
- Primary CTA remains iron-gall ink on paper text (`{colors.primary}` / `{colors.on-primary}`).

## Colors

### Light theme: Calf binding

**What it is:** A bound volume rather than a screen. The shell is a warm aged-paper leaf; the header and footer are dark calf boards; the catalog plate and filter strip are paper leaves lying on the page, lifted by a warm offset shadow. **Notation stays pure white** (`surface-page`).

| Layer | Token | Role |
| --- | --- | --- |
| Paper floor | `{colors.canvas}` | Aged-paper gutter and hero band |
| Work surface | `{colors.surface-card}` | Lighter paper leaf (filters, list, forms) |
| Insets | `{colors.surface-strong}` | Tags, thumbnail matte |
| Paper | `{colors.surface-page}` | Scores and preview inner only |
| Boards | `{colors.board}` | Header/footer leather, board ink for text |

Hairlines are **warm** (`#cfc3ad` ... `#a99c86`), so rules read as ruling on stock. Iron-gall ink and the rust rubric stay the accent system; the background should feel like **aged paper in a leather binding**, not painted drywall.

### Brand and action

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.primary}` | #1d1a15 | Primary CTA background |
| `{colors.on-primary}` | #f6f0e3 | Text on primary CTA |
| `{colors.locator}` | #8f3418 | Active filter rubric rule and ribbon marker |
| `{colors.on-locator}` | #f6f0e3 | Text on locator fills (if used) |
| `{colors.board}` | #241a14 | Header/footer leather boards |
| `{colors.board-ink}` | #e2d6c4 | Nav and wordmark on boards |
| `{colors.board-muted}` | #a08b73 | Secondary text on boards |
| `{colors.board-line}` | #4a3626 | Blind-tooled rule at board seams |

Dark mode primary: `{colors.primary}` #e9e2d5 on `{colors.on-primary}` #17120e. Locator: #e0916a. Boards: #0f0b08.

### Surface

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.canvas}` | #efe8da | Page floor (aged paper) |
| `{colors.hover}` | `color-mix(ink 8%)` | Row/control hover |
| `{colors.surface-card}` | #f6f0e3 | Filter strip, catalog plate, forms |
| `{colors.surface-strong}` | #e3d9c6 | Tags, preview matte |
| `{colors.surface-page}` | #ffffff | **Notation paper** (viewer, practice, preview inner) |

### Hairlines

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.hairline}` | #cfc3ad | Row/section dividers |
| `{colors.hairline-soft}` | #ded5c3 | Lighter divider |
| `{colors.hairline-strong}` | #a99c86 | Header/footer rules, preview matte frame |

### Text

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.ink}` | #1d1a15 | Primary text |
| `{colors.body}` | #3a352c | Running text (warm near-neutral mids) |
| `{colors.muted}` | #4e483d | Credit lines, subtitles (AA on paper) |
| `{colors.muted-soft}` | #5f574a | Extent lines, helpers (AA 12px on leaf) |
| `{colors.placeholder}` | #4e483d | Placeholders |

### Fields and focus

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.field-border}` | #4e483d | Inputs, outline buttons (≥3:1 on paper) |
| `{colors.focus-ring}` | #1d1a15 | `focus-visible` ring |

### Semantic

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.semantic-success}` | #15803d | Confirmation |
| `{colors.semantic-error}` | #a8321a | Errors |

### Dark mode - candlelit library (locked)

Theme: **System** default; header menu overrides. The paper darkens to a low warm key, boards to near-black leather; **notation surfaces unchanged**.

| Surface | Light | Dark |
| --- | --- | --- |
| Canvas | `{colors.canvas}` | #17120e |
| Cards / filter strip | paper | #1f1811 |
| Text | iron-gall | #e9e2d5 |
| Boards | #241a14 | #0f0b08 |
| Viewer/practice page | **#ffffff** | **#ffffff** |
| Preview inner frame | **#ffffff** | **#ffffff** |
| Verovio SVG | black on white | unchanged |

## Typography

### Font families

| Role | Family | Load |
| --- | --- | --- |
| Display (title page, page headings, detail title, wordmark) | Cormorant Garamond 400-600 | `next/font/local`, self-hosted Latin subset |
| Text (row titles, credit headings, running heads, extents, shelf marks, colophon) | EB Garamond 400-600 | `next/font/local`, self-hosted Latin subset |
| UI / chrome | Public Sans 400-600 | `next/font/google` |
| Technical strings | Geist Mono 400 | `next/font/google` |

**Cormorant Garamond** is a fine-press face with a small x-height, so it wants size: it is the title page, the page headings, the score-detail title, and the wordmark, and it should not be used below roughly 30px. **EB Garamond** carries everything at reading size. Neither goes on nav, filters, buttons, or admin chrome.

Both serifs are self-hosted from `app/fonts/` (subset to Latin, variable weight 400-600) because the Google subset ships without `smcp`/`c2sc`/`dlig`: running heads, credit headings, the imprint, and the colophon previously rendered as capitals Chrome scaled down. With the full fonts they are genuine small capitals and ligatures fire. Extents and counts use **old-style figures** (EB Garamond's default figures). CJK work titles fall through to a system serif (`Songti SC`, `SimSun`, `Noto Serif CJK SC`) since neither serif carries CJK glyphs.

### Hierarchy

| Utility | Size | Weight | Font | Use |
| --- | --- | --- | --- | --- |
| `type-catalog-h1` | 48-60px | 600 | Cormorant | Title page H1 |
| `type-work-title-detail` | 32-40px | 600 | Cormorant | Detail title |
| `type-page-h1` | 36-40px | 600 | Cormorant | Admin, not-found, empty states |
| `type-work-title` | 22px | 600 | EB Garamond | Row title |
| `type-group-label` | 19px | 600 small caps | EB Garamond | Credit heading |
| `type-running-head` | 16px | 600 small caps | EB Garamond | Contents head, colophon |
| `type-extent` | 15px | 400 old-style | EB Garamond | Work count per credit |
| `type-shelf` | 13px | 400 | EB Garamond | Shelf mark line (catalogue entry) |
| `type-imprint` | 12px | 600 small caps | EB Garamond | Bookplate imprint, secondary credits |
| `type-body-md` | 16px | 400 | Public Sans | Body |
| `type-body-sm` | 15px | 400 | Public Sans | Captions |
| `type-caption-mono` | 12px | 400 | Geist Mono | Technical strings, control labels |
| `type-nav-link` | 15px | 500 | Public Sans | Nav links |

## Layout

- Base unit: 4px; max catalog width ~1200px.
- Catalog: centred title page (Cormorant H1, inked rust rubric rule) → paper **filter strip** → paper **contents plate** with a running head, credit groups, and a closing fleuron.
- Section rhythm: ~96px between major page bands on marketing-style pages; catalog uses tighter 32–40px between hero and list.
- Shell: leather board header, paper leaf body, leather board footer colophon. The empty catalog and the 404 swap the body for a marbled endpaper panel with a pasted paper bookplate.

### Catalog index

| Element | Treatment |
| --- | --- |
| Running head | `type-running-head` "Contents" + total, above the groups |
| Credit section | `type-group-label` small caps + `type-extent` old-style count |
| Row | EB Garamond title, `type-shelf` shelf line, tags on `surface-strong` |
| Preview | White inner on `surface-strong` matte; desktop `sm+` |
| Filters | `archive-filter-strip` + `surface-leaf`; active value → `archive-locator-active` (rust rule and woven ribbon marker) |
| Closing mark | Centred fleuron between two rules at the foot of the plate |
| Empty state | `MarbledPanel` endpaper, paper bookplate inside with `type-imprint`, `type-page-h1`, message, and the clear-filters action |

## Elevation & Depth

- Catalog plate and filter strip: `border` + `shadow-leaf` (warm offset shadow, inset top highlight, not glow).
- Boards use `surface-board` (leather pore over a dye blotch, end wear, raking sheen, diagonal falloff) with `rule-tooled` blind-tooled seams.
- Viewer stand: aged-paper section with the notation on a lifted white leaf (`shadow-leaf`); inner page flat `#ffffff`.

## Material system

Utilities in `app/globals.css`:

| Utility | Effect |
| --- | --- |
| `surface-paper` | Paper floor: fibre flecks over fine grain, laid and chain lines, top key light, edge vignette |
| `surface-board` | Leather boards: pore over a low-frequency dye blotch, wear at the ends, a raking sheen, a diagonal falloff |
| `on-board` | Remaps ink/muted/hairline/focus tokens to board values for descendants |
| `surface-leaf` | Paper leaf: fine grain plus four warm corners, so each leaf ages on its own |
| `shadow-leaf` | Warm lifted-leaf shadow with inset top highlight |
| `surface-marbled` | Endpaper ground; veins come from `MarbledPanel` |
| `marble-v1` … `marble-v5` | Endpaper vein strokes, light and dark values |
| `rule-tooled` | Blind-tooled seam: groove line with light catch below |
| `rule-printed` | Printed rule on a leaf: strong hairline with a light catch below |
| `rule-inked` | Rubric rule: speckle over rust, dark bed below, light catch above |

Texture recipes are four inline SVG turbulence data URIs, one per material, so a scanned tile can replace any layer without touching a call site: `--grain-fine` (fine noise), `--flecks` (thresholded sparse specks), `--pore` (leather pore), `--blotch` (low-frequency dye unevenness). They are blended per surface: `multiply` and `soft-light` on paper, `overlay` and `multiply` on boards.

The endpaper (`MarbledPanel`, `components/catalog/marbled-panel.tsx`) is drawn rather than scanned: fine vertical strokes displaced by SVG turbulence, which is how Spanish-wave marbling is made. It is used in exactly two places, the empty catalog and the 404, and never on a page carrying the catalog or an engraving.

## Shapes

- Controls: `rounded-md` (8px). No full pill CTAs.
- Tag pills: `rounded-md`, hairline border.

## Components

Maps unchanged in code; visual vocabulary updated to tokens above.

- `public-shell`, `site-header` — leather board bar, Cormorant uppercase wordmark, `rule-tooled` seam
- `public-shell` footer — board colophon in small caps ("Set in Cormorant Garamond, EB Garamond and Public Sans" / "ClearClef, MMXXVI")
- `catalog-hero` — centred title page: Cormorant H1, inked rust rubric rule, centred standfirst
- `contents-list` / `contents-row` — printed header rule, small-caps running head, credit groups in small caps with old-style counts, `type-shelf` shelf lines, fleuron at the foot
- `marbled-panel` — endpaper for the empty catalog and the 404; a paper bookplate holds the message
- `fleuron` — pen-outline leaf ornament that closes the contents plate
- `catalog-filters-bar` — paper filter strip + rust rubric and woven ribbon on `EditionSelect`
- `viewer-stand` / `practice-stage` — white page invariant; the viewer leaf sits lifted on the aged-paper stand
- `button-primary` / `button-outline` — squared iron-gall ink CTAs
- `admin-shell` — board bar with the Cormorant wordmark; Public Sans for admin chrome

## Do's and don'ts

### Do

- Show work **extent** per credit group.
- Use the rust rubric only for active filter holds and the catalog title rule.
- Keep preview and viewer paper `#ffffff` in every mode.
- Use Cormorant Garamond for display at 30px and above, and EB Garamond for everything at reading size; Public Sans for chrome.
- Use small capitals and old-style figures from the self-hosted serifs rather than uppercase or scaled capitals.
- Keep texture on the floor, the leaves, and the boards, never over an engraved page.
- Keep the marbled endpaper to the empty catalog and the 404, and always put the message on a paper bookplate so contrast holds over the veins.

### Don't

- Don't tint or invert engraved SVG.
- Don't use cream-serif "gentle library" as the only identity cue.
- Don't load Verovio on catalog index routes.
- Don't use pill-shaped primary buttons.
- Don't set anything at reading size in Cormorant, and don't set chrome in a serif.
- Don't put the marbled endpaper on a catalog or viewer page, where it would compete with the notation.
- Don't apply more than two textures in one view; grain stays subtle.

## Motion

`edition-interactive-transition`: 200ms ease on background, border, color. No entry animations. `prefers-reduced-motion`: 0ms.

## CSS

Tokens live in `app/globals.css` as `--edition-*` (historical prefix), plus material utilities (`surface-paper`, `surface-board`, `on-board`, `surface-leaf`, `surface-marbled`, `shadow-leaf`, `rule-tooled`, `rule-printed`, `rule-inked`) and the texture tokens (`--grain-fine`, `--flecks`, `--pore`, `--blotch`). Font tokens: `--font-display` (Cormorant Garamond) and `--font-text` (EB Garamond), both self-hosted from `app/fonts/`. Tailwind: `bg-edition-canvas`, `text-edition-muted`, `border-edition-board-line`, `font-display`, `font-text`, etc.

Machine-readable sidecar: `.impeccable/design.json`.

## Provenance

- Direction: archive finding-aid register (Impeccable seed `e1c00e05`, operate mode).
- Replaces prior stone/Newsreader lamp library identity (2026-10).
- Palette recut (2026-10): "Oxide and Slate" (superseded).
- Recut (2026-10): "Calf binding" - aged-paper leaf (`#efe8da`), leather boards (`#241a14`), iron-gall ink, rust rubric (`#8f3418`); material system (grain, key light, blind tooling, ribbon marker); dark mode a candlelit library (`#17120e`); notation paper unchanged.
- Type recut (2026-10): EB Garamond replaces Spectral (titles, credit headings, running heads, wordmark); old-style figures for counts; small-caps running heads and colophon; centred title-page hero; contents running head and finis.
- Binding recut (2026-10): display/text split (Cormorant Garamond over EB Garamond), both **self-hosted and subset to Latin** so real small capitals and ligatures ship; shelf marks off mono onto `type-shelf`; page headings and the score-detail title move to display; imprint and `type-page-h1` added.
- Material recut (2026-10): laid and chain lines with fibre flecks and per-leaf corner ageing on paper; pore, dye blotch, end wear, and a raking sheen on the boards; printed and inked rules; woven ribbon marker; fleuron closing mark; marbled endpaper drawn with turbulence displacement for the empty catalog and the 404.
