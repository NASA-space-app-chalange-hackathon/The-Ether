/**
 * Where and when we ask NASA's free APIs for data, and how real dates map onto the
 * fictional 2035 mission ("replay"). Self-contained (no imports) so the snapshot
 * script can run it directly under Node type stripping.
 */

export const DAY_MS = 86_400_000;

/** Add whole days to an ISO date (yyyy-mm-dd), in UTC. */
export function addDays(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `fromIso` (yyyy-mm-dd) to the instant `when` (any ISO string), in UTC. */
export function daysBetween(fromIso: string, when: string): number {
  return Math.floor((Date.parse(when) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

/** Must match public/data/mission.json (startDate, days). */
export const MISSION_START = "2035-03-01";
export const MISSION_DAYS = 180;
/** Must match public/data/steppe.json (days). */
export const STEPPE_DAYS = 30;

/**
 * DONKI space-weather replay. The mission is in 2035, so we replay a real 180-day
 * window of solar maximum (29 Apr → 25 Oct 2024). Real event date + offset = mission day.
 * The window was chosen so the 8 June 2024 event lands on day 40 of the demo story.
 */
export const DONKI_REPLAY = { realStart: "2024-04-29", days: MISSION_DAYS } as const;
/** api.nasa.gov rejects DONKI ranges longer than 60 days (verified 15 Nov 2026). */
export const DONKI_MAX_RANGE_DAYS = 60;

export const DONKI_PRIMARY = "https://api.nasa.gov/DONKI/SEP";
export const DONKI_BACKUP = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/SEP";

/** Chunked [start, end] ranges (inclusive, ≤ 60 days each) covering the replay window. */
export function donkiRanges(realStart = DONKI_REPLAY.realStart, days: number = DONKI_REPLAY.days): [string, string][] {
  const out: [string, string][] = [];
  for (let offset = 0; offset < days; offset += DONKI_MAX_RANGE_DAYS) {
    const len = Math.min(DONKI_MAX_RANGE_DAYS, days - offset);
    out.push([addDays(realStart, offset), addDays(realStart, offset + len - 1)]);
  }
  return out;
}

export function donkiUrl(base: string, start: string, end: string, apiKey?: string): string {
  const q = new URLSearchParams({ startDate: start, endDate: end });
  if (apiKey) q.set("api_key", apiKey);
  return `${base}?${q.toString()}`;
}

/** JPL Horizons: Mars (499) seen from Earth's centre (500@399), one row per mission day. */
export const HORIZONS_API = "https://ssd.jpl.nasa.gov/api/horizons.api";
export function horizonsUrl(start = MISSION_START, days = MISSION_DAYS): string {
  const q = new URLSearchParams({
    format: "json",
    COMMAND: "'499'",
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    START_TIME: `'${start}'`,
    STOP_TIME: `'${addDays(start, days - 1)}'`,
    STEP_SIZE: "'1 d'",
    // 20 = observer range (au), 21 = one-way light time (minutes).
    QUANTITIES: "'20,21'",
  });
  return `${HORIZONS_API}?${q.toString()}`;
}

/**
 * NASA POWER daily weather for the Steppe replay: a MERRA-2 grid point near Uliastai,
 * Zavkhan aimag, during the 2023–24 winter. Day 16 of the replay is 17 Feb 2024,
 * the first −34 °C night after a windy day.
 */
export const POWER_API = "https://power.larc.nasa.gov/api/temporal/daily/point";
export const POWER_SITE = { latitude: 47.74, longitude: 96.84, name: { en: "Uliastai area, Zavkhan aimag", mn: "Завхан аймаг, Улиастайн орчим" } } as const;
export const POWER_REPLAY = { realStart: "2024-02-01", days: STEPPE_DAYS } as const;
export function powerUrl(realStart: string = POWER_REPLAY.realStart, days: number = POWER_REPLAY.days): string {
  const compact = (d: string) => d.replaceAll("-", "");
  const q = new URLSearchParams({
    parameters: "T2M_MIN,T2M_MAX,WS10M",
    community: "AG",
    latitude: String(POWER_SITE.latitude),
    longitude: String(POWER_SITE.longitude),
    start: compact(realStart),
    end: compact(addDays(realStart, days - 1)),
    format: "JSON",
  });
  return `${POWER_API}?${q.toString()}`;
}

/** Human-readable links for the UI (no keys). */
export const NASA_LINKS = {
  donki: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  donkiApi: "https://api.nasa.gov/",
  horizons: "https://ssd.jpl.nasa.gov/horizons/",
  power: "https://power.larc.nasa.gov/",
} as const;
