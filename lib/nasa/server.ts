import { cacheLife } from "next/cache";
import { DONKI_BACKUP, DONKI_PRIMARY, donkiRanges, donkiUrl, horizonsUrl, powerUrl } from "./config";
import {
  SNAPSHOT_FEEDS,
  buildLightTime,
  buildSpaceWeather,
  buildWeather,
  type Feed,
  type LightTimeData,
  type SpaceWeatherData,
  type WeatherData,
} from "./feeds";

/**
 * Server-only NASA fetchers. Each tries the live API (and a backup host where one exists),
 * caches a good answer for a day, and falls back to the committed snapshot otherwise
 * (cached for an hour, so it retries soon). The browser never calls NASA directly.
 */

const TIMEOUT_MS = 8_000;

/** NASA_API_KEY in production; DEMO_KEY (10 requests/hour) as a local fallback. */
function apiKey(): string {
  return process.env.NASA_API_KEY || "DEMO_KEY";
}

/** The key travels in a header (api.nasa.gov accepts X-Api-Key), so it never appears in URLs, logs or caches keyed by URL. */
async function getJson(url: string, apiKey?: string): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function live<T>(requests: string[], data: T): Feed<T> {
  return { status: "live", fetchedAt: new Date().toISOString(), requests, data };
}

function fallback<T>(name: string, snapshot: Feed<T>, errors: unknown[]): Feed<T> {
  console.warn(`[nasa] ${name}: using committed snapshot (${errors.map((e) => (e instanceof Error ? e.message : String(e))).join("; ")})`);
  return snapshot;
}

async function donkiFrom(base: string, key?: string): Promise<{ records: unknown[]; requests: string[] }> {
  const ranges = donkiRanges();
  const parts = await Promise.all(ranges.map(([s, e]) => getJson(donkiUrl(base, s, e), key)));
  if (!parts.every(Array.isArray)) throw new Error("DONKI: expected arrays");
  return { records: parts.flat(), requests: ranges.map(([s, e]) => donkiUrl(base, s, e)) };
}

export async function getSpaceWeather(): Promise<Feed<SpaceWeatherData>> {
  "use cache";
  const errors: unknown[] = [];
  for (const [base, key] of [
    [DONKI_PRIMARY, apiKey()],
    [DONKI_BACKUP, undefined],
  ] as const) {
    try {
      const { records, requests } = await donkiFrom(base, key);
      const feed = live(requests, buildSpaceWeather(records));
      cacheLife("days");
      return feed;
    } catch (err) {
      errors.push(err);
    }
  }
  cacheLife("hours");
  return fallback("DONKI", SNAPSHOT_FEEDS.spaceWeather, errors);
}

export async function getLightTime(): Promise<Feed<LightTimeData>> {
  "use cache";
  const url = horizonsUrl();
  try {
    const feed = live([url], buildLightTime(await getJson(url)));
    cacheLife("days");
    return feed;
  } catch (err) {
    cacheLife("hours");
    return fallback("Horizons", SNAPSHOT_FEEDS.lightTime, [err]);
  }
}

export async function getWeather(): Promise<Feed<WeatherData>> {
  "use cache";
  const url = powerUrl();
  try {
    const feed = live([url], buildWeather(await getJson(url)));
    cacheLife("days");
    return feed;
  } catch (err) {
    cacheLife("hours");
    return fallback("POWER", SNAPSHOT_FEEDS.weather, [err]);
  }
}
