# Submission — paste-ready text

## Project Name

The Ether

## High-Level Summary

The Ether is a health self-assessment app for astronauts on long missions: an early-warning system for when the doctor is 20 light-minutes away. Instead of comparing crew with population averages, it learns each person's own normal and only raises alerts for changes that persist or cross a safety threshold. It even catches hidden fatigue when sleep and reaction time worsen while self-reported mood stays "fine". Every alert explains what changed, why it matters, what to do now, and who should act: the astronaut, the Crew Medical Officer, or the flight surgeon on Earth, with the real signal delay. It needs no wearable: a 30-second camera pulse check and a 1-minute reaction test run on the device, offline. Cooperative health quests address teamwork. One toggle turns the same engine into a Mongolian-language tool for herders who live hours from the nearest hospital.

## Link to Demo

_DEMO_VIDEO_URL_ (30-second video)

## Link to Final Project

_LIVE_URL_ · https://github.com/NASA-space-app-chalange-hackathon/The-Ether

## Detailed Description

**What it does.** The Ether gathers health indicators through a guided 3-minute daily check. Heart rate comes from the webcam (remote photoplethysmography) or a manual pulse count. There is a 1-minute psychomotor vigilance test, blood pressure, glucose, temperature, SpO₂, body mass, sleep, mood, and a "crew pulse" rating of teamwork. A pure, unit-tested health engine then:
- builds a **personal baseline** for every indicator from the first 14 days (median + MAD), updated slowly and frozen while an alert is active so a drift can't become the new normal;
- flags deviations only when they **persist** (z > 2 on 3 of the last 5 days) or cross a sourced **safety threshold** (WHO SpO₂, ACC/AHA blood pressure, ADA glucose, CDC fever);
- detects **behavioral drift**: sleep down and reaction time up while self-reported mood stays steady, a sign of possible under-reporting;
- tracks **cumulative radiation** against NASA's 600 mSv career limit and a **bone-loss risk** score from exercise adherence;
- assigns each alert to **SELF, Crew Medical Officer, or EARTH** using an escalation table of severity × duration.

**How it looks.** A dark cockpit UI built around the **Mission Clock**: drag from day 0 to 179 and every screen time-travels through a simulated Mars transit (solar storm on day 40, hidden fatigue on day 70, a cardiovascular escalation on day 95).
- **Mission Home**: a status ring per body system, environment selector, signal delay and radiation meter.
- **Body Map**: a clickable front/back figure, where each region opens its function, its spaceflight effect, NASA risk links, a trend vs. the personal baseline, and actions.
- **Action Center**: explainable cards with a checklist and an escalation ladder. EARTH alerts open a **Message to Ground** pre-filled with the evidence and a live light-delay countdown.
- **Trends**, **Quests** (XP, streaks, a cooperative crew goal) and a privacy-first **Crew** view (crewmates see only colors unless a person shares).
- **Learn** cards answer which measurements work in space, why they matter, and when to escalate.

**Why it matters.** On deep-space missions, problems are slow drifts that astronauts may not notice or admit, and the ground is minutes away. The Ether helps crews assess themselves and act early, and it shows when the ground must be involved.

**Impact on Earth.** The same engine, in Mongolian, serves herder households who face the same problem: no doctor nearby, unreliable connection, and the need to self-assess. Steppe mode swaps the risk set (cold, altitude, isolation, distance to the soum hospital) and the ladder (self → family doctor → soum hospital / 103).

**How we built it.** Next.js, TypeScript, Tailwind, Recharts, Framer Motion and IndexedDB (Dexie). There is no backend, no accounts and no keys; data stays on the device, and it works offline as a PWA. The engine, the rPPG signal pipeline (band-pass 0.7–3.5 Hz, FFT peak, SNR quality score) and the PVT scoring are pure TypeScript with 96 unit tests, plus 38 Playwright end-to-end tests: camera fallbacks, offline mode, and a scan for untranslated text in Steppe mode.

## NASA Data

- NASA Human Research Program, **5 Hazards of Human Spaceflight**: hazard model and naming. https://www.nasa.gov/hrp/hazards/
- NASA HRP, **Risks of Human Spaceflight**: 13 risk pages mapped to body regions, alerts and Learn cards (immune, sensorimotor, cardiovascular, hypoxia, nutrition, fitness, SANS, bone, behavioral, teamwork, sleep, radiation-induced cancer, host-microorganism). https://www.nasa.gov/hrp/risks/
- NASA HRP, **Ongoing HRP Research**. https://www.nasa.gov/hrp/ongoing-hrp-research/
- NASA, **The Human Body in Space**: Earth–Mars distance and "up to 20 minutes one-way" communication delay (signal-delay model check); the vigilance self-test used on missions. https://www.nasa.gov/humans-in-space/the-human-body-in-space/
- NASA OCHMO **Radiation Protection technical brief** (NASA-STD-3001): career effective dose < 600 mSv, shown as the radiation limit bar. https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- NASA Open Science Data Repository, **OSD-569** (SpaceX Inspiration4 whole-blood measurements including complete blood counts, 4 crew × 7 timepoints): evidence that crew blood panels can be collected around a mission (context only; no values used). https://osdr.nasa.gov/bio/repo/data/studies/OSD-569
- NASA OSDR **RadLab**: radiation telemetry API identified for a future live dose feed. https://visualization.osdr.nasa.gov/radlab/

## Space Agency Partner & Other Data

- **Canadian Space Agency**, *Monitoring radiation for astronaut health* (neutrons ≈ 30% of total ISS radiation; radiation explainer). https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- **Canadian Space Agency**, *Why do we conduct science experiments in space?* (spaceflight effects resemble accelerated aging and a sedentary lifestyle; our Earth/Steppe framing). https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- SwRI / MSL RAD (Zeitlin et al., *Science* 2013): cruise dose ≈ 1.8 mSv/day, used to calibrate the synthetic radiation data.
- WHO Pulse Oximetry Training Manual; 2017 ACC/AHA High Blood Pressure Guideline; American Diabetes Association; CDC: safety thresholds.
- Basner & Dinges, *Sleep* 2011 (PVT lapses ≥ 500 ms); Verkruysse et al., *Optics Express* 2008 (camera PPG, green channel).
- All crew and herder data is **synthetic**, generated by a seeded script; every assumption is documented in docs/DATA.md.

## Use of Artificial Intelligence

We used **Claude (Anthropic) through Claude Code** as a coding and writing assistant. It generated most of the source code, the automated tests, and drafts of the documentation and UI text (including the Mongolian translations) under the team's direction. Every citation was checked against the source page during development; values we could not source are labelled "Demo parameter — not clinically validated" in the app. No AI-generated images, video or audio are used: the app icon and body figure are hand-written SVG code, and there are no NASA or agency logos.

## References

1. NASA HRP — 5 Hazards of Human Spaceflight. https://www.nasa.gov/hrp/hazards/
2. NASA HRP — Risks of Human Spaceflight. https://www.nasa.gov/hrp/risks/
3. NASA HRP — Ongoing HRP Research. https://www.nasa.gov/hrp/ongoing-hrp-research/
4. NASA — The Human Body in Space. https://www.nasa.gov/humans-in-space/the-human-body-in-space/
5. NASA OCHMO — Radiation Protection Technical Brief. https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
6. NASA OSDR — OSD-569. https://osdr.nasa.gov/bio/repo/data/studies/OSD-569
7. NASA OSDR — RadLab. https://visualization.osdr.nasa.gov/radlab/
8. Canadian Space Agency — Monitoring radiation for astronaut health. https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
9. Canadian Space Agency — Why do we conduct science experiments in space? https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
10. SwRI — Radiation exposure associated with a trip to Mars (Zeitlin C. et al., Science 2013;340:1080). https://www.swri.org/press-release/swri-led-team-calculates-radiation-exposure-associated-trip-mars
11. WHO Pulse Oximetry Training Manual (2011). https://medbox.org/document/pulse-oximetry-training-manual
12. 2017 ACC/AHA High Blood Pressure Guideline (ACC summary). https://acc.org/Latest-in-Cardiology/Articles/2017/11/08/11/47/mon-5pm-bp-guideline-aha-2017
13. American Diabetes Association — Low Blood Glucose (Hypoglycemia). https://diabetes.org/living-with-diabetes/treatment-care/hypoglycemia-low-blood-glucose
14. CDC — Definitions of Signs, Symptoms, and Conditions of Ill Travelers. https://www.cdc.gov/quarantine/maritime/definitions-signs-symptoms-conditions-ill-travelers.html
15. Basner M, Dinges DF. Maximizing sensitivity of the PVT to sleep loss. Sleep 2011;34(5):581–591. https://pmc.ncbi.nlm.nih.gov/articles/PMC3079937/
16. Verkruysse W, Svaasand LO, Nelson JS. Remote plethysmographic imaging using ambient light. Opt Express 2008;16(26):21434. https://pmc.ncbi.nlm.nih.gov/articles/PMC2717852/
