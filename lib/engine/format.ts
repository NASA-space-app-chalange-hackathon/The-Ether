import { INDICATORS } from "./indicators";
import type { AlertEvidence, IndicatorId } from "./types";

/**
 * One formatter for every place a reading is compared with the personal normal
 * (alert text, evidence table, Trends), so the same number never shows two ways.
 * Counts and 1–5 scales always get one decimal: their normal is an average (e.g. 0.4 lapses).
 */
export function valueDecimals(indicator: IndicatorId): number {
  const meta = INDICATORS[indicator];
  return meta.changeAs === "absolute" ? Math.max(1, meta.decimals) : meta.decimals;
}

export function formatValue(indicator: IndicatorId, value: number): string {
  return value.toFixed(valueDecimals(indicator));
}

/** "+2.6", "−1.6", "±0.0" — typographic minus, explicit sign. */
export function signed(n: number, decimals: number): string {
  const s = Math.abs(n).toFixed(decimals);
  if (Number(s) === 0) return `±${s}`;
  return `${n > 0 ? "+" : "−"}${s}`;
}

export interface FormattedChange {
  /** Signed difference from the normal, in the indicator's unit (unit not included). */
  absolute: string;
  /** Unit for the difference ("" for counts and 1–5 scales). */
  unit: string;
  /** Signed percent change, or null for counts and 1–5 scales (a % of 0.4 lapses means nothing). */
  percent: string | null;
}

export function formatChange(e: Pick<AlertEvidence, "indicator" | "value" | "baseline" | "percentChange">): FormattedChange {
  const meta = INDICATORS[e.indicator];
  const absolute = signed(e.value - e.baseline, valueDecimals(e.indicator));
  if (meta.changeAs === "absolute") return { absolute, unit: "", percent: null };
  return { absolute, unit: meta.unit, percent: `${signed(Math.round(e.percentChange), 0)}%` };
}
