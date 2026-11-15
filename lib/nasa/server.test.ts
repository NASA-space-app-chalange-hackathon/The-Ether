import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import donkiSnapshot from "./snapshots/donki-sep.json";
import horizonsSnapshot from "./snapshots/horizons-mars.json";
import powerSnapshot from "./snapshots/power-zavkhan.json";

const cacheLife = vi.fn();
vi.mock("next/cache", () => ({ cacheLife: (profile: string) => cacheLife(profile) }));

const { getLightTime, getSpaceWeather, getWeather } = await import("./server");

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

describe("NASA server fetchers", () => {
  beforeEach(() => {
    cacheLife.mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it("serve live data when NASA answers, cached for a day, and send the key only to api.nasa.gov", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      urls.push(url);
      if (url.includes("DONKI")) return json([]);
      if (url.includes("horizons")) return json(horizonsSnapshot.response);
      return json(powerSnapshot.response);
    }));
    const [sw, lt, w] = [await getSpaceWeather(), await getLightTime(), await getWeather()];
    expect([sw.status, lt.status, w.status]).toEqual(["live", "live", "live"]);
    expect(lt.data.rows).toHaveLength(180);
    expect(cacheLife.mock.calls.flat()).toEqual(["days", "days", "days"]);
    expect(urls.filter((u) => u.includes("api_key"))).toHaveLength(3);
    expect(urls.filter((u) => u.includes("api_key")).every((u) => u.startsWith("https://api.nasa.gov/"))).toBe(true);
    expect(JSON.stringify([sw.requests, lt.requests, w.requests])).not.toContain("api_key");
  });

  it("try the DONKI backup host when api.nasa.gov is rate-limited", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url.startsWith("https://api.nasa.gov/") ? new Response("OVER_RATE_LIMIT", { status: 429 }) : json(donkiSnapshot.response))));
    const sw = await getSpaceWeather();
    expect(sw.status).toBe("live");
    expect(sw.requests[0]).toContain("kauai.ccmc.gsfc.nasa.gov");
    expect(sw.data.events).toHaveLength(7);
  });

  it("fall back to the committed snapshot when NASA is down or returns junk, and retry within the hour", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url.includes("horizons") ? json({ error: "No ephemeris" }) : Promise.reject(new Error("network down")))));
    const [sw, lt, w] = [await getSpaceWeather(), await getLightTime(), await getWeather()];
    expect([sw.status, lt.status, w.status]).toEqual(["snapshot", "snapshot", "snapshot"]);
    expect(sw.data.events.map((e) => e.missionDay)).toContain(40);
    expect(sw.fetchedAt).toBe(donkiSnapshot.fetchedAt);
    expect(cacheLife.mock.calls.flat()).toEqual(["hours", "hours", "hours"]);
  });
});
