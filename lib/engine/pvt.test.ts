import { describe, expect, it } from "vitest";
import { GAP_MAX_MS, GAP_MIN_MS, nextGap, scorePvt } from "./pvt";

describe("scorePvt", () => {
  it("mean RT, lapses ≥500 ms, false starts", () => {
    const r = scorePvt([
      { kind: "response", rtMs: 250 },
      { kind: "response", rtMs: 350 },
      { kind: "response", rtMs: 600 },
      { kind: "false-start" },
      { kind: "response", rtMs: 50 },
    ]);
    expect(r).toEqual({ meanRT: 400, lapses: 1, falseStarts: 2, validTrials: 3 });
  });
  it("a timeout counts as a lapse at 3000 ms", () => {
    expect(scorePvt([{ kind: "timeout" }, { kind: "response", rtMs: 300 }])).toEqual({ meanRT: 1650, lapses: 1, falseStarts: 0, validTrials: 2 });
  });
  it("no valid trials → null mean", () => expect(scorePvt([{ kind: "false-start" }]).meanRT).toBeNull());
});

describe("nextGap", () => {
  it("stays within 2–10 s", () => {
    expect(nextGap(() => 0)).toBe(GAP_MIN_MS);
    expect(nextGap(() => 0.999999)).toBeLessThan(GAP_MAX_MS);
  });
});
