const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 452;

export async function createPreviewThumb(svg: string): Promise<Blob | null> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return null;
  }

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not rasterize preview"));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = THUMB_WIDTH;
    canvas.height = THUMB_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context || image.naturalWidth === 0 || image.naturalHeight === 0) {
      return null;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight,
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(
      image,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height,
    );

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", 0.82);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadPreviewThumb(
  scoreId: string,
  svg: string,
): Promise<boolean> {
  const thumb = await createPreviewThumb(svg);
  if (!thumb) {
    return false;
  }
  const response = await fetch(`/api/admin/scores/${scoreId}/preview`, {
    method: "PUT",
    headers: { "Content-Type": "image/webp" },
    body: thumb,
  });
  return response.ok;
}
