import { describe, expect, it } from "vitest";
import { arrivalTime, composeGroundMessage } from "./message";
import type { Alert } from "./types";

const alert: Alert = {
  id: "orion-c:cardiovascular", memberId: "orion-c", ruleId: "cardiovascular", title: "Heart & blood pressure trend",
  severity: "critical", tier: "EARTH", day: 95, sinceDay: 84, whatChanged: "Resting heart rate +17% vs. your normal.",
  whyItMatters: "", doNow: [], sources: [],
  evidence: [{ indicator: "systolicBP", value: 139, baseline: 118, zScore: 3.6, percentChange: 18, sinceDay: 84 }],
};

describe("composeGroundMessage", () => {
  it("summarises the alert, evidence and what was done", () => {
    const msg = composeGroundMessage({ alert, memberName: "ORION-C", completed: ["Re-measured BP"] });
    expect(msg).toContain("ORION-C, mission day 95");
    expect(msg).toContain("act now");
    expect(msg).toContain("Systolic blood pressure: 139 mmHg (normal 118, z 3.6)");
    expect(msg).toContain("- Re-measured BP");
  });
  it("says when nothing was done yet", () => {
    expect(composeGroundMessage({ alert, memberName: "ORION-C", completed: [] })).toContain("nothing yet");
  });
  it("arrival = sent + delay", () => expect(arrivalTime(1000, 325)).toBe(326_000));
});
