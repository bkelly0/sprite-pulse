export type Point = {
  x: number;
  y: number;
};

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(start: number, end: number, alpha: number): number {
  const safeAlpha = clamp01(alpha);
  return start + (end - start) * safeAlpha;
}

export function interpolatePoint(
  start: Point,
  end: Point,
  alpha: number,
): Point {
  return {
    x: lerp(start.x, end.x, alpha),
    y: lerp(start.y, end.y, alpha),
  };
}