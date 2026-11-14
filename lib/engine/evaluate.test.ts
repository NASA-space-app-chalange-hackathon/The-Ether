import { describe, expect, it } from "vitest";
import { evaluateIndicator, evaluateMember, toDailySeries } from "./evaluate";
import { allRegionStatuses } from "./regions";
import { readingsFor, rng } from "./testUtils";
import type { Reading } from "./types";

const noisy = (seed: number, sd: number) => {
  const r = rng(seed);
  return () => (r() + r() + r() - 1.5) * sd * 2;
};

describe("evaluateIndicator", () => {
  it("flags a sustained rise and freezes the baseline during the alert", () => {
    const n = noisy(1, 1);
    const series = toDailySeries(
      readingsFor("C", "heartRate", 60, (d) => 60 + n() + (d >= 40 ? 12 : 0)),
      "heartRate",
      59,
    );
    const st = evaluateIndicator("C", "heartRate", series, 59);
    expect(st.status).toBe("critical");
    expect(st.sinceDay).toBeGreaterThanOrEqual(40);
    expect(st.sinceDay).toBeLessThanOrEqual(42);
    // Frozen: the baseline did not drift up toward 72.
    expect(st.baseline!.center).toBeLessThan(62);
    expect(st.baseline!.frozen).toBe(true);
  });

  it("stays ok on a noisy but stable series", () => {
    const n = noisy(2, 1.5);
    const series = toDailySeries(readingsFor("A", "heartRate", 90, () => 62 + n()), "heartRate", 89);
    expect(evaluateIndicator("A", "heartRate", series, 89).status).toBe("ok");
  });

  it("is learning during the first 14 days but still applies absolute thresholds", () => {
    const series = toDailySeries(readingsFor("A", "spo2", 5, (d) => (d === 4 ? 88 : 98)), "spo2", 4);
    const st = evaluateIndicator("A", "spo2", series, 4);
    expect(st.learning).toBe(true);
    expect(st.status).toBe("critical");
    expect(st.threshold?.source.id).toBe("whoPulseOx");
  });

  it("stale data → unknown; no data → unknown", () => {
    const series = toDailySeries(readingsFor("A", "glucose", 20, () => 95), "glucose", 40);
    expect(evaluateIndicator("A", "glucose", series, 40).status).toBe("unknown");
    expect(evaluateIndicator("A", "glucose", [], 40).status).toBe("unknown");
  });

  it("a user-entered reading replaces seeded data for that day", () => {
    const seed = readingsFor("A", "spo2", 3, () => 97);
    const manual = { ...seed[2], value: 88, source: "manual" as const };
    expect(toDailySeries([...seed, manual], "spo2", 2).map((p) => p.value)).toEqual([97, 97, 88]);
    expect(toDailySeries([manual, ...seed], "spo2", 2).map((p) => p.value)).toEqual([97, 97, 88]);
  });

  it("averages multiple readings on the same day", () => {
    const rs = [...readingsFor("A", "heartRate", 1, () => 60), ...readingsFor("A", "heartRate", 1, () => 70)];
    expect(toDailySeries(rs, "heartRate", 0)).toEqual([{ day: 0, value: 65 }]);
  });
});

describe("evaluateMember", () => {
  /** A crew member with stable vitals and an optional hidden-fatigue episode. */
  function member(id: string, drift: boolean): Reading[] {
    const n = noisy(7, 1);
    const inDrift = (d: number) => drift && d >= 60 && d <= 75;
    return [
      ...readingsFor(id, "heartRate", 80, () => 60 + n()),
      ...readingsFor(id, "sleepHours", 80, (d) => 7 + n() * 0.2 - (inDrift(d) ? 1.6 : 0)),
      ...readingsFor(id, "pvtMeanRT", 80, (d) => 280 + n() * 8 + (inDrift(d) ? 55 : 0)),
      ...readingsFor(id, "pvtLapses", 80, (d) => Math.max(0, Math.round(1 + n() * 0.4 + (inDrift(d) ? 3 : 0)))),
      ...readingsFor(id, "mood", 80, () => 4),
      ...readingsFor(id, "crewPulse", 80, () => 4),
      ...readingsFor(id, "exerciseMinutes", 80, () => 120),
      ...readingsFor(id, "radiationDose", 80, () => 1.8),
    ];
  }

  it("detects hidden fatigue: drift alert at CMO tier with explainable evidence", () => {
    const a = evaluateMember("B", member("B", true), 70);
    const alert = a.alerts.find((x) => x.ruleId === "behavioral-drift");
    expect(alert).toBeDefined();
    expect(alert!.tier).toBe("CMO");
    expect(alert!.sinceDay).toBeGreaterThanOrEqual(60);
    expect(alert!.evidence.map((e) => e.indicator)).toContain("sleepHours");
    expect(alert!.whatChanged).toMatch(/hidden fatigue/);
    // Sleep/vigilance alerts are merged into the composite, not duplicated.
    expect(a.alerts.some((x) => x.ruleId === "sleep" || x.ruleId === "vigilance")).toBe(false);
    expect(allRegionStatuses(a).brain).not.toBe("ok");
  });

  it("no drift → no alerts and an all-green body", () => {
    const a = evaluateMember("A", member("A", false), 70);
    expect(a.alerts).toEqual([]);
    expect(a.overall).toBe("ok");
    const regions = allRegionStatuses(a);
    expect(regions.heart).toBe("ok");
    expect(regions.eyes).toBe("unknown");
  });

  it("is deterministic and ignores other members' readings", () => {
    const all = [...member("A", false), ...member("B", true)];
    expect(evaluateMember("A", all, 70)).toEqual(evaluateMember("A", member("A", false), 70));
  });
});
