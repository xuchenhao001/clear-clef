"use client";

import { SafeSvg } from "@/components/score/SafeSvg";
import type { LayoutMode } from "@/lib/viewer/spreads";

const SVG_CLASS =
  "flex h-full w-full items-center justify-center [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:w-full [&_svg]:max-w-full";

type PracticeSpreadProps = {
  mode: LayoutMode;
  pages: number[];
  svgs: string[];
};

export function PracticeSpread({ mode, pages, svgs }: PracticeSpreadProps) {
  if (mode === "single") {
    return (
      <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
        <div
          className="flex h-full max-h-full w-full max-w-full items-center justify-center bg-edition-surface-page"
          data-page={pages[0]}
        >
          <SafeSvg svg={svgs[0] ?? ""} preSanitized className={SVG_CLASS} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center gap-2 p-2 sm:p-4">
      {pages.map((pageNum, index) => (
        <div
          key={pageNum}
          className="flex h-full min-w-0 flex-1 items-center justify-center bg-edition-surface-page"
          data-page={pageNum}
        >
          <SafeSvg
            svg={svgs[index] ?? ""}
            preSanitized
            className={SVG_CLASS}
          />
        </div>
      ))}
    </div>
  );
}
