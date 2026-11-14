import { DEMO_PARAMETER, SOURCES } from "./sources";
import type { ActionStep, IndicatorId, Severity, Source, Tier } from "./types";

export type RuleId =
  | "cardiovascular"
  | "hypoxia"
  | "glucose"
  | "fever"
  | "sleep"
  | "vigilance"
  | "mood"
  | "teamwork"
  | "nutrition"
  | "fitness"
  | "behavioral-drift"
  | "radiation-event"
  | "radiation-cumulative"
  | "bone-loss";

/** A rung of the ladder: at this severity, after this many days, this tier owns it. */
export interface LadderStep {
  severity: Severity;
  minDays: number;
  tier: Tier;
}

export interface EscalationRule {
  id: RuleId;
  title: string;
  /** Rungs; the highest tier whose conditions are met wins. */
  ladder: readonly LadderStep[];
  whyItMatters: string;
  /** Steps for every tier; the UI shows SELF up to the assigned tier. */
  steps: readonly ActionStep[];
  sources: readonly Source[];
}

const TIER_RANK: Record<Tier, number> = { SELF: 0, CMO: 1, EARTH: 2 };
const SEVERITY_RANK: Record<Severity, number> = { watch: 1, critical: 2 };

export function tierRank(tier: Tier): number {
  return TIER_RANK[tier];
}

/** Which rule an indicator's own deviation feeds. null = handled by a tracker. */
export const INDICATOR_RULE: Record<IndicatorId, RuleId | null> = {
  heartRate: "cardiovascular",
  hrv: "cardiovascular",
  systolicBP: "cardiovascular",
  diastolicBP: "cardiovascular",
  spo2: "hypoxia",
  glucose: "glucose",
  temperature: "fever",
  sleepHours: "sleep",
  sleepQuality: "sleep",
  pvtMeanRT: "vigilance",
  pvtLapses: "vigilance",
  mood: "mood",
  crewPulse: "teamwork",
  bodyMass: "nutrition",
  // Exercise alerts come from 14-day adherence (see evaluateMember), not daily z-scores.
  exerciseMinutes: null,
  radiationDose: null,
};

/**
 * Escalation rules table. Ladder timings (minDays) are demo parameters chosen
 * for a plausible crew workflow; the "why" text paraphrases the cited NASA HRP risk.
 */
export const RULES: Record<RuleId, EscalationRule> = {
  cardiovascular: {
    id: "cardiovascular",
    title: "Heart & blood pressure trend",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 3, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "In weightlessness, body fluids shift toward the head and the heart and blood vessels adapt. NASA tracks cardiovascular adaptation as a spaceflight risk because a slow rise in resting heart rate or blood pressure can be an early sign the system is under strain.",
    steps: [
      { tier: "SELF", text: "Sit quietly for 5 minutes, then repeat the heart-rate and blood-pressure check." },
      { tier: "SELF", text: "Note caffeine, exercise, stress, or poor sleep in the last 24 hours." },
      { tier: "CMO", text: "Crew Medical Officer: repeat the measurement with the medical kit cuff and review the 14-day trend." },
      { tier: "EARTH", text: "Send the trend summary to the flight surgeon for a private medical conference." },
    ],
    sources: [SOURCES.riskCardio, SOURCES.accAha2017],
  },
  hypoxia: {
    id: "hypoxia",
    title: "Blood oxygen low",
    ladder: [
      { severity: "watch", minDays: 0, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "Low blood oxygen can come from cabin atmosphere changes, illness, or exertion. NASA lists hypoxia as a spaceflight risk; the effects (headache, poor judgement) are easy to miss in yourself.",
    steps: [
      { tier: "SELF", text: "Stop strenuous activity, sit down, and re-measure SpO₂ with warm hands." },
      { tier: "SELF", text: "Tell a crewmate how you feel (headache, breathlessness, confusion)." },
      { tier: "CMO", text: "Crew Medical Officer: check the cabin atmosphere readings and the crewmember's symptoms." },
      { tier: "EARTH", text: "Notify the flight surgeon and environmental control team immediately." },
    ],
    sources: [SOURCES.riskHypoxia, SOURCES.whoPulseOx],
  },
  glucose: {
    id: "glucose",
    title: "Blood glucose out of range",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 3, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "Space food systems, changed activity, and stress can shift blood sugar. NASA tracks inadequate food and nutrition as a risk because poor fuelling affects energy, mood, and long-term health.",
    steps: [
      { tier: "SELF", text: "If low: eat a fast-acting carbohydrate snack and re-check in 15 minutes." },
      { tier: "SELF", text: "If high: drink water, log your last meals, and re-check before the next meal." },
      { tier: "CMO", text: "Crew Medical Officer: review meal logs and the glucose trend with the crewmember." },
      { tier: "EARTH", text: "Ask the flight surgeon and nutrition team to review the menu plan." },
    ],
    sources: [SOURCES.riskNutrition, SOURCES.adaHypoglycemia],
  },
  fever: {
    id: "fever",
    title: "Body temperature raised",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 2, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "Spaceflight changes how the immune system responds, and microbes behave differently in a closed habitat. A fever can mean infection, and in a sealed spacecraft it can affect the whole crew.",
    steps: [
      { tier: "SELF", text: "Re-check temperature in 30 minutes; rest and drink fluids." },
      { tier: "SELF", text: "Wear a mask and wash hands to protect the crew." },
      { tier: "CMO", text: "Crew Medical Officer: assess symptoms and consider isolation in the crew quarters." },
      { tier: "EARTH", text: "Flight surgeon: review for possible infection and medication from the kit." },
    ],
    sources: [SOURCES.riskImmune, SOURCES.riskHostMicrobe, SOURCES.cdcFever],
  },
  sleep: {
    id: "sleep",
    title: "Sleep below your normal",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 5, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "CMO" },
    ],
    whyItMatters:
      "Shifting schedules, noise, and light make sleep hard in space. NASA lists inadequate sleep as a risk because tiredness quietly slows reactions and raises error risk.",
    steps: [
      { tier: "SELF", text: "Protect your full scheduled sleep window tonight; dim screens beforehand." },
      { tier: "SELF", text: "Skip caffeine in the second half of your workday." },
      { tier: "CMO", text: "Crew Medical Officer: review the work schedule and lighting plan with the crewmember." },
    ],
    sources: [SOURCES.riskSleep],
  },
  vigilance: {
    id: "vigilance",
    title: "Reaction time slower than your normal",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 5, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "CMO" },
    ],
    whyItMatters:
      "A short reaction-time test is one of the most sensitive ways to detect fatigue. Slower reactions and more lapses raise the risk of mistakes during critical tasks.",
    steps: [
      { tier: "SELF", text: "Take a 20-minute rest break before any critical task." },
      { tier: "SELF", text: "Repeat the reaction-time test after rest." },
      { tier: "CMO", text: "Crew Medical Officer: consider reassigning safety-critical tasks today." },
    ],
    sources: [SOURCES.riskSleep, SOURCES.basnerPvt],
  },
  mood: {
    id: "mood",
    title: "Mood lower than your normal",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 3, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "Isolation and confinement are among NASA's five hazards. Low mood that lasts can grow into behavioral health problems that affect safety and the crew.",
    steps: [
      { tier: "SELF", text: "Schedule time for something you enjoy and a call or message home." },
      { tier: "SELF", text: "Share a meal or activity with a crewmate today." },
      { tier: "CMO", text: "Crew Medical Officer: have a private check-in conversation." },
      { tier: "EARTH", text: "Book a private session with the ground behavioral health team." },
    ],
    sources: [SOURCES.riskBehavioral, SOURCES.hrpHazards],
  },
  teamwork: {
    id: "teamwork",
    title: "Crew pulse dropping",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 5, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "CMO" },
    ],
    whyItMatters:
      "Small crews living together for months face friction and communication breakdowns. NASA lists inadequate teamwork as a risk because crew cohesion directly affects mission safety.",
    steps: [
      { tier: "SELF", text: "Join today's shared crew quest or meal." },
      { tier: "CMO", text: "Commander/CMO: hold a short crew debrief on workload and friction." },
    ],
    sources: [SOURCES.riskTeamwork],
  },
  nutrition: {
    id: "nutrition",
    title: "Body mass dropping",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 7, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "CMO" },
    ],
    whyItMatters:
      "Astronauts often eat less than they need in space. NASA tracks inadequate food and nutrition because steady weight loss means lost muscle, bone, and energy.",
    steps: [
      { tier: "SELF", text: "Add one extra snack today and log all meals." },
      { tier: "CMO", text: "Crew Medical Officer: review intake against the menu plan." },
    ],
    sources: [SOURCES.riskNutrition],
  },
  fitness: {
    id: "fitness",
    title: "Missing exercise sessions",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "watch", minDays: 7, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "CMO" },
    ],
    whyItMatters:
      "Without gravity, muscles and the heart lose fitness. Daily exercise is the main countermeasure NASA uses for reduced cardiorespiratory and musculoskeletal fitness.",
    steps: [
      { tier: "SELF", text: "Complete today's resistance and cardio sessions." },
      { tier: "CMO", text: "Crew Medical Officer: check for injury or schedule conflicts blocking exercise." },
    ],
    sources: [SOURCES.riskFitness],
  },
  "behavioral-drift": {
    id: "behavioral-drift",
    title: "Possible hidden fatigue",
    ladder: [
      { severity: "watch", minDays: 0, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "Your sleep and reaction time are worse than your normal, but your mood check-ins say you're fine. People often under-report fatigue in isolation; objective signals catch it earlier. NASA tracks both inadequate sleep and behavioral changes as spaceflight risks.",
    steps: [
      { tier: "SELF", text: "Be honest in tonight's check-in: how tired do you really feel?" },
      { tier: "SELF", text: "Protect your full sleep window and take a rest break before critical tasks." },
      { tier: "CMO", text: "Crew Medical Officer: private check-in; review schedule and consider lighter duties for 48 h." },
      { tier: "EARTH", text: "Ground behavioral health team: private conference with the crewmember." },
    ],
    sources: [SOURCES.riskSleep, SOURCES.riskBehavioral, SOURCES.basnerPvt, DEMO_PARAMETER],
  },
  "radiation-event": {
    id: "radiation-event",
    title: "Solar particle event — shelter now",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "critical", minDays: 0, tier: "SELF" },
    ],
    whyItMatters:
      "Space radiation is one of NASA's five hazards. A solar particle event can deliver many days' worth of dose in hours; heavy shielding greatly reduces what you absorb.",
    steps: [
      { tier: "SELF", text: "Go to the storm shelter (the most shielded area) now and stay until the all-clear." },
      { tier: "SELF", text: "Keep your personal dosimeter on you." },
      { tier: "CMO", text: "Crew Medical Officer: log each crewmember's dose after the event." },
    ],
    sources: [SOURCES.hrpHazards, SOURCES.riskRadiationCancer, SOURCES.csaRadiation],
  },
  "radiation-cumulative": {
    id: "radiation-cumulative",
    title: "Career radiation dose rising",
    ladder: [
      { severity: "watch", minDays: 0, tier: "CMO" },
      { severity: "critical", minDays: 0, tier: "EARTH" },
    ],
    whyItMatters:
      "Radiation dose adds up over a career and raises long-term cancer risk. NASA limits career effective dose to under 600 mSv.",
    steps: [
      { tier: "SELF", text: "Sleep in the most shielded crew quarters." },
      { tier: "CMO", text: "Crew Medical Officer: review EVA and work-location plans to limit dose." },
      { tier: "EARTH", text: "Flight surgeon: review remaining-mission dose projection." },
    ],
    sources: [SOURCES.nasaRadiationLimit, SOURCES.riskRadiationCancer],
  },
  "bone-loss": {
    id: "bone-loss",
    title: "Bone-loss risk building",
    ladder: [
      { severity: "watch", minDays: 0, tier: "SELF" },
      { severity: "critical", minDays: 0, tier: "CMO" },
    ],
    whyItMatters:
      "Without gravity loading the skeleton, weight-bearing bones lose mineral density during spaceflight. Resistance exercise is the main countermeasure; missed sessions add up.",
    steps: [
      { tier: "SELF", text: "Do today's resistance-exercise session (squats, deadlifts, heel raises)." },
      { tier: "CMO", text: "Crew Medical Officer: review the exercise log and fix schedule conflicts." },
    ],
    sources: [SOURCES.riskBone, SOURCES.riskFitness, DEMO_PARAMETER],
  },
};

/** Pick the tier for a rule given severity and how long the state has lasted. */
export function resolveTier(rule: EscalationRule, severity: Severity, durationDays: number): Tier {
  let tier: Tier = "SELF";
  for (const step of rule.ladder) {
    const severityOk = SEVERITY_RANK[severity] >= SEVERITY_RANK[step.severity];
    if (severityOk && durationDays >= step.minDays && TIER_RANK[step.tier] > TIER_RANK[tier]) tier = step.tier;
  }
  return tier;
}

/** Steps from SELF up to and including the assigned tier. */
export function stepsUpTo(rule: EscalationRule, tier: Tier): ActionStep[] {
  return rule.steps.filter((s) => TIER_RANK[s.tier] <= TIER_RANK[tier]);
}
