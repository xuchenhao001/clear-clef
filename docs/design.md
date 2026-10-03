# ClearClef design system

Visual reference for ClearClef's public catalog, viewer, and admin. **Archive finding-aid register**: warm parchment reading-room shell, manila work surfaces, Spectral work titles, Public Sans chrome. **Notation stays ink on white paper** in every mode.

**Dials:** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 4`

**Canonical catalog layout:** credit-grouped **contents list** with **extent lines** per credit (see [Catalog index](#catalog-index)).

## Overview

ClearClef reads like a special-collections index: shelf marks in mono, uppercase credit headings, work counts beside each credit, stamp-red **locator** on active catalog filters. Page-1 preview thumbnails sit in white mats on desktop. Dark mode is after-hours reading room; engraved SVG and viewer/practice pages remain `#ffffff`.

**Key characteristics:**

- Parchment canvas `{colors.canvas}` (#f1ece4, Seamless), forest ink `{colors.ink}` (#121a15), manila cards `{colors.surface-card}` (#f6f1e6).
- **Stamp red** `{colors.locator}` (#9f1239) only for active filter holds and selection accents—not primary CTAs.
- **Spectral 600** for catalog H1 and work titles. **Public Sans** 400/500/600 for nav, filters, labels, body. **Geist Mono** for metadata and wordmark.
- Never set nav, buttons, filters, or admin forms in Spectral.
- Squared controls (`rounded-md`, 8px); hairline dividers; catalog list on manila plate with medium shadow (`shadow-md` on plate and filter strip).
- Primary CTA remains forest ink on manila text (`{colors.primary}` / `{colors.on-primary}`).

## Colors

### Light theme: Unified parchment

**What it is:** One warm paper family for the whole reading room—floor, filter strip, catalog plate, tags, and preview matte—instead of a tinted “wall” (e.g. sage or mint) behind cream “furniture.” Elevation comes from **slightly lighter cards**, **warm hairlines**, and **shadow** on plates; **notation stays pure white** (`surface-page`).

| Layer | Token | Role |
| --- | --- | --- |
| Floor | `{colors.canvas}` | Parchment gutter and hero band (Seamless: near card tone; shadow lifts plates) |
| Work surface | `{colors.surface-card}` | Manila plate (filters, list, forms) |
| Insets | `{colors.surface-strong}` | Tags, thumbnail matte |
| Paper | `{colors.surface-page}` | Scores and preview inner only |

Hairlines are **warm** (`#d4ccc2` … `#b5a99c`), not gray-green, so rules match the stock. Forest ink and stamp-red locator stay the accent system; the background should feel like **folder stock**, not painted drywall.

### Brand and action

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.primary}` | #121a15 | Primary CTA background |
| `{colors.on-primary}` | #f6f1e6 | Text on primary CTA |
| `{colors.locator}` | #9f1239 | Active catalog filter locator ring/border |
| `{colors.on-locator}` | #ffffff | Text on locator fills (if used) |

Dark mode primary: `{colors.primary}` #e8ebe9 on `{colors.on-primary}` #121816. Locator: #fb7185.

### Surface

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.canvas}` | #f1ece4 | Page floor (Unified parchment — Seamless) |
| `{colors.hover}` | `color-mix(ink 8%)` | Row/control hover |
| `{colors.surface-card}` | #f6f1e6 | Filter strip, catalog plate, forms |
| `{colors.surface-strong}` | #e5dccf | Tags, preview matte |
| `{colors.surface-page}` | #ffffff | **Notation paper** (viewer, practice, preview inner) |

### Hairlines

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.hairline}` | #d4ccc2 | Row/section dividers |
| `{colors.hairline-soft}` | #e5ddd4 | Lighter divider |
| `{colors.hairline-strong}` | #b5a99c | Header/footer rules, preview matte frame |

### Text

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.ink}` | #121a15 | Primary text |
| `{colors.body}` | #3a3835 | Running text (warm near-neutral mids) |
| `{colors.muted}` | #4d4a46 | Credit lines, subtitles (AA on canvas/card) |
| `{colors.muted-soft}` | #5f5b56 | Extent lines, helpers (AA 12px on plate) |
| `{colors.placeholder}` | #4a4744 | Placeholders |

### Fields and focus

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.field-border}` | #4a4744 | Inputs, outline buttons (≥3:1 on white/manila) |
| `{colors.focus-ring}` | #121a15 | `focus-visible` ring |

### Semantic

| Token | Hex (light) | Use |
| --- | --- | --- |
| `{colors.semantic-success}` | #15803d | Confirmation |
| `{colors.semantic-error}` | #b91c1c | Errors |

### Dark mode — reading room (locked)

Theme: **System** default; header menu overrides. Chrome darkens; **notation surfaces unchanged**.

| Surface | Light | Dark |
| --- | --- | --- |
| Canvas | `{colors.canvas}` | #121816 |
| Cards / filter strip | manila | #1c211e |
| Text | forest ink | #e8ebe9 |
| Viewer/practice page | **#ffffff** | **#ffffff** |
| Preview inner frame | **#ffffff** | **#ffffff** |
| Verovio SVG | black on white | unchanged |

## Typography

### Font families

| Role | Family | Load |
| --- | --- | --- |
| Display (work titles) | Spectral 600 | `next/font/google` in root layout |
| UI / chrome | Public Sans 400–600 | Root layout |
| Metadata / wordmark | Geist Mono 400 | Root layout |

**Spectral only** on catalog H1, row work titles, and score-detail work title. **Never** on nav, filters, buttons, group labels (uppercase Public Sans), or admin.

### Hierarchy

| Utility | Size | Weight | Font | Use |
| --- | --- | --- | --- | --- |
| `type-catalog-h1` | 40–44px | 600 | Spectral | Catalog H1 |
| `type-work-title` | 22px | 600 | Spectral | Row title |
| `type-work-title-detail` | 28–32px | 600 | Spectral | Detail title |
| `type-page-h1` | 32–36px | 500 | Public Sans | Admin, empty states |
| `type-group-label` | 14px | 600 uppercase | Public Sans | Credit heading |
| `type-extent` | 12px | 400 | Geist Mono | Work count per credit |
| `type-body-md` | 16px | 400 | Public Sans | Body |
| `type-body-sm` | 15px | 400 | Public Sans | Captions |
| `type-caption-mono` | 12px | 400 | Geist Mono | Shelf mark line |
| `type-nav-link` | 15px | 500 | Public Sans | Nav links |

## Layout

- Base unit: 4px; max catalog width ~1200px.
- Catalog: hero → manila **filter strip** → manila **contents plate** with credit sections.
- Section rhythm: ~96px between major page bands on marketing-style pages; catalog uses tighter 32–40px between hero and list.

### Catalog index

| Element | Treatment |
| --- | --- |
| Credit section | `type-group-label` + `type-extent` (“N works”) |
| Row | Spectral title, mono shelf line, tags on `surface-strong` |
| Preview | White inner on `surface-strong` matte; desktop `sm+` |
| Filters | `archive-filter-strip`; active value → `archive-locator-active` |

## Elevation & Depth

- Catalog plate and filter strip: `border` + `shadow-md` (offset shadow, not glow).
- Viewer stand: border + canvas shell; inner page flat white.

## Shapes

- Controls: `rounded-md` (8px). No full pill CTAs.
- Tag pills: `rounded-md`, hairline border.

## Components

Maps unchanged in code; visual vocabulary updated to tokens above.

- `public-shell`, `site-header` — manila header bar, mono uppercase wordmark
- `contents-list` / `contents-row` — extent lines, manila plate
- `catalog-filters-bar` — filter strip + locator state on `EditionSelect`
- `viewer-stand` / `practice-stage` — white page invariant
- `button-primary` / `button-outline` — squared forest ink CTAs
- `admin-shell` — Public Sans throughout; no Spectral

## Do's and don'ts

### Do

- Show work **extent** per credit group.
- Use locator red only for active filter holds.
- Keep preview and viewer paper `#ffffff` in dark mode.
- Use Spectral for work titles only; Public Sans for chrome.

### Don't

- Don't tint or invert engraved SVG.
- Don't use cream-serif “gentle library” as the only identity cue.
- Don't load Verovio on catalog index routes.
- Don't use pill-shaped primary buttons.

## Motion

`edition-interactive-transition`: 200ms ease on background, border, color. No entry animations. `prefers-reduced-motion`: 0ms.

## CSS

Tokens live in `app/globals.css` as `--edition-*` (historical prefix). Tailwind: `bg-edition-canvas`, `text-edition-muted`, `border-edition-locator`, `font-display`, etc.

Machine-readable sidecar: `.impeccable/design.json`.

## Provenance

- Direction: archive finding-aid register (Impeccable seed `e1c00e05`, operate mode).
- Replaces prior stone/Newsreader lamp library identity (2026-10).
- Light-theme recut (2026-10): unified warm parchment (Seamless floor `#f1ece4`), manila cards, warm hairlines, forest ink; dark mode unchanged.
