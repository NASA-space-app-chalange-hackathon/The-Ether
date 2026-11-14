import type { Source } from "./types";

/**
 * Citation registry. Every URL here was fetched or confirmed via search on
 * 2026-11-14; `note` records what the source supports. Anything we could not
 * source uses DEMO_PARAMETER instead — never an invented citation.
 */
export const DEMO_PARAMETER: Source = {
  id: "demo",
  title: "Demo parameter — not clinically validated",
  demo: true,
};

const hrpRisk = (id: string, title: string, slug: string): Source => ({
  id,
  title: `NASA HRP — ${title}`,
  url: `https://www.nasa.gov/reference/${slug}/`,
});

export const SOURCES = {
  hrpHazards: {
    id: "hrpHazards",
    title: "NASA HRP — 5 Hazards of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/hazards/",
  },
  hrpRisks: {
    id: "hrpRisks",
    title: "NASA HRP — Risks of Human Spaceflight",
    url: "https://www.nasa.gov/hrp/risks/",
  },
  hrpResearch: {
    id: "hrpResearch",
    title: "NASA HRP — Ongoing HRP Research",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
  },
  nasaBodyInSpace: {
    id: "nasaBodyInSpace",
    title: "NASA — The Human Body in Space",
    url: "https://www.nasa.gov/humans-in-space/the-human-body-in-space/",
    note: "Mars is on average 140 million miles from Earth; communication delay of up to 20 minutes one-way.",
  },
  csaRadiation: {
    id: "csaRadiation",
    title: "Canadian Space Agency — Monitoring radiation for astronaut health",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    note: "Neutron radiation contributes about 30% of total radiation on the ISS.",
  },
  csaScience: {
    id: "csaScience",
    title: "Canadian Space Agency — Why do we conduct science experiments in space?",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
    note: "Effects observed in astronauts are similar to accelerated aging and a sedentary lifestyle.",
  },
  swriRad: {
    id: "swriRad",
    title: "SwRI — Radiation exposure associated with a trip to Mars (MSL RAD; Zeitlin et al., Science 2013;340:1080)",
    url: "https://www.swri.org/press-release/swri-led-team-calculates-radiation-exposure-associated-trip-mars",
    note: "Average galactic cosmic ray dose equivalent rate of about 1.8 mSv per day in cruise.",
  },
  nasaRadiationLimit: {
    id: "nasaRadiationLimit",
    title: "NASA OCHMO Technical Brief — Radiation Protection (NASA-STD-3001)",
    url: "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf",
    note: "Career effective dose from spaceflight radiation shall be less than 600 mSv.",
  },
  whoPulseOx: {
    id: "whoPulseOx",
    title: "WHO Pulse Oximetry Training Manual (2011)",
    url: "https://medbox.org/document/pulse-oximetry-training-manual",
    note: "≥95% normal; ≤94% assess promptly; <90% clinical emergency.",
  },
  accAha2017: {
    id: "accAha2017",
    title: "2017 ACC/AHA High Blood Pressure Guideline (ACC summary)",
    url: "https://acc.org/Latest-in-Cardiology/Articles/2017/11/08/11/47/mon-5pm-bp-guideline-aha-2017",
    note: "Stage 2 hypertension: SBP ≥140 or DBP ≥90 mmHg; crisis: SBP >180 and/or DBP >120.",
  },
  adaHypoglycemia: {
    id: "adaHypoglycemia",
    title: "American Diabetes Association — Low Blood Glucose (Hypoglycemia)",
    url: "https://diabetes.org/living-with-diabetes/treatment-care/hypoglycemia-low-blood-glucose",
    note: "Low blood glucose is below 70 mg/dL.",
  },
  cdcFever: {
    id: "cdcFever",
    title: "CDC — Definitions of Signs, Symptoms, and Conditions of Ill Travelers",
    url: "https://www.cdc.gov/quarantine/maritime/definitions-signs-symptoms-conditions-ill-travelers.html",
    note: "Fever: measured temperature of 100.4 °F [38 °C] or greater.",
  },
  basnerPvt: {
    id: "basnerPvt",
    title: "Basner M, Dinges DF. Maximizing sensitivity of the PVT to sleep loss. Sleep 2011;34(5):581–591",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3079937/",
    note: "Lapses conventionally defined as reaction time ≥500 ms.",
  },
  verkruysse2008: {
    id: "verkruysse2008",
    title: "Verkruysse W, Svaasand LO, Nelson JS. Remote plethysmographic imaging using ambient light. Opt Express 2008;16(26):21434",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2717852/",
    note: "Green channel carries the strongest plethysmographic signal.",
  },

  riskImmune: hrpRisk("riskImmune", "Risk of Altered Immune System Responses", "risk-of-altered-immune-system-responses"),
  riskSensorimotor: hrpRisk("riskSensorimotor", "Risk of Altered Sensorimotor and Vestibular Function", "risk-of-altered-sensorimotor-and-vestibular-function"),
  riskCardio: hrpRisk("riskCardio", "Risk of Cardiovascular Adaptations", "risk-of-cardiovascular-adaptations"),
  riskHypoxia: hrpRisk("riskHypoxia", "Risk of Hypoxia", "risk-of-hypoxia"),
  riskNutrition: hrpRisk("riskNutrition", "Risk of Inadequate Food and Nutrition", "risk-of-inadequate-food-and-nutrition"),
  riskFitness: hrpRisk("riskFitness", "Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness", "risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness"),
  riskSans: hrpRisk("riskSans", "Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)", "risk-of-spaceflight-associated-neuro-ocular-syndrome-sans"),
  riskBone: hrpRisk("riskBone", "Risk of Spaceflight-Induced Bone Changes", "risk-of-spaceflight-induced-bone-changes"),
  riskBehavioral: hrpRisk("riskBehavioral", "Risk of Behavioral Changes and Psychiatric Disorders", "risk-of-behavioral-conditions-and-psychiatric-disorders"),
  riskTeamwork: hrpRisk("riskTeamwork", "Risk of Inadequate Teamwork", "risk-of-inadequate-teamwork"),
  riskSleep: hrpRisk("riskSleep", "Risk of Inadequate Sleep and Irregular Schedules", "risk-from-inadequate-sleep-and-irregular-schedules"),
  riskRadiationCancer: hrpRisk("riskRadiationCancer", "Risk of Radiation-Induced Cancers", "risk-of-radiation-induced-cancers"),
  riskHostMicrobe: hrpRisk("riskHostMicrobe", "Risk of Host-Microorganism Interactions", "risk-of-host-microorganism-interactions"),
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
