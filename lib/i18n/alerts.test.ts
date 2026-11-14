import { describe, expect, it } from "vitest";
import { RULES_MN } from "@/content/rules-mn";
import { RULES } from "@/lib/engine/escalation";
import type { Alert } from "@/lib/engine/types";
import { localizeAlert } from "./alerts";

const alert: Alert = {
  id: "h:cardiovascular", memberId: "herder-1", ruleId: "cardiovascular", title: "Heart & blood pressure trend",
  severity: "critical", tier: "EARTH", day: 27, sinceDay: 18, whatChanged: "English", whyItMatters: "English",
  doNow: RULES.cardiovascular.steps.map((s) => ({ ...s })), sources: [],
  evidence: [{ indicator: "systolicBP", value: 148, baseline: 126, zScore: 4, percentChange: 17.5, sinceDay: 18 }],
};

describe("Mongolian alert content", () => {
  it("covers every rule with the same number of steps as the engine", () => {
    for (const [id, rule] of Object.entries(RULES)) {
      expect(RULES_MN[id as keyof typeof RULES_MN].steps, id).toHaveLength(rule.steps.length);
    }
  });
  it("localizes title, why, steps and rebuilds what-changed from evidence", () => {
    const mn = localizeAlert(alert, "mn");
    expect(mn.title).toBe(RULES_MN.cardiovascular.title);
    expect(mn.doNow.map((s) => s.text)).toEqual(RULES_MN.cardiovascular.steps);
    expect(mn.whatChanged).toBe("Систолын даралт +18% таны хэвийнээс — 10 хоног (18-р өдрөөс). Аюулгүйн босго давсан: Систолын даралт.");
    expect(localizeAlert(alert, "en")).toBe(alert);
  });
});
