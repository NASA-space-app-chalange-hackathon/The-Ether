import { describe, expect, it } from "vitest";
import mission from "@/public/data/mission.json";
import steppe from "@/public/data/steppe.json";
import { expandReadings, type MissionDataset } from "@/lib/data/dataset";
import { SNAPSHOT_FEEDS } from "@/lib/nasa/feeds";
import { RULES } from "./escalation";
import { activeSpaceWeather, evaluateMember } from "./evaluate";
import { formatChange, formatValue, signed } from "./format";
import { INDICATOR_HAZARDS } from "./hazards";
import { INDICATOR_IDS } from "./indicators";
import { signalDelay, type Ephemeris } from "./signal";
import { readingsFor } from "./testUtils";
import type { SpaceWeatherEvent } from "./types";

const ds = mission as unknown as MissionDataset;
const readings = expandReadings(ds);
const sep: SpaceWeatherEvent[] = SNAPSHOT_FEEDS.spaceWeather.data.events.map((e) => ({ day: e.missionDay, realDate: e.realDate, url: e.link, highEnergy: e.highEnergy }));
const ephemeris: Ephemeris = SNAPSHOT_FEEDS.lightTime.data;

describe("hazard tags", () => {
  it("every rule and every indicator names at least one NASA hazard", () => {
    for (const rule of Object.values(RULES)) expect(rule.hazards.length, rule.id).toBeGreaterThan(0);
    for (const id of INDICATOR_IDS) expect(INDICATOR_HAZARDS[id].length, id).toBeGreaterThan(0);
  });
  it("alerts carry their rule's hazards", () => {
    const a = evaluateMember("orion-b", readings, 70);
    expect(a.alerts.find((x) => x.ruleId === "behavioral-drift")?.hazards).toEqual(["isolation"]);
  });
});

describe("real NASA DONKI events in the engine", () => {
  it("picks the event that is still active (3 days)", () => {
    expect(activeSpaceWeather(sep, 39)).toBeNull();
    expect(activeSpaceWeather(sep, 42)?.realDate).toBe("2024-06-08");
    expect(activeSpaceWeather(sep, 43)).toBeNull();
  });
  it("day 40: the radiation alert cites the real event, links DONKI, and the CMO checks dose", () => {
    const a = evaluateMember("orion-a", readings, 40, { priorDose: 20, spaceWeather: sep });
    const alert = a.alerts.find((x) => x.ruleId === "radiation-event")!;
    expect(alert.whatChanged).toContain("8 Jun 2024");
    expect(alert.whatChanged).toContain("replayed on mission day 40");
    expect(alert.realData).toEqual([{ source: "DONKI", realDate: "2024-06-08", url: expect.stringContaining("ccmc.gsfc.nasa.gov/DONKI") }]);
    expect(alert.sources[0].url).toContain("ccmc.gsfc.nasa.gov/DONKI");
    expect(alert.tier).toBe("CMO");
    expect(alert.doNow.map((s) => s.text).join(" ")).toMatch(/shield/i);
    expect(alert.doNow.some((s) => s.tier === "CMO" && /dosimeter/i.test(s.text))).toBe(true);
    expect(a.spaceWeather?.day).toBe(40);
  });
  it("a real event raises the shelter alert even if the dosimeter shows nothing yet", () => {
    const flat = readingsFor("X", "radiationDose", 30, () => 1.8);
    const a = evaluateMember("X", flat, 25, { spaceWeather: [{ day: 25, realDate: "2024-07-23", url: null, highEnergy: true }] });
    const alert = a.alerts.find((x) => x.ruleId === "radiation-event")!;
    expect(alert.whatChanged).toMatch(/no spike yet/);
    expect(a.radiation.status).toBe("critical");
  });
  it("every replayed event day has a dosimeter spike in the simulated data", () => {
    for (const e of sep) {
      const a = evaluateMember("orion-c", readings, e.day, { priorDose: 30 });
      expect(a.radiation.eventActive, `day ${e.day}`).toBe(true);
    }
  });
});

describe("JPL Horizons light time in the engine", () => {
  it("Mars base uses the real light time; transit is interpolated toward it", () => {
    const mars = signalDelay("mars", 0, ephemeris);
    expect(mars).toMatchObject({ source: "horizons", approximate: false });
    expect(mars.oneWaySeconds / 60).toBeCloseTo(13.31, 1);
    expect(signalDelay("transit", 0, ephemeris).oneWaySeconds).toBe(0);
    const arrival = signalDelay("transit", 179, ephemeris);
    expect(arrival.source).toBe("interpolated");
    expect(arrival.oneWaySeconds).toBeCloseTo(signalDelay("mars", 179, ephemeris).oneWaySeconds, 5);
    // Without an ephemeris the old model still works (offline-safe).
    expect(signalDelay("mars", 0).source).toBe("model");
    expect(signalDelay("lunar", 0, ephemeris).source).toBe("fixed");
  });
  it("long delay: an EARTH alert says the Crew Medical Officer acts first and adds the Distance hazard", () => {
    const delay = signalDelay("transit", 95, ephemeris).oneWaySeconds;
    expect(delay).toBeGreaterThan(60);
    const a = evaluateMember("orion-c", readings, 95, { priorDose: 30, commsDelaySeconds: delay });
    const cardio = a.alerts.find((x) => x.ruleId === "cardiovascular")!;
    expect(cardio.tier).toBe("EARTH");
    expect(cardio.firstResponder).toBe("CMO");
    expect(cardio.hazards).toContain("distance");
  });
  it("short delay (Moon): no first-responder override", () => {
    const a = evaluateMember("orion-c", readings, 95, { priorDose: 30, commsDelaySeconds: 1.3 });
    expect(a.alerts.find((x) => x.ruleId === "cardiovascular")!.firstResponder).toBeUndefined();
  });
});

describe("explainable numbers (bug fixes)", () => {
  it("formats counts and 1–5 scales with one decimal and a signed change, no %", () => {
    expect(formatValue("pvtLapses", 0.4)).toBe("0.4");
    expect(formatValue("mood", 4)).toBe("4.0");
    expect(formatChange({ indicator: "pvtLapses", value: 3, baseline: 0.4, percentChange: 650 })).toEqual({ absolute: "+2.6", unit: "", percent: null });
    expect(formatChange({ indicator: "sleepHours", value: 5.4, baseline: 6.97, percentChange: -22.6 })).toEqual({ absolute: "−1.6", unit: "h", percent: "−23%" });
    expect(signed(0.001, 1)).toBe("±0.0");
  });
  it("hidden-fatigue alert: text and evidence agree, and values are labelled as 5-day averages", () => {
    const a = evaluateMember("orion-b", readings, 70);
    const drift = a.alerts.find((x) => x.ruleId === "behavioral-drift")!;
    expect(drift.whatChanged).toMatch(/^5-day averages:/);
    const lapses = drift.evidence.find((e) => e.indicator === "pvtLapses")!;
    expect(lapses.windowDays).toBe(5);
    expect(drift.whatChanged).toContain(`Attention lapses (PVT) ${formatValue("pvtLapses", lapses.value)} vs. your normal ${formatValue("pvtLapses", lapses.baseline)}`);
  });
  it("Steppe heart rate 'Watch' with a normal reading today is explained by the persistence window", () => {
    const herd = expandReadings(steppe as unknown as MissionDataset);
    const hr = evaluateMember("herder-1", herd, 24).indicators.heartRate;
    expect(hr.status).toBe("watch");
    expect(Math.abs(hr.z!)).toBeLessThan(2); // today's value alone looks normal…
    expect(hr.recent).toMatchObject({ abnormalDays: 3, direction: "above", window: 5 }); // …but 3 of the last 5 days were high
    expect(hr.recent.mean).toBeGreaterThan(hr.latest!.value);
  });
});
