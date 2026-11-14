import { describe, expect, it } from "vitest";
import { draftToReadings } from "./checkin";

describe("draftToReadings", () => {
  it("writes one reading per filled field, on the given day, with its source", () => {
    const rs = draftToReadings(
      { heartRate: 72, heartRateSource: "camera", heartRateQuality: 0.8, spo2: 97, mood: 4, pvt: { meanRT: 280, lapses: 1, falseStarts: 0, validTrials: 8 } },
      "orion-b", 70, "2035-05-10T08:00:00Z",
    );
    expect(rs.map((r) => [r.indicator, r.value, r.source])).toEqual([
      ["heartRate", 72, "camera"], ["spo2", 97, "manual"], ["mood", 4, "manual"], ["pvtMeanRT", 280, "pvt"], ["pvtLapses", 1, "pvt"],
    ]);
    expect(rs.every((r) => r.day === 70 && r.memberId === "orion-b")).toBe(true);
    expect(rs[0].quality).toBe(0.8);
  });
  it("drops implausible values and unscored PVT runs", () => {
    expect(draftToReadings({ spo2: 140, temperature: 20, pvt: { meanRT: 300, lapses: 0, falseStarts: 4, validTrials: 2 } }, "a", 1, "t")).toEqual([]);
  });
});
