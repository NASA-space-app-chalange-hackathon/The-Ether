import { describe, expect, it } from "vitest";
import { AU_KM, C_KM_S, earthMarsDistanceKm, formatDelay, signalDelay, transitDistanceKm } from "./signal";

describe("signal delay model", () => {
  it("transit starts at Earth and grows", () => {
    expect(transitDistanceKm(0)).toBeCloseTo(0, 0);
    expect(transitDistanceKm(95)).toBeGreaterThan(transitDistanceKm(30));
  });
  it("delay = distance / c", () => {
    const d = signalDelay("transit", 95);
    expect(d.oneWaySeconds).toBeCloseTo(d.distanceKm / C_KM_S);
  });
  it("Earth–Mars stays within the physical range (0.52–2.52 AU) → at most ~21 min", () => {
    for (let day = 0; day <= 180; day += 5) {
      const au = earthMarsDistanceKm(day) / AU_KM;
      expect(au).toBeGreaterThanOrEqual(0.52);
      expect(au).toBeLessThanOrEqual(2.53);
    }
    expect(signalDelay("mars", 179).oneWaySeconds / 60).toBeLessThan(21);
  });
  it("Moon ≈ 1.28 s; ISS and Steppe < 1 s", () => {
    expect(signalDelay("lunar", 0).oneWaySeconds).toBeCloseTo(1.28, 2);
    expect(signalDelay("iss", 0).oneWaySeconds).toBeLessThan(1);
    expect(signalDelay("steppe", 0).oneWaySeconds).toBe(0);
  });
  it("formats delays", () => {
    expect(formatDelay(0.2)).toBe("< 1 s");
    expect(formatDelay(1.28)).toBe("1.3 s");
    expect(formatDelay(760)).toBe("12 min 40 s");
  });
});
