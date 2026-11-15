import type { PvtResult } from "@/lib/engine/pvt";
import type { IndicatorId, Reading, ReadingSource } from "@/lib/engine/types";

/** Everything the Daily Check can collect; every field is optional. */
export interface CheckInDraft {
  heartRate?: number;
  heartRateSource?: "manual" | "camera";
  heartRateQuality?: number;
  pvt?: PvtResult | null;
  systolicBP?: number;
  diastolicBP?: number;
  glucose?: number;
  temperature?: number;
  spo2?: number;
  bodyMass?: number;
  sleepHours?: number;
  sleepQuality?: number;
  mood?: number;
  crewPulse?: number;
  coldExposure?: number;
  note?: string;
}

/** Plausible input bounds (data-entry validation, not clinical ranges). */
export const INPUT_BOUNDS: Partial<Record<IndicatorId, [number, number]>> = {
  heartRate: [30, 220],
  systolicBP: [70, 250],
  diastolicBP: [40, 150],
  glucose: [30, 500],
  temperature: [34, 42],
  spo2: [70, 100],
  bodyMass: [30, 200],
  sleepHours: [0, 16],
  coldExposure: [0, 24],
};

export function inBounds(id: IndicatorId, v: number | undefined): boolean {
  if (v === undefined) return true;
  const b = INPUT_BOUNDS[id];
  return Number.isFinite(v) && (!b || (v >= b[0] && v <= b[1]));
}

const SIMPLE: IndicatorId[] = ["systolicBP", "diastolicBP", "glucose", "temperature", "spo2", "bodyMass", "sleepHours", "sleepQuality", "mood", "crewPulse", "coldExposure"];

/** Convert a draft into engine readings for one member/day. Out-of-bounds values are dropped. */
export function draftToReadings(draft: CheckInDraft, memberId: string, day: number, timestamp: string): Reading[] {
  const out: Reading[] = [];
  const push = (indicator: IndicatorId, value: number | undefined, source: ReadingSource, quality?: number) => {
    if (value === undefined || !inBounds(indicator, value)) return;
    out.push({ memberId, indicator, value, day, timestamp, source, ...(quality !== undefined ? { quality } : {}) });
  };
  push("heartRate", draft.heartRate, draft.heartRateSource ?? "manual", draft.heartRateQuality);
  for (const id of SIMPLE) push(id, draft[id as keyof CheckInDraft] as number | undefined, "manual");
  if (draft.pvt && draft.pvt.meanRT !== null && draft.pvt.validTrials >= 3) {
    push("pvtMeanRT", draft.pvt.meanRT, "pvt");
    push("pvtLapses", draft.pvt.lapses, "pvt");
  }
  return out;
}
