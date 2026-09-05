export type LayoutSize = {
  width: number;
  height: number;
};

export type ReflowMode = "embedded" | "practice";

const SIZE_EPSILON_PX = 1;

function dimensionChanged(a: number, b: number): boolean {
  return Math.abs(a - b) > SIZE_EPSILON_PX;
}

/** Whether a resize should trigger redoLayout for the given viewer mode. */
export function shouldReflowLayout(
  previous: LayoutSize | null,
  next: LayoutSize,
  mode: ReflowMode,
): boolean {
  if (!previous) {
    return true;
  }
  if (mode === "embedded") {
    return dimensionChanged(previous.width, next.width);
  }
  return (
    dimensionChanged(previous.width, next.width) ||
    dimensionChanged(previous.height, next.height)
  );
}
