import { describe, expect, it } from "vitest";
import { persistenceStatus, worstStatus } from "./persistence";
import { badness, percentChange, robustZ } from "./zscore";

describe("robust z-score", () => {
  it("scales by the robust spread", () => expect(robustZ(66, { center: 60, spread: 2 })).toBe(3));
  it("zero spread → 0 (never Infinity)", () => expect(robustZ(66, { center: 60, spread: 0 })).toBe(0));
  it("badness is positive in the worse direction", () => {
    expect(badness(-2.5, "lower")).toBe(2.5);
    expect(badness(-2.5, "higher")).toBe(-2.5);
    expect(badness(-2.5, "both")).toBe(2.5);
  });
  it("percentChange", () => expect(percentChange(55, 50)).toBeCloseTo(10));
});

describe("persistenceStatus (3 of the last 5 days)", () => {
  it("ok when only 2 of 5 days exceed 2", () => expect(persistenceStatus([2.5, 0, 2.5, 0, 0])).toBe("ok"));
  it("watch when 3 of 5 days exceed 2", () => expect(persistenceStatus([2.5, 0, 2.1, 0, 2.9])).toBe("watch"));
  it("critical when 3 of 5 days exceed 3", () => expect(persistenceStatus([3.5, 3.2, 0, 3.1, 0])).toBe("critical"));
  it("a single huge spike is not enough", () => expect(persistenceStatus([0, 0, 0, 0, 9])).toBe("ok"));
  it("missing days (null) never count as abnormal", () =>
    expect(persistenceStatus([null, 2.5, null, 2.5, null])).toBe("ok"));
  it("only the last 5 entries matter", () => expect(persistenceStatus([3, 3, 3, 0, 0, 0, 0, 0])).toBe("ok"));
});

describe("worstStatus", () => {
  it("ranks critical > watch > ok > unknown", () => {
    expect(worstStatus(["ok", "critical", "watch"])).toBe("critical");
    expect(worstStatus(["unknown", "ok"])).toBe("ok");
    expect(worstStatus([])).toBe("unknown");
  });
});
