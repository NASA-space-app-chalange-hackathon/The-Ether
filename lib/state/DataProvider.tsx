"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DatasetMember, MissionDataset, MissionEvent } from "@/lib/data/dataset";
import { getDB } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { evaluateMember, type MemberAssessment } from "@/lib/engine/evaluate";
import { localizeAlert } from "@/lib/i18n/alerts";
import type { Reading } from "@/lib/engine/types";
import { NASA_LINKS } from "@/lib/nasa/config";
import { useNasa, useSignalDelay, useSpaceWeatherEvents } from "./NasaProvider";
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

const NO_EVENTS: MissionEvent[] = [];

/**
 * Dataset, members, and events for the current mode. Events merge the story with real
 * NASA data: DONKI solar particle events (Space) and POWER weather on the cold snap (Steppe).
 */
export function useMission() {
  const { mode } = useAppState();
  const { status, datasets } = useData();
  const sep = useSpaceWeatherEvents();
  const { weather } = useNasa();
  const dataset = datasets ? (mode === "steppe" ? datasets.steppe : datasets.mission) : null;
  const events = useMemo<MissionEvent[]>(() => {
    if (!dataset) return NO_EVENTS;
    if (dataset.kind === "steppe") {
      return dataset.events.map((e) => {
        const w = weather.data.days[e.day];
        return e.kind === "cold" && w && w.tMin !== null
          ? { ...e, real: { source: "POWER" as const, realDate: w.date, tMin: w.tMin, url: NASA_LINKS.power } }
          : e;
      });
    }
    const replayed: MissionEvent[] = sep.map((e) => ({
      day: e.day,
      kind: "solar",
      icon: "",
      label: `Real NASA DONKI solar particle event (${e.realDate}), replayed on day ${e.day} of the mission`,
      real: { source: "DONKI", realDate: e.realDate, ...(e.url ? { url: e.url } : {}) },
    }));
    return [...dataset.events, ...replayed].sort((a, b) => a.day - b.day);
  }, [dataset, sep, weather]);
  return {
    status,
    dataset,
    members: dataset?.members ?? ([] as DatasetMember[]),
    events,
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
  const sep = useSpaceWeatherEvents();
  const space = app.mode === "space";
  const delay = useSignalDelay(day).oneWaySeconds;
  const assessment = useMemo(
    () =>
      member
        ? evaluateMember(id, mine, day, { priorDose: member.priorDose, ...(space ? { spaceWeather: sep, commsDelaySeconds: delay } : {}) })
        : null,
    [member, id, mine, day, space, sep, delay],
  );
  const { locale, mode } = app;
  return useMemo(
    () =>
      assessment && !(mode === "space" && locale === "en")
        ? { ...assessment, alerts: assessment.alerts.map((a) => localizeAlert(a, locale, mode)) }
        : assessment,
    [assessment, locale, mode],
  );
}
