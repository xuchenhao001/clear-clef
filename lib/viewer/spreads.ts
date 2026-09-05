export const SPREAD_BREAKPOINT_PX = 1280;

export type LayoutMode = "single" | "spread";

export function layoutModeForWidth(widthPx: number): LayoutMode {
  return widthPx >= SPREAD_BREAKPOINT_PX ? "spread" : "single";
}

/** First page index of the spread that contains `currentPage`. */
export function spreadStartPage(currentPage: number): number {
  if (currentPage <= 1) {
    return 1;
  }
  return currentPage % 2 === 0 ? currentPage - 1 : currentPage;
}

/** Page numbers visible in the current view (1 or 2 pages). */
export function pagesInView(
  currentPage: number,
  pageCount: number,
  mode: LayoutMode,
): number[] {
  if (pageCount < 1) {
    return [1];
  }
  if (mode === "single") {
    return [Math.min(Math.max(1, currentPage), pageCount)];
  }
  const start = spreadStartPage(currentPage);
  const pages = [start];
  if (start + 1 <= pageCount) {
    pages.push(start + 1);
  }
  return pages;
}

export function stepPage(
  currentPage: number,
  pageCount: number,
  mode: LayoutMode,
  direction: "prev" | "next",
): number {
  if (pageCount < 1) {
    return 1;
  }
  if (mode === "single") {
    if (direction === "prev") {
      return Math.max(1, currentPage - 1);
    }
    return Math.min(pageCount, currentPage + 1);
  }
  const start = spreadStartPage(currentPage);
  if (direction === "prev") {
    return Math.max(1, start - 2);
  }
  const nextStart = start + 2;
  if (nextStart > pageCount) {
    return start;
  }
  return nextStart;
}

export function formatPageLabel(pages: number[], pageCount: number): string {
  const total = Math.max(1, pageCount);
  if (pages.length === 1) {
    return `${pages[0]} / ${total}`;
  }
  return `${pages[0]}-${pages[pages.length - 1]} / ${total}`;
}

export function canStepPrev(currentPage: number, mode: LayoutMode): boolean {
  if (mode === "single") {
    return currentPage > 1;
  }
  return spreadStartPage(currentPage) > 1;
}

export function canStepNext(
  currentPage: number,
  pageCount: number,
  mode: LayoutMode,
): boolean {
  if (pageCount < 1) {
    return false;
  }
  if (mode === "single") {
    return currentPage < pageCount;
  }
  const start = spreadStartPage(currentPage);
  return start + 2 <= pageCount;
}
