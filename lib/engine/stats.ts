/** Small, dependency-free statistics helpers. All return NaN for empty input. */

export function mean(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Median absolute deviation (unscaled). */
export function mad(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  const m = median(values);
  return median(values.map((v) => Math.abs(v - m)));
}

/** MAD → SD scale factor for normally distributed data. */
export const MAD_TO_SD = 1.4826;

/** Mean absolute deviation → SD scale factor for normal data (√(π/2)). */
export const MEAN_ABS_DEV_TO_SD = Math.sqrt(Math.PI / 2);

/**
 * For normal data trimmed to |z| < 1.5, E|x| = 2(φ(0) − φ(1.5)) / P(|Z| < 1.5) ≈ 0.6219σ,
 * so a trimmed mean absolute deviation is scaled by 1 / 0.6219 to estimate σ.
 */
export const TRIMMED_ABS_DEV_TO_SD = 1 / 0.6219;
