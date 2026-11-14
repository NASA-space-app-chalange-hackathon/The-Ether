import { describe, expect, it } from "vitest";
import { detectBehavioralDrift } from "./composite";
import { adherence, boneTracker, CAREER_LIMIT_MSV, radiationTracker } from "./cumulative";
import { checkThreshold, THRESHOLDS } from "./thresholds";

describe("absolute thresholds", () => {
  it("returns the most severe threshold crossed", () => {
    expect(checkThreshold("spo2", 89)?.severity).toBe("critical");
    expect(checkThreshold("spo2", 93)?.severity).toBe("watch");
    expect(checkThreshold("spo2", 98)).toBeNull();
    expect(checkThreshold("systolicBP", 145)?.severity).toBe("watch");
    expect(checkThreshold("temperature", 38.0)?.severity).toBe("watch");
  });
  it("every threshold has a source (or the demo label)", () => {
    for (const t of THRESHOLDS) expect(t.source.title.length).toBeGreaterThan(0);
  });
});

describe("behavioral drift composite", () => {
  it("fires when sleep and vigilance worsen while mood is stable", () => {
    expect(detectBehavioralDrift({ sleepHours: 2, pvtMeanRT: 2, crewPulse: 0 }, 0.2).severity).toBe("watch");
  });
  it("escalates to critical only with a strong shift plus a falling crew pulse", () => {
    expect(detectBehavioralDrift({ sleepHours: 5, pvtMeanRT: 5, crewPulse: 0 }, 0).severity).toBe("watch");
    expect(detectBehavioralDrift({ sleepHours: 5, pvtMeanRT: 5, crewPulse: 2 }, 0).severity).toBe("critical");
  });
  it("does not fire if mood also dropped (not silent)", () => {
    expect(detectBehavioralDrift({ sleepHours: 2, pvtMeanRT: 2 }, -2).severity).toBeNull();
  });
  it("needs both sleep and vigilance", () => {
    expect(detectBehavioralDrift({ sleepHours: 2, pvtMeanRT: 0.5 }, 0).severity).toBeNull();
  });
  it("missing data never triggers", () => {
    expect(detectBehavioralDrift({}, null).severity).toBeNull();
  });
});

describe("radiation tracker", () => {
  const dose = (day: number) => ({ day, value: day === 40 || day === 41 ? 30 : 1.8 });
  const series = Array.from({ length: 60 }, (_, d) => dose(d));
  it("detects a particle event and when it started", () => {
    const r = radiationTracker(series, 41);
    expect(r.eventActive).toBe(true);
    expect(r.eventSinceDay).toBe(40);
    expect(r.status).toBe("critical");
  });
  it("event clears after a few quiet days", () => expect(radiationTracker(series, 50).eventActive).toBe(false));
  it("tracks the career-limit fraction including prior dose", () => {
    const r = radiationTracker(series, 59, 100);
    expect(r.totalDose).toBeCloseTo(100 + 58 * 1.8 + 60);
    expect(r.fractionOfLimit).toBeCloseTo(r.totalDose / CAREER_LIMIT_MSV);
  });
  it("no data → unknown", () => expect(radiationTracker([], 10).status).toBe("unknown"));
});

describe("bone tracker", () => {
  const full = Array.from({ length: 180 }, (_, day) => ({ day, value: 120 }));
  const none = Array.from({ length: 180 }, (_, day) => ({ day, value: 0 }));
  it("adherence counts missing days as no exercise", () => {
    expect(adherence(full, 20)).toBe(1);
    expect(adherence([{ day: 20, value: 120 }], 20)).toBeCloseTo(1 / 14);
  });
  it("skipping exercise builds risk much faster than full adherence", () => {
    expect(boneTracker(none, 179).score).toBeGreaterThan(boneTracker(full, 179).score * 3);
    expect(boneTracker(none, 179).status).toBe("critical");
    expect(boneTracker(full, 179).status).toBe("ok");
  });
});
