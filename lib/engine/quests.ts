import type { MemberAssessment } from "./evaluate";
import type { RuleId } from "./escalation";
import type { Reading } from "./types";

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

// ---------- history, XP, streaks, crew goal ----------

/** XP per level (game-design parameter). */
export const LEVEL_XP = 1000;
/** Routine quests that can be verified from data on past days. */
export const ROUTINE: readonly QuestKind[] = ["checkin", "exercise", "sleep", "crew"];
/** Thresholds for counting a routine quest as done from data (game-design parameters). */
export const EXERCISE_DONE_MIN = 90;
export const SLEEP_DONE_H = 7;
export const CREW_DONE_PULSE = 4;

/** Routine quests a day's readings show were completed. */
export function autoCompleted(dayReadings: readonly Reading[]): Set<QuestKind> {
  const done = new Set<QuestKind>();
  const val = (id: Reading["indicator"]) => dayReadings.find((r) => r.indicator === id)?.value;
  if (dayReadings.length > 0) done.add("checkin");
  if ((val("exerciseMinutes") ?? 0) >= EXERCISE_DONE_MIN) done.add("exercise");
  if ((val("sleepHours") ?? 0) >= SLEEP_DONE_H) done.add("sleep");
  if ((val("crewPulse") ?? 0) >= CREW_DONE_PULSE) done.add("crew");
  return done;
}

export interface QuestProgress {
  xp: number;
  level: number;
  /** 0–1 progress to the next level. */
  levelProgress: number;
  checkinStreak: number;
  exerciseStreak: number;
  /** Routine quests done per day (index = day). */
  doneByDay: QuestKind[][];
}

function streak(doneByDay: readonly QuestKind[][], kind: QuestKind, uptoDay: number): number {
  let n = 0;
  for (let d = uptoDay; d >= 0 && doneByDay[d]?.includes(kind); d--) n++;
  return n;
}

/** XP/level/streaks from data up to `uptoDay`, plus XP from manually ticked quest ids. */
export function questProgress(readings: readonly Reading[], uptoDay: number, extraXp = 0): QuestProgress {
  const byDay: Reading[][] = Array.from({ length: uptoDay + 1 }, () => []);
  for (const r of readings) if (r.day <= uptoDay && r.day >= 0) byDay[r.day].push(r);
  const doneByDay = byDay.map((rs) => [...autoCompleted(rs)]);
  const xp = doneByDay.reduce((sum, kinds) => sum + kinds.reduce((s, k) => s + XP[k], 0), 0) + extraXp;
  return {
    xp,
    level: Math.floor(xp / LEVEL_XP) + 1,
    levelProgress: (xp % LEVEL_XP) / LEVEL_XP,
    checkinStreak: streak(doneByDay, "checkin", uptoDay),
    exerciseStreak: streak(doneByDay, "exercise", uptoDay),
    doneByDay,
  };
}

export interface CrewGoal {
  done: number;
  possible: number;
  pct: number;
  /** Routine quests done per member in the window. */
  byMember: Record<string, number>;
}

/** Cooperative goal: share of routine quests the whole crew completed in the last `windowDays`. */
export function crewGoal(progress: Record<string, QuestProgress>, uptoDay: number, windowDays = 7): CrewGoal {
  const from = Math.max(0, uptoDay - windowDays + 1);
  const span = uptoDay - from + 1;
  const byMember: Record<string, number> = {};
  for (const [id, p] of Object.entries(progress)) {
    byMember[id] = 0;
    for (let d = from; d <= uptoDay; d++) byMember[id] += p.doneByDay[d]?.length ?? 0;
  }
  const done = Object.values(byMember).reduce((s, v) => s + v, 0);
  const possible = Object.keys(progress).length * span * ROUTINE.length;
  return { done, possible, pct: possible ? done / possible : 0, byMember };
}
