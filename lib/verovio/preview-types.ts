export type PreviewInput = {
  filename: string;
  bytes: ArrayBuffer;
};

export type PreviewRequest = PreviewInput & {
  id: number;
};

export type PreviewResponse = {
  id: number;
  svg?: string;
  error?: string;
};
