MASTER PROMPT — "The Ether" (NASA Space Apps Challenge 2026)

(Local copy, gitignored. Phase 0 workspace-setup instructions omitted — already done.)

0. Context

You are the lead engineer for team The Ether (Ulaanbaatar, Mongolia) at the 2026 NASA Space Apps Challenge. Challenge: "Create Health Monitoring Software for Astronauts on Space Missions" (Difficulty: Intermediate).

Hard deadline: submission closes Sunday 15 Nov 2026, 23:59 Ulaanbaatar time (UTC+8). We submit at 22:00 at the latest, so the build must be demo-ready by Sunday 18:00. Speed and a polished, working demo come before completeness.

Git remote: https://github.com/NASA-space-app-chalange-hackathon/The-Ether.git

The challenge, as written by NASA (summary)
Long missions expose astronauts to radiation, isolation and confinement, altered gravity, distance from Earth, and a hostile closed environment (NASA HRP's 5 hazards). These lead to immune changes, bone loss, cardiovascular events, poor nutrition, and behavioral health problems.
Astronauts must spot these changes in themselves. Build a visual tool that gathers health indicators, helps astronauts assess their own health, and gives guidance on treatment and improvement.
Input can be anything: keyboard, clicks, camera images, ultrasound images, and so on.
Suggested indicators: blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood.
Questions the judges want answered: Which measurements can be done in space? Why is the exam needed? How do spaceflight hazards affect each indicator? When does a result need attention from the crew vs. flight surgeons on the ground? What actions prevent a critical condition?
UI suggestions: animations, interactivity, a clickable human figure where each body part shows its function and status, dynamic charts over time, color coding, gamification, routine prompts to take measurements, simple explanations (do not assume the astronaut is a medical expert), support for different environments (spacecraft, station, rover, lunar or Mars base).

Judging criteria (all weighted equally): Impact · Creativity · Validity (scientifically sound, works in the real world) · Relevance (answers the challenge, complete, usable) · Presentation.

Our competitive edge — must have dashboard + body figure + personal baseline + offline, plus four differentiators:
1. Camera vital check: a 30-second heart-rate measurement from the webcam (rPPG). No wearable needed.
2. Three-tier action ladder: every alert says what changed → why it matters → what to do now, and assigns the action to SELF, CREW MEDICAL OFFICER, or EARTH (flight surgeon, with live signal-delay countdown).
3. Gamification and crew cohesion: daily health quests, streaks, crew score, plus a lightweight teamwork/mood pulse. Answers NASA's Risk of Inadequate Teamwork.
4. Earth mode "Space ↔ Steppe": one toggle turns the same app into a tool for remote Mongolian herders (no doctor nearby, unreliable connection, self-assessment). Mongolian UI text and Earth-specific risks (cold, altitude, isolation, distance to the soum hospital).

1. Tech stack (do not change without a strong reason)
- Next.js (latest stable, App Router) + TypeScript (strict) + Tailwind CSS, deployed to Vercel. Pin exact versions (no ^). Do not upgrade during the hackathon.
- npm, Node ≥ 20.
- Framer Motion for animation, Recharts for charts.
- Body figure: layered SVG anatomy. Three.js only if time remains in Phase 6.
- Storage: IndexedDB through Dexie. No backend, no accounts.
- PWA: hand-written service worker (public/sw.js, cache-first for static assets and pages) + app/manifest.ts. Do not use next-pwa. Register the SW only in production builds.
- Every component that uses window, the camera, IndexedDB, or Dexie must be "use client", guarded or loaded with dynamic(..., { ssr: false }). Never access IndexedDB during SSR. #1 source of build errors; check before every build.
- Seed data generated at build time into /public/data/*.json (or static JSON) and loaded into Dexie on first visit. Live demo shows the full 180-day story with zero clicks.
- Camera: getUserMedia + canvas pixel pipeline. All processing on device.
- i18n: simple JSON dictionaries, en (default) and mn (Steppe mode).
- No paid APIs, no API keys.

2. Product spec
2.1 Personas and seeded demo data
Fictional 4-person crew on a Mars transit mission, 180 mission days, seeded deterministic script (/scripts/generate-mission.ts):
- Day 0–14: baseline period.
- Day ~40: solar particle event (radiation spike, crew shelters).
- Day 60–75: Crew member B's sleep drifts down and reaction time worsens, while mood self-reports stay "fine" (hidden behavioral drift). App catches it from objective signals.
- Day ~95: Crew member C shows a slow upward drift in resting HR and BP. Escalated to CMO.
- Days 100–180: bone-loss risk accumulates for whoever misses exercise quests.
Realistic values with noise. Document every assumption in docs/DATA.md.

2.2 Screens
/ Mission Home: mission day counter, environment selector (Transit / ISS / Lunar base / Mars base / Rover), signal-delay indicator, overall status ring, today's quests, active alerts.
/body Body Map: interactive front/back SVG figure. Regions: brain/behavior, eyes (SANS), heart/vessels, lungs/blood O₂, bones (spine, hips, legs), muscles, immune/skin, gut/nutrition, plus radiation overlay. Colored by status (green/amber/red/grey). Click → side panel: what the system does, how spaceflight affects it (HRP risk), latest indicators, trend vs. baseline, recommended actions.
/check Daily 3-Minute Check stepper:
 a) Camera HR (30 s): rPPG forehead/cheek ROI, green-channel mean, detrend, band-pass 0.7–3.5 Hz, FFT peak → bpm, signal-quality score; fallback to manual. Live waveform.
 b) PVT-lite (~60 s): random 2–10 s intervals; mean RT, lapses (>500 ms), false starts.
 c) Manual vitals: BP, glucose (mg/dL), temperature, SpO₂ (opt), body mass (opt).
 d) Sleep hours + quality (1–5).
 e) Mood (5-point faces) + crew pulse (1–5) + optional note.
 Each step has "Why this test?" (simple explanation + NASA source).
/alerts Action Center: What changed (value, % vs baseline, since when) → Why it matters → Do now → Who (SELF/CMO/EARTH) → Source. EARTH alerts: "Message to Ground" composer with auto summary + light-delay countdown (Mars distance on that mission day; delay = distance / c, one way).
/trends: multi-indicator charts with baseline bands (mean ± 2 SD), event annotations, 7/30/180-day switch.
/quests: daily quests, XP, levels, streaks, cooperative crew goal.
/crew: CMO overview, one ring per person, alert counts. Privacy: crew see only color unless shared.
/learn: explainer cards per indicator and hazard, each cited.
Mode toggle Space ↔ Steppe 🐎: Mongolian language, steppe theme, risk set (cold, altitude, isolation, distance to soum hospital), ladder SELF → family/bag doctor → soum hospital / 103. Seed 1 herder persona, 30 days.

2.3 Health engine (/lib/engine) — pure, unit-tested
- Baseline: first 14 days, median + MAD scaled to SD; then EWMA α≈0.05; freeze while in alert.
- Deviation: robust z. Amber: |z| > 2 for 3 of last 5 days; red: |z| > 3 or absolute threshold.
- Thresholds (SpO₂ < 92%, glucose < 70 or > 180, SBP ≥ 140, temp ≥ 38.0 °C) in /lib/engine/thresholds.ts with source field; uncited → "Demo parameter — not clinically validated".
- Composite: behavioral drift = sleep ↓ + PVT lapses ↑ + crew-pulse ↓ while self-mood stable → possible under-reporting.
- Cumulative: radiation dose vs career-limit bar (cite NASA); exercise adherence → bone-risk meter.
- Escalation rules table (indicator, severity, duration) → tier + action text + source.
- Every alert stores its triggering inputs.
- Vitest tests for baseline, z-score, persistence, escalation.

2.4 Content and validity
/content/risks.ts from NASA HRP resources:
- https://www.nasa.gov/hrp/hazards/
- https://www.nasa.gov/hrp/risks/
- https://www.nasa.gov/hrp/ongoing-hrp-research/
- https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
Map regions to HRP risks: immune, sensorimotor, cardiovascular, hypoxia, nutrition, cardiorespiratory & musculoskeletal fitness, SANS, bone, behavioral, teamwork, sleep, radiation cancer.
NASA open data: search OSDR (https://osdr.nasa.gov) for human datasets (Inspiration4/SOMA, Twins Study) and RadLab. Verify every ID; never invent. If unfetchable, say so in DATA.md and use labelled synthetic data.
Permanent disclaimer: "Prototype for NASA Space Apps 2026. Not a medical device. Simulated crew data."

3. Design direction
Cockpit aesthetic: dark, high contrast, calm; large touch targets; color + icon/text.
Colors: green #22c55e, amber #f59e0b, red #ef4444, grey #64748b on deep navy/black.
Inter + a mono font for numbers. Meaningful animation (heart pulse, ring fill, rPPG waveform, quest burst).
Great at 1280×720 and on tablet. No NASA logos/meatball/worm/flags/patches or imitation branding. No recognizable minors; abstract avatars only.

4. Repository deliverables
README.md (one-liner, problem, solution, features, screenshots, how to run, live link, data used, stack, AI usage disclosure, team, disclaimer); docs/CHALLENGE.md (challenge sentence → feature table); docs/DATA.md; docs/SUBMISSION.md (Project Name, High-Level Summary ≤150 words, Detailed Description, NASA Data, Partner & Other Data, Use of AI, References); docs/DEMO_SCRIPT.md (30 s video script + 7-slide outline); LICENSE (MIT); .gitignore.

5. Memory and state
CLAUDE.md (condensed brief) + PROGRESS.md (done/in progress/next/issues/decisions), updated after every task. Reread after compaction.

6. Quality gates (phase not done until all pass)
tsc --noEmit · npm run lint · vitest run · npm run build · Playwright smoke (e2e/smoke.spec.ts: every route against npm run start, fails on console error / hydration warning / uncaught exception) from Phase 3 on.
Fix root causes (no ts-ignore, eslint-disable, any). Same error after 3 attempts → stop and report.
Acceptance:
- Body Map: every region clickable (desktop + touch), keyboard focus, engine color, panel with chart + actions + source.
- Engine test: B behavioral-drift alert days 60–75; C cardiovascular CMO alert ~day 95; solar event ~day 40.
- Daily Check: camera permission flow; denied/unavailable/low quality → manual fallback, no crash. Camera HR within ±10 bpm of manual pulse (user to test if needed). PVT records RT + lapses.
- New check-in data appears on Home, Body Map, Trends, Alerts without reload.
- Offline after one online visit (Playwright context.setOffline(true)).
- Steppe mode: every visible string translated.
- Live Vercel URL loads incognito, no login, full demo story visible.

7. Ask the human for: GitHub push auth, Vercel login/link, real-camera test, recording video + submitting form. Never handle secrets.

8. Phases (commit + push after each)
1 Scaffold (≤45 min) · 2 Engine + data (≤2 h) 🛑 alert summary per crew member · 3 Core screens (≤4 h) 🛑 build passes, describe demo · 4 Daily Check (≤3 h) · 5 Differentiators (≤3 h) · 6 Polish + offline (≤2 h), Demo Mode jumps to days 40/70/95 · 7 Ship (≤1.5 h) 🛑 live URL, repo URL, SUBMISSION.md.

9. Working rules
Working software over breadth; cut Three.js → Steppe extras → crew view, never engine/Body Map/Action Center/Daily Check. Small typed functions. Never fabricate science. English UI except Steppe. Build + tests before every commit. Task list per phase; 3–5 line plan before big components. Build vertically. Commit ≥ every 45 min; push at end of phase. No extra libraries without a one-line reason in PROGRESS.md. Any task > 60 min → write blocker, pick simpler option.
