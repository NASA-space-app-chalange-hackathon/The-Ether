/**
 * Refresh the committed fallback snapshots of real NASA API responses.
 *
 *   NASA_API_KEY=… npm run nasa:snapshot   (DEMO_KEY is used if unset: 10 requests/hour)
 *
 * Writes lib/nasa/snapshots/{donki-sep,horizons-mars,power-zavkhan}.json. Each file keeps the
 * raw response untouched plus when and from where it was fetched (API key redacted).
 * The app falls back to these whenever a live call is slow, down, or rate-limited.
 */
import { writeFileSync } from "node:fs";
import { DONKI_PRIMARY, donkiRanges, donkiUrl, horizonsUrl, powerUrl } from "../lib/nasa/config.ts";

const OUT = new URL("../lib/nasa/snapshots/", import.meta.url);
const key = process.env.NASA_API_KEY || "DEMO_KEY";

async function getJson(url: string, apiKey?: string): Promise<unknown> {
  // The key goes in a header (api.nasa.gov accepts X-Api-Key), never in the URL.
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: apiKey ? { "X-Api-Key": apiKey } : {} });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}\n${await res.text()}`);
  return res.json();
}

function write(name: string, requests: string[], response: unknown): void {
  const body = { fetchedAt: new Date().toISOString(), requests, response };
  writeFileSync(new URL(name, OUT), `${JSON.stringify(body, null, 1)}\n`);
  console.log(`wrote lib/nasa/snapshots/${name}`);
}

const donki: unknown[] = [];
const donkiRequests: string[] = [];
for (const [start, end] of donkiRanges()) {
  const part = await getJson(donkiUrl(DONKI_PRIMARY, start, end), key);
  if (!Array.isArray(part)) throw new Error(`DONKI ${start}…${end}: expected an array`);
  donki.push(...part);
  donkiRequests.push(donkiUrl(DONKI_PRIMARY, start, end));
}
write("donki-sep.json", donkiRequests, donki);

const hz = horizonsUrl();
write("horizons-mars.json", [hz], await getJson(hz));

const pw = powerUrl();
write("power-zavkhan.json", [pw], await getJson(pw));
