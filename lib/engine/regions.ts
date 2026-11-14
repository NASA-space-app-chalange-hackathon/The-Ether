import type { RuleId } from "./escalation";
import type { MemberAssessment } from "./evaluate";
import { worstStatus } from "./persistence";
import type { IndicatorId, Status } from "./types";

export type RegionId = "brain" | "eyes" | "heart" | "lungs" | "bones" | "muscles" | "immune" | "gut" | "radiation";

/** Which indicators colour each body region. Regions with none show grey (no data). */
export const REGION_INDICATORS: Record<RegionId, readonly IndicatorId[]> = {
  brain: ["sleepHours", "sleepQuality", "pvtMeanRT", "pvtLapses", "mood", "crewPulse"],
  eyes: [],
  heart: ["heartRate", "hrv", "systolicBP", "diastolicBP"],
  lungs: ["spo2"],
  bones: [],
  muscles: ["exerciseMinutes", "bodyMass"],
  immune: ["temperature"],
  gut: ["glucose", "bodyMass"],
  radiation: ["radiationDose"],
};

export const REGION_IDS = Object.keys(REGION_INDICATORS) as RegionId[];

/** Alert rules whose actions belong to each region's panel. */
export const REGION_RULES: Record<RegionId, readonly RuleId[]> = {
  brain: ["behavioral-drift", "sleep", "vigilance", "mood", "teamwork"],
  eyes: [],
  heart: ["cardiovascular"],
  lungs: ["hypoxia"],
  bones: ["bone-loss"],
  muscles: ["fitness", "nutrition"],
  immune: ["fever"],
  gut: ["glucose", "nutrition"],
  radiation: ["radiation-event", "radiation-cumulative"],
};

/** Engine status for one body region, including composite and tracker signals. */
export function regionStatus(a: MemberAssessment, region: RegionId): Status {
  const fromIndicators = REGION_INDICATORS[region].map((id) => a.indicators[id].status);
  switch (region) {
    case "brain":
      return worstStatus([...fromIndicators, a.drift.severity ?? "unknown"]);
    case "bones":
      return a.bone.status;
    case "muscles":
      return worstStatus([...fromIndicators, a.bone.status === "critical" ? "watch" : "unknown"]);
    case "radiation":
      return a.radiation.status;
    default:
      return worstStatus(fromIndicators);
  }
}

export function allRegionStatuses(a: MemberAssessment): Record<RegionId, Status> {
  return Object.fromEntries(REGION_IDS.map((r) => [r, regionStatus(a, r)])) as Record<RegionId, Status>;
}
