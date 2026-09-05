"use client";

import { sanitizeVerovioSvg } from "@/lib/viewer/sanitize-svg";

type SafeSvgProps = {
  svg: string;
  className?: string;
  /** Skip sanitization when svg was already sanitized at the cache boundary. */
  preSanitized?: boolean;
};

export function SafeSvg({ svg, className, preSanitized = false }: SafeSvgProps) {
  const safe = preSanitized ? svg : sanitizeVerovioSvg(svg);
  if (!safe) {
    return null;
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
