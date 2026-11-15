# Challenge Mapping

Challenge: **Create Health Monitoring Software for Astronauts on Space Missions** (NASA Space Apps Challenge 2026).

## Challenge statements → features

| Challenge text (summary) | How The Ether answers it | Where |
| --- | --- | --- |
| Long missions expose astronauts to radiation, isolation and confinement, altered gravity, distance from Earth, and a hostile closed environment (HRP's 5 hazards). | All five hazards, named exactly as on nasa.gov, tag every alert, indicator and body system (small hazard labels that link to Learn, which groups content by hazard). Real NASA data per hazard: DONKI solar particle events (Space Radiation), JPL Horizons light time (Distance from Earth), NASA POWER winter weather (hostile environment, Steppe). | `/learn`, alerts, Trends, Body Map, `lib/engine/hazards.ts`, `lib/nasa` |
| These lead to immune changes, bone loss, cardiovascular events, poor nutrition, and behavioral health problems. | Body regions and rules for immune/skin, bones, heart/vessels, gut/nutrition and brain/behavior, each linked to its NASA HRP risk page (13 risks). | `/body`, `lib/engine/escalation.ts` |
| Astronauts must spot these changes in themselves. | A personal baseline per indicator; persistence-based alerts; a behavioral-drift composite that catches under-reported fatigue. | `lib/engine`, Action Center |
| Build a visual tool that gathers health indicators… | Daily 3-Minute Check (camera HR, PVT-lite, vitals, sleep, mood + crew pulse) saved to the on-device database. | `/check` |
| …helps astronauts assess their own health… | Status ring, colored body map, trends against one's own normal, plain-language explanations. | `/`, `/body`, `/trends` |
| …and gives guidance on treatment and improvement. | Every alert: what changed → why it matters → do now (checklist) → who acts; quests turn guidance into daily actions. | `/alerts`, `/quests` |
| Input can be anything: keyboard, clicks, camera images… | Keyboard/click entry, touch, and a 30-second **camera** pulse check (rPPG). | `/check` |
| Suggested indicators: blood pressure, heart rate, blood sugar, body temperature, sleep hours, mood. | All six, plus HRV, SpO₂, body mass, sleep quality, reaction time, crew pulse, exercise and radiation dose. | `lib/engine/indicators.ts` |
| UI: animations, interactivity. | Animated status ring, pulsing critical regions, heartbeat, live rPPG waveform, quest bursts, Mission Clock scrubbing, Demo Mode. | All screens |
| A clickable human figure where each body part shows its function and status. | Front/back SVG body map; each region is clickable (mouse, touch, keyboard) and opens function, status, trend and actions. | `/body` |
| Dynamic charts over time. | Trend charts with the baseline band (±2 SD), event annotations, and 7/30/180-day ranges, synced to the Mission Clock. | `/trends`, Body Map panel |
| Color coding. | Green / amber / red / grey, always paired with an icon and text. | Everywhere |
| Gamification. | Quests generated from the engine, XP, levels, streaks, and a cooperative crew goal. | `/quests` |
| Routine prompts to take measurements. | The daily check-in quest and streak; Home "Today's quests". | `/`, `/quests` |
| Simple explanations; don't assume a medical expert. | Plain-language "why it matters", "Why this test?" on every check step, and Learn cards. | `/check`, `/learn`, `/alerts` |
| Support different environments (spacecraft, station, rover, lunar or Mars base). | Environment selector (Mars transit, space station, lunar base, Mars base, rover). Mars base/rover use the real JPL Horizons light time; long delays make the CMO act first on Earth-level alerts. | Home, `lib/engine/signal.ts`, `lib/nasa/horizons.ts` |

## Questions worth considering → answers

| Question | Answer in the app |
| --- | --- |
| **Which measurements can be done in space?** | Every Learn card answers "Can it be measured in space?": camera or finger pulse, BP cuff, finger-prick glucose, thermometer, pulse oximeter, self-reported sleep and mood, a 1-minute reaction test, exercise logs, dosimeters. The Daily Check takes about 3 minutes with no special hardware. |
| **Why is the exam needed?** | The "Why this test?" explainer on each check step, and "Why it matters" on every Learn card and alert, each with NASA HRP sources. |
| **How do spaceflight hazards affect each indicator?** | Body Map panels ("How spaceflight affects it"), Learn cards (hazard chips per indicator), and each alert's "why it matters". |
| **When does a result need attention from the crew vs. flight surgeons on the ground?** | The escalation table maps (rule, severity, duration) → **SELF / CMO / EARTH**, shown as a ladder on every alert. Example: BP watch → SELF; watch for ≥ 3 days → CMO; critical → EARTH. EARTH alerts open the Message to Ground with the real light-delay. |
| **What actions prevent a critical condition?** | "Do now" checklists per tier, quests created from active alerts (e.g. missed exercise → resistance session), and early detection through persistence and drift rules before thresholds are crossed. |

## Judging criteria

| Criterion | Evidence |
| --- | --- |
| Impact | Catches silent drift early in space; the same engine serves remote Mongolian herders (Steppe mode). |
| Creativity | Mission Clock time-travel, hidden-fatigue detection, light-delay Message to Ground, camera rPPG, cooperative crew goal, Space ↔ Steppe. |
| Validity | Robust statistics, persistence rules, sourced thresholds, every number cited or labelled as a demo parameter, 126 unit tests + 44 e2e tests. |
| Relevance | Every challenge sentence and question is mapped above. |
| Presentation | Demo Mode (30-second captioned story), screenshots, docs. |
