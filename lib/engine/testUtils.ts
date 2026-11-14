import type { IndicatorId, Reading } from "./types";

/** Deterministic pseudo-random generator (mulberry32) for tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build readings for one indicator from a function of the day. */
export function readingsFor(
  memberId: string,
  indicator: IndicatorId,
  days: number,
  valueOn: (day: number) => number | null,
): Reading[] {
  const out: Reading[] = [];
  for (let day = 0; day < days; day++) {
    const value = valueOn(day);
    if (value === null) continue;
    out.push({ memberId, indicator, value, day, timestamp: `2026-01-01T00:00:00Z`, source: "seed" });
  }
  return out;
}
