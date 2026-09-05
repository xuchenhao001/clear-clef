# ClearClef design system

Visual reference for ClearClef's public catalog and viewer. Token structure is inspired by editorial product systems (quiet paper, ink CTAs, light display type). Components and surfaces are specific to a **music edition catalog**, not a generic SaaS marketing site.

**Dials:** `DESIGN_VARIANCE: 6` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 3`

**Canonical catalog layout:** composer-grouped **contents list** (see [Catalog index](#catalog-index)). Production `/` restyle is a follow-up.

## Overview

ClearClef reads like a small music publisher's desk: warm stone paper, engraved notation as incipit thumbnails, title-page typography for work identity, and Geist for product chrome.

**Key characteristics:**

- Off-white stone canvas `{colors.canvas}` (#f5f5f5), warm near-black ink `{colors.ink}` (#0c0a09).
- No saturated CTA color. Primary action is an ink pill at `{rounded.pill}`.
- Display runs **Newsreader** at weight 300 (optical size ~72 for heroes). Never bold display headlines.
- UI runs **Geist** at 400/500. Score metadata runs **Geist Mono**.
- Engraved preview SVG appears as a small incipit thumbnail on catalog rows (desktop). No decorative stave backgrounds in chrome.
- Soft pill geometry for CTAs; hairline dividers for catalog rows.
- Generous section rhythm (~96px between major bands).

## Colors

### Brand and action

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.primary}` | #292524 | Ink pill background (primary CTA). Used scarcely. |
| `{colors.primary-active}` | #0c0a09 | Press state. |

### Surface

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.canvas}` | #f5f5f5 | Page floor. Public catalog default. |
| `{colors.canvas-soft}` | #fafafa | Subtle alternating band (optional). |
| `{colors.surface-card}` | #ffffff | Score plates, viewer page, form inputs. |
| `{colors.surface-strong}` | #f0efed | Disabled plates, tag backgrounds. |

### Hairlines

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.hairline}` | #e7e5e4 | Default 1px divider, card outline. |
| `{colors.hairline-soft}` | #f0efed | Lighter divider. |
| `{colors.hairline-strong}` | #d6d3d1 | Input borders, stronger panel outline. |

### Text

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.ink}` | #0c0a09 | Display, primary text. |
| `{colors.body}` | #4e4e4e | Running text. |
| `{colors.body-strong}` | #292524 | Emphasis. |
| `{colors.muted}` | #777169 | Composer line, sub-titles. |
| `{colors.muted-soft}` | #a8a29e | Disabled, helper text. |
| `{colors.on-primary}` | #ffffff | Text on ink pill. |

### Semantic

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.semantic-success}` | #16a34a | Confirmation. |
| `{colors.semantic-error}` | #dc2626 | Validation errors. |

### Dark mode (optional)

Public catalog is **light-first** (print on paper). If dark mode is kept, treat it as a lamp on a music stand: deep ink canvas, but the **engraved page stays white**. Do not grey-wash or invert Verovio SVG fills.

## Typography

### Font families

| Role | Family | License | Load |
| --- | --- | --- | --- |
| Display | Newsreader 300 | SIL OFL | `next/font/google` |
| UI / body | Geist 400/500 | OFL | Already in root layout |
| Metadata | Geist Mono | OFL | Already in root layout |

**Do not** use Waldenburg, Playfair Display, Fraunces, Instrument Serif, or EB Garamond as defaults. **Never** set nav, buttons, filters, or admin forms in the display serif.

### Hierarchy

| Token | Size | Weight | Line height | Letter spacing | Font | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `{typography.display-xl}` | 48px | 300 | 1.08 | -0.96px | Newsreader | Catalog H1 |
| `{typography.display-lg}` | 36px | 300 | 1.17 | -0.36px | Newsreader | Section heads |
| `{typography.display-md}` | 32px | 300 | 1.13 | -0.32px | Newsreader | Score title (detail) |
| `{typography.display-sm}` | 24px | 300 | 1.2 | 0 | Newsreader | Card work titles |
| `{typography.title-md}` | 20px | 500 | 1.35 | 0 | Geist | Component titles |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0.16px | Geist | Body |
| `{typography.body-sm}` | 15px | 400 | 1.47 | 0.15px | Geist | Footer, captions |
| `{typography.caption-mono}` | 12px | 400 | 1.5 | 0 | Geist Mono | Catalog line, colophon |
| `{typography.button}` | 15px | 500 | 1.0 | 0 | Geist | CTA pill |
| `{typography.nav-link}` | 15px | 500 | 1.4 | 0 | Geist | Top nav |

Use `font-variation-settings: "opsz" 72, "wght" 300` (or 48 for smaller display) on Newsreader at large sizes.

### Title page stack

Score identity on catalog rows and detail pages:

1. **Composer** - Geist, `{typography.body-sm}`, `{colors.muted}`
2. **Work title** - Newsreader 300, `{typography.display-sm}` or `{typography.display-md}`
3. **Catalog line** - Geist Mono, `{typography.caption-mono}` (e.g. `BWV 846 · C major · 4/4`)

Detail pages lead **composer then title**, like a printed edition title page.

## Layout

### Spacing

- Base unit: 4px.
- Tokens: `{spacing.xs}` 8px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.section}` 96px.
- Catalog content max width: ~1200px (`max-w-[1200px]`).
- Public catalog index is a **contents list**: composer sections, hairline-divided rows, optional incipit at desktop right.

### Catalog index

The public index is a publisher-style **contents list**, not a card grid.

| Element | Treatment |
| --- | --- |
| Composer section | Newsreader `{typography.display-lg}`, grouped works underneath |
| Row | Work title (Newsreader `{typography.display-sm}`), Geist Mono catalog line, Geist body for difficulty and musical tags |
| Divider | `border-y` + `divide-y` on `{colors.hairline}`; no card boxes per row |
| Incipit | Small page-1 preview thumbnail at row right on `sm+`; hidden on narrow mobile |
| Filters | Quiet `filter-bar` above the list; not a heavy bordered panel |

**Rejected for catalog index:** 2-up score plate grid, three equal marketplace cards, SaaS hero with gradient blobs, trust logo strips in the hero.

## Elevation and depth

| Level | Treatment | Use |
| --- | --- | --- |
| Flat canvas | `{colors.canvas}` | Body, nav, footer bands |
| Card / plate | `{colors.surface-card}` + 1px `{colors.hairline}` | Viewer page, incipit thumbnail frame |
| Row hover | Subtle background tint or ink text shift only | Contents list rows (no card shadow) |

No pastel gradient orbs. No neon glow. The engraved SVG provides atmospheric depth.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.xl}` | 16px | Viewer shell, incipit frame |
| `{rounded.pill}` | 9999px | CTAs, tag pills (musical tags only) |

## Components

### `top-nav`

Background `{colors.canvas}`, height 64px. Geist wordmark left; catalog label optional; Admin as text link right. No decorative clef in the header.

Maps to: [`components/site-header.tsx`](../components/site-header.tsx)

### `catalog-hero`

Left-aligned Newsreader H1 ("Score catalog") + one Geist sentence (max ~20 words). No eyebrow, no CTA strip, no trust logos in the hero band.

### `filter-bar`

Quiet row: key, difficulty, license, tag. Labels above selects. No heavy bordered panel. Maps to: [`components/catalog/catalog-filters.tsx`](../components/catalog/catalog-filters.tsx)

### `contents-list`

Composer-grouped catalog index. Section head in Newsreader `{typography.display-lg}`. Each row: Newsreader work title, Geist Mono catalog line, Geist body for difficulty and tags. Hairline dividers between rows. Small page-1 incipit thumbnail at desktop right (from R2 preview URL in production).

Maps to: [`app/(site)/page.tsx`](../app/(site)/page.tsx) (restyle target)

### `contents-row`

Single row inside `contents-list`. No card wrapper. Clickable row spans title block and optional incipit.

### `title-page` (detail)

Composer line, Newsreader work title, metadata dl (key, time, difficulty) in Geist. Musical tag pills only. License **not** pill-styled here.

Maps to: [`app/(site)/scores/[slug]/page.tsx`](../app/(site)/scores/[slug]/page.tsx)

### `colophon`

Footer block on score detail. Geist Mono rights line: license (required), source URL if present. Reads like an ISMN / plate mark, not a badge cluster.

### `viewer-stand`

Stone canvas around a white engraved page. Top bar: page index in Geist Mono (`3 / 12`). Previous / Next as outline pills. Loading: "Preparing the score." Skeleton matches page rectangle.

Maps to: [`components/score/ScoreViewer.tsx`](../components/score/ScoreViewer.tsx)

### `button-primary`

Ink pill. Background `{colors.primary}`, text `{colors.on-primary}`, `{rounded.pill}`, height 40px, padding 10px × 20px.

### `button-outline`

Transparent pill, 1px `{colors.hairline-strong}` border, ink text.

### `admin-shell`

Back-of-house. Clear forms, required license field. Do not apply display serif or edition ornament to admin upload surfaces.

## Do's and don'ts

### Do

- Reserve `{colors.primary}` for primary CTAs only.
- Use Newsreader 300 for every display headline. Never bold display copy.
- Use Geist Mono for catalog numbers, key, time signature, license colophon.
- Group the catalog index by composer with hairline-divided contents rows.
- Show page-1 preview as a small incipit thumbnail on catalog rows (desktop).
- Use pill shape for CTAs and musical tag pills.
- Keep copy in edition voice: "Public catalog of licensed scores."

### Don't

- Don't add pastel gradient orbs, decorative clefs, or stave backgrounds in chrome.
- Don't use card grids or score plate tiles on the catalog index.
- Don't pill the license next to the work title.
- Don't bold display headlines or mix a second serif for emphasis.
- Don't use marketing filler ("discover", "elevate", "seamless").
- Don't invert or grey-wash engraved SVG in dark mode.
- Don't load Verovio on catalog list pages (see [rendering.md](rendering.md)).

## Responsive behavior

| Breakpoint | Key changes |
| --- | --- |
| Mobile (< 640px) | Contents rows stack; incipit hidden; filters wrap |
| Tablet (640-1024px) | Incipit visible; nav stays single line |
| Desktop (> 1024px) | Full contents list with incipit column; max width 1200px |

Touch targets: primary pill 40px height minimum.

## CSS variable mapping (future restyle)

When applying tokens to [`app/globals.css`](../app/globals.css), prefer semantic names alongside shadcn internals:

```css
:root {
  --color-canvas: #f5f5f5;
  --color-ink: #0c0a09;
  --color-hairline: #e7e5e4;
  --font-display: var(--font-newsreader);
}
```

Do not rewrite shadcn `--primary` until a dedicated restyle PR. Map edition tokens in a separate layer first.

## Known gaps

- Production `/` not yet restyled to contents list.
- Newsreader not yet loaded in root layout.
- Motion timings (row hover, page turn) out of scope for v1 reference.
- SMuFL webfont on viewer route is optional later ([rendering.md](rendering.md)).
- Form validation states beyond focus not fully specified.

## Provenance

- Editorial token rhythm (ink pill, hairline cards, 96px sections) adapted from external editorial product references.
- ClearClef-specific: Newsreader + Geist stack, no atmospheric orbs, contents-list catalog, engraved SVG as incipit thumbnail.
- Layout decision: contents list chosen over score plate grid.
