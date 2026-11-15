import type { Environment } from "./types";

/** One row of a real ephemeris (JPL Horizons): Earth–Mars light time on a calendar date. */
export interface EphemerisRow {
  date: string;
  distanceAu: number | null;
  lightTimeMin: number;
}

/** Real Earth–Mars light time for the mission dates (from JPL Horizons). */
export interface Ephemeris {
  /** Calendar date of mission day 0 (yyyy-mm-dd). */
  missionStart: string;
  rows: readonly EphemerisRow[];
}

/**
 * Approximate one-way signal delay (light time) between Earth and the crew.
 *
 * Model (an approximation, not an ephemeris): circular, coplanar orbits —
 * Earth at 1 AU / 365.25 d, Mars at 1.524 AU / 687 d. In transit the spacecraft
 * spirals out from Earth's position at day 0 to meet Mars at the end of the
 * mission, sweeping TRANSFER_SWEEP_DEG of heliocentric angle.
 * Sanity check: NASA quotes up to ~20 min one-way while on Mars.
 */
export const AU_KM = 149_597_870.7;
export const C_KM_S = 299_792.458;
export const MOON_KM = 384_400;
export const EARTH_ORBIT_AU = 1;
export const MARS_ORBIT_AU = 1.524;
export const EARTH_PERIOD_D = 365.25;
export const MARS_PERIOD_D = 687;
export const TRANSFER_DAYS = 180;
/** Demo parameter: heliocentric angle swept by the fast transfer. */
export const TRANSFER_SWEEP_DEG = 120;
/** ISS altitude (~400 km); relay via geostationary satellites adds more, so we report "< 1 s". */
export const ISS_DELAY_S = 0.5;

const rad = (deg: number) => (deg * Math.PI) / 180;
const earthAngle = (day: number) => (360 * day) / EARTH_PERIOD_D;
/** Mars starts where it will be when the crew arrives, minus its own motion. */
const marsAngle = (day: number) => TRANSFER_SWEEP_DEG - (360 * TRANSFER_DAYS) / MARS_PERIOD_D + (360 * day) / MARS_PERIOD_D;

function distanceAU(r1: number, a1: number, r2: number, a2: number): number {
  return Math.sqrt(r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(rad(a1 - a2)));
}

/** Earth–spacecraft distance during transit (km). */
export function transitDistanceKm(day: number): number {
  const s = Math.min(1, Math.max(0, day / TRANSFER_DAYS));
  const r = EARTH_ORBIT_AU + (MARS_ORBIT_AU - EARTH_ORBIT_AU) * s;
  return distanceAU(EARTH_ORBIT_AU, earthAngle(day), r, TRANSFER_SWEEP_DEG * s) * AU_KM;
}

/** Earth–Mars distance on a given mission day (km). */
export function earthMarsDistanceKm(day: number): number {
  return distanceAU(EARTH_ORBIT_AU, earthAngle(day), MARS_ORBIT_AU, marsAngle(day)) * AU_KM;
}

/**
 * horizons:     real JPL Horizons Earth–Mars light time on that date (Mars base, rover)
 * interpolated: transit, between Earth (day 0) and Mars' real position on arrival — approximate
 * model:        the circular-orbit model below (no ephemeris available) — approximate
 * fixed:        Moon / ISS / Earth constants
 */
export type DelaySource = "horizons" | "interpolated" | "model" | "fixed";

export interface SignalDelay {
  /** One-way light time in seconds. */
  oneWaySeconds: number;
  distanceKm: number;
  approximate: boolean;
  source: DelaySource;
}

function isoPlusDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Real Earth–Mars light time (s) and distance (km) on a mission day, if the ephemeris covers it. */
export function marsFromEphemeris(eph: Ephemeris, day: number): { seconds: number; km: number } | null {
  const date = isoPlusDays(eph.missionStart, day);
  const row = eph.rows.find((r) => r.date === date);
  if (!row) return null;
  const seconds = row.lightTimeMin * 60;
  return { seconds, km: row.distanceAu !== null ? row.distanceAu * AU_KM : seconds * C_KM_S };
}

/**
 * One-way signal delay to Earth. With an ephemeris, Mars base/rover use the real
 * light time; transit scales it by the fraction of the journey flown (approximate:
 * the spacecraft heads for where Mars will be on arrival).
 */
export function signalDelay(env: Environment, day: number, ephemeris?: Ephemeris): SignalDelay {
  const real = ephemeris && (env === "mars" || env === "rover" || env === "transit") ? marsFromEphemeris(ephemeris, day) : null;
  if (real) {
    if (env === "transit") {
      const s = Math.min(1, Math.max(0, day / (TRANSFER_DAYS - 1)));
      return { oneWaySeconds: real.seconds * s, distanceKm: real.km * s, approximate: true, source: "interpolated" };
    }
    return { oneWaySeconds: real.seconds, distanceKm: real.km, approximate: false, source: "horizons" };
  }
  let distanceKm: number;
  switch (env) {
    case "transit":
      distanceKm = transitDistanceKm(day);
      break;
    case "mars":
    case "rover":
      distanceKm = earthMarsDistanceKm(day);
      break;
    case "lunar":
      return { oneWaySeconds: MOON_KM / C_KM_S, distanceKm: MOON_KM, approximate: true, source: "fixed" };
    case "iss":
    case "steppe":
      return { oneWaySeconds: env === "iss" ? ISS_DELAY_S : 0, distanceKm: env === "iss" ? 400 : 0, approximate: true, source: "fixed" };
  }
  return { oneWaySeconds: distanceKm / C_KM_S, distanceKm, approximate: true, source: "model" };
}

/** "12 min 40 s", "1.3 s", "< 1 s". */
export function formatDelay(seconds: number): string {
  if (seconds < 1) return "< 1 s";
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return s === 60 ? `${m + 1} min 0 s` : `${m} min ${s} s`;
}
