import { expandReadings, type MissionDataset } from "@/lib/data/dataset";
import type { EtherDB } from "./schema";

export const DATASET_URLS = { mission: "/data/mission.json", steppe: "/data/steppe.json" } as const;

/** FNV-1a hash of the dataset text — re-seed automatically whenever the generated data changes. */
export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.text();
}

export interface SeedResult {
  seeded: boolean;
  mission: MissionDataset;
  steppe: MissionDataset;
}

/**
 * First-visit seeder (client only). Loads the generated datasets into IndexedDB.
 * Seed rows are replaced when the data changes; readings the user entered
 * (source ≠ "seed") are always kept.
 */
export async function ensureSeeded(db: EtherDB): Promise<SeedResult> {
  const [missionText, steppeText] = await Promise.all([fetchText(DATASET_URLS.mission), fetchText(DATASET_URLS.steppe)]);
  const version = `${fnv1a(missionText)}-${fnv1a(steppeText)}`;
  const mission = JSON.parse(missionText) as MissionDataset;
  const steppe = JSON.parse(steppeText) as MissionDataset;

  const current = await db.meta.get("seedVersion");
  if (current?.value === version) return { seeded: false, mission, steppe };

  await db.transaction("rw", db.members, db.readings, db.meta, async () => {
    await db.readings.where("source").equals("seed").delete();
    await db.members.bulkPut([...mission.members, ...steppe.members]);
    await db.readings.bulkAdd([...expandReadings(mission), ...expandReadings(steppe)]);
    await db.meta.put({ key: "seedVersion", value: version });
  });
  return { seeded: true, mission, steppe };
}
