import { describe, expect, it } from "vitest";
import { RULES, resolveTier, stepsUpTo } from "./escalation";

describe("escalation ladder", () => {
  const cardio = RULES.cardiovascular;
  it("short watch → SELF, persistent watch → CMO, critical → EARTH", () => {
    expect(resolveTier(cardio, "watch", 1)).toBe("SELF");
    expect(resolveTier(cardio, "watch", 3)).toBe("CMO");
    expect(resolveTier(cardio, "critical", 1)).toBe("EARTH");
  });
  it("behavioral drift goes straight to the CMO", () => {
    expect(resolveTier(RULES["behavioral-drift"], "watch", 1)).toBe("CMO");
  });
  it("steps include SELF up to the assigned tier only", () => {
    const tiers = new Set(stepsUpTo(cardio, "CMO").map((s) => s.tier));
    expect([...tiers].sort()).toEqual(["CMO", "SELF"]);
  });
  it("every rule cites at least one source", () => {
    for (const r of Object.values(RULES)) expect(r.sources.length).toBeGreaterThan(0);
  });
});
