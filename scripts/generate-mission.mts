/**
 * Seeded, deterministic generator for the demo datasets.
 *
 *   npm run generate   → public/data/mission.json (4 crew × 180 days)
 *                        public/data/steppe.json  (1 herder × 30 days)
 *
 * Runs directly under Node ≥ 22.6 (type stripping), so it uses type-only imports.
 * Every assumption is documented in docs/DATA.md. All values are synthetic.
 */
import type { IndicatorId } from "../lib/engine/types";
import type { DatasetMember, MissionDataset, MissionEvent } from "../lib/data/dataset";

export const MISSION_SEED = 2026;
export const MISSION_DAYS = 180;
export const STEPPE_DAYS = 30;

// ---------- deterministic randomness ----------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Rand {
  private next: () => number;
  constructor(seed: number) {
    this.next = mulberry32(seed);
  }
  uniform(): number {
    return this.next();
  }
  /** Standard normal via Box–Muller. */
  normal(mean = 0, sd = 1): number {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  poisson(lambda: number): number {
    const l = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= this.next();
    } while (p > l);
    return k - 1;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
}

// ---------- helpers ----------
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, dp = 0) => Math.round(v * 10 ** dp) / 10 ** dp;
/** 0 before `start`, linear to 1 at `full`. */
const ramp = (day: number, start: number, full: number) => clamp((day - start) / (full - start), 0, 1);
/** Smooth on/off window: ramps up over `edge` days from `start`, down after `end`. */
const episode = (day: number, start: number, end: number, edge: number) =>
  Math.min(ramp(day, start - edge, start), 1 - ramp(day, end, end + edge));

/** 1–5 scale around a typical value with occasional ±1 days. */
function likert(r: Rand, typical: number, shift = 0): number {
  let v = typical + shift;
  const u = r.uniform();
  if (u < 0.1) v -= 1;
  else if (u > 0.88) v += 1;
  return clamp(Math.round(v), 1, 5);
}

type Series = Partial<Record<IndicatorId, (number | null)[]>>;

interface Profile {
  heartRate: number;
  hrv: number;
  systolicBP: number;
  diastolicBP: number;
  glucose: number;
  temperature: number;
  spo2: number;
  bodyMass: number;
  sleepHours: number;
  pvtMeanRT: number;
  pvtLapses: number;
  exerciseMinutes: number;
  mood: number;
  crewPulse: number;
}

/** Cruise GCR dose-equivalent rate, ≈1.8 mSv/day (MSL RAD; see docs/DATA.md). */
const CRUISE_DOSE_MSV = 1.8;
/** Story event days. */
export const SPE_DAY = 40;
export const DRIFT_START = 60;
export const DRIFT_END = 75;
export const CARDIO_START = 80;
export const CARDIO_FULL = 100;
export const EXERCISE_SKIP_START = 100;

/** Share of days a manual vital is not logged (tests missing-data handling). */
const MISSING_RATE = 0.03;

const CREW: readonly (DatasetMember & { profile: Profile })[] = [
  {
    id: "orion-a",
    name: "ORION-A",
    role: "Commander",
    avatar: "hex",
    sharesDetails: true,
    priorDose: 20,
    profile: { heartRate: 58, hrv: 56, systolicBP: 114, diastolicBP: 72, glucose: 90, temperature: 36.6, spo2: 98, bodyMass: 79, sleepHours: 6.9, pvtMeanRT: 262, pvtLapses: 0.8, exerciseMinutes: 125, mood: 4, crewPulse: 4 },
  },
  {
    id: "orion-b",
    name: "ORION-B",
    role: "Flight Engineer",
    avatar: "tri",
    sharesDetails: false,
    priorDose: 0,
    profile: { heartRate: 62, hrv: 48, systolicBP: 112, diastolicBP: 70, glucose: 88, temperature: 36.7, spo2: 98, bodyMass: 64, sleepHours: 7.1, pvtMeanRT: 255, pvtLapses: 0.7, exerciseMinutes: 120, mood: 4, crewPulse: 4 },
  },
  {
    id: "orion-c",
    name: "ORION-C",
    role: "Mission Specialist",
    avatar: "circle",
    sharesDetails: true,
    priorDose: 30,
    profile: { heartRate: 60, hrv: 44, systolicBP: 118, diastolicBP: 76, glucose: 94, temperature: 36.6, spo2: 97, bodyMass: 84, sleepHours: 6.7, pvtMeanRT: 275, pvtLapses: 1.0, exerciseMinutes: 122, mood: 4, crewPulse: 4 },
  },
  {
    id: "orion-d",
    name: "ORION-D",
    role: "Crew Medical Officer",
    avatar: "diamond",
    sharesDetails: true,
    priorDose: 10,
    profile: { heartRate: 56, hrv: 60, systolicBP: 110, diastolicBP: 68, glucose: 86, temperature: 36.5, spo2: 98, bodyMass: 61, sleepHours: 7.0, pvtMeanRT: 250, pvtLapses: 0.6, exerciseMinutes: 128, mood: 4, crewPulse: 4 },
  },
];

const MISSION_EVENTS: readonly MissionEvent[] = [
  { day: 0, kind: "launch", icon: "🚀", label: "Trans-Mars injection — learning each crewmember's normal" },
  { day: SPE_DAY, kind: "solar", icon: "☀️", label: "Solar particle event — crew shelters" },
  { day: 70, kind: "drift", icon: "🧠", label: "ORION-B: hidden fatigue detected" },
  { day: 95, kind: "cardio", icon: "🫀", label: "ORION-C: cardiovascular trend escalated" },
  { day: 156, kind: "bone", icon: "🦴", label: "ORION-D: missed exercise adds up" },
];

function maybe(r: Rand, value: number, missingRate = MISSING_RATE): number | null {
  return r.chance(missingRate) ? null : value;
}

function generateMember(member: (typeof CREW)[number], days: number, seed: number): Series {
  const r = new Rand(seed);
  const p = member.profile;
  const s: Required<Series> = {
    heartRate: [], hrv: [], systolicBP: [], diastolicBP: [], glucose: [], temperature: [], spo2: [], bodyMass: [],
    sleepHours: [], sleepQuality: [], mood: [], crewPulse: [], pvtMeanRT: [], pvtLapses: [], exerciseMinutes: [], radiationDose: [],
  };
  const isB = member.id === "orion-b";
  const isC = member.id === "orion-c";
  const isD = member.id === "orion-d";

  for (let d = 0; d < days; d++) {
    // Story modifiers.
    const drift = isB ? episode(d, DRIFT_START, DRIFT_END, 3) : 0;
    const cardio = isC ? ramp(d, CARDIO_START, CARDIO_FULL) * (1 - ramp(d, 120, 145)) : 0;
    const skipping = isD && d >= EXERCISE_SKIP_START;
    const shelter = d === SPE_DAY || d === SPE_DAY + 1;

    s.heartRate.push(round(r.normal(p.heartRate + 13 * cardio, 2)));
    s.hrv.push(round(r.normal(p.hrv - 12 * cardio, 4)));
    s.systolicBP.push(maybe(r, round(r.normal(p.systolicBP + 24 * cardio, 3.5))));
    s.diastolicBP.push(maybe(r, round(r.normal(p.diastolicBP + 11 * cardio, 2.5))));
    s.glucose.push(maybe(r, round(r.normal(p.glucose, 5))));
    s.temperature.push(maybe(r, round(r.normal(p.temperature, 0.12), 1)));
    s.spo2.push(maybe(r, clamp(round(r.normal(p.spo2, 0.5)), 90, 100)));
    // Slow in-flight mass loss (demo assumption) plus daily noise.
    s.bodyMass.push(maybe(r, round(r.normal(p.bodyMass - 0.006 * d, 0.25), 1)));

    const sleep = clamp(r.normal(p.sleepHours - 1.55 * drift - (shelter ? 1.2 : 0), 0.5), 3, 9.5);
    s.sleepHours.push(round(sleep, 1));
    s.sleepQuality.push(clamp(Math.round(3 + (sleep - 6.2) * 1.1 + r.normal(0, 0.4)), 1, 5));
    // Hidden drift: B keeps reporting the usual mood.
    s.mood.push(likert(r, p.mood));
    s.crewPulse.push(likert(r, p.crewPulse));
    s.pvtMeanRT.push(round(r.normal(p.pvtMeanRT * (1 + 0.18 * drift), 15)));
    s.pvtLapses.push(r.poisson(p.pvtLapses + 2.5 * drift));

    const exercise = skipping
      ? r.chance(0.85) ? clamp(r.normal(5, 6), 0, 30) : r.normal(100, 15)
      : shelter ? 0 : r.normal(p.exerciseMinutes, 12);
    s.exerciseMinutes.push(round(clamp(exercise, 0, 180)));

    const dose = CRUISE_DOSE_MSV + r.normal(0, 0.06) + (d === SPE_DAY ? 22 : d === SPE_DAY + 1 ? 6 : 0);
    s.radiationDose.push(round(dose, 2));
  }
  return s;
}

// ---------- Steppe herder persona ----------
const HERDER: DatasetMember & { profile: Pick<Profile, "heartRate" | "systolicBP" | "diastolicBP" | "glucose" | "temperature" | "spo2" | "sleepHours" | "mood"> } = {
  id: "herder-1",
  name: "Herder household",
  role: "Herder, rural soum",
  avatar: "ger",
  sharesDetails: true,
  priorDose: 0,
  profile: { heartRate: 70, systolicBP: 126, diastolicBP: 80, glucose: 96, temperature: 36.6, spo2: 96, sleepHours: 7.2, mood: 4 },
};

export const COLD_SNAP_DAY = 16;

const STEPPE_EVENTS: readonly MissionEvent[] = [
  { day: 0, kind: "launch", icon: "🐎", label: "Winter camp — learning your normal" },
  { day: COLD_SNAP_DAY, kind: "cold", icon: "❄️", label: "Cold snap — extra work protecting the herd" },
  { day: 24, kind: "cardio", icon: "🫀", label: "Blood pressure rising — contact the family doctor" },
];

function generateHerder(days: number, seed: number): Series {
  const r = new Rand(seed);
  const p = HERDER.profile;
  const s: Series = { heartRate: [], systolicBP: [], diastolicBP: [], glucose: [], temperature: [], spo2: [], sleepHours: [], sleepQuality: [], mood: [] };
  for (let d = 0; d < days; d++) {
    const cold = ramp(d, COLD_SNAP_DAY, COLD_SNAP_DAY + 8);
    s.heartRate!.push(round(r.normal(p.heartRate + 6 * cold, 2.5)));
    s.systolicBP!.push(maybe(r, round(r.normal(p.systolicBP + 22 * cold, 3.5)), 0.05));
    s.diastolicBP!.push(maybe(r, round(r.normal(p.diastolicBP + 10 * cold, 2.5)), 0.05));
    s.glucose!.push(maybe(r, round(r.normal(p.glucose, 5)), 0.3));
    s.temperature!.push(maybe(r, round(r.normal(p.temperature, 0.12), 1), 0.1));
    s.spo2!.push(maybe(r, clamp(round(r.normal(p.spo2, 0.4)), 90, 100), 0.1));
    const sleep = clamp(r.normal(p.sleepHours - 0.5 * cold, 0.45), 3, 10);
    s.sleepHours!.push(round(sleep, 1));
    s.sleepQuality!.push(clamp(Math.round(3 + (sleep - 6.5) * 1.1 + r.normal(0, 0.4)), 1, 5));
    s.mood!.push(likert(r, p.mood));
  }
  return s;
}

// ---------- public API ----------
function strip<T extends DatasetMember & { profile: unknown }>(m: T): DatasetMember {
  return { id: m.id, name: m.name, role: m.role, avatar: m.avatar, sharesDetails: m.sharesDetails, priorDose: m.priorDose };
}

export function generateMission(seed = MISSION_SEED): MissionDataset {
  return {
    version: 1,
    kind: "mission",
    seed,
    days: MISSION_DAYS,
    startDate: "2035-03-01",
    members: CREW.map((m) => strip(m)),
    events: [...MISSION_EVENTS],
    series: Object.fromEntries(CREW.map((m, i) => [m.id, generateMember(m, MISSION_DAYS, seed * 31 + i)])),
  };
}

export function generateSteppe(seed = MISSION_SEED): MissionDataset {
  return {
    version: 1,
    kind: "steppe",
    seed,
    days: STEPPE_DAYS,
    startDate: "2026-12-01",
    members: [strip(HERDER)],
    events: [...STEPPE_EVENTS],
    series: { [HERDER.id]: generateHerder(STEPPE_DAYS, seed * 97) },
  };
}

// ---------- CLI ----------
async function main(): Promise<void> {
  const { writeFileSync, mkdirSync } = await import("node:fs");
  const { join } = await import("node:path");
  const outDir = join(process.cwd(), "public", "data");
  mkdirSync(outDir, { recursive: true });
  for (const [name, data] of [["mission.json", generateMission()], ["steppe.json", generateSteppe()]] as const) {
    writeFileSync(join(outDir, name), JSON.stringify(data) + "\n");
    console.log(`wrote public/data/${name} (${data.members.length} member(s) × ${data.days} days)`);
  }
}

const invokedDirectly = typeof process !== "undefined" && process.argv[1]?.endsWith("generate-mission.mts");
if (invokedDirectly) void main();
