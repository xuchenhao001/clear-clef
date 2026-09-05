export type VerovioToolkitLike = {
  setOptions: (options: Record<string, unknown>) => void;
  loadZipDataBuffer: (buffer: ArrayBuffer) => boolean;
  loadData: (xml: string) => boolean;
  getPageCount: () => number;
  renderToSVG: (page: number) => string;
  redoLayout: () => void;
  getPageWithElement: (xmlId: string) => number;
  destroy: () => void;
};
