/** Strip script, foreignObject, and inline event handlers from Verovio SVG before innerHTML. */
export function sanitizeVerovioSvg(svg: string): string {
  if (!svg || !svg.includes("<svg")) {
    return "";
  }

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    doc.querySelectorAll("script, foreignObject").forEach((el) => {
      el.remove();
    });
    doc.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.toLowerCase().startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      }
    });
    const root = doc.documentElement;
    if (root?.tagName?.toLowerCase() === "svg") {
      return root.outerHTML;
    }
  }

  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "");
}
