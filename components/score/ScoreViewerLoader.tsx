
import { lazy, Suspense } from "react";
import { ViewerSkeleton } from "@/components/score/viewer-skeleton";

const ScoreViewer = lazy(() => import("@/components/score/ScoreViewer"));

type ScoreViewerLoaderProps = {
  fileUrl: string;
  compressed?: boolean;
  title: string;
};

export function ScoreViewerLoader(props: ScoreViewerLoaderProps) {
  return (
    <Suspense fallback={<ViewerSkeleton />}>
      <ScoreViewer {...props} />
    </Suspense>
  );
}
