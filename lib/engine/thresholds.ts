import { DEMO_PARAMETER, SOURCES } from "./sources";
import type { IndicatorId, Severity, Source } from "./types";

export interface AbsoluteThreshold {
  indicator: IndicatorId;
  op: "<" | "<=" | ">" | ">=";
  value: number;
  severity: Severity;
  /** Plain-language label shown in alerts. */
  label: string;
  source: Source;
}

/**
 * Absolute safety thresholds. These act on a single reading, regardless of the
 * personal baseline. Every entry carries a source or the demo-parameter label.
 */
export const THRESHOLDS: readonly AbsoluteThreshold[] = [
  { indicator: "spo2", op: "<=", value: 94, severity: "watch", label: "SpO₂ at or below 94% — assess the cause promptly", source: SOURCES.whoPulseOx },
  { indicator: "spo2", op: "<", value: 90, severity: "critical", label: "SpO₂ below 90% — clinical emergency", source: SOURCES.whoPulseOx },
  { indicator: "systolicBP", op: ">=", value: 140, severity: "watch", label: "Systolic ≥140 mmHg (stage 2 range)", source: SOURCES.accAha2017 },
  { indicator: "systolicBP", op: ">", value: 180, severity: "critical", label: "Systolic >180 mmHg (crisis range)", source: SOURCES.accAha2017 },
  { indicator: "diastolicBP", op: ">=", value: 90, severity: "watch", label: "Diastolic ≥90 mmHg (stage 2 range)", source: SOURCES.accAha2017 },
  { indicator: "diastolicBP", op: ">", value: 120, severity: "critical", label: "Diastolic >120 mmHg (crisis range)", source: SOURCES.accAha2017 },
  { indicator: "glucose", op: "<", value: 70, severity: "watch", label: "Glucose below 70 mg/dL (low)", source: SOURCES.adaHypoglycemia },
  { indicator: "glucose", op: "<", value: 54, severity: "critical", label: "Glucose below 54 mg/dL (very low)", source: DEMO_PARAMETER },
  { indicator: "glucose", op: ">", value: 180, severity: "watch", label: "Glucose above 180 mg/dL (high)", source: DEMO_PARAMETER },
  { indicator: "glucose", op: ">", value: 250, severity: "critical", label: "Glucose above 250 mg/dL (very high)", source: DEMO_PARAMETER },
  { indicator: "temperature", op: ">=", value: 38.0, severity: "watch", label: "Temperature ≥38.0 °C (fever)", source: SOURCES.cdcFever },
  { indicator: "temperature", op: ">=", value: 39.0, severity: "critical", label: "Temperature ≥39.0 °C (high fever)", source: DEMO_PARAMETER },
  { indicator: "heartRate", op: ">", value: 100, severity: "watch", label: "Resting heart rate above 100 bpm", source: DEMO_PARAMETER },
  { indicator: "heartRate", op: "<", value: 40, severity: "watch", label: "Resting heart rate below 40 bpm", source: DEMO_PARAMETER },
  { indicator: "sleepHours", op: "<", value: 4, severity: "watch", label: "Less than 4 hours of sleep", source: DEMO_PARAMETER },
];

function crosses(value: number, t: AbsoluteThreshold): boolean {
  switch (t.op) {
    case "<":
      return value < t.value;
    case "<=":
      return value <= t.value;
    case ">":
      return value > t.value;
    case ">=":
      return value >= t.value;
  }
}

/** The most severe threshold a reading crosses, or null. */
export function checkThreshold(indicator: IndicatorId, value: number): AbsoluteThreshold | null {
  const hits = THRESHOLDS.filter((t) => t.indicator === indicator && crosses(value, t));
  return hits.find((t) => t.severity === "critical") ?? hits[0] ?? null;
}
