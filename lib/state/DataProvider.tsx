"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DatasetMember, MissionDataset } from "@/lib/data/dataset";
import { getDB } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { evaluateMember, type MemberAssessment } from "@/lib/engine/evaluate";
import type { Reading } from "@/lib/engine/types";
import { useAppState } from "./useAppState";

type Status = "loading" | "ready" | "error";

interface DataContextValue {
  status: Status;
  datasets: { mission: MissionDataset; steppe: MissionDataset } | null;
  readings: readonly Reading[];
}

const DataContext = createContext<DataContextValue>({ status: "loading", datasets: null, readings: [] });

const EMPTY: readonly Reading[] = [];

/** Seeds IndexedDB on first visit, then streams all readings live from Dexie. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [datasets, setDatasets] = useState<DataContextValue["datasets"]>(null);

  useEffect(() => {
    let cancelled = false;
    ensureSeeded(getDB())
      .then(({ mission, steppe }) => {
        if (cancelled) return;
        setDatasets({ mission, steppe });
        setStatus("ready");
      })
      .catch((err: unknown) => {
        console.warn("Seeding failed", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useLiveQuery<Reading[] | null>(
    () => (status === "ready" ? getDB().readings.toArray() : null),
    [status],
  );
  const value = useMemo<DataContextValue>(
    () => ({ status, datasets, readings: live ?? EMPTY }),
    [status, datasets, live],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  return useContext(DataContext);
}

/** Dataset, members, and events for the current mode. */
export function useMission() {
  const { mode } = useAppState();
  const { status, datasets } = useData();
  const dataset = datasets ? (mode === "steppe" ? datasets.steppe : datasets.mission) : null;
  return {
    status,
    dataset,
    members: dataset?.members ?? ([] as DatasetMember[]),
    events: dataset?.events ?? [],
    maxDay: dataset ? dataset.days - 1 : 0,
  };
}

/** Engine assessment of one member as of the Mission Clock day ("data up to the current day"). */
export function useAssessment(memberId?: string, dayOverride?: number): MemberAssessment | null {
  const app = useAppState();
  const { readings } = useData();
  const { dataset, maxDay } = useMission();
  const id = memberId ?? app.memberId;
  const day = Math.min(dayOverride ?? app.day, maxDay);
  const member = dataset?.members.find((m) => m.id === id);
  const mine = useMemo(() => readings.filter((r) => r.memberId === id), [readings, id]);
  return useMemo(
    () => (member ? evaluateMember(id, mine, day, { priorDose: member.priorDose }) : null),
    [member, id, mine, day],
  );
}
