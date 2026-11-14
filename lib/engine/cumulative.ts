import type { DailyValue } from "./baseline";
import { BASELINE_DAYS } from "./baseline";
import { median } from "./stats";
import type { Status } from "./types";

/** NASA career effective-dose limit (NASA-STD-3001; see SOURCES.nasaRadiationLimit). */
export const CAREER_LIMIT_MSV = 600;
/** A day counts as a particle event when dose > factor × the usual daily dose. Demo parameter. */
export const SPE_FACTOR = 3;
/** Minimum extra dose (mSv) above usual for an event. Demo parameter. */
export const SPE_MIN_EXCESS_MSV = 1;
/** Event guidance stays active this many days after the last spike. Demo parameter. */
export const SPE_ACTIVE_DAYS = 3;

export interface RadiationTracker {
  priorDose: number;
  missionDose: number;
  totalDose: number;
  fractionOfLimit: number;
  todayDose: number | null;
  usualDailyDose: number | null;
  eventActive: boolean;
  eventSinceDay: number | null;
  status: Status;
}

export function radiationTracker(series: readonly DailyValue[], day: number, priorDose = 0): RadiationTracker {
  const upto = series.filter((p) => p.day <= day);
  const missionDose = upto.reduce((s, p) => s + p.value, 0);
  const totalDose = priorDose + missionDose;
  const early = upto.filter((p) => p.day < BASELINE_DAYS).map((p) => p.value);
  const usual = early.length ? median(early) : null;
  const today = upto.find((p) => p.day === day)?.value ?? null;

  let eventSinceDay: number | null = null;
  if (usual !== null) {
    const isSpike = (v: number) => v > Math.max(usual * SPE_FACTOR, usual + SPE_MIN_EXCESS_MSV);
    const recent = upto.filter((p) => p.day > day - SPE_ACTIVE_DAYS && isSpike(p.value));
    if (recent.length) {
      // Walk back to the first spike day of this event.
      let first = Math.min(...recent.map((p) => p.day));
      const spikeDays = new Set(upto.filter((p) => isSpike(p.value)).map((p) => p.day));
      while (spikeDays.has(first - 1)) first -= 1;
      eventSinceDay = first;
    }
  }

  const fractionOfLimit = totalDose / CAREER_LIMIT_MSV;
  let status: Status = upto.length ? "ok" : "unknown";
  if (fractionOfLimit >= 0.5) status = "watch";
  if (fractionOfLimit >= 0.8 || eventSinceDay !== null) status = "critical";

  return {
    priorDose,
    missionDose,
    totalDose,
    fractionOfLimit,
    todayDose: today,
    usualDailyDose: usual,
    eventActive: eventSinceDay !== null,
    eventSinceDay,
    status,
  };
}

/** Daily exercise target (minutes). Demo parameter. */
export const EXERCISE_TARGET_MIN = 120;
/** Score gained per day with zero exercise; 100 ≈ a full 180-day mission with none. Demo parameter. */
export const BONE_DAILY_MAX = 100 / 180;
/** Fraction of that daily gain removed by full adherence. Demo parameter. */
export const EXERCISE_PROTECTION = 0.8;
export const ADHERENCE_WINDOW = 14;

export interface BoneTracker {
  /** 0–100 relative bone-loss risk score (demo model, not a BMD estimate). */
  score: number;
  /** 0–1 share of the exercise target met over the last 14 days. */
  adherence: number | null;
  status: Status;
  /** First day the score crossed the watch line, if it has. */
  sinceDay: number | null;
}

/** Adherence over the trailing window; days with no log count as no exercise. */
export function adherence(series: readonly DailyValue[], day: number, window = ADHERENCE_WINDOW): number | null {
  const start = Math.max(0, day - window + 1);
  const span = day - start + 1;
  if (span <= 0) return null;
  const byDay = new Map(series.map((p) => [p.day, p.value]));
  let total = 0;
  for (let d = start; d <= day; d++) total += Math.min(1, (byDay.get(d) ?? 0) / EXERCISE_TARGET_MIN);
  return total / span;
}

export const BONE_WATCH = 35;
export const BONE_CRITICAL = 70;

/** Adherence below this counts as "missing exercise". Demo parameter. */
export const LOW_ADHERENCE = 0.6;

/** First day of the current run of low adherence ending at `day`, or null if adherence is fine. */
export function lowAdherenceSince(series: readonly DailyValue[], day: number): number | null {
  const low = (d: number) => (adherence(series, d) ?? 1) < LOW_ADHERENCE;
  if (!series.some((p) => p.day <= day) || !low(day)) return null;
  let d = day;
  while (d > 0 && low(d - 1)) d -= 1;
  return d;
}

export function boneTracker(series: readonly DailyValue[], day: number): BoneTracker {
  if (!series.some((p) => p.day <= day)) return { score: 0, adherence: null, status: "unknown", sinceDay: null };
  let score = 0;
  let sinceDay: number | null = null;
  for (let d = 0; d <= day; d++) {
    const a = adherence(series, d) ?? 0;
    score += BONE_DAILY_MAX * (1 - EXERCISE_PROTECTION * a);
    if (sinceDay === null && score >= BONE_WATCH) sinceDay = d;
  }
  const status: Status = score >= BONE_CRITICAL ? "critical" : score >= BONE_WATCH ? "watch" : "ok";
  return { score: Math.min(100, score), adherence: adherence(series, day), status, sinceDay };
}
