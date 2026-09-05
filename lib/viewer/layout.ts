import {
  embeddedLayoutOptions,
  practiceLayoutOptions,
} from "@/lib/verovio/options";
import { restorePageFromElement } from "@/lib/viewer/position";
import type { VerovioToolkitLike } from "@/lib/viewer/types";

function layoutResult(
  toolkit: VerovioToolkitLike,
  restoreXmlId: string | null,
): { pageCount: number; page: number } {
  toolkit.redoLayout();
  const pageCount = toolkit.getPageCount();
  const page = restorePageFromElement(toolkit, restoreXmlId, 1);
  return {
    pageCount,
    page: Math.min(Math.max(1, page), pageCount),
  };
}

export function applyEmbeddedLayout(
  toolkit: VerovioToolkitLike,
  widthPx: number,
  restoreXmlId: string | null,
): { pageCount: number; page: number } {
  toolkit.setOptions(embeddedLayoutOptions(widthPx));
  return layoutResult(toolkit, restoreXmlId);
}

export function applyPracticeLayout(
  toolkit: VerovioToolkitLike,
  widthPx: number,
  heightPx: number,
  restoreXmlId: string | null,
): { pageCount: number; page: number } {
  toolkit.setOptions(practiceLayoutOptions(widthPx, heightPx));
  return layoutResult(toolkit, restoreXmlId);
}

/** @deprecated Use applyEmbeddedLayout or applyPracticeLayout */
export function applyVerovioLayout(
  toolkit: VerovioToolkitLike,
  widthPx: number,
  heightPx: number,
  restoreXmlId: string | null,
): { pageCount: number; page: number } {
  return applyPracticeLayout(toolkit, widthPx, heightPx, restoreXmlId);
}

export const LAYOUT_DEBOUNCE_MS = 150;
