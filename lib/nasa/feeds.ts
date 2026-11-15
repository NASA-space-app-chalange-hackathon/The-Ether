import donkiSnapshot from "./snapshots/donki-sep.json";
import horizonsSnapshot from "./snapshots/horizons-mars.json";
import powerSnapshot from "./snapshots/power-zavkhan.json";
import { DONKI_REPLAY, MISSION_START, POWER_REPLAY, POWER_SITE } from "./config";
import { groupSepEvents, isDonkiSepArray, replaySepEvents, type ReplayedSep } from "./donki";
import { isHorizonsResponse, parseHorizonsLightTime, type LightTimeRow } from "./horizons";
import { isPowerResponse, parsePowerDaily, type WeatherDay } from "./power";

/**
 * Parsed NASA feeds, shared by the server routes (live data) and the client
 * (committed snapshot as the instant, offline-safe starting point).
 */

export type FeedStatus = "live" | "snapshot";

export interface Feed<T> {
  status: FeedStatus;
  /** When the underlying response was fetched from NASA (ISO). */
  fetchedAt: string;
  /** Request URLs (API key never included). */
  requests: string[];
  data: T;
}

export interface SpaceWeatherData {
  replayStart: string;
  /** All DONKI SEP records in the window (one per instrument detection). */
  recordCount: number;
  /** Detections grouped into events, near-Earth or not. */
  eventCount: number;
  /** GOES-detected events mapped onto mission days. */
  events: ReplayedSep[];
}

export interface LightTimeData {
  missionStart: string;
  rows: LightTimeRow[];
}

export interface WeatherData {
  replayStart: string;
  site: typeof POWER_SITE;
  elevationM: number | null;
  days: WeatherDay[];
}

export function buildSpaceWeather(raw: unknown): SpaceWeatherData {
  if (!isDonkiSepArray(raw)) throw new Error("DONKI: unexpected response shape");
  const groups = groupSepEvents(raw);
  return {
    replayStart: DONKI_REPLAY.realStart,
    recordCount: raw.length,
    eventCount: groups.length,
    events: replaySepEvents(groups, DONKI_REPLAY.realStart, DONKI_REPLAY.days),
  };
}

export function buildLightTime(raw: unknown): LightTimeData {
  if (!isHorizonsResponse(raw)) throw new Error("Horizons: unexpected response shape");
  return { missionStart: MISSION_START, rows: parseHorizonsLightTime(raw.result) };
}

export function buildWeather(raw: unknown): WeatherData {
  if (!isPowerResponse(raw)) throw new Error("POWER: unexpected response shape");
  const parsed = parsePowerDaily(raw);
  return { replayStart: POWER_REPLAY.realStart, site: POWER_SITE, elevationM: parsed.elevationM, days: parsed.days };
}

interface SnapshotFile {
  fetchedAt: string;
  requests: string[];
  response: unknown;
}

function fromSnapshot<T>(file: SnapshotFile, build: (raw: unknown) => T): Feed<T> {
  return { status: "snapshot", fetchedAt: file.fetchedAt, requests: file.requests, data: build(file.response) };
}

export const SNAPSHOT_FEEDS = {
  spaceWeather: fromSnapshot(donkiSnapshot as SnapshotFile, buildSpaceWeather),
  lightTime: fromSnapshot(horizonsSnapshot as SnapshotFile, buildLightTime),
  weather: fromSnapshot(powerSnapshot as SnapshotFile, buildWeather),
};

export type NasaFeeds = { spaceWeather: Feed<SpaceWeatherData>; lightTime: Feed<LightTimeData>; weather: Feed<WeatherData> };
