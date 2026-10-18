import type { ReactNode } from "react";
import { cn } from "cn";

// Spanish-wave marbling, drawn rather than scanned: fine stripes displaced by
// turbulence, which is how the pattern is actually made (comb the trough, then
// displace it). Fixed id because the panel appears once per page.
const FILTER_ID = "clear-clef-marbled-endpaper";
const LINE_COUNT = 260;
const LINE_PITCH = 1.2;
const MARBLE_CLASSES = [
  "marble-v1",
  "marble-v2",
  "marble-v3",
  "marble-v4",
  "marble-v5",
] as const;

type MarbledPanelProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * The endpaper: the one surface a fine binding has that the catalog itself does
 * not. Used for the two places with no score to show (404 and empty catalog),
 * where it reads as the inside of the cover.
 */
export function MarbledPanel({ children, className }: MarbledPanelProps) {
  return (
    <div className={cn("surface-marbled relative overflow-hidden", className)}>
      <svg
        aria-hidden
        viewBox="0 0 300 140"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <defs>
          <filter
            id={FILTER_ID}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.012"
              numOctaves="3"
              seed="9"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="55"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.35" />
          </filter>
        </defs>
        <g filter={`url(#${FILTER_ID})`}>
          {Array.from({ length: LINE_COUNT }, (_, index) => (
            <line
              key={index}
              x1={index * LINE_PITCH}
              y1={-20}
              x2={index * LINE_PITCH}
              y2={160}
              strokeWidth={index % 11 === 0 ? 2.6 : 1.4}
              strokeOpacity={0.2 + (index % 5) * 0.07}
              className={MARBLE_CLASSES[index % MARBLE_CLASSES.length]}
            />
          ))}
        </g>
      </svg>
      {/* Children must be positioned too, or the absolutely positioned SVG
          paints over them. */}
      <div className="relative">{children}</div>
    </div>
  );
}
