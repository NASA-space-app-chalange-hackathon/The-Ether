import Dexie, { type EntityTable, type Table } from "dexie";
import type { DatasetMember } from "@/lib/data/dataset";
import type { Alert, Baseline, IndicatorId, Reading } from "@/lib/engine/types";

/** Key/value store for app-level state (seed version, mode, settings). */
export interface MetaEntry {
  key: string;
  value: string;
}

/** A message queued to the ground (flight surgeon / soum hospital). Stored locally only. */
export interface GroundMessage {
  id?: number;
  memberId: string;
  alertId: string;
  missionDay: number;
  body: string;
  /** Wall-clock ms when sent. */
  sentAt: number;
  /** Wall-clock ms when it reaches Earth (sentAt + one-way delay). */
  arrivesAt: number;
}

export type EtherDB = Dexie & {
  members: EntityTable<DatasetMember, "id">;
  readings: EntityTable<Reading, "id">;
  /** Compound primary key: [memberId, indicator]. */
  baselines: Table<Baseline, [string, IndicatorId]>;
  alerts: EntityTable<Alert, "id">;
  meta: EntityTable<MetaEntry, "key">;
  messages: EntityTable<GroundMessage, "id">;
};

let instance: EtherDB | null = null;

/**
 * Lazily open the IndexedDB database. Only call from client code after mount;
 * throws during server rendering so misuse is caught early.
 */
export function getDB(): EtherDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() must not be called during server rendering");
  }
  if (instance) return instance;

  const db = new Dexie("the-ether") as EtherDB;
  db.version(1).stores({
    members: "id",
    readings: "++id, memberId, indicator, day, source, [memberId+indicator], [memberId+day]",
    baselines: "[memberId+indicator], memberId",
    alerts: "id, memberId, day, tier, severity",
    meta: "key",
  });
  db.version(2).stores({ messages: "++id, memberId, alertId, sentAt" });
  instance = db;
  return db;
}
