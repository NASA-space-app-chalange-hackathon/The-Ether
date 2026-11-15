import type { CrewMember, IndicatorId, Reading } from "@/lib/engine/types";

export type MissionEventKind = "launch" | "solar" | "drift" | "cardio" | "bone" | "cold";

export interface MissionEvent {
  day: number;
  kind: MissionEventKind;
  icon: string;
  label: string;
  /** Set when the event comes from real NASA data replayed on the mission timeline. */
  real?: RealEventRef;
}

export interface RealEventRef {
  source: "DONKI" | "POWER";
  /** Real calendar date (yyyy-mm-dd). */
  realDate: string;
  url?: string;
  /** POWER: daily minimum temperature (°C). */
  tMin?: number;
}

export interface DatasetMember extends CrewMember {
  /** Radiation dose from earlier missions (mSv). */
  priorDose: number;
}

/** Compact on-disk format: one value (or null = not logged) per day per indicator. */
export interface MissionDataset {
  version: number;
  kind: "mission" | "steppe";
  seed: number;
  days: number;
  /** Fictional calendar date of day 0 (ISO yyyy-mm-dd). */
  startDate: string;
  members: DatasetMember[];
  events: MissionEvent[];
  series: Record<string, Partial<Record<IndicatorId, (number | null)[]>>>;
}

const DAY_MS = 86_400_000;

/** ISO timestamp for a mission day (08:00 UTC check-in). */
export function dayToTimestamp(startDate: string, day: number): string {
  return new Date(Date.parse(`${startDate}T08:00:00Z`) + day * DAY_MS).toISOString();
}

/** Expand the compact dataset into engine Readings. */
export function expandReadings(ds: MissionDataset): Reading[] {
  const out: Reading[] = [];
  for (const [memberId, byIndicator] of Object.entries(ds.series)) {
    for (const [indicator, values] of Object.entries(byIndicator) as [IndicatorId, (number | null)[]][]) {
      values.forEach((value, day) => {
        if (value === null) return;
        out.push({ memberId, indicator, value, day, timestamp: dayToTimestamp(ds.startDate, day), source: "seed" });
      });
    }
  }
  return out;
}
