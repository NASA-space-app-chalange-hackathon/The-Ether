# The Ether — working notes for Claude Code (local, gitignored)

Read this + PROGRESS.md first after any compaction/restart. Full brief: docs/MASTER_PROMPT.md.

## Goal
NASA Space Apps 2026 — "Create Health Monitoring Software for Astronauts on Space Missions".
Team The Ether (Ulaanbaatar). Submit by Sun 15 Nov 2026 22:00 UB (UTC+8); demo-ready by Sun 18:00.
Differentiators: camera rPPG HR check · SELF/CMO/EARTH action ladder with light-delay · quests + crew pulse (teamwork risk) · Space ↔ Steppe mode (Mongolian herders).

## Stack (pinned, no upgrades)
Next.js App Router + TS strict + Tailwind v4 · Framer Motion · Recharts · Dexie (IndexedDB) · Vitest · Playwright.
Hand-written public/sw.js + app/manifest.ts (no next-pwa). No backend, no API keys.
Anything touching window/camera/IndexedDB → "use client" + guarded / dynamic(ssr:false). getDB() throws on server.

## Folders
app/ routes (/, /body, /check, /alerts, /trends, /quests, /crew, /learn) · components/{ui,body,charts,check,alerts}
lib/engine (pure, tested) · lib/db (Dexie) · lib/i18n (en/mn + t()) · content/ (cited risks) · scripts/ (generator)
public/data/ (seed JSON) · e2e/ (Playwright smoke) · docs/

## Demo story (180 days, 4 fictional crew, seeded)
d0–14 baseline · d~40 solar particle event · d60–75 B: sleep↓ + PVT↑, mood "fine" → behavioral drift
d~95 C: resting HR/BP creep → CMO · d100–180 bone-loss risk for missed exercise. Herder persona: 30 days.

## Rules
- Never fabricate science/numbers/citations/dataset IDs; uncited → "Demo parameter — not clinically validated".
- No NASA logos/branding; abstract avatars only. UI copy English (mn in Steppe mode).
- Status colors: green #22c55e, amber #f59e0b, red #ef4444, grey #64748b on deep navy; color + icon/text.
- Commits: English, NO AI attribution lines (user instruction). Push to main.
- User asked to STOP after foundation and wait for "continue" before features.

## Quality gates (all must pass before commit)
npm run typecheck · npm run lint · npm run test · npm run build · npm run e2e
No ts-ignore / eslint-disable / untyped any. Same error 3× → stop and report.
