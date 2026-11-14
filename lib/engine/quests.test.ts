import { describe, expect, it } from "vitest";
import { evaluateMember } from "./evaluate";
import { dailyQuests } from "./quests";
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
