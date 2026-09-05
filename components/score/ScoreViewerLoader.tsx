"use client";

import dynamic from "next/dynamic";

const ScoreViewer = dynamic(() => import("@/components/score/ScoreViewer"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border px-6 py-16 text-center text-sm text-zinc-500">
      Loading score viewer…
    </div>
  ),
});

type ScoreViewerLoaderProps = {
  fileUrl: string;
  visibleParts?: string[];
  title: string;
};

export function ScoreViewerLoader(props: ScoreViewerLoaderProps) {
  return <ScoreViewer {...props} />;
}
