/** Minimal shape of a JPL Horizons API response (format=json). */
export interface HorizonsResponse {
  signature?: { source?: string; version?: string };
  result: string;
}

export interface LightTimeRow {
  /** yyyy-mm-dd (UT). */
  date: string;
  /** Earth–Mars distance in au, if requested (quantity 20). */
  distanceAu: number | null;
  /** One-way light time in minutes (quantity 21). */
  lightTimeMin: number;
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

export function isHorizonsResponse(x: unknown): x is HorizonsResponse {
  return typeof x === "object" && x !== null && typeof (x as HorizonsResponse).result === "string";
}

/**
 * Parse the ephemeris table between $$SOE and $$EOE. Columns are located from the
 * header line, so the parser works for QUANTITIES='21' and for '20,21'.
 */
export function parseHorizonsLightTime(result: string): LightTimeRow[] {
  const soe = result.indexOf("$$SOE");
  const eoe = result.indexOf("$$EOE");
  if (soe < 0 || eoe < soe) throw new Error("Horizons: no ephemeris table ($$SOE…$$EOE) in response");
  const header = result.slice(0, soe).split("\n").reverse().find((l) => l.includes("Date__(UT)"));
  if (!header || !header.includes("1-way_down_LT")) throw new Error("Horizons: light-time column (quantity 21) missing");
  const hasDistance = /\bdelta\b/.test(header);

  const rows: LightTimeRow[] = [];
  for (const line of result.slice(soe + 5, eoe).split("\n")) {
    const m = line.match(/^\s*(\d{4})-([A-Z][a-z]{2})-(\d{2})\s+\d{2}:\d{2}(.*)$/);
    if (!m || !MONTHS[m[2]]) continue;
    const nums = m[4].trim().split(/\s+/).map(Number).filter((n) => Number.isFinite(n));
    if (nums.length === 0) continue;
    const lightTimeMin = nums[nums.length - 1];
    rows.push({ date: `${m[1]}-${MONTHS[m[2]]}-${m[3]}`, distanceAu: hasDistance ? nums[0] : null, lightTimeMin });
  }
  if (rows.length === 0) throw new Error("Horizons: ephemeris table is empty");
  return rows;
}

/** Light time (seconds) on a calendar date, or null if the table doesn't cover it. */
export function lightTimeOn(rows: readonly LightTimeRow[], isoDate: string): number | null {
  const row = rows.find((r) => r.date === isoDate);
  return row ? row.lightTimeMin * 60 : null;
}
