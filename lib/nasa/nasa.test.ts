import { describe, expect, it } from "vitest";
import mission from "@/public/data/mission.json";
import steppe from "@/public/data/steppe.json";
import { REPLAY_SEP_DAYS } from "@/scripts/generate-mission.mts";
import donkiSnapshot from "./snapshots/donki-sep.json";
import horizonsSnapshot from "./snapshots/horizons-mars.json";
import powerSnapshot from "./snapshots/power-zavkhan.json";
import { DONKI_REPLAY, MISSION_DAYS, MISSION_START, POWER_REPLAY, STEPPE_DAYS, addDays, daysBetween, donkiRanges, donkiUrl, horizonsUrl, powerUrl } from "./config";
import { groupSepEvents, isDonkiSepArray, replaySepEvents, toDetections, type DonkiSepRecord } from "./donki";
import { SNAPSHOT_FEEDS, buildLightTime, buildSpaceWeather, buildWeather } from "./feeds";
import { lightTimeOn, parseHorizonsLightTime } from "./horizons";
import { coldestDay, parsePowerDaily, type PowerResponse } from "./power";

const rec = (sepID: string, eventTime: string, instrument: string): DonkiSepRecord => ({
  sepID,
  eventTime,
  instruments: [{ displayName: instrument }],
  link: `https://example.test/${sepID}`,
});

describe("config", () => {
  it("matches the generated datasets", () => {
    expect(mission.startDate).toBe(MISSION_START);
    expect(mission.days).toBe(MISSION_DAYS);
    expect(steppe.days).toBe(STEPPE_DAYS);
  });
  it("splits the DONKI window into ≤ 60-day requests that cover all 180 days", () => {
    const ranges = donkiRanges();
    expect(ranges).toEqual([
      ["2024-04-29", "2024-06-27"],
      ["2024-06-28", "2024-08-26"],
      ["2024-08-27", "2024-10-25"],
    ]);
    expect(daysBetween(ranges[0][0], `${ranges[2][1]}T00:00Z`)).toBe(DONKI_REPLAY.days - 1);
  });
  it("never puts an API key in the request URLs we keep", () => {
    expect(donkiUrl("https://api.nasa.gov/DONKI/SEP", "2024-01-01", "2024-01-31")).not.toContain("api_key");
    for (const url of [...donkiSnapshot.requests, ...horizonsSnapshot.requests, ...powerSnapshot.requests]) expect(url).not.toMatch(/api_key/i);
  });
  it("builds the documented Horizons and POWER queries", () => {
    const hz = new URL(horizonsUrl());
    expect(hz.searchParams.get("COMMAND")).toBe("'499'");
    expect(hz.searchParams.get("CENTER")).toBe("'500@399'");
    expect(hz.searchParams.get("QUANTITIES")).toBe("'20,21'");
    expect(hz.searchParams.get("STOP_TIME")).toBe(`'${addDays(MISSION_START, MISSION_DAYS - 1)}'`);
    const pw = new URL(powerUrl());
    expect(pw.searchParams.get("parameters")).toBe("T2M_MIN,T2M_MAX,WS10M");
    expect(pw.searchParams.get("start")).toBe("20240201");
    expect(pw.searchParams.get("end")).toBe("20240301");
  });
});

describe("DONKI SEP parser", () => {
  it("validates the response shape", () => {
    expect(isDonkiSepArray(donkiSnapshot.response)).toBe(true);
    expect(isDonkiSepArray({ error: "rate limited" })).toBe(false);
    expect(isDonkiSepArray([{ eventTime: "x" }])).toBe(false);
  });
  it("de-duplicates records and sorts detections by time", () => {
    const d = toDetections([rec("b", "2024-01-02T00:00Z", "SOHO"), rec("a", "2024-01-01T00:00Z", "GOES-P: SEISS >10 MeV"), rec("a", "2024-01-01T00:00Z", "GOES-P: SEISS >10 MeV")]);
    expect(d.map((x) => x.instrument)).toEqual(["GOES-P: SEISS >10 MeV", "SOHO"]);
  });
  it("groups detections within 24 h into one event, anchored on the GOES detection", () => {
    const events = groupSepEvents([
      rec("1", "2024-05-09T14:00Z", "MODEL: REleASE:ACE/EPAM 15.8-39.8 MeV"),
      rec("2", "2024-05-10T13:35Z", "GOES-P: SEISS >10 MeV"),
      rec("3", "2024-05-11T02:10Z", "GOES-P: SEISS >100 MeV"),
      rec("4", "2024-05-13T12:44Z", "STEREO A: IMPACT 13-100 MeV"),
    ]);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ time: "2024-05-10T13:35Z", nearEarth: true, highEnergy: true, link: "https://example.test/2" });
    expect(events[0].detections).toHaveLength(3);
    expect(events[1]).toMatchObject({ nearEarth: false, highEnergy: false });
  });
  it("replays only GOES-detected events inside the window, as mission days", () => {
    const events = groupSepEvents([rec("1", "2024-06-08T02:25Z", "GOES-P: SEISS >100 MeV"), rec("2", "2024-08-05T17:26Z", "STEREO A: IMPACT 13-100 MeV"), rec("3", "2023-01-01T00:00Z", "GOES-P: SEISS >10 MeV")]);
    const replayed = replaySepEvents(events, DONKI_REPLAY.realStart, DONKI_REPLAY.days);
    expect(replayed.map((e) => [e.realDate, e.missionDay])).toEqual([["2024-06-08", 40]]);
  });
  it("snapshot: real 2024 events land on the documented mission days (and match the generator)", () => {
    const sw = buildSpaceWeather(donkiSnapshot.response);
    expect(sw.recordCount).toBe(donkiSnapshot.response.length);
    expect(sw.events.map((e) => e.missionDay)).toEqual([...REPLAY_SEP_DAYS]);
    const day40 = sw.events.find((e) => e.missionDay === 40)!;
    expect(day40.realDate).toBe("2024-06-08");
    expect(day40.highEnergy).toBe(true);
    expect(day40.link).toMatch(/^https:\/\/ccmc\.gsfc\.nasa\.gov\/DONKI\/view\/SEP\//);
  });
});

describe("JPL Horizons parser", () => {
  const sample = [
    "header…",
    " Date__(UT)__HR:MN     1-way_down_LT",
    "*****",
    "$$SOE",
    " 2035-Mar-01 00:00     13.30544639",
    " 2035-Mar-02 00:00 *m  13.23179814",
    "$$EOE",
  ].join("\n");
  it("parses light time with QUANTITIES='21' only", () => {
    expect(parseHorizonsLightTime(sample)).toEqual([
      { date: "2035-03-01", distanceAu: null, lightTimeMin: 13.30544639 },
      { date: "2035-03-02", distanceAu: null, lightTimeMin: 13.23179814 },
    ]);
  });
  it("rejects responses without a table or light-time column", () => {
    expect(() => parseHorizonsLightTime("No ephemeris for target")).toThrow(/SOE/);
    expect(() => parseHorizonsLightTime(sample.replace("1-way_down_LT", "delta"))).toThrow(/light-time/);
  });
  it("snapshot: one row per mission day, Mars 13.3 → 3.3 light-minutes over the mission", () => {
    const { rows } = buildLightTime(horizonsSnapshot.response);
    expect(rows).toHaveLength(MISSION_DAYS);
    expect(rows[0].date).toBe(MISSION_START);
    expect(rows[0].lightTimeMin).toBeCloseTo(13.305, 2);
    expect(rows[0].distanceAu).toBeCloseTo(1.5998, 3);
    expect(rows[MISSION_DAYS - 1]).toMatchObject({ date: "2035-08-27" });
    expect(rows[MISSION_DAYS - 1].lightTimeMin).toBeCloseTo(3.304, 2);
    expect(lightTimeOn(rows, "2035-03-01")).toBeCloseTo(798.3, 0);
    expect(lightTimeOn(rows, "2040-01-01")).toBeNull();
  });
});

describe("NASA POWER parser", () => {
  it("parses daily values and treats the fill value as missing", () => {
    const json: PowerResponse = {
      header: { fill_value: -999 },
      geometry: { coordinates: [96.84, 47.74, 2257.56] },
      properties: { parameter: { T2M_MIN: { "20240217": -34.09, "20240216": -999 }, T2M_MAX: { "20240217": -17.9 }, WS10M: { "20240217": 4.32 } } },
    };
    expect(parsePowerDaily(json)).toEqual({
      elevationM: 2257.56,
      days: [
        { date: "2024-02-16", tMin: null, tMax: null, wind: null },
        { date: "2024-02-17", tMin: -34.09, tMax: -17.9, wind: 4.32 },
      ],
    });
  });
  it("snapshot: 30 real days; the cold snap starts on replay day 16 (17 Feb 2024)", () => {
    const w = buildWeather(powerSnapshot.response);
    expect(w.days).toHaveLength(STEPPE_DAYS);
    expect(w.days[0].date).toBe(POWER_REPLAY.realStart);
    expect(w.days[16]).toMatchObject({ date: "2024-02-17", tMin: -34.09 });
    expect(w.days[15].wind).toBeGreaterThan(8);
    const coldest = coldestDay(w.days)!;
    expect(coldest.index).toBeGreaterThanOrEqual(16);
    expect(coldest.tMin).toBeLessThan(-35);
  });
});

describe("snapshot feeds", () => {
  it("are marked as snapshots with their real fetch time", () => {
    for (const feed of Object.values(SNAPSHOT_FEEDS)) {
      expect(feed.status).toBe("snapshot");
      expect(Number.isNaN(Date.parse(feed.fetchedAt))).toBe(false);
    }
  });
});
