# The Ether

Self-assessment health monitoring for astronauts on long missions — learns each crew member's normal, catches silent drift, and says what to do and who should act. Built for the NASA Space Apps Challenge 2026.

> Prototype for NASA Space Apps 2026. Not a medical device. Simulated crew data.

## How to run

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` / `npm run start` | Production build and server |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (Vitest) |
| `npm run e2e` | Playwright smoke test (run `npx playwright install chromium` once, and `npm run build` first) |

## License

MIT
