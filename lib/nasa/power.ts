/** Minimal shape of a NASA POWER daily point response (format=JSON). */
export interface PowerResponse {
  geometry?: { coordinates?: number[] };
  header?: { fill_value?: number; sources?: string[] };
  properties: { parameter: Record<string, Record<string, number>> };
}

export interface WeatherDay {
  /** yyyy-mm-dd */
  date: string;
  /** Daily minimum air temperature at 2 m (°C). */
  tMin: number | null;
  /** Daily maximum air temperature at 2 m (°C). */
  tMax: number | null;
  /** Mean wind speed at 10 m (m/s). */
  wind: number | null;
}

export interface PowerSeries {
  days: WeatherDay[];
  /** Grid-point elevation (m), as reported by POWER. */
  elevationM: number | null;
}

export function isPowerResponse(x: unknown): x is PowerResponse {
  const p = (x as PowerResponse | null)?.properties?.parameter;
  return typeof p === "object" && p !== null && typeof p.T2M_MIN === "object";
}

export function parsePowerDaily(json: PowerResponse): PowerSeries {
  const fill = json.header?.fill_value ?? -999;
  const p = json.properties.parameter;
  const val = (key: string, date: string) => {
    const v = p[key]?.[date];
    return typeof v === "number" && Number.isFinite(v) && v !== fill ? v : null;
  };
  const dates = Object.keys(p.T2M_MIN).filter((d) => /^\d{8}$/.test(d)).sort();
  if (dates.length === 0) throw new Error("POWER: no daily values in response");
  const days = dates.map((d) => {
    const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    return { date: iso, tMin: val("T2M_MIN", d), tMax: val("T2M_MAX", d), wind: val("WS10M", d) };
  });
  const elevation = json.geometry?.coordinates?.[2];
  return { days, elevationM: typeof elevation === "number" ? elevation : null };
}

/** The coldest night in a series (lowest daily minimum). */
export function coldestDay(days: readonly WeatherDay[]): (WeatherDay & { index: number }) | null {
  let best: (WeatherDay & { index: number }) | null = null;
  days.forEach((d, index) => {
    if (d.tMin !== null && (best === null || d.tMin < (best.tMin ?? Infinity))) best = { ...d, index };
  });
  return best;
}
