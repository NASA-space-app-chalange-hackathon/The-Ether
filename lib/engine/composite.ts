import { mean } from "./stats";
import type { IndicatorId, Severity } from "./types";

/** Mean worse-direction z per indicator over the recent window (null = no data). */
export type WindowBadness = Partial<Record<IndicatorId, number | null>>;

export const DRIFT_OBJECTIVE_Z = 1.5;
export const DRIFT_CRITICAL_Z = 4;
export const MOOD_STABLE_Z = 1;
export const CREW_PULSE_Z = 1;

export interface DriftResult {
  severity: Severity | null;
  sleepWorse: boolean;
  vigilanceWorse: boolean;
  crewPulseWorse: boolean;
  moodStable: boolean;
}

/**
 * Behavioral drift = objective signals worsen (sleep ↓ AND reaction time/lapses ↑)
 * while self-reported mood stays steady → possible under-reporting.
 * If mood also drops, this is not "silent" drift; the regular mood rule covers it.
 * Critical requires a strong shift (both > DRIFT_CRITICAL_Z) AND a falling crew pulse.
 * Thresholds are demo parameters (not clinically validated).
 */
export function detectBehavioralDrift(w: WindowBadness, moodSignedZ: number | null): DriftResult {
  const sleep = w.sleepHours ?? null;
  const vigilance = maxDefined([w.pvtMeanRT ?? null, w.pvtLapses ?? null]);
  const crew = w.crewPulse ?? null;

  const sleepWorse = sleep !== null && sleep > DRIFT_OBJECTIVE_Z;
  const vigilanceWorse = vigilance !== null && vigilance > DRIFT_OBJECTIVE_Z;
  const crewPulseWorse = crew !== null && crew > CREW_PULSE_Z;
  const moodStable = moodSignedZ !== null && Math.abs(moodSignedZ) < MOOD_STABLE_Z;

  let severity: Severity | null = null;
  if (sleepWorse && vigilanceWorse && moodStable) {
    const strong = (sleep ?? 0) > DRIFT_CRITICAL_Z && (vigilance ?? 0) > DRIFT_CRITICAL_Z;
    severity = strong && crewPulseWorse ? "critical" : "watch";
  }
  return { severity, sleepWorse, vigilanceWorse, crewPulseWorse, moodStable };
}

function maxDefined(values: readonly (number | null)[]): number | null {
  const defined = values.filter((v): v is number => v !== null);
  return defined.length ? Math.max(...defined) : null;
}

/** Mean of the non-null entries, or null if there are fewer than `min`. */
export function windowMean(values: readonly (number | null)[], min = 3): number | null {
  const defined = values.filter((v): v is number => v !== null && Number.isFinite(v));
  return defined.length >= min ? mean(defined) : null;
}
