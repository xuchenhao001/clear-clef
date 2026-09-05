"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { PracticeStage } from "@/components/score/PracticeStage";
import { SafeSvg } from "@/components/score/SafeSvg";
import { ViewerSkeleton } from "@/components/score/viewer-skeleton";
import { shouldLoadMxlBuffer } from "@/lib/score-file";
import { VEROVIO_VIEWER_BASE_OPTIONS } from "@/lib/verovio/options";
import { pageTurnFromKeyboard, shouldIgnoreKeyboardTarget } from "@/lib/viewer/keyboard";
import { shouldReflowLayout, type LayoutSize } from "@/lib/viewer/layout-guard";
import { applyEmbeddedLayout, LAYOUT_DEBOUNCE_MS } from "@/lib/viewer/layout";
import { extractFirstXmlId } from "@/lib/viewer/position";
import { sanitizeVerovioSvg } from "@/lib/viewer/sanitize-svg";
import type { VerovioToolkitLike } from "@/lib/viewer/types";

type ScoreViewerProps = {
  fileUrl: string;
  compressed?: boolean;
  title: string;
};

export default function ScoreViewer({
  fileUrl,
  compressed = false,
  title,
}: ScoreViewerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const pageSlotRef = useRef<HTMLDivElement>(null);
  const practiceButtonRef = useRef<HTMLButtonElement>(null);
  const toolkitRef = useRef<VerovioToolkitLike | null>(null);
  const svgCacheRef = useRef(new Map<number, string>());
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionXmlIdRef = useRef<string | null>(null);
  const lastLayoutSizeRef = useRef<LayoutSize | null>(null);

  const [toolkit, setToolkit] = useState<VerovioToolkitLike | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSvg, setCurrentSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceXmlId, setPracticeXmlId] = useState<string | null>(null);

  const invalidateCache = useCallback(() => {
    svgCacheRef.current.clear();
  }, []);

  const renderPageSvg = useCallback((tk: VerovioToolkitLike, page: number) => {
    const cache = svgCacheRef.current;
    if (!cache.has(page)) {
      cache.set(page, sanitizeVerovioSvg(tk.renderToSVG(page)));
    }
    return cache.get(page) ?? "";
  }, []);

  const runEmbeddedLayout = useCallback(
    (tk: VerovioToolkitLike, restoreXmlId: string | null, force = false) => {
      const slot = pageSlotRef.current;
      if (!slot) {
        return;
      }
      const nextSize: LayoutSize = {
        width: Math.max(200, slot.clientWidth),
        height: 0,
      };
      if (
        !force &&
        !shouldReflowLayout(lastLayoutSizeRef.current, nextSize, "embedded")
      ) {
        return;
      }
      lastLayoutSizeRef.current = nextSize;
      invalidateCache();
      const { pageCount: nextCount, page } = applyEmbeddedLayout(
        tk,
        nextSize.width,
        restoreXmlId,
      );
      setPageCount(nextCount);
      setCurrentPage(page);
      const svg = renderPageSvg(tk, page);
      setCurrentSvg(svg);
      positionXmlIdRef.current = extractFirstXmlId(svg);
    },
    [invalidateCache, renderPageSvg],
  );

  const scheduleEmbeddedLayout = useCallback(
    (tk: VerovioToolkitLike, restoreXmlId: string | null) => {
      if (layoutTimerRef.current) {
        clearTimeout(layoutTimerRef.current);
      }
      layoutTimerRef.current = setTimeout(() => {
        runEmbeddedLayout(tk, restoreXmlId);
      }, LAYOUT_DEBOUNCE_MS);
    },
    [runEmbeddedLayout],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [{ default: createVerovioModule }, { VerovioToolkit }] =
          await Promise.all([
            import("verovio/wasm"),
            import("verovio/esm"),
          ]);

        const verovioModule = await createVerovioModule();
        if (cancelled) {
          return;
        }

        const tk = new VerovioToolkit(verovioModule) as VerovioToolkitLike;
        tk.setOptions(VEROVIO_VIEWER_BASE_OPTIONS);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Failed to load score file");
        }

        const buffer = await response.arrayBuffer();
        const loaded = shouldLoadMxlBuffer(compressed, buffer)
          ? tk.loadZipDataBuffer(buffer)
          : tk.loadData(new TextDecoder().decode(buffer));

        if (!loaded) {
          throw new Error("Verovio could not parse the score");
        }

        toolkitRef.current = tk;
        setToolkit(tk);
        setPageCount(tk.getPageCount());
        setCurrentPage(1);
      } catch (initError) {
        setError(
          initError instanceof Error ? initError.message : "Failed to load viewer",
        );
      } finally {
        setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
      toolkitRef.current?.destroy();
      toolkitRef.current = null;
    };
  }, [fileUrl, compressed]);

  useEffect(() => {
    if (!toolkit || loading || practiceOpen) {
      return;
    }
    const slot = pageSlotRef.current;
    if (!slot) {
      return;
    }

    lastLayoutSizeRef.current = null;
    requestAnimationFrame(() => {
      runEmbeddedLayout(toolkit, positionXmlIdRef.current, true);
    });

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? slot.clientWidth;
      const nextSize: LayoutSize = { width: Math.max(200, width), height: 0 };
      if (!shouldReflowLayout(lastLayoutSizeRef.current, nextSize, "embedded")) {
        return;
      }
      scheduleEmbeddedLayout(toolkit, positionXmlIdRef.current);
    });
    observer.observe(slot);
    return () => {
      observer.disconnect();
      if (layoutTimerRef.current) {
        clearTimeout(layoutTimerRef.current);
      }
    };
  }, [toolkit, loading, practiceOpen, runEmbeddedLayout, scheduleEmbeddedLayout]);

  const goToPage = useCallback(
    (page: number) => {
      if (!toolkit) {
        return;
      }
      const clamped = Math.min(Math.max(1, page), pageCount);
      setCurrentPage(clamped);
      const svg = renderPageSvg(toolkit, clamped);
      setCurrentSvg(svg);
      positionXmlIdRef.current = extractFirstXmlId(svg);
    },
    [toolkit, pageCount, renderPageSvg],
  );

  const handlePracticeOpen = () => {
    setPracticeXmlId(positionXmlIdRef.current);
    setPracticeOpen(true);
  };

  const handlePracticeClose = (xmlId: string | null) => {
    setPracticeOpen(false);
    positionXmlIdRef.current = xmlId;
    lastLayoutSizeRef.current = null;
    if (toolkit) {
      requestAnimationFrame(() => {
        runEmbeddedLayout(toolkit, xmlId, true);
      });
    }
  };

  const handleSectionKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (practiceOpen || shouldIgnoreKeyboardTarget(event.target)) {
      return;
    }
    const turn = pageTurnFromKeyboard(event);
    if (!turn) {
      return;
    }
    event.preventDefault();
    if (turn === "first") {
      goToPage(1);
    } else if (turn === "last") {
      goToPage(pageCount);
    } else if (turn === "prev") {
      goToPage(currentPage - 1);
    } else {
      goToPage(currentPage + 1);
    }
  };

  const pageLabel = `${currentPage} / ${pageCount || 1}`;

  if (loading) {
    return <ViewerSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-edition-semantic-error/30 bg-edition-semantic-error/5 px-6 py-8 text-sm text-edition-semantic-error">
        {error}
      </div>
    );
  }

  return (
    <>
      <section
        ref={sectionRef}
        aria-label={`Engraved score for ${title}`}
        tabIndex={0}
        onKeyDown={handleSectionKeyDown}
        className="overflow-hidden rounded-xl border border-edition-hairline bg-edition-canvas text-edition-ink outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-edition-hairline px-4 py-3">
          <p className="type-caption-mono" aria-label={`Page ${pageLabel}`}>
            {pageLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
            </Button>
            <Button
              ref={practiceButtonRef}
              type="button"
              size="sm"
              onClick={handlePracticeOpen}
            >
              Practice
            </Button>
          </div>
        </div>
        <div ref={pageSlotRef} className="bg-edition-surface-page p-4">
          <SafeSvg
            svg={currentSvg}
            preSanitized
            className="flex w-full items-start justify-center [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:w-full"
          />
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {pageLabel}
        </p>
      </section>

      {toolkit ? (
        <PracticeStage
          open={practiceOpen}
          onClose={handlePracticeClose}
          toolkit={toolkit}
          title={title}
          initialXmlId={practiceXmlId}
          returnFocusRef={practiceButtonRef}
        />
      ) : null}
    </>
  );
}
