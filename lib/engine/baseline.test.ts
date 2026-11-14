import { describe, expect, it } from "vitest";
import { BASELINE_DAYS, EWMA_ALPHA, buildBaseline, updateBaseline } from "./baseline";
import { INDICATORS } from "./indicators";

const series = (vals: number[]) => vals.map((value, day) => ({ day, value }));

describe("buildBaseline", () => {
  it("uses median + MAD×1.4826 from the first 14 days only", () => {
    const vals = [60, 62, 61, 63, 59, 60, 62, 61, 60, 64, 58, 61, 62, 60, 100, 100];
    const b = buildBaseline("A", "heartRate", series(vals))!;
    expect(b.center).toBe(61);
    expect(b.spread).toBeCloseTo(1 * 1.4826 > INDICATORS.heartRate.minSpread ? 1.4826 : INDICATORS.heartRate.minSpread);
    expect(b.n).toBe(BASELINE_DAYS);
  });

  it("constant series (MAD = 0) falls back to the minimum spread", () => {
    const b = buildBaseline("A", "systolicBP", series(Array(14).fill(115)))!;
    expect(b.center).toBe(115);
    expect(b.spread).toBe(INDICATORS.systolicBP.minSpread);
  });

  it("short history → null", () => {
    expect(buildBaseline("A", "heartRate", series([60, 61, 62]))).toBeNull();
  });

  it("tolerates missing days as long as there are ≥5 points", () => {
    const pts = [0, 3, 6, 9, 12].map((day) => ({ day, value: 60 + day / 10 }));
    expect(buildBaseline("A", "heartRate", pts)).not.toBeNull();
    expect(buildBaseline("A", "heartRate", pts.slice(1))).toBeNull();
  });
});

describe("updateBaseline", () => {
  const base = buildBaseline("A", "heartRate", series(Array(14).fill(60)))!;

  it("moves the centre by α toward the new value", () => {
    const next = updateBaseline(base, { day: 14, value: 70 }, false);
    expect(next.center).toBeCloseTo(60 + EWMA_ALPHA * 10);
    expect(next.updatedDay).toBe(14);
    expect(next.frozen).toBe(false);
  });

  it("freezes while in alert: centre and spread unchanged", () => {
    const next = updateBaseline(base, { day: 14, value: 90 }, true);
    expect(next.center).toBe(base.center);
    expect(next.spread).toBe(base.spread);
    expect(next.frozen).toBe(true);
  });

  it("never lets spread fall below the indicator minimum", () => {
    let b = base;
    for (let d = 14; d < 200; d++) b = updateBaseline(b, { day: d, value: 60 }, false);
    expect(b.spread).toBeGreaterThanOrEqual(INDICATORS.heartRate.minSpread);
  });
});
