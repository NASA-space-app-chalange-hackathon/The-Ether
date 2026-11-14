import type { Baseline, Indicator } from "./types";

/** Robust z-score of a value against a personal baseline. */
export function robustZ(value: number, baseline: Pick<Baseline, "center" | "spread">): number {
  if (!(baseline.spread > 0)) return 0;
  return (value - baseline.center) / baseline.spread;
}

/**
 * Z re-signed so that positive always means "worse" for this indicator.
 * For two-sided indicators the magnitude is used.
 */
export function badness(z: number, worseWhen: Indicator["worseWhen"]): number {
  if (worseWhen === "higher") return z;
  if (worseWhen === "lower") return -z;
  return Math.abs(z);
}

export function percentChange(value: number, center: number): number {
  if (center === 0) return 0;
  return ((value - center) / Math.abs(center)) * 100;
}
