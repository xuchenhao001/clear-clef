"use client";

import dynamic from "next/dynamic";
import { ViewerSkeleton } from "@/components/score/viewer-skeleton";

const ScoreViewer = dynamic(() => import("@/components/score/ScoreViewer"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

type ScoreViewerLoaderProps = {
  fileUrl: string;
  compressed?: boolean;
  title: string;
};

export function ScoreViewerLoader(props: ScoreViewerLoaderProps) {
  return <ScoreViewer {...props} />;
}
