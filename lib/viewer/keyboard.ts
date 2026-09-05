export type PageTurnDirection = "prev" | "next" | "first" | "last";

export function pageTurnFromKeyboard(event: {
  key: string;
}): PageTurnDirection | null {
  switch (event.key) {
    case "ArrowLeft":
    case "PageUp":
      return "prev";
    case "ArrowRight":
    case "PageDown":
    case " ":
      return "next";
    case "Home":
      return "first";
    case "End":
      return "last";
    default:
      return null;
  }
}

export function shouldIgnoreKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  return target.isContentEditable;
}
