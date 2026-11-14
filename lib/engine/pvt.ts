/** PVT-lite scoring (psychomotor vigilance test). */

/** Lapse: reaction time ≥ 500 ms (Basner & Dinges 2011). */
export const LAPSE_MS = 500;
/** Responses faster than this are anticipations, counted as false starts. */
export const MIN_VALID_RT_MS = 100;
/** No response by this time counts as a lapse and the trial ends. */
export const TIMEOUT_MS = 3000;
export const GAP_MIN_MS = 2000;
export const GAP_MAX_MS = 10000;

export type PvtTrial = { kind: "response"; rtMs: number } | { kind: "false-start" } | { kind: "timeout" };

export interface PvtResult {
  meanRT: number | null;
  lapses: number;
  falseStarts: number;
  validTrials: number;
}

export function scorePvt(trials: readonly PvtTrial[]): PvtResult {
  let falseStarts = 0;
  let lapses = 0;
  const rts: number[] = [];
  for (const tr of trials) {
    if (tr.kind === "false-start" || (tr.kind === "response" && tr.rtMs < MIN_VALID_RT_MS)) {
      falseStarts += 1;
    } else if (tr.kind === "timeout") {
      lapses += 1;
      rts.push(TIMEOUT_MS);
    } else {
      rts.push(tr.rtMs);
      if (tr.rtMs >= LAPSE_MS) lapses += 1;
    }
  }
  return {
    meanRT: rts.length ? Math.round(rts.reduce((s, v) => s + v, 0) / rts.length) : null,
    lapses,
    falseStarts,
    validTrials: rts.length,
  };
}

/** Random inter-stimulus gap in [min, max) ms; `random` injectable for tests. */
export function nextGap(random: () => number = Math.random, min = GAP_MIN_MS, max = GAP_MAX_MS): number {
  return min + random() * (max - min);
}
