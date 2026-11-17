export interface StopKeyframe {
  p: number;
  v: number;
}

export const STOPS_X: readonly StopKeyframe[] = [
  { p: 0, v: 0 },
  { p: 0.32, v: -3.1 },
  { p: 0.64, v: 3.2 },
  { p: 1, v: 0 },
];

export const STOPS_Y: readonly StopKeyframe[] = [
  { p: 0, v: -4.5 },
  { p: 0.32, v: 0.55 },
  { p: 0.64, v: 0.45 },
  { p: 1, v: 0.15 },
];

export const STOPS_S: readonly StopKeyframe[] = [
  { p: 0, v: 2.15 },
  { p: 0.32, v: 1.0 },
  { p: 0.64, v: 0.92 },
  { p: 1, v: 1.12 },
];

export const ENTRY_DURATION_SEC = 1.9;
export const ENTRY_START_Y = -6.5;

export function lerp(a: number, b: number, t: number): number {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function sampleStops(stops: readonly StopKeyframe[], p: number): number {
  if (stops.length === 0) return 0;
  if (p <= stops[0].p) return stops[0].v;
  const last = stops[stops.length - 1];
  if (p >= last.p) return last.v;

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (p >= a.p && p <= b.p) {
      const span = b.p - a.p;
      if (span <= 0) return b.v;
      const t = clamp((p - a.p) / span, 0, 1);
      const smooth = t * t * (3 - 2 * t);
      return lerp(a.v, b.v, smooth);
    }
  }
  return last.v;
}

export function computeScrollProgress(
  scrollY: number,
  scrollHeight: number,
  innerHeight: number
): number {
  const maxScroll = scrollHeight - innerHeight;
  if (maxScroll <= 0) return 0;
  return clamp(scrollY / maxScroll, 0, 1);
}

export function computeEntryOffset(
  elapsedSinceLoadSec: number | null,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedSinceLoadSec === null) return 0;
  if (elapsedSinceLoadSec >= ENTRY_DURATION_SEC) return 0;
  const t = clamp(elapsedSinceLoadSec / ENTRY_DURATION_SEC, 0, 1);
  const eased = 1 - Math.pow(1 - t, 3);
  return lerp(ENTRY_START_Y, 0, eased);
}

export function computeTargetTransform(
  progress: number,
  innerWidth: number
): { x: number; y: number; scale: number } {
  const sideScale = clamp(innerWidth / 1200, 0.5, 1);
  return {
    x: sampleStops(STOPS_X, progress) * sideScale,
    y: sampleStops(STOPS_Y, progress),
    scale: sampleStops(STOPS_S, progress),
  };
}
