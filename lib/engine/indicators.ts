import type { Indicator, IndicatorId } from "./types";

export interface IndicatorMeta extends Indicator {
  /** Floor for the baseline spread (SD units) so a flat series can't make tiny changes look huge. */
  minSpread: number;
  /** Decimal places for display. */
  decimals: number;
  /** Counts and 1–5 scales read better as "4 vs. your normal 1" than as a percentage. */
  changeAs?: "absolute";
}

/**
 * Indicator catalogue. `minSpread` values are demo parameters chosen to be
 * roughly the day-to-day measurement noise of each indicator. For 1–5 scales it is
 * 0.5 so a one-point change (z = 2) never counts as a deviation on its own.
 */
export const INDICATORS: Record<IndicatorId, IndicatorMeta> = {
  heartRate: { id: "heartRate", label: "Resting heart rate", unit: "bpm", worseWhen: "both", minSpread: 2, decimals: 0 },
  hrv: { id: "hrv", label: "Heart rate variability (RMSSD)", unit: "ms", worseWhen: "lower", minSpread: 3, decimals: 0 },
  systolicBP: { id: "systolicBP", label: "Systolic blood pressure", unit: "mmHg", worseWhen: "both", minSpread: 3, decimals: 0 },
  diastolicBP: { id: "diastolicBP", label: "Diastolic blood pressure", unit: "mmHg", worseWhen: "both", minSpread: 2, decimals: 0 },
  glucose: { id: "glucose", label: "Blood glucose", unit: "mg/dL", worseWhen: "both", minSpread: 5, decimals: 0 },
  temperature: { id: "temperature", label: "Body temperature", unit: "°C", worseWhen: "higher", minSpread: 0.15, decimals: 1 },
  spo2: { id: "spo2", label: "Blood oxygen (SpO₂)", unit: "%", worseWhen: "lower", minSpread: 0.7, decimals: 0 },
  bodyMass: { id: "bodyMass", label: "Body mass", unit: "kg", worseWhen: "lower", minSpread: 0.4, decimals: 1 },
  sleepHours: { id: "sleepHours", label: "Sleep duration", unit: "h", worseWhen: "lower", minSpread: 0.4, decimals: 1 },
  sleepQuality: { id: "sleepQuality", label: "Sleep quality", unit: "/5", worseWhen: "lower", minSpread: 0.5, decimals: 0, changeAs: "absolute" },
  mood: { id: "mood", label: "Self-reported mood", unit: "/5", worseWhen: "lower", minSpread: 0.5, decimals: 0, changeAs: "absolute" },
  crewPulse: { id: "crewPulse", label: "Crew pulse (teamwork)", unit: "/5", worseWhen: "lower", minSpread: 0.5, decimals: 0, changeAs: "absolute" },
  pvtMeanRT: { id: "pvtMeanRT", label: "Reaction time (PVT mean)", unit: "ms", worseWhen: "higher", minSpread: 15, decimals: 0 },
  pvtLapses: { id: "pvtLapses", label: "Attention lapses (PVT)", unit: "", worseWhen: "higher", minSpread: 1, decimals: 0, changeAs: "absolute" },
  exerciseMinutes: { id: "exerciseMinutes", label: "Exercise", unit: "min", worseWhen: "lower", minSpread: 10, decimals: 0 },
  radiationDose: { id: "radiationDose", label: "Radiation dose (daily)", unit: "mSv", worseWhen: "higher", minSpread: 0.1, decimals: 2 },
};

export const INDICATOR_IDS = Object.keys(INDICATORS) as IndicatorId[];
