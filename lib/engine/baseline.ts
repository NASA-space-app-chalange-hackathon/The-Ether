import { INDICATORS } from "./indicators";
import { MAD_TO_SD, TRIMMED_ABS_DEV_TO_SD, mad, median } from "./stats";
import type { Baseline, IndicatorId } from "./types";

/** One value per mission day. */
export interface DailyValue {
  day: number;
  value: number;
}

/** Days 0..BASELINE_DAYS-1 form the initial personal baseline. */
export const BASELINE_DAYS = 14;
/** Fewer points than this and we refuse to call it a baseline. */
export const MIN_BASELINE_POINTS = 5;
/** Slow EWMA so a drift can't quietly become the "new normal". */
export const EWMA_ALPHA = 0.05;
/** Only readings within ±1.5 SD of the baseline update it (symmetric trim, no bias). */
export const UPDATE_GATE_Z = 1.5;

/**
 * Robust baseline from the first BASELINE_DAYS: median + MAD×1.4826.
 * Returns null when there is too little data (short history / missing days).
 * A constant series (MAD = 0) falls back to the indicator's minimum spread.
 */
export function buildBaseline(
  memberId: string,
  indicator: IndicatorId,
  series: readonly DailyValue[],
  baselineDays: number = BASELINE_DAYS,
): Baseline | null {
  const window = series.filter((p) => p.day < baselineDays).map((p) => p.value);
  if (window.length < MIN_BASELINE_POINTS) return null;
  const spread = Math.max(mad(window) * MAD_TO_SD, INDICATORS[indicator].minSpread);
  const lastDay = series.filter((p) => p.day < baselineDays).reduce((d, p) => Math.max(d, p.day), 0);
  return {
    memberId,
    indicator,
    center: median(window),
    spread,
    n: window.length,
    updatedDay: lastDay,
    frozen: false,
  };
}

/**
 * EWMA update of centre and spread, gated: only readings within ±UPDATE_GATE_Z
 * spreads update the baseline, so a slow drift can't pull it along. While
 * `freeze` is true (the indicator is in an alert state) nothing changes except
 * the flag. The spread uses the trimmed-deviation scale factor to stay unbiased.
 */
export function updateBaseline(
  baseline: Baseline,
  point: DailyValue,
  freeze: boolean,
  alpha: number = EWMA_ALPHA,
): Baseline {
  if (freeze) return { ...baseline, frozen: true };
  const deviation = point.value - baseline.center;
  if (Math.abs(deviation) > UPDATE_GATE_Z * baseline.spread) return { ...baseline, frozen: false };
  const center = baseline.center + alpha * deviation;
  const absDevAsSd = Math.abs(deviation) * TRIMMED_ABS_DEV_TO_SD;
  const spread = Math.max(
    baseline.spread + alpha * (absDevAsSd - baseline.spread),
    INDICATORS[baseline.indicator].minSpread,
  );
  return { ...baseline, center, spread, n: baseline.n + 1, updatedDay: point.day, frozen: false };
}
