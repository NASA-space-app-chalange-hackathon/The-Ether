import { daysBetween } from "./config";

/** One DONKI SEP record as returned by /DONKI/SEP (one record per instrument detection). */
export interface DonkiSepRecord {
  sepID: string;
  eventTime: string;
  instruments?: { displayName: string }[] | null;
  link?: string | null;
  linkedEvents?: { activityID: string }[] | null;
}

export interface SepDetection {
  time: string;
  instrument: string;
  link: string | null;
}

/** Detections grouped into one solar particle event (an "episode"). */
export interface SepEvent {
  id: string;
  /** ISO time the event is anchored to: first GOES detection, else the first detection. */
  time: string;
  detections: SepDetection[];
  /** Detected by a GOES satellite in Earth orbit (not only a model or a distant spacecraft). */
  nearEarth: boolean;
  /** GOES saw protons above 100 MeV. */
  highEnergy: boolean;
  /** DONKI page for the anchoring detection. */
  link: string | null;
}

export interface ReplayedSep extends SepEvent {
  missionDay: number;
  /** Real calendar date of the anchoring detection (yyyy-mm-dd). */
  realDate: string;
}

/** Detections closer than this belong to the same event. */
export const SEP_GROUP_GAP_HOURS = 24;

export function isDonkiSepArray(x: unknown): x is DonkiSepRecord[] {
  return (
    Array.isArray(x) &&
    x.every((r) => typeof r === "object" && r !== null && typeof (r as DonkiSepRecord).sepID === "string" && typeof (r as DonkiSepRecord).eventTime === "string")
  );
}

const isGoes = (instrument: string) => instrument.startsWith("GOES");
const instrumentsOf = (r: DonkiSepRecord) => (r.instruments ?? []).map((i) => i.displayName).filter(Boolean);

/** Flatten records into detections, sorted by time, de-duplicated by sepID. */
export function toDetections(records: readonly DonkiSepRecord[]): SepDetection[] {
  const seen = new Set<string>();
  const out: SepDetection[] = [];
  for (const r of records) {
    if (seen.has(r.sepID) || Number.isNaN(Date.parse(r.eventTime))) continue;
    seen.add(r.sepID);
    const names = instrumentsOf(r);
    for (const instrument of names.length ? names : ["Unknown instrument"]) out.push({ time: r.eventTime, instrument, link: r.link ?? null });
  }
  return out.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
}

/** Group detections into events: a new event starts after a gap of more than 24 h. */
export function groupSepEvents(records: readonly DonkiSepRecord[], gapHours = SEP_GROUP_GAP_HOURS): SepEvent[] {
  const groups: SepDetection[][] = [];
  for (const d of toDetections(records)) {
    const last = groups[groups.length - 1];
    if (last && Date.parse(d.time) - Date.parse(last[last.length - 1].time) <= gapHours * 3_600_000) last.push(d);
    else groups.push([d]);
  }
  return groups.map((detections) => {
    const anchor = detections.find((d) => isGoes(d.instrument)) ?? detections[0];
    return {
      id: `SEP-${anchor.time}`,
      time: anchor.time,
      detections,
      nearEarth: detections.some((d) => isGoes(d.instrument)),
      highEnergy: detections.some((d) => isGoes(d.instrument) && d.instrument.includes(">100 MeV")),
      link: anchor.link,
    };
  });
}

/**
 * Map real events onto the mission timeline. Only events seen near Earth by GOES
 * are replayed: a model run or a detection on the far side of the Sun is not a crew warning.
 */
export function replaySepEvents(events: readonly SepEvent[], realStart: string, days: number): ReplayedSep[] {
  return events
    .filter((e) => e.nearEarth)
    .map((e) => ({ ...e, missionDay: daysBetween(realStart, e.time), realDate: e.time.slice(0, 10) }))
    .filter((e) => e.missionDay >= 0 && e.missionDay < days);
}
