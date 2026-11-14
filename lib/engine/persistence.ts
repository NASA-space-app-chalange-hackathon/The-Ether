import type { Status } from "./types";

export const PERSIST_WINDOW = 5;
export const PERSIST_MIN_DAYS = 3;
export const WATCH_Z = 2;
export const CRITICAL_Z = 3;

/**
 * Persistence rule over the last PERSIST_WINDOW calendar days.
 * `badnessByDay[i]` is the worse-direction z for day (end - window + 1 + i), or
 * null if that day has no reading (a missing day never counts as abnormal).
 *
 * watch:    badness > 2 on ≥ 3 of the last 5 days
 * critical: badness > 3 on ≥ 3 of the last 5 days (same persistence, so a
 *           single noisy reading can't trigger a red; absolute thresholds are
 *           handled separately and act immediately)
 */
export function persistenceStatus(badnessByDay: readonly (number | null)[]): Exclude<Status, "unknown"> {
  const window = badnessByDay.slice(-PERSIST_WINDOW);
  const count = (limit: number) => window.filter((b) => b !== null && b > limit).length;
  if (count(CRITICAL_Z) >= PERSIST_MIN_DAYS) return "critical";
  if (count(WATCH_Z) >= PERSIST_MIN_DAYS) return "watch";
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
