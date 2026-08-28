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

//does not clamp alpha, so callers can extrapolate past the known endpoints
export function lerpUnclamped(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

export function interpolatePoint(
  start: Point,
  end: Point,
  alpha: number,
  options?: { clamp?: boolean },
): Point {
  const interpolate = options?.clamp === true ? lerp : lerpUnclamped;
  return {
    x: interpolate(start.x, end.x, alpha),
    y: interpolate(start.y, end.y, alpha),
  };
}