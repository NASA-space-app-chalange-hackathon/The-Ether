import type { IndicatorId } from "./types";

/**
 * NASA HRP's five hazards of human spaceflight (https://www.nasa.gov/hrp/hazards/).
 * HRP's risk pages don't name a hazard, so the tags below are our mapping, based on
 * how the Hazards page describes each one (e.g. Distance from Earth: supplies and
 * medical care become harder to receive; Hostile/Closed Environments: the spacecraft
 * ecosystem — temperature, pressure, air).
 */
export type HazardId = "radiation" | "isolation" | "distance" | "gravity" | "environment";

export const HAZARD_IDS: readonly HazardId[] = ["radiation", "isolation", "distance", "gravity", "environment"];

/** The hazard(s) each indicator mainly tracks. */
export const INDICATOR_HAZARDS: Record<IndicatorId, readonly HazardId[]> = {
  heartRate: ["gravity"],
  hrv: ["gravity"],
  systolicBP: ["gravity"],
  diastolicBP: ["gravity"],
  glucose: ["distance", "environment"],
  temperature: ["environment"],
  spo2: ["environment"],
  bodyMass: ["distance", "gravity"],
  sleepHours: ["isolation", "environment"],
  sleepQuality: ["isolation", "environment"],
  mood: ["isolation"],
  crewPulse: ["isolation"],
  pvtMeanRT: ["isolation"],
  pvtLapses: ["isolation"],
  exerciseMinutes: ["gravity"],
  radiationDose: ["radiation"],
};
