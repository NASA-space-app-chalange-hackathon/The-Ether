import { describe, expect, it } from "vitest";
import { evaluateMember } from "./evaluate";
import { crewGoal, dailyQuests, questProgress } from "./quests";
import { readingsFor } from "./testUtils";

describe("dailyQuests", () => {
  const calm = evaluateMember("A", readingsFor("A", "heartRate", 30, () => 60), 29);

  it("always includes the routine: check-in, exercise, hydration, crew time", () => {
    expect(dailyQuests(calm).map((q) => q.kind)).toEqual(["checkin", "exercise", "hydration", "crew"]);
  });

  it("adds targeted quests from alerts, with the triggering rule as the reason", () => {
    const quests = dailyQuests({ ...calm, alerts: [{ ...fakeAlert("bone-loss") }, { ...fakeAlert("radiation-event") }] });
    const kinds = quests.map((q) => q.kind);
    expect(kinds).toContain("resistance");
    expect(kinds).toContain("shelter");
    expect(kinds).not.toContain("exercise");
    expect(quests.find((q) => q.kind === "resistance")?.reason).toBe("bone-loss");
  });

  it("ids are stable per member/day/kind and steppe mode drops spacecraft exercise", () => {
    expect(dailyQuests(calm)[0].id).toBe("A:29:checkin");
    expect(dailyQuests(calm, "steppe").map((q) => q.kind)).not.toContain("exercise");
  });
});

function fakeAlert(ruleId: string) {
  return {
    id: `A:${ruleId}`, memberId: "A", ruleId, title: "", severity: "watch" as const, tier: "SELF" as const,
    day: 29, sinceDay: 29, whatChanged: "", whyItMatters: "", doNow: [], sources: [], evidence: [],
  };
}

describe("quest progress", () => {
  const day = (d: number, ex: number, sleep: number, crew: number) => [
    ...readingsFor("A", "heartRate", 1, () => 60).map((r) => ({ ...r, day: d })),
    ...readingsFor("A", "exerciseMinutes", 1, () => ex).map((r) => ({ ...r, day: d })),
    ...readingsFor("A", "sleepHours", 1, () => sleep).map((r) => ({ ...r, day: d })),
    ...readingsFor("A", "crewPulse", 1, () => crew).map((r) => ({ ...r, day: d })),
  ];

  it("derives routine completions, XP, level and streaks from data", () => {
    const rs = [...day(0, 120, 7.5, 4), ...day(1, 120, 6, 4), ...day(2, 30, 7.2, 3)];
    const p = questProgress(rs, 2);
    expect(p.doneByDay.map((d) => d.sort())).toEqual([
      ["checkin", "crew", "exercise", "sleep"],
      ["checkin", "crew", "exercise"],
      ["checkin", "sleep"],
    ]);
    expect(p.xp).toBe(70 + 45 + 35);
    expect(p.checkinStreak).toBe(3);
    expect(p.exerciseStreak).toBe(0);
    expect(questProgress(rs, 2, 1000).level).toBe(2);
  });

  it("crew goal is the share of routine quests done by everyone in the window", () => {
    const a = questProgress(day(0, 120, 8, 5), 0);
    const b = questProgress(day(0, 0, 5, 2), 0);
    const g = crewGoal({ A: a, B: b }, 0);
    expect(g).toEqual({ done: 5, possible: 8, pct: 5 / 8, byMember: { A: 4, B: 1 } });
  });
});
