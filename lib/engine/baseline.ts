import { INDICATORS } from "./indicators";
import { MAD_TO_SD, MEAN_ABS_DEV_TO_SD, mad, median } from "./stats";
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
 * EWMA update of centre and spread. While `freeze` is true (the indicator is in
 * an alert state) the baseline is returned unchanged except for the flag, so an
 * abnormal run can never pull the baseline toward itself.
 */
export function updateBaseline(
  baseline: Baseline,
  point: DailyValue,
  freeze: boolean,
  alpha: number = EWMA_ALPHA,
): Baseline {
  if (freeze) return { ...baseline, frozen: true };
  const center = baseline.center + alpha * (point.value - baseline.center);
  const absDevAsSd = Math.abs(point.value - baseline.center) * MEAN_ABS_DEV_TO_SD;
  const spread = Math.max(
    baseline.spread + alpha * (absDevAsSd - baseline.spread),
    INDICATORS[baseline.indicator].minSpread,
  );
  return { ...baseline, center, spread, n: baseline.n + 1, updatedDay: point.day, frozen: false };
}
