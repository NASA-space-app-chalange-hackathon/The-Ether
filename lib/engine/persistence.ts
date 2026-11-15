import type { Status } from "./types";

export const PERSIST_WINDOW = 5;
export const PERSIST_MIN_DAYS = 3;
export const WATCH_Z = 2;
export const CRITICAL_Z = 3;
/**
 * 1–5 scales move in whole steps, so a real drop can alternate between
 * "−1 step" (z ≈ −1) and "−2 steps" (z ≈ −2.5) and never hit 3 single days.
 * For ordinal indicators the 5-day mean deviation also counts. Demo parameters.
 */
export const ORDINAL_WATCH_MEAN = 1.5;
export const ORDINAL_CRITICAL_MEAN = 2.5;

/**
 * Persistence rule over the last PERSIST_WINDOW calendar days.
 * `badnessByDay[i]` is the worse-direction z for day (end - window + 1 + i), or
 * null if that day has no reading (a missing day never counts as abnormal).
 *
 * watch:    badness > 2 on ≥ 3 of the last 5 days
 * ordinal:  1–5 scales also flag on the 5-day mean (see ORDINAL_*_MEAN)
 * critical: badness > 3 on ≥ 3 of the last 5 days (same persistence, so a
 *           single noisy reading can't trigger a red; absolute thresholds are
 *           handled separately and act immediately)
 */
export function persistenceStatus(
  badnessByDay: readonly (number | null)[],
  options: { ordinal?: boolean } = {},
): Exclude<Status, "unknown"> {
  const window = badnessByDay.slice(-PERSIST_WINDOW);
  const count = (limit: number) => window.filter((b) => b !== null && b > limit).length;
  const values = window.filter((b): b is number => b !== null);
  const mean = values.length >= PERSIST_MIN_DAYS ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const meanRule = options.ordinal === true;
  if (count(CRITICAL_Z) >= PERSIST_MIN_DAYS || (meanRule && mean > ORDINAL_CRITICAL_MEAN)) return "critical";
  if (count(WATCH_Z) >= PERSIST_MIN_DAYS || (meanRule && mean > ORDINAL_WATCH_MEAN)) return "watch";
  return "ok";
}

const RANK: Record<Status, number> = { unknown: -1, ok: 0, watch: 1, critical: 2 };

/** Worst of several statuses; "unknown" only if nothing is known. */
export function worstStatus(statuses: readonly Status[]): Status {
  return statuses.reduce<Status>((worst, s) => (RANK[s] > RANK[worst] ? s : worst), "unknown");
}

export function statusRank(s: Status): number {
  return RANK[s];
}
