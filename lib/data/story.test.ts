import { describe, expect, it } from "vitest";
import { evaluateMember, type MemberAssessment } from "@/lib/engine/evaluate";
import { regionStatus } from "@/lib/engine/regions";
import mission from "@/public/data/mission.json";
import steppe from "@/public/data/steppe.json";
import { generateMission, generateSteppe } from "@/scripts/generate-mission.mts";
import { expandReadings, type MissionDataset } from "./dataset";

const missionDs = mission as unknown as MissionDataset;
const steppeDs = steppe as unknown as MissionDataset;
const readings = expandReadings(missionDs);
const prior = (id: string) => missionDs.members.find((m) => m.id === id)!.priorDose;
const at = (id: string, day: number): MemberAssessment => evaluateMember(id, readings, day, { priorDose: prior(id) });
const rules = (a: MemberAssessment) => a.alerts.map((x) => x.ruleId);
const CREW = ["orion-a", "orion-b", "orion-c", "orion-d"];

describe("generated data", () => {
  it("committed JSON matches the deterministic generator (run `npm run generate`)", () => {
    expect(JSON.parse(JSON.stringify(generateMission()))).toEqual(mission);
    expect(JSON.parse(JSON.stringify(generateSteppe()))).toEqual(steppe);
  });
  it("has 4 crew × 180 days and 1 herder × 30 days, with no real names", () => {
    expect(missionDs.members.map((m) => m.name)).toEqual(["ORION-A", "ORION-B", "ORION-C", "ORION-D"]);
    expect(missionDs.days).toBe(180);
    expect(steppeDs.members).toHaveLength(1);
    expect(steppeDs.days).toBe(30);
  });
});

describe("demo story (engine on generated data)", () => {
  it("day 1: everyone is still learning, nothing is alerting", () => {
    for (const id of CREW) expect(at(id, 1).alerts).toEqual([]);
  });

  it("~day 40: solar particle event for the whole crew, cleared by day 45", () => {
    for (const id of CREW) {
      expect(rules(at(id, 39))).not.toContain("radiation-event");
      expect(rules(at(id, 40))).toContain("radiation-event");
      expect(at(id, 40).radiation.status).toBe("critical");
      expect(rules(at(id, 45))).not.toContain("radiation-event");
    }
  });

  it("days 60–75: ORION-B hidden fatigue → behavioral drift at CMO, mood still 'fine'", () => {
    for (let d = 63; d <= 75; d++) {
      const drift = at("orion-b", d).alerts.find((a) => a.ruleId === "behavioral-drift");
      expect(drift, `day ${d}`).toBeDefined();
      expect(drift!.tier).toBe("CMO");
    }
    const day70 = at("orion-b", 70);
    expect(regionStatus(day70, "brain")).toBe("watch");
    expect(day70.indicators.mood.status).toBe("ok");
    expect(day70.alerts[0].sinceDay).toBeGreaterThanOrEqual(60);
  });

  it("~day 95: ORION-C cardiovascular → CMO first, then EARTH", () => {
    expect(rules(at("orion-c", 79))).not.toContain("cardiovascular");
    const d90 = at("orion-c", 90).alerts.find((a) => a.ruleId === "cardiovascular");
    expect(d90?.tier).toBe("CMO");
    const d95 = at("orion-c", 95).alerts.find((a) => a.ruleId === "cardiovascular");
    expect(d95?.severity).toBe("critical");
    expect(d95?.tier).toBe("EARTH");
    expect(regionStatus(at("orion-c", 95), "heart")).toBe("critical");
  });

  it("days 100–180: ORION-D skips exercise → fitness alert, then bone-loss risk", () => {
    expect(rules(at("orion-d", 99))).not.toContain("fitness");
    expect(rules(at("orion-d", 110))).toContain("fitness");
    expect(rules(at("orion-d", 170))).toContain("bone-loss");
    expect(at("orion-d", 179).bone.score).toBeGreaterThan(at("orion-a", 179).bone.score * 1.5);
  });

  it("ORION-A has no health alerts outside the shared radiation events", () => {
    for (let d = 0; d < 180; d += 3) {
      const own = rules(at("orion-a", d)).filter((r) => !r.startsWith("radiation"));
      expect(own, `day ${d}`).toEqual([]);
    }
  });

  it("Steppe herder: blood pressure rises after the cold snap", () => {
    const herd = expandReadings(steppeDs);
    expect(evaluateMember("herder-1", herd, 10).alerts).toEqual([]);
    expect(evaluateMember("herder-1", herd, 27).alerts.map((a) => a.ruleId)).toContain("cardiovascular");
  });
});
