"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { signalDelay, type SignalDelay } from "@/lib/engine/signal";
import type { SpaceWeatherEvent } from "@/lib/engine/types";
import { SNAPSHOT_FEEDS, type Feed, type NasaFeeds } from "@/lib/nasa/feeds";
import { useAppState } from "./useAppState";

/** Our own server routes (they call NASA; the browser never does). */
export const NASA_ROUTES = {
  spaceWeather: "/api/nasa/space-weather",
  lightTime: "/api/nasa/light-time",
  weather: "/api/nasa/weather",
} as const;

const NasaContext = createContext<NasaFeeds>(SNAPSHOT_FEEDS);

function isFeed(x: unknown): x is Feed<unknown> {
  const f = x as Feed<unknown> | null;
  return !!f && (f.status === "live" || f.status === "snapshot") && typeof f.fetchedAt === "string" && typeof f.data === "object" && f.data !== null;
}

/**
 * Starts from the committed snapshot of real NASA responses (instant, works offline),
 * then swaps in whatever our server routes return — live data when NASA answered.
 */
export function NasaProvider({ children }: { children: ReactNode }) {
  const [feeds, setFeeds] = useState<NasaFeeds>(SNAPSHOT_FEEDS);

  useEffect(() => {
    let cancelled = false;
    for (const key of Object.keys(NASA_ROUTES) as (keyof NasaFeeds)[]) {
      fetch(NASA_ROUTES[key])
        .then((res) => (res.ok ? res.json() : null))
        .then((json: unknown) => {
          if (cancelled || !isFeed(json)) return;
          setFeeds((prev) => ({ ...prev, [key]: json }));
        })
        .catch(() => {
          // Offline or route down: keep the snapshot.
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return <NasaContext.Provider value={feeds}>{children}</NasaContext.Provider>;
}

export function useNasa(): NasaFeeds {
  return useContext(NasaContext);
}

/** Real DONKI solar particle events, as engine events on mission days. */
export function useSpaceWeatherEvents(): readonly SpaceWeatherEvent[] {
  const { spaceWeather } = useNasa();
  return useMemo(
    () => spaceWeather.data.events.map((e) => ({ day: e.missionDay, realDate: e.realDate, url: e.link, highEnergy: e.highEnergy })),
    [spaceWeather],
  );
}

/** One-way signal delay for the current environment, using the JPL Horizons ephemeris where it applies. */
export function useSignalDelay(day?: number): SignalDelay {
  const { environment, day: clockDay } = useAppState();
  const { lightTime } = useNasa();
  return signalDelay(environment, day ?? clockDay, lightTime.data);
}
