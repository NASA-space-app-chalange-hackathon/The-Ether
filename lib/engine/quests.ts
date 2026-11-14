import type { MemberAssessment } from "./evaluate";
import type { RuleId } from "./escalation";

export type QuestKind = "checkin" | "exercise" | "resistance" | "sleep" | "hydration" | "crew" | "shelter" | "rest" | "bp";

export interface Quest {
  /** Stable per member per day: `${memberId}:${day}:${kind}`. */
  id: string;
  kind: QuestKind;
  xp: number;
  /** The alert rule that generated this quest, if any (explainability). */
  reason: RuleId | null;
  /** Counts toward the shared crew goal. */
  crewGoal: boolean;
}

/** XP values are game-design parameters, not health metrics. */
const XP: Record<QuestKind, number> = {
  checkin: 10,
  exercise: 20,
  resistance: 30,
  sleep: 25,
  hydration: 5,
  crew: 15,
  shelter: 30,
  rest: 15,
  bp: 15,
};

/**
 * Today's quests for one member, generated from the engine: a fixed daily
 * routine plus targeted quests for whatever the engine is worried about.
 */
export function dailyQuests(a: MemberAssessment, mode: "space" | "steppe" = "space"): Quest[] {
  const has = (rule: RuleId) => a.alerts.some((x) => x.ruleId === rule);
  const q = (kind: QuestKind, reason: RuleId | null = null, crewGoal = true): Quest => ({
    id: `${a.memberId}:${a.day}:${kind}`,
    kind,
    xp: XP[kind],
    reason,
    crewGoal,
  });

  const quests: Quest[] = [q("checkin")];
  if (has("radiation-event")) quests.push(q("shelter", "radiation-event"));
  if (has("behavioral-drift") || has("sleep")) quests.push(q("sleep", has("behavioral-drift") ? "behavioral-drift" : "sleep"));
  if (has("vigilance") || has("behavioral-drift")) quests.push(q("rest", has("vigilance") ? "vigilance" : "behavioral-drift"));
  if (has("cardiovascular")) quests.push(q("bp", "cardiovascular"));
  if (mode === "space") {
    quests.push(has("bone-loss") || has("fitness") ? q("resistance", has("bone-loss") ? "bone-loss" : "fitness") : q("exercise"));
  }
  quests.push(q("hydration", null, false));
  quests.push(q("crew", has("teamwork") ? "teamwork" : null));
  return quests;
}
