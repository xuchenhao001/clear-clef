"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type ScoreViewerProps = {
  fileUrl: string;
  visibleParts?: string[];
  title: string;
};

type VerovioToolkitLike = {
  setOptions: (options: Record<string, unknown>) => void;
  loadZipDataBuffer: (buffer: ArrayBuffer) => boolean;
  loadData: (xml: string) => boolean;
  getPageCount: () => number;
  renderToSVG: (page: number) => string;
};

export default function ScoreViewer({
  fileUrl,
  visibleParts,
  title,
}: ScoreViewerProps) {
  const [toolkit, setToolkit] = useState<VerovioToolkitLike | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        tk.setOptions({
          scale: 40,
          footer: "none",
          header: "none",
        });

        if (visibleParts?.length) {
          tk.setOptions({ partNames: visibleParts });
        }

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Failed to load score file");
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") ?? "";
        const loaded =
          contentType.includes("zip") || fileUrl.endsWith(".mxl")
            ? tk.loadZipDataBuffer(buffer)
            : tk.loadData(new TextDecoder().decode(buffer));

        if (!loaded) {
          throw new Error("Verovio could not parse the score");
        }

        const pages = tk.getPageCount();
        setToolkit(tk);
        setPageCount(pages);
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
    };
  }, [fileUrl, visibleParts]);

  const svg = useMemo(() => {
    if (!toolkit || currentPage < 1) {
      return "";
    }
    return toolkit.renderToSVG(currentPage);
  }, [toolkit, currentPage]);

  const pageLabel = useMemo(
    () => `Page ${currentPage} of ${pageCount || 1}`,
    [currentPage, pageCount],
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-border px-6 py-16 text-center text-sm text-zinc-500">
        Preparing Verovio viewer…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <section
      aria-label={`Engraved score for ${title}`}
      className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <p className="text-sm text-zinc-500">{pageLabel}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() =>
              setCurrentPage((page) => Math.min(pageCount, page + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>
      <div
        className="overflow-x-auto p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </section>
  );
}
