/** Fixed options for ingest page-1 preview thumbnails (do not reflow). */
export const VEROVIO_PREVIEW_OPTIONS = {
  scale: 40,
  footer: "none",
  header: "none",
} as const;

export const VEROVIO_SCALE = 40;

/** Base viewer options; page dimensions are set per layout mode. */
export const VEROVIO_VIEWER_BASE_OPTIONS = {
  scale: VEROVIO_SCALE,
  footer: "none",
  header: "none",
  breaks: "auto",
} as const;

/**
 * Map a CSS pixel slot to Verovio page dimensions.
 * Verovio: rendered width ≈ pageWidth * scale / 100
 */
export function pageSizeFromSlot(
  widthPx: number,
  heightPx: number,
  scale = VEROVIO_SCALE,
): { pageWidth: number; pageHeight: number; scale: number } {
  const pageWidth = Math.max(100, Math.round((widthPx * 100) / scale));
  const pageHeight = Math.max(100, Math.round((heightPx * 100) / scale));
  return { pageWidth, pageHeight, scale };
}

function pageWidthFromSlot(widthPx: number, scale = VEROVIO_SCALE): number {
  return Math.max(100, Math.round((widthPx * 100) / scale));
}

/** Embedded detail viewer: reflow on width only; height follows content. */
export function embeddedLayoutOptions(widthPx: number) {
  return {
    ...VEROVIO_VIEWER_BASE_OPTIONS,
    pageWidth: pageWidthFromSlot(widthPx),
    adjustPageHeight: true,
    scale: VEROVIO_SCALE,
  };
}

/** Practice overlay: fill a fixed viewport slot (width + height). */
export function practiceLayoutOptions(widthPx: number, heightPx: number) {
  const { pageWidth, pageHeight, scale } = pageSizeFromSlot(widthPx, heightPx);
  return {
    ...VEROVIO_VIEWER_BASE_OPTIONS,
    pageWidth,
    pageHeight,
    adjustPageHeight: false,
    scale,
  };
}
