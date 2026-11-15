import type { RegionId } from "@/lib/engine/regions";
import { SOURCES } from "@/lib/engine/sources";
import type { Source } from "@/lib/engine/types";

export type HazardId = "radiation" | "isolation" | "distance" | "gravity" | "environment";

export interface Hazard {
  id: HazardId;
  /** Name exactly as NASA HRP lists it. */
  name: string;
  icon: string;
  summary: string;
  source: Source;
}

/** NASA HRP's five hazards (RIDGE), names as on https://www.nasa.gov/hrp/hazards/. Summaries are our plain-language paraphrase. */
export const HAZARDS: readonly Hazard[] = [
  {
    id: "radiation",
    name: "Space Radiation",
    icon: "☢",
    summary: "Outside Earth's magnetic field, crews are exposed to cosmic rays and solar particle events that raise long-term cancer risk and can affect the brain and heart.",
    source: SOURCES.hrpHazards,
  },
  {
    id: "isolation",
    name: "Isolation and Confinement",
    icon: "◎",
    summary: "Months in a small habitat with the same few people can disturb sleep, mood, and teamwork.",
    source: SOURCES.hrpHazards,
  },
  {
    id: "distance",
    name: "Distance from Earth",
    icon: "⟷",
    summary: "On Mars, messages take up to about 20 minutes each way, so the crew must detect and handle problems themselves.",
    source: SOURCES.nasaBodyInSpace,
  },
  {
    id: "gravity",
    name: "Gravity Fields",
    icon: "⇣",
    summary: "Weightlessness and partial gravity shift fluids toward the head, unload bones and muscles, and confuse the balance system.",
    source: SOURCES.hrpHazards,
  },
  {
    id: "environment",
    name: "Hostile/Closed Environments",
    icon: "⬡",
    summary: "A sealed spacecraft controls air, temperature, noise, and microbes — small changes affect everyone on board.",
    source: SOURCES.hrpHazards,
  },
];

export interface RegionContent {
  id: RegionId;
  name: string;
  /** What this body system does — plain language. */
  function: string;
  /** How spaceflight affects it — plain language. */
  spaceflightEffect: string;
  hazards: readonly HazardId[];
  /** NASA HRP risk pages that cover this region. */
  risks: readonly Source[];
}

export const REGION_CONTENT: Record<RegionId, RegionContent> = {
  brain: {
    id: "brain",
    name: "Brain & behavior",
    function: "Controls attention, reaction speed, sleep, mood, and how you work with others.",
    spaceflightEffect: "Irregular schedules, isolation, and stress can wear down sleep and alertness slowly — often before you notice it yourself.",
    hazards: ["isolation", "distance"],
    risks: [SOURCES.riskBehavioral, SOURCES.riskSleep, SOURCES.riskTeamwork, SOURCES.riskSensorimotor],
  },
  eyes: {
    id: "eyes",
    name: "Eyes (SANS)",
    function: "Focus and vision, supplied by the optic nerve at the back of the eye.",
    spaceflightEffect: "Fluid shifting toward the head is linked to swelling at the back of the eye and vision changes, called Spaceflight Associated Neuro-ocular Syndrome (SANS). Checking it needs eye imaging this prototype does not yet capture.",
    hazards: ["gravity"],
    risks: [SOURCES.riskSans],
  },
  heart: {
    id: "heart",
    name: "Heart & vessels",
    function: "Pumps blood and keeps blood pressure steady when you move or change posture.",
    spaceflightEffect: "Without gravity, fluids shift upward and the heart and vessels adapt; radiation may add long-term effects.",
    hazards: ["gravity", "radiation"],
    risks: [SOURCES.riskCardio],
  },
  lungs: {
    id: "lungs",
    name: "Lungs & blood oxygen",
    function: "Moves oxygen into the blood and carbon dioxide out.",
    spaceflightEffect: "The crew depends entirely on the life-support system; a cabin atmosphere problem or illness shows up as lower blood oxygen.",
    hazards: ["environment"],
    risks: [SOURCES.riskHypoxia],
  },
  bones: {
    id: "bones",
    name: "Bones (spine, hips, legs)",
    function: "Support your weight and store minerals.",
    spaceflightEffect: "Without load, weight-bearing bones lose mineral density; resistance exercise is the main countermeasure.",
    hazards: ["gravity"],
    risks: [SOURCES.riskBone],
  },
  muscles: {
    id: "muscles",
    name: "Muscles & fitness",
    function: "Move and stabilise the body; keep heart and lungs fit.",
    spaceflightEffect: "Muscles that fight gravity on Earth weaken quickly in space without daily exercise.",
    hazards: ["gravity"],
    risks: [SOURCES.riskFitness],
  },
  immune: {
    id: "immune",
    name: "Immune system & skin",
    function: "Defends against infection and heals wounds.",
    spaceflightEffect: "Spaceflight changes immune responses, and microbes behave differently in a closed habitat.",
    hazards: ["environment", "radiation", "isolation"],
    risks: [SOURCES.riskImmune, SOURCES.riskHostMicrobe],
  },
  gut: {
    id: "gut",
    name: "Gut & nutrition",
    function: "Turns food into energy and building blocks; keeps blood sugar steady.",
    spaceflightEffect: "Limited menus, appetite changes, and workload can leave crews under-fuelled.",
    hazards: ["environment", "distance"],
    risks: [SOURCES.riskNutrition],
  },
  cold: {
    id: "cold",
    name: "Cold exposure / skin",
    function: "Skin and circulation keep fingers, toes and face warm.",
    spaceflightEffect: "Not a spaceflight system in this app — used in Steppe mode for deep-cold exposure.",
    hazards: ["environment"],
    risks: [SOURCES.csaScience],
  },
  radiation: {
    id: "radiation",
    name: "Radiation exposure",
    function: "Whole-body dose from cosmic rays and solar particle events, tracked against the career limit.",
    spaceflightEffect: "Dose builds up every day outside Earth's magnetic field and jumps during solar storms.",
    hazards: ["radiation"],
    risks: [SOURCES.riskRadiationCancer, SOURCES.nasaRadiationLimit, SOURCES.csaRadiation],
  },
};
