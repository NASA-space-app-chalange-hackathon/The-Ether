/**
 * Core domain types for The Ether health engine.
 * Kept framework-free so the engine stays pure and unit-testable.
 */

/** Who an alert's action is assigned to. */
export type Tier = "SELF" | "CMO" | "EARTH";

/** Engine status for an indicator, body region, or person. "unknown" = no data (grey). */
export type Status = "ok" | "watch" | "critical" | "unknown";

/** Operating environment; drives signal delay and context-specific risks. */
export type Environment = "transit" | "iss" | "lunar" | "mars" | "rover" | "steppe";

/** Identifier for every measurable health indicator. */
export type IndicatorId =
  | "heartRate"
  | "systolicBP"
  | "diastolicBP"
  | "glucose"
  | "temperature"
  | "spo2"
  | "bodyMass"
  | "sleepHours"
  | "sleepQuality"
  | "mood"
  | "crewPulse"
  | "pvtMeanRT"
  | "pvtLapses"
  | "exerciseMinutes"
  | "radiationDose";

/** How a reading was captured. */
export type ReadingSource = "camera" | "manual" | "pvt" | "seed" | "sensor";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  /** Abstract avatar key; never a photo. */
  avatar: string;
  /** Whether this member shares detailed data with the crew (privacy rule). */
  sharesDetails: boolean;
}

export interface Indicator {
  id: IndicatorId;
  label: string;
  unit: string;
  /** Direction that is worse; used to word alerts ("dropped" vs "rose"). */
  worseWhen: "higher" | "lower" | "both";
}

export interface Reading {
  /** Auto-incremented by Dexie; absent before insert. */
  id?: number;
  memberId: string;
  indicator: IndicatorId;
  value: number;
  /** Mission day (0-based). */
  day: number;
  /** ISO timestamp of capture. */
  timestamp: string;
  source: ReadingSource;
  /** Optional 0–1 signal-quality score (e.g. camera rPPG). */
  quality?: number;
}

export interface Baseline {
  memberId: string;
  indicator: IndicatorId;
  /** Robust centre (median, then EWMA-updated). */
  center: number;
  /** Robust spread (MAD × 1.4826), as an SD estimate. */
  spread: number;
  /** Number of readings the baseline was built from. */
  n: number;
  /** Last mission day included in the baseline. */
  updatedDay: number;
  /** True while updates are frozen because the member is in an alert state. */
  frozen: boolean;
}

export interface AlertEvidence {
  indicator: IndicatorId;
  value: number;
  baseline: number;
  zScore: number;
  /** Percent change vs. baseline. */
  percentChange: number;
  sinceDay: number;
}

export interface Alert {
  id: string;
  memberId: string;
  /** Rule that fired, e.g. "behavioral-drift" or "systolicBP-threshold". */
  ruleId: string;
  severity: Exclude<Status, "ok" | "unknown">;
  tier: Tier;
  day: number;
  /** What changed — plain language. */
  whatChanged: string;
  /** Why it matters — hazard + HRP risk. */
  whyItMatters: string;
  /** Concrete steps to take now. */
  doNow: string[];
  /** Citation(s) backing the rule. */
  sources: string[];
  /** Inputs that triggered the alert, so the UI can explain it. */
  evidence: AlertEvidence[];
  acknowledged: boolean;
}
