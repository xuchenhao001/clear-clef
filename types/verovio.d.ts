declare module "verovio/wasm" {
  export default function createVerovioModule(): Promise<unknown>;
}

declare module "verovio/esm" {
  export class VerovioToolkit {
    constructor(module: unknown);
    setOptions(options: Record<string, unknown>): void;
    loadZipDataBuffer(buffer: ArrayBuffer): boolean;
    loadData(xml: string): boolean;
    getPageCount(): number;
    renderToSVG(page: number): string;
    redoLayout(): void;
    getPageWithElement(xmlId: string): number;
    destroy(): void;
  }
}
