import { VEROVIO_PREVIEW_OPTIONS } from "@/lib/verovio/options";

export async function generatePreviewSvg(file: File): Promise<string> {
  const [{ default: createVerovioModule }, { VerovioToolkit }] = await Promise.all([
    import("verovio/wasm"),
    import("verovio/esm"),
  ]);

  const verovioModule = await createVerovioModule();
  const toolkit = new VerovioToolkit(verovioModule);
  try {
    toolkit.setOptions(VEROVIO_PREVIEW_OPTIONS);

    const buffer = await file.arrayBuffer();
    const extension = file.name.toLowerCase().split(".").pop();
    const loaded =
      extension === "mxl"
        ? toolkit.loadZipDataBuffer(buffer)
        : toolkit.loadData(new TextDecoder().decode(buffer));

    if (!loaded) {
      throw new Error("Could not render preview from uploaded file");
    }

    return toolkit.renderToSVG(1);
  } finally {
    toolkit.destroy();
  }
}
