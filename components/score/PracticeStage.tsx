
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { PracticeSpread } from "@/components/score/PracticeSpread";
import { pageTurnFromKeyboard, shouldIgnoreKeyboardTarget } from "@/lib/viewer/keyboard";
import { shouldReflowLayout, type LayoutSize } from "@/lib/viewer/layout-guard";
import { applyPracticeLayout, LAYOUT_DEBOUNCE_MS } from "@/lib/viewer/layout";
import { extractFirstXmlId } from "@/lib/viewer/position";
import { sanitizeVerovioSvg } from "@/lib/viewer/sanitize-svg";
import {
  canStepNext,
  canStepPrev,
  formatPageLabel,
  layoutModeForWidth,
  pagesInView,
  stepPage,
  type LayoutMode,
} from "@/lib/viewer/spreads";
import type { VerovioToolkitLike } from "@/lib/viewer/types";

const CHROME_HEIGHT_PX = 56;
const SWIPE_THRESHOLD_PX = 48;
const TAP_MOVE_MAX_PX = 12;
const CHROME_HIDE_MS = 2000;
const TAP_LEFT_MAX = 0.3;
const TAP_RIGHT_MIN = 0.7;
const HISTORY_STATE_KEY = "clear-clef-practice";

type PracticeStageProps = {
  open: boolean;
  onClose: (xmlId: string | null) => void;
  toolkit: VerovioToolkitLike;
  title: string;
  initialXmlId: string | null;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function PracticeStage({
  open,
  onClose,
  toolkit,
  title,
  initialXmlId,
  returnFocusRef,
}: PracticeStageProps) {
  const dialogId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const svgCacheRef = useRef(new Map<number, string>());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const historyPushedRef = useRef(false);
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chromeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const positionXmlIdRef = useRef<string | null>(null);
  const lastLayoutSizeRef = useRef<LayoutSize | null>(null);
  const currentPageRef = useRef(1);
  const pageCountRef = useRef(1);
  const layoutModeRef = useRef<LayoutMode>("single");
  const initialXmlIdRef = useRef(initialXmlId);

  const [mounted] = useState(() => typeof document !== "undefined");
  const [pageCount, setPageCount] = useState(() => toolkit.getPageCount());
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("single");
  const [chromeVisible, setChromeVisible] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [svgs, setSvgs] = useState<string[]>([]);

  const reducedMotion = useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    currentPageRef.current = currentPage;
    pageCountRef.current = pageCount;
    layoutModeRef.current = layoutMode;
  }, [currentPage, pageCount, layoutMode]);

  useEffect(() => {
    initialXmlIdRef.current = initialXmlId;
  }, [initialXmlId]);

  const invalidateCache = useCallback(() => {
    svgCacheRef.current.clear();
  }, []);

  const renderPageSvg = useCallback(
    (page: number) => {
      const cache = svgCacheRef.current;
      if (!cache.has(page)) {
        cache.set(page, sanitizeVerovioSvg(toolkit.renderToSVG(page)));
      }
      return cache.get(page) ?? "";
    },
    [toolkit],
  );

  const refreshSvgs = useCallback(
    (page: number, mode: LayoutMode, total: number) => {
      const visible = pagesInView(page, total, mode);
      const rendered = visible.map((p) => renderPageSvg(p));
      setSvgs(rendered);
      positionXmlIdRef.current = extractFirstXmlId(rendered[0] ?? "");
    },
    [renderPageSvg],
  );

  const runLayout = useCallback(
    (restoreXmlId: string | null, force = false) => {
      const stage = stageRef.current;
      const slot = slotRef.current;
      if (!stage || !slot) {
        return;
      }

      const stageWidth = stage.clientWidth;
      const mode = layoutModeForWidth(stageWidth);
      const slotWidth =
        mode === "spread"
          ? Math.max(100, (slot.clientWidth - 8) / 2)
          : slot.clientWidth;
      const slotHeight = Math.max(100, slot.clientHeight);
      const nextSize: LayoutSize = { width: slotWidth, height: slotHeight };

      if (
        !force &&
        !shouldReflowLayout(lastLayoutSizeRef.current, nextSize, "practice")
      ) {
        return;
      }

      lastLayoutSizeRef.current = nextSize;
      setLayoutMode(mode);
      invalidateCache();
      const { pageCount: nextCount, page } = applyPracticeLayout(
        toolkit,
        slotWidth,
        slotHeight,
        restoreXmlId,
      );
      setPageCount(nextCount);
      setCurrentPage(page);
      refreshSvgs(page, mode, nextCount);
    },
    [toolkit, invalidateCache, refreshSvgs],
  );

  const scheduleLayout = useCallback(
    (restoreXmlId: string | null) => {
      if (layoutTimerRef.current) {
        clearTimeout(layoutTimerRef.current);
      }
      layoutTimerRef.current = setTimeout(() => {
        runLayout(restoreXmlId);
      }, LAYOUT_DEBOUNCE_MS);
    },
    [runLayout],
  );

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    if (chromeTimerRef.current) {
      clearTimeout(chromeTimerRef.current);
    }
    if (!reducedMotion) {
      chromeTimerRef.current = setTimeout(() => {
        setChromeVisible(false);
      }, CHROME_HIDE_MS);
    }
  }, [reducedMotion]);

  const finishClose = useCallback(
    (xmlId: string | null) => {
      onClose(xmlId);
    },
    [onClose],
  );

  const handleClose = useCallback(() => {
    const xmlId = positionXmlIdRef.current;
    historyPushedRef.current = false;
    finishClose(xmlId);
    window.history.back();
  }, [finishClose]);

  const turn = useCallback(
    (direction: "prev" | "next" | "first" | "last") => {
      let next = currentPageRef.current;
      const total = pageCountRef.current;
      const mode = layoutModeRef.current;
      if (direction === "first") {
        next = 1;
      } else if (direction === "last") {
        next = total;
      } else if (direction === "prev") {
        next = stepPage(next, total, mode, "prev");
      } else {
        next = stepPage(next, total, mode, "next");
      }
      setCurrentPage(next);
      refreshSvgs(next, mode, total);
      showChrome();
    },
    [refreshSvgs, showChrome],
  );

  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleStagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId) {
      return;
    }
    const delta = event.clientX - start.x;
    if (!reducedMotion) {
      setDragOffset(delta);
    }
  };

  const handleStagePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    pointerStartRef.current = null;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const distance = Math.hypot(deltaX, deltaY);

    setDragOffset(0);

    if (distance < TAP_MOVE_MAX_PX) {
      const ratio = event.clientX / event.currentTarget.clientWidth;
      if (ratio < TAP_LEFT_MAX) {
        turn("prev");
        return;
      }
      if (ratio > TAP_RIGHT_MIN) {
        turn("next");
        return;
      }
      setChromeVisible((visible) => !visible);
      showChrome();
      return;
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        turn("next");
      } else {
        turn("prev");
      }
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    historyPushedRef.current = true;
    window.history.pushState({ [HISTORY_STATE_KEY]: true }, "");

    const onPopState = () => {
      if (!historyPushedRef.current) {
        return;
      }
      historyPushedRef.current = false;
      finishClose(positionXmlIdRef.current);
    };
    window.addEventListener("popstate", onPopState);

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Unsupported or denied
      }
    }
    void requestWakeLock();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      } else {
        wakeLockRef.current?.release().catch(() => undefined);
        wakeLockRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
      if (chromeTimerRef.current) {
        clearTimeout(chromeTimerRef.current);
      }
    };
  }, [open, finishClose]);

  useEffect(() => {
    if (!open) {
      lastLayoutSizeRef.current = null;
      return;
    }

    positionXmlIdRef.current = initialXmlIdRef.current;
    requestAnimationFrame(() => {
      runLayout(initialXmlIdRef.current, true);
      dialogRef.current?.focus();
      showChrome();
    });
  }, [open, runLayout, showChrome]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {
        width: stage.clientWidth,
        height: stage.clientHeight,
      };
      const mode = layoutModeForWidth(width);
      const slotWidth =
        mode === "spread" ? Math.max(100, (width - 8) / 2) : width;
      const nextSize: LayoutSize = {
        width: Math.max(100, slotWidth),
        height: Math.max(100, height),
      };
      if (!shouldReflowLayout(lastLayoutSizeRef.current, nextSize, "practice")) {
        return;
      }
      scheduleLayout(positionXmlIdRef.current);
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      if (layoutTimerRef.current) {
        clearTimeout(layoutTimerRef.current);
      }
    };
  }, [open, scheduleLayout]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const inertedSiblings: HTMLElement[] = [];
    for (const child of document.body.children) {
      if (child !== dialog && child instanceof HTMLElement) {
        child.inert = true;
        inertedSiblings.push(child);
      }
    }

    const focusableInDialog = () => {
      const toolbar = toolbarRef.current;
      const toolbarInert = toolbar?.inert ?? false;
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !toolbarInert || !toolbar?.contains(element));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const focusables = focusableInDialog();
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
            return;
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
            return;
          }
        }
      }

      if (shouldIgnoreKeyboardTarget(event.target)) {
        return;
      }
      const turnDir = pageTurnFromKeyboard(event);
      if (turnDir) {
        event.preventDefault();
        turn(turnDir);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      for (const element of inertedSiblings) {
        element.inert = false;
      }
    };
  }, [open, turn, handleClose]);

  useEffect(() => {
    if (!open) {
      returnFocusRef.current?.focus();
    }
  }, [open, returnFocusRef]);

  if (!open || !mounted) {
    return null;
  }

  const visiblePages = pagesInView(currentPage, pageCount, layoutMode);
  const pageLabel = formatPageLabel(visiblePages, pageCount);
  const canPrev = canStepPrev(currentPage, layoutMode);
  const canNext = canStepNext(currentPage, pageCount, layoutMode);
  const chromeInteractive = chromeVisible || reducedMotion;

  return createPortal(
    <div
      ref={dialogRef}
      id={dialogId}
      role="dialog"
      aria-modal="true"
      aria-label={`Practice view for ${title}`}
      tabIndex={-1}
      className="surface-board on-board fixed inset-0 z-50 flex flex-col text-edition-ink outline-none"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      onPointerMove={showChrome}
      onFocusCapture={() => {
        showChrome();
      }}
    >
      <div
        ref={toolbarRef}
        inert={chromeInteractive ? undefined : true}
        aria-hidden={chromeInteractive ? undefined : true}
        className={`flex shrink-0 items-center justify-between gap-4 border-b border-edition-hairline px-4 transition-opacity duration-200 ${
          chromeInteractive ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ minHeight: CHROME_HEIGHT_PX }}
      >
        <p className="type-shelf">{pageLabel}</p>
        <div className="flex items-center gap-5">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => turn("prev")}
            className="type-hint hover:text-edition-gilt disabled:pointer-events-none disabled:text-edition-muted-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => turn("next")}
            className="type-hint text-edition-gilt hover:text-edition-ink disabled:pointer-events-none disabled:text-edition-muted-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="type-hint hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
          >
            Close
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none overscroll-none"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
      >
        <div
          ref={slotRef}
          className="absolute inset-0"
          style={{
            transform: dragOffset ? `translateX(${dragOffset}px)` : undefined,
            transition:
              dragOffset === 0 && !reducedMotion
                ? "transform 280ms cubic-bezier(0.16, 1, 0.3, 1)"
                : undefined,
          }}
        >
          <PracticeSpread mode={layoutMode} pages={visiblePages} svgs={svgs} />
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {pageLabel}
      </p>
    </div>,
    document.body,
  );
}
